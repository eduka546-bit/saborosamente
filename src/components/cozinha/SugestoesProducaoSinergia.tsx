import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  dataProducao: string;
  producoes: any[];
  produtos: any[];
  receitas: any[];
  receitaItens: any[];
  ingredientes: any[];
  estoqueMarmitas: any[];
};

type Sugestao = {
  produto: any;
  score: number;
  nivel: "alta" | "media";
  ingrediente: string;
  motivo: string;
  estoque: number;
  mediaDia: number;
  sugerida: number;
};

const n = (v: unknown) => Number(v || 0);

export function SugestoesProducaoSinergia({
  dataProducao,
  producoes,
  produtos,
  receitas,
  receitaItens,
  ingredientes,
  estoqueMarmitas,
}: Props) {
  const produtoPorId = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);
  const receitaPorProduto = useMemo(() => new Map(receitas.map((r) => [r.produto_id, r])), [receitas]);
  const itensPorReceita = useMemo(() => {
    const map = new Map<string, any[]>();
    receitaItens.forEach((item) => map.set(item.receita_id, [...(map.get(item.receita_id) || []), item]));
    return map;
  }, [receitaItens]);
  const ingredientePorId = useMemo(() => new Map(ingredientes.map((i) => [i.id, i])), [ingredientes]);

  // Histórico simples de vendas: usamos pedidos/itens para estimar a saída média por produto.
  const { data: historico = [] } = useQuery({
    queryKey: ["coz-sinergia-vendas", dataProducao],
    queryFn: async () => {
      const inicio = new Date(`${dataProducao}T00:00:00`);
      inicio.setDate(inicio.getDate() - 30);
      const { data, error } = await supabase
        .from("pedido_itens")
        .select("produto_id,quantidade,pedido_id,pedidos!inner(status,created_at)")
        .gte("pedidos.created_at", inicio.toISOString())
        .lt("pedidos.created_at", `${dataProducao}T23:59:59`)
        .not("pedidos.status", "in", "(cancelado,cancelada)" );
      if (error) return [];
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const vendas30 = useMemo(() => {
    const map = new Map<string, number>();
    (historico as any[]).forEach((item) => map.set(item.produto_id, n(map.get(item.produto_id)) + n(item.quantidade)));
    return map;
  }, [historico]);

  const sugestoes = useMemo<Sugestao[]>(() => {
    const planejados = (producoes || []).filter((p) => p.status !== "cancelada");
    if (!planejados.length) return [];

    // Ingredientes presentes em uma produção já planejada. A gramatura é considerada para
    // evitar recomendar um prato que só compartilhe um ingrediente irrelevante em quantidade mínima.
    const base = new Map<string, { peso: number; produtos: string[] }>();
    planejados.forEach((p) => {
      const receita = receitaPorProduto.get(p.produto_id);
      if (!receita) return;
      const campo = `gramas_${p.gramatura || "400"}`;
      (itensPorReceita.get(receita.id) || []).forEach((item) => {
        if (!item.ingrediente_id) return;
        const peso = n(item[campo]) * n(p.quantidade_planejada);
        if (peso <= 0) return;
        const atual = base.get(item.ingrediente_id) || { peso: 0, produtos: [] };
        atual.peso += peso;
        const nome = produtoPorId.get(p.produto_id)?.nome;
        if (nome && !atual.produtos.includes(nome)) atual.produtos.push(nome);
        base.set(item.ingrediente_id, atual);
      });
    });

    const idsPlanejados = new Set(planejados.map((p) => p.produto_id));
    const resultado: Sugestao[] = [];

    produtos
      .filter((p) => ["marmita", "sopa", "complemento"].includes(p.tipo_produto || "marmita"))
      .filter((p) => p.ativo !== false && !idsPlanejados.has(p.id))
      .forEach((p) => {
        const receita = receitaPorProduto.get(p.id);
        if (!receita) return;
        const itens = itensPorReceita.get(receita.id) || [];
        let melhor: { score: number; ingredienteId: string; peso: number } | null = null;

        itens.forEach((item) => {
          if (!item.ingrediente_id) return;
          const baseIng = base.get(item.ingrediente_id);
          if (!baseIng || n(item.gramas_400) <= 0) return;
          const qtdNoPrato = n(item.gramas_400);
          // Principalidade: quantidade usada na ficha. O score favorece ingredientes
          // compartilhados em maior quantidade e evita sugestões por arroz/sal/temperos.
          const score = Math.min(100, (qtdNoPrato / 400) * 70 + Math.min(30, baseIng.peso / 10000 * 30));
          if (!melhor || score > melhor.score) melhor = { score, ingredienteId: item.ingrediente_id, peso: qtdNoPrato };
        });

        if (!melhor || melhor.score < 25) return;
        const ing = ingredientePorId.get(melhor.ingredienteId);
        if (!ing) return;
        const estoque = (estoqueMarmitas || [])
          .filter((e) => e.produto_id === p.id)
          .reduce((s, e) => s + n(e.quantidade), 0);
        const mediaDia = n(vendas30.get(p.id)) / 30;
        const sugerida = Math.max(1, Math.ceil(mediaDia * 2 - estoque));
        resultado.push({
          produto: p,
          score: melhor.score,
          nivel: melhor.score >= 55 ? "alta" : "media",
          ingrediente: ing.nome,
          motivo: `A ficha usa ${melhor.peso.toLocaleString("pt-BR")} g de ${ing.nome}; esse ingrediente já está na produção de hoje.`,
          estoque,
          mediaDia,
          sugerida,
        });
      });

    return resultado.sort((a, b) => b.score - a.score).slice(0, 6);
  }, [producoes, produtos, receitaPorProduto, itensPorReceita, ingredientePorId, produtoPorId, estoqueMarmitas, vendas30]);

  if (!sugestoes.length) return null;

  return (
    <div className="mb-5 rounded-2xl border border-[#cfe3d5] bg-[#f2faf5] p-4 md:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#087443] text-white">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="font-black text-[#173a2d]">Sinergias de produção</h2>
          <p className="text-sm text-[#62766b]">Já que estes ingredientes estarão sendo preparados hoje, vale avaliar estas outras marmitas.</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sugestoes.map((s) => (
          <article key={s.produto.id} className="rounded-xl border border-[#dbe7dd] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold">{s.produto.nome}</h3>
                <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${s.nivel === "alta" ? "bg-[#e0f2e7] text-[#087443]" : "bg-[#fff4d9] text-[#8b5a00]"}`}>
                  Sinergia {s.nivel}
                </span>
              </div>
              <TrendingUp size={17} className="text-[#087443]" />
            </div>
            <p className="mt-3 text-sm text-[#52695f]">{s.motivo}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-[#f7f6f0] p-2"><span className="text-[#62766b]">Estoque cozinha</span><strong className="block text-sm">{s.estoque.toLocaleString("pt-BR")} un</strong></div>
              <div className="rounded-lg bg-[#f7f6f0] p-2"><span className="text-[#62766b]">Média/dia</span><strong className="block text-sm">{s.mediaDia.toFixed(1)} un</strong></div>
            </div>
            <p className="mt-3 text-sm font-bold text-[#087443]">Sugestão inicial: +{s.sugerida} un</p>
          </article>
        ))}
      </div>
    </div>
  );
}
