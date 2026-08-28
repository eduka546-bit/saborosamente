/**
 * Registrar Pedido P10 — cola o texto do pedido do Pedidos10 e decrementa estoque.
 * Parseia: "5x TD18-Nome 200g" → qty=5, cod=TD18, tamanho=200g
 * Sem número na frente = qty 1.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ClipboardPaste, CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/registrar-p10")({
  component: RegistrarP10Page,
  ssr: false,
});

interface ItemParseado {
  quantidade: number;
  codigo: string;
  nome: string;
  tamanho: string;
  produtoId?: string;
  encontrado: boolean;
}

function parsearTexto(texto: string): ItemParseado[] {
  // Separa por vírgula ou quebra de linha
  const partes = texto
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const items: ItemParseado[] = [];

  for (const parte of partes) {
    // Ignora linhas que não parecem item (ex: "Combo 10 a 19", "Servir:", "Sabor:")
    if (/^(combo|servir|sabor)/i.test(parte) && !parte.match(/TD|SO|CO/i)) continue;

    // Padrão: [Nx] COD-Nome TAMANHOg
    // Ex: "5x TD18-Patinho Moído á Bolonhesa com Arroz e Feijão 200g"
    // Ex: "TD13 - Escondidinho de Patinho com Batata Inglesa e Queijo 400g"
    const match = parte.match(
      /^(\d+)\s*x\s*(TD|SO|CO)(\d+)\s*[-–]\s*(.+?)\s*(200|300|400)\s*g\s*$/i,
    );
    if (match) {
      items.push({
        quantidade: parseInt(match[1]),
        codigo: `${match[2].toUpperCase()}${match[3]}`,
        nome: match[4].trim(),
        tamanho: `${match[5]}g`,
        encontrado: false,
      });
      continue;
    }

    // Sem quantidade (= 1 unidade)
    const match2 = parte.match(
      /^(TD|SO|CO)(\d+)\s*[-–]\s*(.+?)\s*(200|300|400)\s*g\s*$/i,
    );
    if (match2) {
      items.push({
        quantidade: 1,
        codigo: `${match2[1].toUpperCase()}${match2[2]}`,
        nome: match2[3].trim(),
        tamanho: `${match2[4]}g`,
        encontrado: false,
      });
      continue;
    }

    // Tenta formato mais solto (com "x" e código no meio)
    const match3 = parte.match(/^(\d+)\s*x\s*(TD|SO|CO)(\d+)/i);
    if (match3) {
      // Extrai tamanho do final
      const tamMatch = parte.match(/(200|300|400)\s*g/i);
      const tamanho = tamMatch ? `${tamMatch[1]}g` : "300g";
      const nomeRest = parte
        .replace(/^\d+\s*x\s*/i, "")
        .replace(/(TD|SO|CO)\d+\s*[-–]?\s*/i, "")
        .replace(/(200|300|400)\s*g/i, "")
        .trim();
      items.push({
        quantidade: parseInt(match3[1]),
        codigo: `${match3[2].toUpperCase()}${match3[3]}`,
        nome: nomeRest || `Produto ${match3[2]}${match3[3]}`,
        tamanho,
        encontrado: false,
      });
      continue;
    }

    // Sem quantidade, formato solto
    const match4 = parte.match(/^(TD|SO|CO)(\d+)/i);
    if (match4) {
      const tamMatch = parte.match(/(200|300|400)\s*g/i);
      const tamanho = tamMatch ? `${tamMatch[1]}g` : "300g";
      const nomeRest = parte
        .replace(/(TD|SO|CO)\d+\s*[-–]?\s*/i, "")
        .replace(/(200|300|400)\s*g/i, "")
        .trim();
      items.push({
        quantidade: 1,
        codigo: `${match4[1].toUpperCase()}${match4[2]}`,
        nome: nomeRest || `Produto ${match4[1]}${match4[2]}`,
        tamanho,
        encontrado: false,
      });
    }
  }

  return items;
}

