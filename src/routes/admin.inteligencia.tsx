import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  BellRing,
  FlaskConical,
  PackageSearch,
  Users,
  ArrowLeft,
  Copy,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/inteligencia")({
  component: InteligenciaPage,
  ssr: false,
});

function InteligenciaPage() {
  const { data: funil = [] } = useQuery({
    queryKey: ["intel-funil-30d"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("funil_analytics", { p_dias: 30 });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: estoque = [] } = useQuery({
    queryKey: ["intel-estoque"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("inteligencia_estoque");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: segmentos = [] } = useQuery({
    queryKey: ["intel-segmentos"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("segmentos_clientes");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: reposicao = [] } = useQuery({
    queryKey: ["intel-reposicao"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("demanda_reposicao");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: ab = [] } = useQuery({
    queryKey: ["intel-ab-product-cta"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ab_test_resultados", {
        p_experimento: "product_modal_cta_v1",
        p_dias: 30,
      });
      if (error) throw error;
      return data ?? [];
    },
  });

  const counts = (segmentos as any[]).reduce((acc: Record<string, number>, item: any) => {
    acc[item.segmento] = (acc[item.segmento] || 0) + 1;
    return acc;
  }, {});

  const copySegment = async (segmento: string) => {
    const phones = (segmentos as any[])
      .filter((item) => item.segmento === segmento && item.telefone)
      .map((item) => String(item.telefone).replace(/\D/g, ""))
      .filter(Boolean);
    if (!phones.length) return toast.info("Nenhum telefone neste segmento.");
    await navigator.clipboard.writeText(phones.join("\n"));
    toast.success(`${phones.length} contatos copiados.`);
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/admin" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-primary">
            <ArrowLeft className="size-4" /> Voltar ao painel
          </Link>
          <h1 className="text-3xl font-black text-[#173a2d]">Inteligência comercial</h1>
          <p className="mt-1 text-sm text-[#62766b]">
            Funil, demanda, clientes e previsão de estoque em um só lugar.
          </p>
        </div>
        <Link
          to="/admin/campanhas"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-white"
        >
          <Megaphone className="size-4" /> Abrir campanhas
        </Link>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          <h2 className="text-lg font-black">Funil dos últimos 30 dias</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {(funil as any[]).map((item) => (
            <article key={item.evento} className="rounded-2xl border bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#62766b]">
                {item.evento.replaceAll("_", " ")}
              </p>
              <p className="mt-2 text-2xl font-black text-[#087443]">{item.sessoes}</p>
              <p className="text-xs text-[#62766b]">{item.eventos} eventos</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <PackageSearch className="size-5 text-primary" />
            <h2 className="text-lg font-black">Estoque e sugestão de produção</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-white">
            <div className="grid grid-cols-[minmax(180px,1fr)_90px_90px_110px] bg-[#edf5e6] px-3 py-2 text-[10px] font-black uppercase text-[#527164]">
              <span>Produto</span><span>Dias</span><span>Estoque</span><span>Sugestão</span>
            </div>
            {(estoque as any[]).slice(0, 15).map((item) => (
              <div
                key={item.produto_id}
                className="grid grid-cols-[minmax(180px,1fr)_90px_90px_110px] items-center border-t px-3 py-3 text-sm"
              >
                <div>
                  <b>{item.nome}</b>
                  <span className={
                    "ml-2 rounded-full px-2 py-0.5 text-[9px] font-black uppercase " +
                    (item.prioridade === "urgente"
                      ? "bg-red-100 text-red-700"
                      : item.prioridade === "atencao"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700")
                  }>
                    {item.prioridade}
                  </span>
                </div>
                <span>{item.dias_restantes ?? "—"}</span>
                <span>{item.estoque_total}</span>
                <b className="text-primary">{item.sugestao_producao} un</b>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <BellRing className="size-5 text-primary" />
            <h2 className="text-lg font-black">Procura por itens esgotados</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-white">
            {(reposicao as any[]).length === 0 ? (
              <p className="p-6 text-sm text-[#62766b]">Nenhum alerta de reposição aguardando.</p>
            ) : (
              (reposicao as any[]).slice(0, 15).map((item) => (
                <div key={`${item.produto_id}:${item.gramatura}`} className="flex items-center justify-between border-b p-4 last:border-b-0">
                  <div>
                    <p className="text-sm font-bold">{item.nome}</p>
                    <p className="text-xs text-[#62766b]">{item.gramatura || "geral"}</p>
                  </div>
                  <span className="rounded-full bg-[#edf5e6] px-3 py-1 text-xs font-black text-primary">
                    {item.interessados} interessados
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h2 className="text-lg font-black">Segmentos de clientes</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {["vip","recorrente","novo","ativo","inativo"].map((segmento) => (
            <article key={segmento} className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-black uppercase text-[#527164]">{segmento}</p>
              <p className="mt-2 text-2xl font-black text-primary">{counts[segmento] || 0}</p>
              <button
                type="button"
                onClick={() => copySegment(segmento)}
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
              >
                <Copy className="size-3" /> Copiar telefones
              </button>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <FlaskConical className="size-5 text-primary" />
          <h2 className="text-lg font-black">Teste A/B do CTA do produto</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(ab as any[]).map((item) => {
            const addRate = Number(item.exposicoes) > 0 ? (Number(item.adicoes) / Number(item.exposicoes)) * 100 : 0;
            const buyRate = Number(item.exposicoes) > 0 ? (Number(item.compras) / Number(item.exposicoes)) * 100 : 0;
            return (
              <article key={item.variante} className="rounded-2xl border bg-white p-4">
                <p className="text-xs font-black uppercase text-[#527164]">Variante {item.variante}</p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div><b className="text-lg">{item.exposicoes}</b><p className="text-[10px] text-[#62766b]">Exposições</p></div>
                  <div><b className="text-lg">{addRate.toFixed(1)}%</b><p className="text-[10px] text-[#62766b]">Adicionaram</p></div>
                  <div><b className="text-lg">{buyRate.toFixed(1)}%</b><p className="text-[10px] text-[#62766b]">Compraram</p></div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
