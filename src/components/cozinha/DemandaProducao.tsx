import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CalendarDays, CheckCircle2, Factory, PackageCheck, Plus } from "lucide-react";
import { toast } from "sonner";

type Demanda = {
  produto_id: string;
  produto_nome: string;
  gramatura: "200" | "300" | "400";
  demanda_pedidos: number;
  estoque_loja: number;
  estoque_cozinha: number;
  producao_planejada: number;
  necessidade_producao: number;
};

const hoje = () => new Date().toISOString().slice(0, 10);
const n = (v: unknown) => Number(v || 0);

export function DemandaProducao() {
  const qc = useQueryClient();
  const [dataProducao, setDataProducao] = useState(hoje());
  const [salvando, setSalvando] = useState<string | null>(null);

  const { data: demanda = [], isLoading, refetch } = useQuery({
    queryKey: ["coz-demanda-producao"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("cozinha_demanda_producao");
      if (error) throw error;
      return (data ?? []) as Demanda[];
    },
  });

  const pendentes = useMemo(
    () => demanda.filter((x) => n(x.necessidade_producao) > 0),
    [demanda],
  );

  const totais = useMemo(() => ({
    pedidos: demanda.reduce((s, x) => s + n(x.demanda_pedidos), 0),
    loja: demanda.reduce((s, x) => s + n(x.estoque_loja), 0),
    cozinha: demanda.reduce((s, x) => s + n(x.estoque_cozinha), 0),
    necessidade: demanda.reduce((s, x) => s + n(x.necessidade_producao), 0),
  }), [demanda]);

  const adicionar = async (item: Demanda) => {
    const quantidade = Math.max(0, Math.trunc(n(item.necessidade_producao)));
    if (!quantidade) return;
    setSalvando(`${item.produto_id}-${item.gramatura}`);
    try {
      const { error } = await supabase.from("cozinha_producoes").insert({
        data_producao: dataProducao,
        produto_id: item.produto_id,
        gramatura: item.gramatura,
        quantidade_planejada: quantidade,
        quantidade_produzida: 0,
        status: "planejada",
        observacao: "Gerado automaticamente pela demanda de pedidos confirmados",
      } as any);
      if (error) throw error;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["coz-prod-dia"] }),
        qc.invalidateQueries({ queryKey: ["coz-demanda-producao"] }),
      ]);
      toast.success(`${quantidade}× ${item.produto_nome} (${item.gramatura} g) adicionada(s) à produção.`);
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível adicionar à produção.");
    } finally {
      setSalvando(null);
    }
  };

  const adicionarTodas = async () => {
    if (!pendentes.length) return;
    setSalvando("todas");
    try {
      const linhas = pendentes.map((item) => ({
        data_producao: dataProducao,
        produto_id: item.produto_id,
        gramatura: item.gramatura,
        quantidade_planejada: Math.max(0, Math.trunc(n(item.necessidade_producao))),
        quantidade_produzida: 0,
        status: "planejada",
        observacao: "Gerado automaticamente pela demanda de pedidos confirmados",
      }));
      const { error } = await supabase.from("cozinha_producoes").insert(linhas as any);
      if (error) throw error;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["coz-prod-dia"] }),
        qc.invalidateQueries({ queryKey: ["coz-demanda-producao"] }),
      ]);
      toast.success("Necessidades adicionadas ao planejamento de produção.");
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível adicionar as necessidades.");
    } finally {
      setSalvando(null);
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#173a2d]">Demanda de produção</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#62766b]">
            Cruza pedidos confirmados em aberto com o estoque da loja, o saldo pronto na cozinha e o que já está planejado. Assim a cozinha recebe necessidade de produção, não pedidos individuais.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-bold text-[#527164]">
            Produzir em
            <span className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-[#087443]" size={16} />
              <input
                type="date"
                value={dataProducao}
                onChange={(e) => setDataProducao(e.target.value)}
                className="rounded-xl border border-[#cbd8ce] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#087443]"
              />
            </span>
          </label>
          <button
            onClick={adicionarTodas}
            disabled={!pendentes.length || salvando === "todas"}
            className="flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Adicionar todas à produção
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Resumo icon={PackageCheck} label="Em pedidos abertos" valor={totais.pedidos} />
        <Resumo icon={CheckCircle2} label="Disponível na loja" valor={totais.loja} />
        <Resumo icon={Factory} label="Pronto na cozinha" valor={totais.cozinha} />
        <Resumo icon={AlertTriangle} label="Falta produzir" valor={totais.necessidade} destaque />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border bg-white p-8 text-center text-sm text-[#62766b]">Calculando demanda…</div>
      ) : !demanda.length ? (
        <div className="rounded-2xl border bg-white p-8 text-center">
          <CheckCircle2 className="mx-auto mb-3 text-[#087443]" />
          <h3 className="font-bold">Nenhuma demanda aberta agora</h3>
          <p className="mt-1 text-sm text-[#62766b]">Pedidos pendentes, em preparo ou em rota aparecerão aqui automaticamente.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-[#f4f7f4] text-left text-xs uppercase tracking-wide text-[#527164]">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 text-center">Tamanho</th>
                  <th className="px-4 py-3 text-center">Pedidos</th>
                  <th className="px-4 py-3 text-center">Loja</th>
                  <th className="px-4 py-3 text-center">Cozinha</th>
                  <th className="px-4 py-3 text-center">Já planejado</th>
                  <th className="px-4 py-3 text-center">Falta produzir</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1ed]">
                {demanda.map((item) => {
                  const falta = n(item.necessidade_producao);
                  const chave = `${item.produto_id}-${item.gramatura}`;
                  return (
                    <tr key={chave} className={falta > 0 ? "bg-[#fffdf5]" : ""}>
                      <td className="px-4 py-3 font-bold text-[#173a2d]">{item.produto_nome}</td>
                      <td className="px-4 py-3 text-center font-bold">{item.gramatura} g</td>
                      <td className="px-4 py-3 text-center">{item.demanda_pedidos}</td>
                      <td className="px-4 py-3 text-center">{item.estoque_loja}</td>
                      <td className="px-4 py-3 text-center">{item.estoque_cozinha}</td>
                      <td className="px-4 py-3 text-center">{item.producao_planejada}</td>
                      <td className={`px-4 py-3 text-center text-lg font-black ${falta > 0 ? "text-[#b65a00]" : "text-[#087443]"}`}>
                        {falta}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {falta > 0 ? (
                          <button
                            onClick={() => adicionar(item)}
                            disabled={salvando === chave || salvando === "todas"}
                            className="rounded-xl border border-[#087443] px-3 py-2 text-xs font-bold text-[#087443] hover:bg-[#e0f2e7] disabled:opacity-50"
                          >
                            Adicionar à produção
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-[#087443]">Coberto</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end border-t bg-[#fafcf9] px-4 py-3">
            <button onClick={() => refetch()} className="text-xs font-bold text-[#087443] hover:underline">Atualizar cálculo</button>
          </div>
        </div>
      )}
    </section>
  );
}

function Resumo({ icon: Icon, label, valor, destaque = false }: any) {
  return (
    <article className={`rounded-2xl border p-4 ${destaque ? "border-[#f0c98a] bg-[#fff6e5]" : "bg-white"}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#62766b]">
        <Icon size={16} className={destaque ? "text-[#b65a00]" : "text-[#087443]"} />
        {label}
      </div>
      <p className={`mt-2 text-3xl font-black ${destaque ? "text-[#b65a00]" : "text-[#173a2d]"}`}>{valor}</p>
      <p className="text-xs text-[#7a8c83]">unidades</p>
    </article>
  );
}
