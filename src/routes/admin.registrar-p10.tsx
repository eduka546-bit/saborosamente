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
import { encontrarProdutoP10, normalizarAgendamentoP10, parseP10Receipt, type P10Dados } from "@/lib/p10-receipt";

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

function RegistrarP10Page() {
  const [texto, setTexto] = useState("");
  const [items, setItems] = useState<ItemParseado[]>([]);
  const [processando, setProcessando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [dadosPedido, setDadosPedido] = useState<P10Dados | null>(null);
  const [quantidadeEsperada, setQuantidadeEsperada] = useState<number | null>(null);
  // Valores do rodapé do cupom (editáveis antes de registrar).
  const [valorTotal, setValorTotal] = useState("");
  const [taxaEntrega, setTaxaEntrega] = useState("");

  // Busca produtos pra casar código com produto_id
  const { data: produtos = [] } = useQuery({
    queryKey: ["p10-produtos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id, nome, codigo_integracao, tipo_produto")
        .eq("ativo", true);
      return data ?? [];
    },
  });

  function handleParsear() {
    const recibo = parseP10Receipt(texto);
    const matched: ItemParseado[] = recibo.itens.map(item => {
      const prod = encontrarProdutoP10(item, produtos);
      return {
        ...item,
        codigo: item.codigo || (prod?.nome.match(/\\b(?:TD|SO|CO)\\d+\\b/i)?.[0] ?? ""),
        produtoId: prod?.id,
        encontrado: !!prod,
      };
    });
    setItems(matched);
    setDadosPedido({ ...recibo.dados, agendado: normalizarAgendamentoP10(recibo.dados.agendado) });
    setQuantidadeEsperada(recibo.quantidadeEsperada);
    setValorTotal(recibo.total > 0 ? recibo.total.toFixed(2).replace(".", ",") : "");
    setTaxaEntrega(recibo.taxa > 0 ? recibo.taxa.toFixed(2).replace(".", ",") : "0,00");
    setConcluido(false);
    if (!matched.length) toast.error("Nenhuma refeição identificada. Confira o comprovante.");
    else if (matched.some(item => !item.encontrado))
      toast.warning("Há produtos não identificados. Corrija o vínculo antes de registrar.");
  }

  async function handleProcessar() {
    if (/agendad/i.test(dadosPedido?.entrega || "") && !/\b\d{2}\/\d{2}\/\d{4}\b/.test(dadosPedido?.agendado || "")) {
      toast.error("Data agendada inválida: confira dia, mês e ano antes de registrar.");
      return;
    }
    if (!items.length || items.some(item => !item.produtoId)) {
      toast.error("Identifique todos os produtos antes de registrar e baixar o estoque.");
      return;
    }
    if (quantidadeEsperada != null &&
        items.reduce((s, item) => s + item.quantidade, 0) !== quantidadeEsperada) {
      toast.error("Quantidade de refeições diferente do combo. Revise o texto.");
      return;
    }
    const tamanhoInvalido = items.find(item => {
      const tipo = produtos.find((p: any) => p.id === item.produtoId)?.tipo_produto;
      return item.tamanho === "150g" && tipo !== "complemento";
    });
    if (tamanhoInvalido) {
      toast.error("Produtos de 150g precisam estar vinculados a complementos cadastrados.");
      return;
    }
    setProcessando(true);
    try {
      const total = valorTotal ? Number(valorTotal.replace(/\./g, "").replace(",", ".")) || 0 : 0;
      const taxa = taxaEntrega ? Number(taxaEntrega.replace(/\./g, "").replace(",", ".")) || 0 : 0;

      // 1. Registra o pedido em Solicitados/Novos para evitar finalizar entregas agendadas antecipadamente.
      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          nome_cliente: dadosPedido?.cliente || "Pedidos10",
          telefone_cliente: dadosPedido?.telefone || null,
          metodo_entrega: /retirada/i.test(dadosPedido?.entrega || "") ?
            "retirada" : (/entrega/i.test(dadosPedido?.entrega || "") || taxa > 0 ? "entrega" : "retirada"),
          horario_recebimento: dadosPedido?.agendado
            ? `Agendado: ${dadosPedido.agendado}` : dadosPedido?.entrega || null,
          endereco_rua: dadosPedido?.rua || null,
          endereco_numero: dadosPedido?.numero || null,
          endereco_complemento: dadosPedido?.complemento || null,
          endereco_bairro: dadosPedido?.bairro || null,
          endereco_cidade: dadosPedido?.cidade || null,
          endereco_referencia: dadosPedido?.referencia || null,
          metodo_pagamento: dadosPedido?.pagamento ? `P10 - ${dadosPedido.pagamento}` : "P10",
          valor_total: total,
          taxa_entrega: taxa,
          status: "pendente",
          origem: "pedidos10",
          observacao: "Lançado manualmente via Registrar Pedido P10" +
            (dadosPedido ? ` | Valor pago: R$ ${dadosPedido.totalPago.toFixed(2)} | A receber: R$ ${dadosPedido.totalAPagar.toFixed(2)}` : ""),
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
          // Complementos de 150g são guardados em estoque_200g no cadastro.
          p_tamanho: item.tamanho === "150g" ? "200g" : item.tamanho,
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
    setDadosPedido(null);
    setQuantidadeEsperada(null);
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Package size={22} className="text-[#5850ec]" />
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Registrar Pedido P10</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Cole o texto do pedido do Pedidos10. O sistema registra o pedido (origem P10, pagamento
            do comprovante), exibe em Solicitados/Novos e baixa o estoque após confirmar.
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
          onChange={(e) => { setTexto(e.target.value); setItems([]); setConcluido(false); setDadosPedido(null); }}
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

      {dadosPedido && items.length > 0 && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 space-y-1">
          <p className="font-bold text-[#315440] mb-2">Dados lidos do comprovante</p>
          <p><b>Cliente:</b> {dadosPedido.cliente || "Não informado"} {dadosPedido.telefone ? `• ${dadosPedido.telefone}` : ""}</p>
          <p><b>Entrega:</b> {dadosPedido.entrega || "Não informada"}</p>
          {dadosPedido.agendado && <p><b>Agendado:</b> {dadosPedido.agendado}</p>}
          {(dadosPedido.rua || dadosPedido.numero) && (
            <p><b>Endereço:</b> {[dadosPedido.rua, dadosPedido.numero, dadosPedido.complemento, dadosPedido.bairro, dadosPedido.cidade].filter(Boolean).join(", ")}</p>
          )}
          {dadosPedido.referencia && <p><b>Referência:</b> {dadosPedido.referencia}</p>}
          <p><b>Pagamento:</b> {dadosPedido.pagamento || "P10"}
            {` • Pago: R$ ${dadosPedido.totalPago.toFixed(2).replace(".", ",")} • A receber: R$ ${dadosPedido.totalAPagar.toFixed(2).replace(".", ",")}`}
          </p>
        </div>
      )}

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
                  {item.produtoId && (
                    <p className="text-[11px] text-emerald-700">
                      Catálogo: {produtos.find((p: any) => p.id === item.produtoId)?.nome || "Produto vinculado"}
                    </p>
                  )}
                  {!item.encontrado && (
                    <select aria-label={`Corrigir produto de ${item.nome}`}
                      className="mt-2 max-w-full rounded border border-amber-300 bg-white p-1 text-xs"
                      value={item.produtoId || ""}
                      onChange={e => {
                        const product = produtos.find((p: any) => p.id === e.target.value);
                        setItems(current => current.map((row, i) => i === idx
                          ? { ...row, produtoId: product?.id, encontrado: !!product }
                          : row));
                      }}>
                      <option value="">Selecione o produto cadastrado</option>
                      {produtos.filter((p: any) => {
                        const codigo = String(p.nome || "").match(/\\b(TD|SO|CO)\\d+\\b/i)?.[1]?.toUpperCase();
                        return item.codigo.startsWith("CO") ? codigo === "CO" :
                          item.codigo.startsWith("SO") ? codigo === "SO" :
                          item.codigo.startsWith("TD") ? codigo === "TD" : true;
                      }).map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  )}
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

          {quantidadeEsperada != null && (
            <p className={`text-xs font-semibold ${items.reduce((s, i) => s + i.quantidade, 0) === quantidadeEsperada ? "text-green-700" : "text-red-700"}`}>
              Combo: {quantidadeEsperada} refeições esperadas • {items.reduce((s, i) => s + i.quantidade, 0)} identificadas
            </p>
          )}
          {items.some(i => !i.encontrado) && (
            <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              Alguns itens do cupom não têm correspondência exata no catálogo. Selecione o produto correto antes de lançar o pedido.
            </p>
          )}

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
              disabled={processando || items.some(i => !i.encontrado) || (quantidadeEsperada != null && items.reduce((s, i) => s + i.quantidade, 0) !== quantidadeEsperada)}
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
