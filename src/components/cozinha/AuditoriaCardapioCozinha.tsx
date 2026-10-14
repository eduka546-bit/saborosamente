import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck } from "lucide-react";
import { revisarTodasReceitas } from "@/lib/cozinha-revisao-receitas";

type Props = {
  produtos: any[];
  receitas: any[];
  receitaItens: any[];
  montagemItens: any[];
  preparacoes: any[];
  preparacaoItens: any[];
  ingredientes: any[];
};

export function AuditoriaCardapioCozinha(props: Props) {
  const revisoes = useMemo(() => revisarTodasReceitas(props), [
    props.produtos, props.receitas, props.receitaItens, props.montagemItens,
    props.preparacoes, props.preparacaoItens, props.ingredientes,
  ]);
  const totalSimulacoes = revisoes.reduce((s, r) => s + r.simulacoes, 0);
  const pendencias = revisoes.filter((r) => r.estrutura.length || r.rendimentos.length || r.simulacao.length);
  const errosEstrutura = revisoes.reduce((s, r) => s + r.estrutura.length, 0);
  const alertasRendimento = revisoes.reduce((s, r) => s + r.rendimentos.length, 0);
  const errosTamanho = revisoes.reduce((s, r) => s + r.simulacao.length, 0);
  if (!revisoes.length) return null;
  return <details className="mb-5 rounded-2xl border border-[#dbe7dd] bg-white shadow-sm">
    <summary className="cursor-pointer list-none p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-black text-[#075636]"><ClipboardCheck size={19} /> Auditoria contínua das receitas</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#62766b]">
            Três verificações em cada uma das {revisoes.length} fichas técnicas; resultados recalculados quando os cadastros mudam.
          </p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-black ${pendencias.length ? "bg-amber-100 text-amber-800" : "bg-[#e0f2e7] text-[#087443]"}`}>
          {pendencias.length ? `${pendencias.length} receita(s) com atenção` : "Nenhuma divergência automática"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-[#f2f7ef] p-2"><b className="block text-base text-[#087443]">{revisoes.length}</b><span className="text-[11px] font-semibold text-[#52695f]">Fichas verificadas</span></div>
        <div className="rounded-xl bg-[#f2f7ef] p-2"><b className="block text-base text-[#087443]">{totalSimulacoes}</b><span className="text-[11px] font-semibold text-[#52695f]">Tamanhos simulados</span></div>
        <div className={`rounded-xl p-2 ${pendencias.length ? "bg-amber-50" : "bg-[#f2f7ef]"}`}><b className={`block text-base ${pendencias.length ? "text-amber-800" : "text-[#087443]"}`}>{pendencias.length}</b><span className="text-[11px] font-semibold text-[#52695f]">Pendências</span></div>
      </div>
      <p className="mt-2 text-xs font-semibold text-[#62766b]">Clique para ver as três revisões de cada produto e as pendências.</p>
    </summary>
    <div className="border-t border-[#dbe7dd] px-4 pb-4 pt-3 sm:px-5">
      <p className="mb-3 text-xs leading-relaxed text-[#62766b]">
        1. Integridade dos vínculos • 2. Rendimentos e perdas dos preparos • 3. Simulação de 150/200/300/400 g conforme o produto.
        Foram encontradas {errosEstrutura} inconsistências estruturais, {alertasRendimento} alerta(s) de rendimento e {errosTamanho} divergência(s) em tamanhos.
        A auditoria automática não substitui pesagem real, e não altera receitas sem confirmação.
      </p>
      <div className="overflow-x-auto rounded-xl border border-[#dbe7dd]">
        <table className="w-full min-w-[690px] text-left text-xs sm:text-sm">
          <thead className="bg-[#edf5e6] text-[#173a2d]">
            <tr><th className="px-3 py-3">Receita</th><th className="px-3 py-3">1. Estrutura</th><th className="px-3 py-3">2. Rendimentos</th><th className="px-3 py-3">3. Montagem</th></tr>
          </thead>
          <tbody>
            {revisoes.map((r) => <tr key={r.receitaId} className="border-t border-[#ebf0eb] align-top">
              <td className="max-w-[320px] px-3 py-2.5"><b className="break-words text-[#173a2d]">{r.produto}</b>
                {Boolean(r.estrutura.length + r.rendimentos.length + r.simulacao.length) && <div className="mt-1 space-y-1 text-[11px] text-amber-900">
                  {[...r.estrutura, ...r.rendimentos, ...r.simulacao].map((aviso, i) => <p key={i} className="leading-relaxed">• {aviso}</p>)}
                </div>}
              </td>
              {([r.estrutura, r.rendimentos, r.simulacao] as string[][]).map((alertas, i) => <td key={i} className="px-3 py-2.5">
                {alertas.length ? <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-amber-800"><AlertTriangle size={14}/>Conferir ({alertas.length})</span> : <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-[#087443]"><CheckCircle2 size={14}/>Sem divergência</span>}
              </td>)}
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </details>;
}
