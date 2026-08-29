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

// Extrai valores do rodapé do cupom P10: TOTAL PEDIDO e Tx. Entrega.
// Aceita "1.234,56" (pt-BR) e "1234.56".
function parseValorBR(s: string): number {
  const limpo = s.replace(/[^\d.,]/g, "").trim();
  if (!limpo) return 0;
  // Se tem vírgula, assume pt-BR (ponto = milhar, vírgula = decimal).
  if (limpo.includes(",")) {
    return Number(limpo.replace(/\./g, "").replace(",", ".")) || 0;
  }
  return Number(limpo) || 0;
}

function extrairRodape(texto: string): { total: number; taxa: number } {
  let total = 0;
  let taxa = 0;
  for (const linha of texto.split(/\n/)) {
    const l = linha.trim();
    if (/tx\.?\s*entrega|taxa\s*de?\s*entrega/i.test(l)) {
      taxa = parseValorBR(l);
    } else if (/total\s*pedido/i.test(l)) {
      total = parseValorBR(l);
    }
  }
  return { total, taxa };
}

function parsearTexto(texto: string): ItemParseado[] {
  const items: ItemParseado[] = [];
  const linhasBrutas = texto
    .split(/\n/)
    .map((s) => s.trim().replace(/^\*+\s*/, "").replace(/^[-–]\s*/, ""))
    .filter(Boolean);

  // Junta linhas de continuação: quando o nome do item quebra em várias linhas,
  // a linha seguinte (sem código próprio) é anexada à linha com código anterior.
  // Assim o tamanho ("300g") que ficou na 2ª linha entra no item certo.
  const linhas: string[] = [];
  for (const l of linhasBrutas) {
    const temCodigo = /(TD|SO|CO)\d+/i.test(l);
    const ehRodape = /total|tx\.?\s*entrega|f\.?\s*pagamento|troco|servir|consumir|deseja|escolha/i.test(l);
    if (temCodigo) {
      linhas.push(l);
    } else if (linhas.length > 0 && !ehRodape && /(TD|SO|CO)\d+/i.test(linhas[linhas.length - 1])) {
      // continuação do item anterior (parte do nome / tamanho)
      linhas[linhas.length - 1] += " " + l;
    } else {
      linhas.push(l);
    }
  }

  let tamanhoAtual = "300g"; // default

  for (const linha of linhas) {
    // Detecta header de tamanho: "Tradicional P (200g)", "Sopa (400g)", "Tamanho: 5 Refeições 200g P"
    const headerTam = linha.match(/\b[PpMmGg]\s*\((\d{3})g?\)/) ||
      linha.match(/\b(200|300|400)\s*g\b.*\b[PMG]\b/i) ||
      linha.match(/\bSopa\s*\((\d{3})g?\)/i);
    if (headerTam) {
      const t = headerTam[1] || linha.match(/(200|300|400)/)?.[1];
      if (t) tamanhoAtual = `${t}g`;
    }

    // Ignora linhas sem código de produto
    if (!linha.match(/(TD|SO|CO)\d+/i)) continue;

    // Ignora linhas que são só "Servir:", "Deseja Garfo", preços, etc
    if (/^(Servir|Deseja|Escolha|\d+[,.]?\d*$)/i.test(linha)) continue;

    // Extrai o conteúdo após "Sabor:" se existir
    const conteudo = linha.replace(/^.*?Sabor:\s*/i, "").replace(/\.\s*$/, "");

    // Separa por vírgula (pode ter vários itens na mesma linha)
    const partes = conteudo.split(/,/).map((s) => s.trim()).filter(Boolean);

    for (const parte of partes) {
      if (!parte.match(/(TD|SO|CO)\d+/i)) continue;

      // Extrai quantidade (Nx no início, default 1)
      const qtyMatch = parte.match(/^(\d+)\s*x\s*/i);
      const quantidade = qtyMatch ? parseInt(qtyMatch[1]) : 1;
      const semQty = parte.replace(/^\d+\s*x\s*/i, "").trim();

      // Extrai código
      const codMatch = semQty.match(/(TD|SO|CO)(\d+)/i);
      if (!codMatch) continue;
      const codigo = `${codMatch[1].toUpperCase()}${codMatch[2]}`;

      // Extrai tamanho do final (se existir), senão usa header
      const tamItemMatch = semQty.match(/(200|300|400)\s*g/i);
      const tamanho = tamItemMatch ? `${tamItemMatch[1]}g` : tamanhoAtual;

      // Extrai nome
      const nome = semQty
        .replace(/^\s*(TD|SO|CO)\d+\s*[-–]?\s*/i, "")
        .replace(/(200|300|400)\s*g\s*$/i, "")
        .replace(/\d+\s*g\s*$/i, "") // remove tamanhos como 150g
        .trim() || `Produto ${codigo}`;

      items.push({ quantidade, codigo, nome, tamanho, encontrado: false });
    }
  }

  return items;
}

