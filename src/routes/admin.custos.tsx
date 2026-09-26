import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Save, WalletCards } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/custos")({ component: CustosMargensPage, ssr: false });

const n = (v: unknown) => Number(v || 0);
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v: number) => `${n(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const input = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#5850ec]";

type AbaFinanceiro = "operacional" | "produtos";

type Faixa = {
  chave: string;
  nome: string;
  percentual: number;
  quantidade: number;
  custoMedio: number;
  vendaMedia: number;
  custoTotal: number;
  receita: number;
  contribuicao: number;
};

function CustosMargensPage() {
  const qc = useQueryClient();
  const [aba, setAba] = useState<AbaFinanceiro>("operacional");
  const [volume, setVolume] = useState(1000);
  const [edicoesDespesas, setEdicoesDespesas] = useState<Record<string, any>>({});
  const [edicoesMix, setEdicoesMix] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const [novoGasto, setNovoGasto] = useState({ nome: "", categoria: "Operacional", valor_mensal: "" });

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-financeiro-operacional"],
    queryFn: async () => {
      const [prod, rec, itens, ings, preps, prepItens, embalagens, despesas, mix] = await Promise.all([
        supabase
          .from("produtos")
          .select("id,nome,tipo_produto,preco,preco_300g,preco_400g,ativo")
          .in("tipo_produto", ["marmita", "sopa", "complemento"])
          .order("nome"),
        supabase.from("cozinha_receitas").select("id,produto_id"),
        supabase
          .from("cozinha_receita_itens")
          .select("receita_id,ingrediente_id,preparacao_id,gramas_personalizada,gramas_200,gramas_300,gramas_400,operacao_producao,fator_producao"),
        supabase.from("cozinha_ingredientes").select("id,nome,unidade_medida,custo_por_kg,custo_por_unidade"),
        supabase.from("cozinha_preparacoes").select("id,rendimento_final_g"),
        supabase
          .from("cozinha_preparacao_itens")
          .select("preparacao_id,ingrediente_id,preparacao_componente_id,quantidade"),
        supabase.from("cozinha_embalagens").select("categoria,custo_unitario,ativo"),
        supabase.from("financeiro_despesas_operacionais").select("*").order("ordem"),
        supabase.from("financeiro_mix_operacional").select("*").order("ordem"),
      ]);
      for (const r of [prod, rec, itens, ings, preps, prepItens, embalagens, despesas, mix]) {
        if (r.error) throw r.error;
      }

      const ingMap = new Map((ings.data ?? []).map((x: any) => [x.id, x]));
      const prepMap = new Map((preps.data ?? []).map((x: any) => [x.id, x]));
      const recByProduct = new Map((rec.data ?? []).map((x: any) => [x.produto_id, x.id]));
      const itensByRec = new Map<string, any[]>();
      (itens.data ?? []).forEach((x: any) =>
        itensByRec.set(x.receita_id, [...(itensByRec.get(x.receita_id) || []), x]),
      );
      const prepItensByPrep = new Map<string, any[]>();
      (prepItens.data ?? []).forEach((x: any) =>
        prepItensByPrep.set(x.preparacao_id, [...(prepItensByPrep.get(x.preparacao_id) || []), x]),
      );

      const custoIng = (id: string) => {
        const x: any = ingMap.get(id);
        if (!x) return 0;
        return x.unidade_medida === "un" || x.unidade_medida === "L"
          ? n(x.custo_por_unidade)
          : n(x.custo_por_kg) / 1000;
      };

      const custoPrepG = (id: string, visitados = new Set<string>()): number => {
        if (!id || visitados.has(id)) return 0;
        const p: any = prepMap.get(id);
        const rendimento = n(p?.rendimento_final_g);
        if (!(rendimento > 0)) return 0;
        const proximos = new Set(visitados);
        proximos.add(id);
        const total = (prepItensByPrep.get(id) || []).reduce((s: number, x: any) => {
          const qtd = n(x.quantidade);
          if (!(qtd > 0)) return s;
          if (x.preparacao_componente_id) {
            return s + qtd * custoPrepG(x.preparacao_componente_id, proximos);
          }
          return s + qtd * custoIng(x.ingrediente_id);
        }, 0);
        return total / rendimento;
      };

      const embalagem = (tipo: string, tam: string) => {
        const categoria =
          tipo === "sopa"
            ? "sopa"
            : tipo === "complemento"
              ? "marmita_200"
              : `marmita_${tam}`;
        const emb: any = (embalagens.data ?? []).find(
          (x: any) => x.categoria === categoria && x.ativo !== false,
        );
        const etq: any = (embalagens.data ?? []).find(
          (x: any) => x.categoria === "etiqueta" && x.ativo !== false,
        );
        return {
          embalagem: n(emb?.custo_unitario),
          etiqueta: n(etq?.custo_unitario),
          total: n(emb?.custo_unitario) + n(etq?.custo_unitario),
          embalagemCadastrada: Boolean(emb),
        };
      };

      const quantidadeLinha = (x: any, tam: string) => {
        const campo = tam === "150" ? "gramas_personalizada" : `gramas_${tam}`;
        const base = n(x[campo]);
        const fator = n(x.fator_producao || 1);
        if (x.operacao_producao === "acrescentar") return base * (1 + fator);
        if (x.operacao_producao === "dividir" && fator) return base / fator;
        return base;
      };

      const custoLinha = (x: any, tam: string) => {
        const qtd = quantidadeLinha(x, tam);
        if (x.ingrediente_id) return qtd * custoIng(x.ingrediente_id);
        if (x.preparacao_id) return qtd * custoPrepG(x.preparacao_id);
        return 0;
      };

      const produtosCalculados = (prod.data ?? []).map((p: any) => {
        const recId = recByProduct.get(p.id);
        const linhas = itensByRec.get(recId) || [];
        const tamanhos =
          p.tipo_produto === "sopa"
            ? ["400"]
            : p.tipo_produto === "complemento"
              ? ["150"]
              : ["200", "300", "400"];
        return {
          ...p,
          tamanhos: tamanhos.map((tam) => {
            const custoIngredientes = linhas.reduce((s, x) => s + custoLinha(x, tam), 0);
            const custoEmbalagem = embalagem(p.tipo_produto, tam);
            const custo = custoIngredientes + custoEmbalagem.total;
            const preco =
              p.tipo_produto === "complemento" || tam === "200"
                ? n(p.preco)
                : tam === "300"
                  ? n(p.preco_300g || p.preco)
                  : n(p.preco_400g || p.preco);
            const lucro = preco - custo;
            const margem = preco > 0 ? (lucro / preco) * 100 : 0;
            return { tam, custo, custoIngredientes, custoEmbalagem, preco, margem, lucro };
          }),
        };
      });

      return {
        produtos: produtosCalculados,
        despesas: despesas.data ?? [],
        mix: mix.data ?? [],
      };
    },
  });

  const produtosAtivos = useMemo(
    () => (data?.produtos ?? []).filter((p: any) => p.ativo !== false),
    [data?.produtos],
  );

  const mediaSegmento = (chave: string) => {
    let candidatos: any[] = [];
    if (chave.startsWith("marmita_")) {
      const tam = chave.split("_")[1];
      candidatos = produtosAtivos
        .filter((p: any) => p.tipo_produto === "marmita")
        .map((p: any) => p.tamanhos.find((t: any) => t.tam === tam))
        .filter(Boolean);
    } else if (chave === "sopa") {
      candidatos = produtosAtivos
        .filter((p: any) => p.tipo_produto === "sopa")
        .map((p: any) => p.tamanhos[0])
        .filter(Boolean);
    } else if (chave === "complemento_150") {
      candidatos = produtosAtivos
        .filter((p: any) => p.tipo_produto === "complemento")
        .map((p: any) => p.tamanhos[0])
        .filter(Boolean);
    }
    const custos = candidatos.map((x) => n(x.custo)).filter((x) => x > 0);
    const vendas = candidatos.map((x) => n(x.preco)).filter((x) => x > 0);
    return {
      custo: custos.length ? custos.reduce((a, b) => a + b, 0) / custos.length : 0,
      venda: vendas.length ? vendas.reduce((a, b) => a + b, 0) / vendas.length : 0,
      produtos: candidatos.length,
    };
  };

  const mixAtual = (data?.mix ?? []).filter((x: any) => x.ativo !== false);
  const somaMix = mixAtual.reduce((s: number, x: any) => s + n(edicoesMix[x.chave] ?? x.percentual), 0);
  const pesosMix = mixAtual.map((x: any) => ({
    ...x,
    percentualAtual: n(edicoesMix[x.chave] ?? x.percentual),
  }));
  const volumeSeguro = Math.max(0, Math.round(n(volume)));

  const alocarUnidades = () => {
    if (!pesosMix.length || !(somaMix > 0) || volumeSeguro <= 0) return new Map<string, number>();
    const bases = pesosMix.map((x: any) => {
      const exato = (volumeSeguro * x.percentualAtual) / somaMix;
      return { chave: x.chave, base: Math.floor(exato), resto: exato - Math.floor(exato) };
    });
    let faltam = volumeSeguro - bases.reduce((s, x) => s + x.base, 0);
    bases.sort((a, b) => b.resto - a.resto);
    for (let i = 0; i < bases.length && faltam > 0; i++, faltam--) bases[i].base += 1;
    return new Map(bases.map((x) => [x.chave, x.base]));
  };

  const unidadesPorMix = alocarUnidades();

  const faixas: Faixa[] = pesosMix.map((x: any) => {
    const media = mediaSegmento(x.chave);
    const quantidade = unidadesPorMix.get(x.chave) || 0;
    const custoTotal = quantidade * media.custo;
    const receita = quantidade * media.venda;
    return {
      chave: x.chave,
      nome: x.nome,
      percentual: x.percentualAtual,
      quantidade,
      custoMedio: media.custo,
      vendaMedia: media.venda,
      custoTotal,
      receita,
      contribuicao: receita - custoTotal,
    };
  });

  const despesasAtivas = (data?.despesas ?? []).filter((x: any) => x.ativo !== false);
  const totalFixo = despesasAtivas.reduce((s: number, x: any) => s + n(x.valor_mensal), 0);
  const custoVariavelTotal = faixas.reduce((s, x) => s + x.custoTotal, 0);
  const receitaTotal = faixas.reduce((s, x) => s + x.receita, 0);
  const contribuicaoTotal = receitaTotal - custoVariavelTotal;
  const resultadoOperacional = contribuicaoTotal - totalFixo;
  const custoMedioPonderado = volumeSeguro > 0 ? custoVariavelTotal / volumeSeguro : 0;
  const vendaMediaPonderada = volumeSeguro > 0 ? receitaTotal / volumeSeguro : 0;
  const contribuicaoMedia = vendaMediaPonderada - custoMedioPonderado;
  const pontoEquilibrio = contribuicaoMedia > 0 ? Math.ceil(totalFixo / contribuicaoMedia) : 0;
  const faturamentoEquilibrio = pontoEquilibrio * vendaMediaPonderada;

  const linhasProdutos = (data?.produtos ?? []).flatMap((p: any) =>
    p.tamanhos.map((t: any) => ({ nome: p.nome, tipo: p.tipo_produto, ...t })),
  );
  const margemMedia = linhasProdutos.length
    ? linhasProdutos.reduce((s: number, x: any) => s + x.margem, 0) / linhasProdutos.length
    : 0;

  const editarDespesa = (id: string, campo: string, valor: any) =>
    setEdicoesDespesas((atual) => ({
      ...atual,
      [id]: { ...(atual[id] || {}), [campo]: valor },
    }));

  const valorDespesa = (item: any, campo: string) =>
    edicoesDespesas[item.id]?.[campo] ?? item[campo];

  const salvarDespesa = async (item: any) => {
    setSalvando(item.id);
    const patch = edicoesDespesas[item.id] || {};
    const { error } = await supabase
      .from("financeiro_despesas_operacionais")
      .update({
        nome: String(patch.nome ?? item.nome).trim(),
        categoria: String(patch.categoria ?? item.categoria).trim() || "Operacional",
        valor_mensal: Math.max(0, n(patch.valor_mensal ?? item.valor_mensal)),
        ativo: patch.ativo ?? item.ativo,
        observacao: String(patch.observacao ?? item.observacao ?? "").trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);
    setSalvando(null);
    if (error) return toast.error(error.message);
    setEdicoesDespesas((atual) => {
      const proximo = { ...atual };
      delete proximo[item.id];
      return proximo;
    });
    await qc.invalidateQueries({ queryKey: ["admin-financeiro-operacional"] });
    toast.success("Gasto operacional atualizado.");
  };

  const adicionarGasto = async () => {
    if (!novoGasto.nome.trim()) return toast.error("Informe o nome do gasto.");
    setSalvando("novo");
    const proximaOrdem = Math.max(0, ...(data?.despesas ?? []).map((x: any) => n(x.ordem))) + 10;
    const { error } = await supabase.from("financeiro_despesas_operacionais").insert({
      nome: novoGasto.nome.trim(),
      categoria: novoGasto.categoria.trim() || "Operacional",
      valor_mensal: Math.max(0, n(novoGasto.valor_mensal)),
      ativo: true,
      ordem: proximaOrdem,
      origem: "manual",
    });
    setSalvando(null);
    if (error) return toast.error(error.message);
    setNovoGasto({ nome: "", categoria: "Operacional", valor_mensal: "" });
    await qc.invalidateQueries({ queryKey: ["admin-financeiro-operacional"] });
    toast.success("Gasto operacional adicionado.");
  };

  const salvarMix = async (item: any) => {
    const valor = Math.max(0, Math.min(100, n(edicoesMix[item.chave] ?? item.percentual)));
    setSalvando("mix-" + item.chave);
    const { error } = await supabase
      .from("financeiro_mix_operacional")
      .update({ percentual: valor, updated_at: new Date().toISOString() })
      .eq("chave", item.chave);
    setSalvando(null);
    if (error) return toast.error(error.message);
    setEdicoesMix((atual) => {
      const proximo = { ...atual };
      delete proximo[item.chave];
      return proximo;
    });
    await qc.invalidateQueries({ queryKey: ["admin-financeiro-operacional"] });
    toast.success("Mix de vendas atualizado.");
  };

  if (isLoading) return <div className="p-8 text-gray-500">Calculando financeiro e custos...</div>;
  if (error) return <div className="p-8 text-red-600">Não foi possível carregar o financeiro.</div>;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-black text-[#5850ec]">
            <WalletCards /> Financeiro
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Controle operacional, ponto de equilíbrio e custos técnicos em uma única área.
          </p>
        </div>
        <div className="flex rounded-xl border bg-white p-1">
          <button
            onClick={() => setAba("operacional")}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${aba === "operacional" ? "bg-[#5850ec] text-white" : "text-gray-500"}`}
          >
            Controle operacional
          </button>
          <button
            onClick={() => setAba("produtos")}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${aba === "produtos" ? "bg-[#5850ec] text-white" : "text-gray-500"}`}
          >
            Custos por produto
          </button>
        </div>
      </div>

      {aba === "operacional" ? (
        <>
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#5850ec]">Simulador mensal</p>
                <h2 className="mt-1 text-xl font-black text-gray-900">Produção, vendas e ponto de equilíbrio</h2>
                <p className="mt-1 max-w-3xl text-sm text-gray-500">
                  Informe o total de unidades. O sistema distribui o volume pelo mix cadastrado e usa os custos médios reais das fichas técnicas, embalagens e etiquetas.
                </p>
              </div>
              <label className="min-w-[230px] text-xs font-bold uppercase text-gray-500">
                Total de unidades
                <input
                  className={input + " mt-1 text-lg font-black"}
                  type="number"
                  min="0"
                  step="1"
                  value={volume}
                  onChange={(e) => setVolume(Math.max(0, n(e.target.value)))}
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {[
                ["Receita estimada", brl(receitaTotal), "venda média atual"],
                ["Insumos", brl(custoVariavelTotal), "fichas + embalagem + etiqueta"],
                ["Despesas fixas", brl(totalFixo), "mensal"],
                ["Gasto total", brl(custoVariavelTotal + totalFixo), "variável + fixo"],
                ["Resultado", brl(resultadoOperacional), resultadoOperacional >= 0 ? "superávit" : "déficit"],
                ["Zero a zero", pontoEquilibrio ? `${pontoEquilibrio.toLocaleString("pt-BR")} un` : "—", "ponto de equilíbrio"],
                ["Faturamento 0 a 0", pontoEquilibrio ? brl(faturamentoEquilibrio) : "—", "estimado"],
              ].map(([label, valor, sub]) => (
                <article key={label} className="rounded-xl border bg-gray-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">{label}</p>
                  <p className={`mt-1 text-lg font-black ${label === "Resultado" ? (resultadoOperacional >= 0 ? "text-emerald-600" : "text-red-600") : "text-gray-900"}`}>
                    {valor}
                  </p>
                  <p className="text-[10px] text-gray-400">{sub}</p>
                </article>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-[#f5f3ff] p-4">
                <p className="text-xs font-bold text-[#5850ec]">Venda média ponderada / unidade</p>
                <p className="mt-1 text-2xl font-black">{brl(vendaMediaPonderada)}</p>
              </div>
              <div className="rounded-xl bg-[#fff8e6] p-4">
                <p className="text-xs font-bold text-amber-700">Custo médio de insumos / unidade</p>
                <p className="mt-1 text-2xl font-black">{brl(custoMedioPonderado)}</p>
              </div>
              <div className="rounded-xl bg-[#edf8f1] p-4">
                <p className="text-xs font-bold text-emerald-700">Contribuição média / unidade</p>
                <p className="mt-1 text-2xl font-black">{brl(contribuicaoMedia)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#5850ec]">Mix operacional</p>
                <h2 className="mt-1 text-xl font-black">Distribuição das vendas</h2>
                <p className="mt-1 text-sm text-gray-500">
                  O custo médio de cada faixa vem automaticamente do cardápio. Os percentuais podem ser ajustados.
                </p>
              </div>
              <div className={`rounded-xl px-3 py-2 text-sm font-black ${Math.abs(somaMix - 100) < 0.001 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                Soma do mix: {pct(somaMix)}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-3">Tipo</th>
                    <th className="px-3 py-3">Mix</th>
                    <th className="px-3 py-3 text-right">Qtd.</th>
                    <th className="px-3 py-3 text-right">Custo médio</th>
                    <th className="px-3 py-3 text-right">Venda média</th>
                    <th className="px-3 py-3 text-right">Gasto produção</th>
                    <th className="px-3 py-3 text-right">Receita</th>
                    <th className="px-3 py-3 text-right">Contribuição</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {faixas.map((f) => {
                    const original = mixAtual.find((x: any) => x.chave === f.chave);
                    return (
                      <tr key={f.chave} className="border-t">
                        <td className="px-3 py-3 font-bold">{f.nome}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <input
                              className="w-20 rounded-lg border px-2 py-1.5 text-right font-bold"
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={edicoesMix[f.chave] ?? String(original?.percentual ?? 0)}
                              onChange={(e) => setEdicoesMix((a) => ({ ...a, [f.chave]: e.target.value }))}
                            />
                            <span>%</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-bold">{f.quantidade.toLocaleString("pt-BR")}</td>
                        <td className="px-3 py-3 text-right">{brl(f.custoMedio)}</td>
                        <td className="px-3 py-3 text-right">{brl(f.vendaMedia)}</td>
                        <td className="px-3 py-3 text-right">{brl(f.custoTotal)}</td>
                        <td className="px-3 py-3 text-right">{brl(f.receita)}</td>
                        <td className={`px-3 py-3 text-right font-black ${f.contribuicao >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {brl(f.contribuicao)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => original && salvarMix(original)}
                            disabled={salvando === "mix-" + f.chave}
                            className="rounded-lg border px-2 py-1.5 text-xs font-bold text-[#5850ec] disabled:opacity-50"
                          >
                            Salvar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {Math.abs(somaMix - 100) >= 0.001 && (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-bold text-amber-700">
                O mix não soma 100%. Enquanto isso, a simulação distribui o total proporcionalmente aos percentuais informados, sem perder unidades.
              </p>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-wide text-[#5850ec]">Despesas operacionais</p>
              <h2 className="mt-1 text-xl font-black">Gastos mensais</h2>
              <p className="mt-1 text-sm text-gray-500">
                Estes valores já entram no ponto de equilíbrio. A estrutura foi preparada para futuramente vincular cada linha aos lançamentos do financeiro sem duplicar o gasto.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-3">Gasto</th>
                    <th className="px-3 py-3">Categoria</th>
                    <th className="px-3 py-3 text-right">Mensal</th>
                    <th className="px-3 py-3">Observação</th>
                    <th className="px-3 py-3">Ativo</th>
                    <th className="px-3 py-3">Vínculo</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.despesas ?? []).map((item: any) => (
                    <tr key={item.id} className="border-t align-top">
                      <td className="px-3 py-2">
                        <input className={input} value={valorDespesa(item, "nome")} onChange={(e) => editarDespesa(item.id, "nome", e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input className={input} value={valorDespesa(item, "categoria")} onChange={(e) => editarDespesa(item.id, "categoria", e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input className={input + " text-right font-bold"} type="number" min="0" step="0.01" value={valorDespesa(item, "valor_mensal")} onChange={(e) => editarDespesa(item.id, "valor_mensal", e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input className={input} value={valorDespesa(item, "observacao") || ""} onChange={(e) => editarDespesa(item.id, "observacao", e.target.value)} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input type="checkbox" checked={Boolean(valorDespesa(item, "ativo"))} onChange={(e) => editarDespesa(item.id, "ativo", e.target.checked)} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-500">
                          {item.financeiro_lancamento_id ? "Vinculado" : "Manual · pronto para vincular"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => salvarDespesa(item)} disabled={salvando === item.id} className="rounded-lg bg-[#5850ec] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                          <Save size={13} className="mr-1 inline" /> Salvar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-[#f8f7ff] font-black">
                    <td className="px-3 py-3" colSpan={2}>TOTAL FIXO ATIVO</td>
                    <td className="px-3 py-3 text-right text-lg text-[#5850ec]">{brl(totalFixo)}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4 grid gap-2 rounded-xl border border-dashed p-3 md:grid-cols-[1fr_220px_180px_auto]">
              <input className={input} placeholder="Novo gasto" value={novoGasto.nome} onChange={(e) => setNovoGasto({ ...novoGasto, nome: e.target.value })} />
              <input className={input} placeholder="Categoria" value={novoGasto.categoria} onChange={(e) => setNovoGasto({ ...novoGasto, categoria: e.target.value })} />
              <input className={input} type="number" min="0" step="0.01" placeholder="Valor mensal" value={novoGasto.valor_mensal} onChange={(e) => setNovoGasto({ ...novoGasto, valor_mensal: e.target.value })} />
              <button onClick={adicionarGasto} disabled={salvando === "novo"} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5850ec] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                <Plus size={16} /> Adicionar
              </button>
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-xs font-bold uppercase text-gray-400">Produtos analisados</p>
              <p className="mt-1 text-2xl font-black">{data?.produtos?.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-xs font-bold uppercase text-gray-400">Variações calculadas</p>
              <p className="mt-1 text-2xl font-black">{linhasProdutos.length}</p>
            </div>
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-xs font-bold uppercase text-gray-400">Margem bruta média</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">{pct(margemMedia)}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Tamanho</th>
                    <th className="px-4 py-3 text-right">Custo</th>
                    <th className="px-4 py-3 text-right">Venda</th>
                    <th className="px-4 py-3 text-right">Lucro bruto</th>
                    <th className="px-4 py-3 text-right">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasProdutos.map((x: any) => (
                    <tr key={`${x.nome}-${x.tam}`} className="border-t">
                      <td className="px-4 py-3 font-semibold">{x.nome}</td>
                      <td className="px-4 py-3 capitalize">{x.tipo}</td>
                      <td className="px-4 py-3">{x.tam} g</td>
                      <td className="px-4 py-3 text-right">{brl(x.custo)}</td>
                      <td className="px-4 py-3 text-right">{brl(x.preco)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${x.lucro < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {brl(x.lucro)}
                      </td>
                      <td className={`px-4 py-3 text-right font-black ${x.margem < 30 ? "text-red-600" : x.margem < 45 ? "text-amber-600" : "text-emerald-600"}`}>
                        {pct(x.margem)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Custos técnicos usam ingredientes, preparações compartilhadas, embalagens e etiqueta. Complementos de 150 g usam a mesma embalagem de 250 ml das marmitas de 200 g.
          </p>
        </>
      )}
    </div>
  );
}
