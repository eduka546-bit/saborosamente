import { useState } from "react";
import { BarChart3, X } from "lucide-react";
import type { AtendimentoEstado, Etiqueta } from "./WhatsAppBusinessTools";

export type RelatorioWhatsApp = {
  total: number;
  aguardando: number;
  humanos: number;
  respostaIA: number;
  arquivadas: number;
  fixadas: number;
  comResponsavel: number;
  tempoMedioMin: number | null;
  amostraTempos: number;
  etiquetas: { nome: string; cor: string; quantidade: number }[];
};

export function criarRelatorioWhatsApp(
  conversas: any[], estados: AtendimentoEstado[], etiquetas: Etiqueta[],
): RelatorioWhatsApp {
  const porId = new Map(estados.map((estado) => [estado.conversa_id, estado]));
  const tempos: number[] = [];
  let aguardando = 0, humanos = 0, respostaIA = 0, arquivadas = 0, fixadas = 0, comResponsavel = 0;

  for (const conversa of conversas) {
    const state = porId.get(conversa.id);
    if (state?.arquivada) arquivadas++;
    if (state?.fixada) fixadas++;
    if (state?.responsavel_id) comResponsavel++;
    if (conversa.modo === "humano") humanos++;
    const mensagens = (Array.isArray(conversa.mensagens) ? conversa.mensagens : [])
      .filter((msg: any) => msg?.role === "assistant" || msg?.role === "user");
    const ultimo = mensagens.at(-1);
    if (ultimo?.role === "user") aguardando++;
    if (ultimo?.role === "assistant" && !ultimo?.manual) respostaIA++;
    let esperandoDesde: number | null = null;
    for (const msg of mensagens) {
      const ts = Date.parse(String(msg?.timestamp ?? ""));
      if (!Number.isFinite(ts)) continue;
      if (msg.role === "user") {
        if (esperandoDesde === null) esperandoDesde = ts;
      } else if (msg.role === "assistant" && esperandoDesde !== null) {
        const minutos = (ts - esperandoDesde) / 60000;
        if (minutos >= 0 && minutos <= 1440) tempos.push(minutos);
        esperandoDesde = null;
      }
    }
  }
  return {
    total: conversas.length, aguardando, humanos, respostaIA, arquivadas, fixadas,
    comResponsavel,
    tempoMedioMin: tempos.length ? tempos.reduce((a,b) => a+b, 0) / tempos.length : null,
    amostraTempos: tempos.length,
    etiquetas: etiquetas.map((e) => ({
      nome: e.nome, cor: e.cor,
      quantidade: estados.filter((s) => s.etiquetas.includes(e.id)).length,
    })).sort((a,b) => b.quantidade - a.quantidade),
  };
}

export function WhatsAppReports({ conversas, estados, etiquetas, dark }: {
  conversas: any[]; estados: AtendimentoEstado[]; etiquetas: Etiqueta[]; dark: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const resumo = criarRelatorioWhatsApp(conversas, estados, etiquetas);
  const painel = dark ? "border-[#3b4a54] bg-[#202c33] text-[#e9edef]" : "border-[#dfe3e5] bg-white text-[#111b21]";
  const campos: { nome: string; valor: string | number; detalhe?: string }[] = [
    { nome: "Conversas", valor: resumo.total },
    { nome: "Aguardando resposta", valor: resumo.aguardando },
    { nome: "Atendimento humano", valor: resumo.humanos },
    { nome: "Última resposta da IA", valor: resumo.respostaIA },
    { nome: "Arquivadas", valor: resumo.arquivadas },
    { nome: "Fixadas", valor: resumo.fixadas },
    { nome: "Atribuídas à equipe", valor: resumo.comResponsavel },
    { nome: "Tempo médio para resposta", valor: resumo.tempoMedioMin === null ? "—" : resumo.tempoMedioMin.toFixed(1) + " min",
      detalhe: resumo.amostraTempos + " respostas com horário disponível" },
  ];
  return (
    <>
      <button type="button" onClick={() => setAberto(true)} title="Relatório do atendimento"
        className={"rounded-full p-2 hover:bg-black/10 " + (dark ? "text-[#8696a0]" : "text-[#667781]")}>
        <BarChart3 size={18}/>
      </button>
      {aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3" role="dialog"
          aria-modal="true" aria-label="Relatório de atendimento">
          <section className={"flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl " + painel}>
            <div className="flex items-start justify-between border-b border-current/15 p-4">
              <div>
                <h2 className="font-bold">Relatório do WhatsApp</h2>
                <p className="mt-1 text-xs opacity-70">Indicadores calculados das conversas e estados atuais do painel.</p>
              </div>
              <button type="button" onClick={() => setAberto(false)} title="Fechar"><X size={19}/></button>
            </div>
            <div className="overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {campos.map((item) => (
                  <div key={item.nome} className="rounded-xl border border-current/15 p-3">
                    <p className="text-[11px] opacity-70">{item.nome}</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-[#00a884]">{item.valor}</p>
                    {item.detalhe && <p className="mt-1 text-[10px] opacity-60">{item.detalhe}</p>}
                  </div>
                ))}
              </div>
              <h3 className="mt-4 text-sm font-bold">Conversas por etiqueta</h3>
              <div className="mt-2 space-y-2">
                {resumo.etiquetas.map((e) => (
                  <div key={e.nome} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.cor }}/>
                    <span className="min-w-0 flex-1">{e.nome}</span>
                    <strong className="tabular-nums">{e.quantidade}</strong>
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-black/10">
                      <div className="h-full rounded-full" style={{ backgroundColor: e.cor,
                        width: (resumo.total ? Math.min(100, e.quantidade / resumo.total * 100) : 0) + "%" }}/>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] opacity-65">
                Os indicadores não são dados oficiais da Meta: refletem as conversas salvas neste painel.
                O tempo médio usa apenas respostas com data válida no histórico recente disponível;
                registros antigos sem horário não entram na média. Resposta da IA não equivale necessariamente a venda ou atendimento resolvido.
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