function RegistrarP10Page() {
  const [texto, setTexto] = useState("");
  const [items, setItems] = useState<ItemParseado[]>([]);
  const [processando, setProcessando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  // Valores do rodapé do cupom (editáveis antes de registrar).
  const [valorTotal, setValorTotal] = useState("");
  const [taxaEntrega, setTaxaEntrega] = useState("");

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
    // Pré-preenche total e taxa a partir do rodapé do cupom.
    const { total, taxa } = extrairRodape(texto);
    if (total > 0) setValorTotal(total.toFixed(2).replace(".", ","));
    if (taxa > 0) setTaxaEntrega(taxa.toFixed(2).replace(".", ","));
    setConcluido(false);
  }

  async function handleProcessar() {
    setProcessando(true);
    try {
      const total = valorTotal ? Number(valorTotal.replace(/\./g, "").replace(",", ".")) || 0 : 0;
      const taxa = taxaEntrega ? Number(taxaEntrega.replace(/\./g, "").replace(",", ".")) || 0 : 0;

      // 1. Cria o pedido (origem pedidos10, pagamento P10, já entregue).
      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          nome_cliente: "Pedidos10",
          metodo_entrega: taxa > 0 ? "entrega" : "retirada",
          metodo_pagamento: "P10",
          valor_total: total,
          taxa_entrega: taxa,
          status: "entregue",
          origem: "pedidos10",
          observacao: "Lançado manualmente via Registrar Pedido P10",
        })
        .select()
        .single();
      if (pedidoError) throw new Error("Erro ao criar pedido: " + pedidoError.message);

      // 2. Cria os itens do pedido (com produto_id quando identificado).
      const itensInsert = items.map((item) => ({
        pedido_id: pedido.id,
        produto_id: item.produtoId ?? null,
        nome_item: item.produtoId ? null : `${item.codigo} ${item.nome}`.trim(),
        quantidade: item.quantidade,
        preco_unitario: 0, // o valor real do pedido está em valor_total
        observacao: `Peso: ${item.tamanho}`,
      }));
      if (itensInsert.length > 0) {
        const { error: itensError } = await supabase.from("pedido_itens").insert(itensInsert);
        if (itensError) throw new Error("Erro ao criar itens: " + itensError.message);
      }

      // 3. Decrementa estoque de cada item identificado.
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

      setConcluido(true);
      if (falhou === 0) {
        toast.success(`Pedido P10 registrado! ${ok} item(ns), estoque atualizado.`);
      } else {
        toast.warning(
          `Pedido criado. ${ok} item(ns) baixaram o estoque, ${falhou} não encontrado(s).`,
        );
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao registrar o pedido.");
    } finally {
      setProcessando(false);
    }
  }

  function handleLimpar() {
    setTexto("");
    setItems([]);
    setValorTotal("");
    setTaxaEntrega("");
    setConcluido(false);
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Package size={22} className="text-[#5850ec]" />
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Registrar Pedido P10</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Cole o texto do pedido do Pedidos10. O sistema cria o pedido (origem P10, pagamento
            P10), lança no relatório e decrementa o estoque.
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

          {/* Valores do pedido (puxados do rodapé do cupom, editáveis) */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                Total do pedido (R$)
              </label>
              <input
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                placeholder="0,00"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                Taxa de entrega (R$)
              </label>
              <input
                value={taxaEntrega}
                onChange={(e) => setTaxaEntrega(e.target.value)}
                placeholder="0,00"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm"
              />
            </div>
          </div>

          {!concluido && (
            <Button
              onClick={handleProcessar}
              disabled={processando}
              className="w-full bg-[#086e45] text-white mt-4"
            >
              {processando ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Package size={16} className="mr-2" />
              )}
              Registrar pedido P10 e baixar estoque
            </Button>
          )}

          {concluido && (
            <div className="text-center py-3 text-green-600 font-bold text-sm flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> Pedido P10 registrado e estoque atualizado!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
