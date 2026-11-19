import { useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { perguntaSemIdentificadores } from "@/lib/whatsapp-ia-facts";

const exemplos = [
  "Quanto custam 10 marmitas de 300g?",
  "Vocês entregam em Campo Alegre? Qual o dia e o horário limite?",
  "Quais formas de pagamento vocês aceitam?",
  "Como funciona a marmita personalizada?",
  "Qual é o status do meu pedido?",
];

export function WhatsAppIAAssistant({ dark, initialQuestion = "", onApply }: {
  dark: boolean; initialQuestion?: string; onApply?: (text: string) => void;
}) {
  const [pergunta, setPergunta] = useState(perguntaSemIdentificadores(initialQuestion));
  const [resposta, setResposta] = useState("");
  const [info, setInfo] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    if (loading || !pergunta.trim()) return;
    setLoading(true); setErro(""); setResposta(""); setInfo("");
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-ia-assistente", {
        body: { pergunta: perguntaSemIdentificadores(pergunta) },
      });
      if (error) {
        const details = await (error as any).context?.json?.().catch(() => null);
        throw new Error(details?.error || "Não foi possível conectar ao assistente. Tente novamente.");
      }
      if (!data?.resposta) throw new Error(data?.error || "Resposta vazia.");
      setResposta(data.resposta);
      setInfo(`Consultou ${data.produtos} produtos e ${data.cidades} cidades no site.`);
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao gerar resposta."); }
    finally { setLoading(false); }
  };
  return <section className={`rounded-xl border p-3 space-y-3 text-sm ${dark ? "bg-[#182229] border-[#3b4a54] text-white" : "bg-white border-gray-200 text-gray-900"}`}>
    <p className="flex items-center gap-2 font-bold text-[#00a884]"><Bot size={18}/>{onApply ? "Assistente Saborosa" : "Simulador da Saborosa"}</p>
    <p className="text-xs opacity-80">Teste ou revise a pergunta sem CPF, endereço completo ou informações pessoais. Nenhuma mensagem será enviada.</p>
    {!onApply && <div className="flex flex-wrap gap-1">{exemplos.map(ex => <button key={ex} disabled={loading} type="button" onClick={() => { setPergunta(ex); setResposta(""); setErro(""); setInfo(""); }} className="rounded-full border border-current/20 px-2 py-1 text-xs hover:bg-[#00a884]/10">{ex}</button>)}</div>}
    <textarea aria-label="Pergunta para a IA" value={pergunta} onChange={e => { setPergunta(e.target.value); setResposta(""); setInfo(""); setErro(""); }} maxLength={1500} disabled={loading}
      rows={3} placeholder="Ex.: Quanto custa a marmita de 400g?" className="w-full resize-y rounded-lg border border-current/20 bg-transparent p-2"/>
    <button type="button" onClick={generate} disabled={loading || !pergunta.trim()} className="flex items-center gap-2 rounded-lg bg-[#00a884] px-3 py-2 font-semibold text-white disabled:opacity-50">
      {loading ? <Loader2 className="animate-spin" size={16}/> : <Bot size={16}/>} {loading ? "Consultando site..." : "Gerar sugestão"}
    </button>
    {erro && <p role="alert" className="text-red-500 text-xs">{erro}</p>}
    {resposta && <div className="space-y-2">
      <p className="text-xs font-semibold">Sugestão — revise antes de usar</p>
      <p className="rounded-lg bg-[#00a884]/10 p-3 whitespace-pre-wrap">{resposta}</p>
      <p className="text-xs opacity-70">{info}</p>
      {onApply && <button type="button" onClick={() => onApply(resposta)} className="rounded-lg border border-[#00a884] text-[#00a884] px-3 py-2 font-semibold">Inserir no campo de mensagem</button>}
    </div>}
  </section>;
}
