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
    // "Tx. Entrega:   19,25"  ou  "Taxa de Entrega: 7,25"
    if (/tx\.?\s*entrega|taxa\s*de?\s*entrega/i.test(l)) {
      const v = parseValorBR(l);
      if (v > 0) taxa = v;
    // "TOTAL PEDIDO:   69,05"  ou  "Total Pedido: 206,25"
    } else if (/total\s*pedido/i.test(l)) {
      const v = parseValorBR(l);
      if (v > 0) total = v;
    }
  }
  return { total, taxa };
}

function parsearTexto(texto: string): ItemParseado[] {
  const items: ItemParseado[] = [];
  const linhas = texto
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Estado do item sendo montado (aguardando o código TD/SO/CO nas linhas seguintes)
  let pendente: { quantidade: number; tamanho: string } | null = null;
  let nomePendente = "";

  for (const linha of linhas) {
    // Ignora separadores, cabeçalhos e rodapé
    if (/^[-=]{4,}/.test(linha)) continue;
    if (/^(qtd|descri|v\.uni|f\.\s*pag|troco|total\s*pago|total\s*a\s*pagar|servir|deseja|garfo|\+\+)/i.test(linha)) continue;
    if (/^total\s*(itens|pedido|entrega)|tx\.?\s*entrega/i.test(linha)) continue;

    // ── Linha de produto: começa com número de quantidade
    // Ex.: "2    TRADICIONAL G (400G)   24,90  49,80"
    //       "1    SOPA (400G)   18,00  18,00"
    const linhaProduto = linha.match(/^(\d+)\s+(.+?)\s+\d[\d.,]+\s+\d[\d.,]+\s*$/);
    if (linhaProduto) {
      const qtd = parseInt(linhaProduto[1], 10);
      const desc = linhaProduto[2].trim();
      // Extrai tamanho da descrição ("400G", "300G", "200G")
      const tamMatch = desc.match(/\b(200|300|400)\s*[gG]\b/);
      const tamanho = tamMatch ? `${tamMatch[1]}g` : "300g";
      pendente = { quantidade: qtd, tamanho };
      nomePendente = "";
      continue;
    }

    // ── Linha de sabor: começa com * e tem código TD/SO/CO
    // Ex.: "* TD01- Tiras de Alcatra ao Molho"
    if (pendente && /^\*?\s*(TD|SO|CO)\d+/i.test(linha)) {
      const semAsterisco = linha.replace(/^\*+\s*/, "").trim();
      const codMatch = semAsterisco.match(/(TD|SO|CO)(\d+)/i);
      if (codMatch) {
        const codigo = `${codMatch[1].toUpperCase()}${codMatch[2]}`;
        // Extrai tamanho do próprio texto (pode sobrescrever o do header)
        const tamNoText = semAsterisco.match(/\b(200|300|400)\s*g\b/i);
        const tamanho = tamNoText ? `${tamNoText[1]}g` : pendente.tamanho;
        const nome = semAsterisco
          .replace(/(TD|SO|CO)\d+\s*[-–]?\s*/i, "")
          .replace(/\b(200|300|400)\s*g\b/i, "")
          .trim() || `Produto ${codigo}`;
        nomePendente = nome;
        items.push({
          quantidade: pendente.quantidade,
          codigo,
          nome,
          tamanho,
          encontrado: false,
        });
        // Mantém pendente pra continuar capturando mais sabores do mesmo item
        // (ex.: "Combo 5" pode ter vários TD na mesma entrada)
      }
      continue;
    }

    // ── Continuação do nome (linha sem * e sem código, após um sabor)
    // Ex.: "Madeira e Arroz com Brocolis"
    if (pendente && nomePendente && !/^\*/.test(linha) && !/^(SABOR|SERVIR|DESEJA)/i.test(linha) && /(TD|SO|CO)\d+/i.test(linha) === false) {
      // Atualiza o nome do último item adicionado
      if (items.length > 0) {
        items[items.length - 1].nome = (nomePendente + " " + linha).trim();
        nomePendente = items[items.length - 1].nome;
      }
    }

    // Se chegou numa nova linha de produto (número no início), reseta pendente
    if (/^\d+\s+[A-Z]/i.test(linha) && !/^\d+[,.]/.test(linha)) {
      pendente = null;
      nomePendente = "";
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
