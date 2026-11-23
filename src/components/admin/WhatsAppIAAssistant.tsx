import { useState } from "react";
import { Bot, Loader2, Heart, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { perguntaSemIdentificadores } from "@/lib/whatsapp-ia-facts";
import { salvarTreinamento } from "./WhatsAppIASettings";
import { catalogMoney, type CatalogOrderItem } from "@/lib/whatsapp-catalog";
import type { SugestaoPedido } from "@/lib/whatsapp-ia-order";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { MemoriaCliente } from "@/lib/whatsapp-ia-customer-memory";
import { WhatsAppIASales } from "./WhatsAppIASales";

const exemplos = [
  "Quanto custam 10 marmitas de 300g?",
  "Vocês entregam em Campo Alegre? Qual o dia e o horário limite?",
  "Quais formas de pagamento vocês aceitam?",
  "Como funciona a marmita personalizada?",
  "Qual é o status do meu pedido?",
];

export function WhatsAppIAAssistant({ dark, initialQuestion = "", onApply, onOrder, conversationId }: {
  dark: boolean; initialQuestion?: string; onApply?: (text: string) => void; onOrder?: (items: CatalogOrderItem[]) => void; conversationId?: string;
}) {
  const qc = useQueryClient();
  const {data:memoria, isFetching:carregandoMemoria, error:erroMemoria, refetch:atualizarMemoria} = useQuery<MemoriaCliente>({
    queryKey:["wa-ia-memoria-cliente",conversationId],
    enabled:!!conversationId,
    staleTime:30_000,
    retry:false,
    queryFn:async()=>{
      const {data,error}=await supabase.functions.invoke("whatsapp-ia-assistente",{
        body:{modo:"contexto",conversationId},
      });
      if(error)throw new Error("Não consegui consultar o histórico desta conversa.");
      if(data?.error || !data?.memoria)throw new Error(data?.error || "Histórico indisponível.");
      return data.memoria as MemoriaCliente;
    },
  });
  const [pergunta, setPergunta] = useState(perguntaSemIdentificadores(initialQuestion));
  const [resposta, setResposta] = useState("");
  const [info, setInfo] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [pedido, setPedido] = useState<SugestaoPedido | null>(null);
  const [corrigindo, setCorrigindo] = useState(false);
  const [correcao, setCorrecao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState("");
  const generate = async (modo: "resposta" | "pedido" = "resposta", perguntaForcada?: string) => {
    const perguntaAtual = perguntaForcada || pergunta;
    if (loading || !perguntaAtual.trim()) return;
    if (perguntaForcada) setPergunta(perguntaForcada);
    setLoading(true); setErro(""); setResposta(""); setInfo(""); setPedido(null); setCorrigindo(false); setFeedback("");
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-ia-assistente", {
        body: { pergunta: perguntaSemIdentificadores(perguntaAtual), modo, ...(conversationId ? {conversationId} : {}) },
      });
      if (error) {
        const details = await (error as any).context?.json?.().catch(() => null);
        throw new Error(details?.error || "Não foi possível conectar ao assistente. Tente novamente.");
      }
      if (modo === "pedido") {
        if (!data?.pedido) throw new Error(data?.error || "Pedido não reconhecido.");
        setPedido(data.pedido);
        setInfo(data?.origem==="repeticao_verificada" ? "Itens do último pedido entregue conferidos com catálogo, estoque e preços atuais." : "Rascunho sugerido com produtos do site.");
        return;
      }
      if (!data?.resposta) throw new Error(data?.error || "Resposta vazia.");
      setResposta(data.resposta);
      setInfo(`Consultou ${data.produtos} produtos e ${data.cidades} cidades no site.`);
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao gerar resposta."); }
    finally { setLoading(false); }
  };
  async function salvarCorrecao() {
    setSalvando(true);setFeedback("");
    try {await salvarTreinamento(pergunta,correcao);await qc.invalidateQueries({queryKey:["wa-ia-treinamentos"]});setCorrigindo(false);setFeedback("Correção salva para aprovação na central de treinamento.");}
    catch{setFeedback("Não foi possível salvar a correção.");}finally{setSalvando(false);}
  }
  return <section className={`rounded-xl border p-3 space-y-3 text-sm ${dark ? "bg-[#182229] border-[#3b4a54] text-white" : "bg-white border-gray-200 text-gray-900"}`}>
    <p className="flex items-center gap-2 font-bold text-[#00a884]"><Bot size={18}/>{conversationId || onApply ? "Assistente Saborosa" : "Simulador da Saborosa"}</p>
    <p className="text-xs opacity-80">Teste ou revise a pergunta sem CPF, endereço completo ou informações pessoais. Nenhuma mensagem será enviada.</p>
    {conversationId && <div className="space-y-2 rounded-lg border border-[#00a884]/30 bg-[#00a884]/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-xs font-bold"><Heart size={14}/> Memória de compras da conversa</p>
        <button type="button" disabled={carregandoMemoria} onClick={()=>void atualizarMemoria()}
          className="text-[11px] text-[#00a884] underline disabled:opacity-50">Atualizar compras</button>
      </div>
      {carregandoMemoria&&!memoria && <p className="text-xs opacity-70">Consultando pedidos anteriores...</p>}
      {erroMemoria && <p className="text-xs text-orange-500">Não foi possível consultar o histórico. Confira a sessão administrativa.</p>}
      {memoria && <>
        <p className="text-xs">{memoria.pedidosEntregues} pedido(s) entregue(s) entre os {memoria.pedidosAnalisados} mais recentes consultados.
          {memoria.intervaloMedioDias !== null ? " Intervalo médio observado: "+memoria.intervaloMedioDias+" dia(s)." : ""}</p>
        {memoria.favoritos.length>0 && <p className="text-xs">
          <strong>Sabores mais comprados:</strong> {memoria.favoritos.slice(0,3).map(p=>p.nome+" ("+p.weight+")").join(" · ")}
        </p>}
        {memoria.ultimoPedido && <div className="space-y-1">
          <p className="text-xs font-semibold">Último pedido entregue
            {memoria.ultimoPedido.data ? " · "+new Date(memoria.ultimoPedido.data).toLocaleDateString("pt-BR") : ""}
          </p>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {memoria.ultimoPedido.itens.map((i,index)=><p key={i.productId+":"+i.weight+":"+index} className="text-xs">
              {i.quantity}× {i.nome} · {i.weight}</p>)}
          </div>
          {memoria.ultimoPedido.naoReconhecidos>0 && <p className="text-xs text-orange-500">
            {memoria.ultimoPedido.naoReconhecidos} item(ns) do último pedido precisam de conferência manual.
          </p>}
          {onOrder && <button type="button" disabled={loading || !memoria.ultimoPedido.itens.length}
            onClick={()=>void generate("pedido","Quero repetir exatamente o último pedido entregue, com os mesmos sabores, tamanhos e quantidades.")}
            className="inline-flex items-center gap-2 rounded-lg border border-[#00a884] px-3 py-2 text-xs font-semibold text-[#00a884] disabled:opacity-40">
            <RotateCcw size={14}/> Preparar repetição do último pedido
          </button>}
        </div>}
        {!memoria.ultimoPedido && <p className="text-xs opacity-70">Sem pedidos entregues reconhecidos por este número. Não será presumido um pedido anterior.</p>}
        <p className="text-[11px] opacity-70">Histórico vinculado ao número desta conversa. Confirme com o cliente antes de enviar detalhes. Nenhum pedido foi criado ou reservado.</p>
      </>}
    </div>}

    <WhatsAppIASales key={conversationId || "simulador"} dark={dark} conversationId={conversationId}
      onApply={onApply} onOrder={onOrder}/>
        {!onApply && <div className="flex flex-wrap gap-1">{exemplos.map(ex => <button key={ex} disabled={loading} type="button" onClick={() => { setPergunta(ex); setResposta(""); setErro(""); setInfo("");setPedido(null);setCorrigindo(false);setFeedback(""); }} className="rounded-full border border-current/20 px-2 py-1 text-xs hover:bg-[#00a884]/10">{ex}</button>)}</div>}
    <textarea aria-label="Pergunta para a IA" value={pergunta} onChange={e => { setPergunta(e.target.value); setResposta(""); setInfo(""); setErro("");setPedido(null);setCorrigindo(false);setFeedback(""); }} maxLength={1500} disabled={loading||salvando}
      rows={3} placeholder="Ex.: Quanto custa a marmita de 400g?" className="w-full resize-y rounded-lg border border-current/20 bg-transparent p-2"/>
    <div className="flex flex-wrap gap-2"><button type="button" onClick={()=>generate()} disabled={loading || !pergunta.trim()} className="flex items-center gap-2 rounded-lg bg-[#00a884] px-3 py-2 font-semibold text-white disabled:opacity-50">
      {loading ? <Loader2 className="animate-spin" size={16}/> : <Bot size={16}/>} {loading ? "Consultando site..." : "Gerar sugestão"}
    </button><button type="button" onClick={()=>generate("pedido")} disabled={loading||!pergunta.trim()} className="rounded-lg border border-[#00a884] text-[#00a884] px-3 py-2 font-semibold disabled:opacity-50">Montar pedido com IA</button></div>
    {erro && <p role="alert" className="text-red-500 text-xs">{erro}</p>}
    {resposta && <div className="space-y-2">
      <p className="text-xs font-semibold">Sugestão — revise antes de usar</p>
      <p className="rounded-lg bg-[#00a884]/10 p-3 whitespace-pre-wrap">{resposta}</p>
      <p className="text-xs opacity-70">{info}</p>
      {onApply && <button type="button" onClick={() => onApply(resposta)} className="rounded-lg border border-[#00a884] text-[#00a884] px-3 py-2 font-semibold">Inserir no campo de mensagem</button>}
      <button type="button" className="block text-xs font-semibold underline" onClick={()=>{setCorrecao(resposta);setCorrigindo(true);}}>Corrigir e ensinar a IA</button>
      {corrigindo&&<div className="space-y-2"><textarea aria-label="Resposta corrigida" rows={4} maxLength={1500} className="w-full rounded-lg border border-current/20 bg-transparent p-2" value={correcao} onChange={e=>setCorrecao(e.target.value)}/><button type="button" disabled={salvando||!correcao.trim()} onClick={salvarCorrecao} className="rounded-lg bg-[#00a884] px-3 py-2 text-white disabled:opacity-50">Salvar correção para revisão</button></div>}
    </div>}
    {feedback&&<p className="text-xs">{feedback}</p>}
    {pedido&&<div className="space-y-2 rounded-lg border border-current/20 p-3">
      <p className="font-bold">Rascunho sugerido — confira com o cliente</p>
      {info && <p className="text-xs opacity-70">{info}</p>}
      {pedido.itens.map(i=><div key={i.productId+":"+i.weight} className="flex justify-between gap-3 border-b border-current/10 pb-1 text-xs"><span>{i.quantity}× {i.nome} · {i.tamanho}{i.estoque===null?" · confirmar estoque":""}</span><span>{catalogMoney(i.unitPrice*i.quantity)}</span></div>)}
      {pedido.pendencias.map((p,i)=><p key={i} className="text-xs text-orange-500">⚠ {p}</p>)}
      <p className="font-bold">Subtotal estimado: {catalogMoney(pedido.subtotal)}</p><p className="text-xs opacity-70">Sem frete, adicionais ou cashback. Revise a faixa de desconto se já houver itens no rascunho. Nenhum item foi reservado.</p>
      {onOrder&&<button type="button" disabled={!pedido.itens.length||pedido.pendencias.length>0} className="rounded-lg bg-[#00a884] px-3 py-2 text-white font-semibold disabled:opacity-50" onClick={()=>onOrder(pedido.itens.map(({productId,quantity,weight,unitPrice})=>({productId,quantity,weight,unitPrice})))}>Abrir rascunho de pedido</button>}
    </div>}
  </section>;
}