function RegistrarP10Page() {
  const [texto, setTexto] = useState("");
  const [items, setItems] = useState<ItemParseado[]>([]);
  const [processando, setProcessando] = useState(false);
  const [concluido, setConcluido] = useState(false);

  // Busca produtos pra casar código com produto_id
  const { data: produtos = [] } = useQuery({
    queryKey: ["p10-produtos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id, nome, codigo_integracao")
        .eq("ativo", true);
      return data ?? [];
    },
  });

  function handleParsear() {
    const parsed = parsearTexto(texto);

    // Tenta casar cada item com um produto do banco pelo código (TDxx no nome)
    const matched = parsed.map((item) => {
      // Busca pelo código no nome do produto (ex: "TD13" aparece no nome "TD13 - Escondidinho...")
      const prod = produtos.find(
        (p: any) =>
          p.nome?.toUpperCase().includes(item.codigo) ||
          p.codigo_integracao === item.codigo,
      );
      return {
        ...item,
        produtoId: prod?.id,
        encontrado: !!prod,
      };
    });

    setItems(matched);
    setConcluido(false);
  }

  async function handleProcessar() {
    setProcessando(true);
    let ok = 0;
    let falhou = 0;

    for (const item of items) {
      if (!item.produtoId) {
        falhou++;
        continue;
      }

      const { error } = await supabase.rpc("decrementar_estoque", {
        p_produto_id: item.produtoId,
        p_qtd: item.quantidade,
        p_tamanho: item.tamanho,
      });

      if (error) {
        console.error(`Erro ao decrementar ${item.codigo}:`, error.message);
        falhou++;
      } else {
        ok++;
      }
    }

    setProcessando(false);
    setConcluido(true);

    if (falhou === 0) {
      toast.success(`Estoque atualizado! ${ok} item(ns) decrementados.`);
    } else {
      toast.warning(`${ok} OK, ${falhou} falhou(aram). Verifique os não encontrados.`);
    }
  }

  function handleLimpar() {
    setTexto("");
    setItems([]);
    setConcluido(false);
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Package size={22} className="text-[#5850ec]" />
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Registrar Pedido P10</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Cole o texto do pedido do Pedidos10. O sistema identifica os itens e decrementa o
            estoque automaticamente.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <label className="text-xs font-bold uppercase text-gray-400 block">
          Texto do pedido (copie do painel P10)
        </label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={`Exemplo:\nCombo 10 a 19 Unidades\nSabor: TD13 - Escondidinho de Patinho 200g, 5x TD18-Patinho Moído 400g, TD20-Lasanha de Carne 300g`}
          className="w-full h-32 rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-[#5850ec]/30"
        />
        <div className="flex gap-2">
          <Button onClick={handleParsear} disabled={!texto.trim()} className="bg-[#5850ec] text-white">
            <ClipboardPaste size={16} className="mr-2" /> Identificar itens
          </Button>
          {items.length > 0 && (
            <Button variant="outline" onClick={handleLimpar}>
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Itens identificados */}
      {items.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-700">
            {items.length} item(ns) identificados:
          </h3>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  item.encontrado ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {item.quantidade}x {item.codigo} — {item.tamanho}
                  </p>
                  <p className="text-[11px] text-gray-500">{item.nome}</p>
                </div>
                <div className="text-right">
                  {item.encontrado ? (
                    <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Encontrado
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-500">Não encontrado</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!concluido && (
            <Button
              onClick={handleProcessar}
              disabled={processando || items.filter((i) => i.encontrado).length === 0}
              className="w-full bg-[#086e45] text-white mt-4"
            >
              {processando ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Package size={16} className="mr-2" />
              )}
              Decrementar estoque ({items.filter((i) => i.encontrado).length} itens)
            </Button>
          )}

          {concluido && (
            <div className="text-center py-3 text-green-600 font-bold text-sm flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> Estoque atualizado!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
