import { useEffect, useState } from "react";
import { Bot, Loader2, Heart, RotateCcw, ShoppingCart, Sparkles, ClipboardCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { perguntaSemIdentificadores } from "@/lib/whatsapp-ia-facts";
import { salvarTreinamento } from "./WhatsAppIASettings";
import { catalogMoney, type CatalogOrderItem } from "@/lib/whatsapp-catalog";
import type { SugestaoPedido } from "@/lib/whatsapp-ia-order";
import { ESTADO_VENDA_VAZIO, normalizarEstadoVenda, type EstadoVenda } from "@/lib/whatsapp-ia-sales";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { MemoriaCliente } from "@/lib/whatsapp-ia-customer-memory";

type SugestaoVenda = {productId:string;nome:string;weight:"200g"|"300g"|"400g";motivo:string};
type PreviewVenda = {
  texto:string;itensTotal:number;pendencias:string[];
  perguntaSeguinte:string;aplicavelNoFormulario:boolean;proximaFaixa:string|null;
};
const prefixoVenda="saborosamente:rascunho-venda-ia:v1:";
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
  const [estadoVenda, setEstadoVenda] = useState<EstadoVenda>(ESTADO_VENDA_VAZIO);
  const [resumoVenda, setResumoVenda] = useState<PreviewVenda | null>(null);
  const [sugestoesVenda, setSugestoesVenda] = useState<SugestaoVenda[]>([]);
  const [historicoVenda, setHistoricoVenda] = useState<string[]>([]);
  const [modoAtivo, setModoAtivo] = useState<"resposta"|"pedido"|"venda">("resposta");
  useEffect(()=>{
    if (!conversationId) return;
    try {
      const salvo=sessionStorage.getItem(prefixoVenda+conversationId);
      if(!salvo)return;
      const registro=JSON.parse(salvo);
      const estado=normalizarEstadoVenda(registro?.estadoVenda);
      setEstadoVenda(estado);
      // O subtotal antigo não é exibido: sempre recalcular no servidor ao continuar.
      setResumoVenda(null);
      setPedido(null);
      setSugestoesVenda([]);
      setHistoricoVenda(Array.isArray(registro?.historicoVenda)?
        registro.historicoVenda.filter((v:unknown)=>typeof v==="string").slice(-10):[]);
    }catch{ /* navegador privado, sem armazenamento */ }
  },[conversationId]);
  const [corrigindo, setCorrigindo] = useState(false);
  const [correcao, setCorrecao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState("");
  const generate = async (modo: "resposta" | "pedido" | "venda" = "resposta", perguntaForcada?: string) => {
    const perguntaAtual = perguntaForcada || pergunta;
    if (loading || !perguntaAtual.trim()) return;
    if (perguntaForcada) setPergunta(perguntaForcada);
    setModoAtivo(modo);
    setLoading(true); setErro(""); setResposta(""); setInfo("");
    if(modo!=="venda"){setPedido(null);setResumoVenda(null);setSugestoesVenda([]);}
    setCorrigindo(false); setFeedback("");
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-ia-assistente", {
        body: { pergunta: perguntaSemIdentificadores(perguntaAtual), modo,
          ...(modo==="venda"?{estadoVenda}:{}),
          ...(conversationId ? {conversationId} : {}) },
      });
      if (error) {
        const details = await (error as any).context?.json?.().catch(() => null);
        throw new Error(details?.error || "Não foi possível conectar ao assistente. Tente novamente.");
      }
      if (modo === "venda") {
        if(!data?.pedido || !data?.resumo || !data?.estadoVenda)
          throw new Error(data?.error || "A IA não retornou um carrinho válido.");
        if(data?.erroValidacao)
          throw new Error("A atualização tentou remover itens sem autorização. Mantive o carrinho anterior.");
        const proposto=normalizarEstadoVenda(data.estadoVenda);
        setEstadoVenda(proposto);
        setPedido(data.pedido);
        setResumoVenda(data.resumo);
        setSugestoesVenda(Array.isArray(data.sugestoes)?data.sugestoes.slice(0,3):[]);
        setInfo("Carrinho calculado com preços e estoque do site. A equipe deve revisar.");
        const proximas=[...historicoVenda,perguntaSemIdentificadores(perguntaAtual)].slice(-10);
        setHistoricoVenda(proximas);
        if(conversationId) {
          try {sessionStorage.setItem(prefixoVenda+conversationId,
            JSON.stringify({estadoVenda:proposto,historicoVenda:proximas}));}
          catch{ /* navegação privada: o carrinho permanece nesta tela */ }
        }
        setPergunta("");
        return;
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

    {conversationId && <div className="space-y-2 rounded-lg border border-[#00a884]/30 p-3">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <p className="flex items-center gap-1 font-bold text-[#00a884]"><ShoppingCart size={16}/> Venda assistida</p>
        <button type="button" disabled={loading} onClick={()=>{
          if(!window.confirm("Limpar o carrinho de venda assistida desta conversa? Não altera pedidos existentes."))return;
          setEstadoVenda(ESTADO_VENDA_VAZIO);setResumoVenda(null);setPedido(null);
          setSugestoesVenda([]);setHistoricoVenda([]);setInfo("");setErro("");
          try{sessionStorage.removeItem(prefixoVenda+conversationId);}catch{}
        }} className="flex gap-1 text-xs text-orange-500"><Trash2 size={13}/> Limpar rascunho</button>
      </div>
      <p className="text-xs opacity-75">Escreva o pedido inicial ou uma alteração. A IA preserva os itens já escolhidos e pergunta o que faltar. Nenhuma mensagem é enviada ao cliente.</p>
      {estadoVenda.itens.length>0 && <p className="text-xs font-semibold">
        {estadoVenda.itens.reduce((n,i)=>n+i.quantity,0)} unidade(s) no carrinho em elaboração.
        {resumoVenda ? " Confira os valores recalculados abaixo." : " Atualize a venda para conferir preços e estoque atuais."}
      </p>}
      {historicoVenda.length>0 && <details className="text-xs"><summary className="cursor-pointer">Histórico desta montagem ({historicoVenda.length})</summary>
        <div className="space-y-1 pt-2">{historicoVenda.map((m,i)=><p key={i} className="border-l-2 border-[#00a884]/30 pl-2">{m}</p>)}</div>
      </details>}
      <div className="flex flex-wrap gap-1">
        {["Quero 5 marmitas de frango de 300g","Mais duas opções leves de 300g","Será para entrega em Rio Negrinho"].map(t=>
          <button key={t} type="button" disabled={loading} onClick={()=>setPergunta(t)}
            className="rounded-full border border-current/20 px-2 py-1 text-[11px]">{t}</button>)}
      </div>
    </div>}
    {!onApply && <div className="flex flex-wrap gap-1">{exemplos.map(ex => <button key={ex} disabled={loading} type="button" onClick={() => { setPergunta(ex); setResposta(""); setErro(""); setInfo("");setPedido(null);setCorrigindo(false);setFeedback(""); }} className="rounded-full border border-current/20 px-2 py-1 text-xs hover:bg-[#00a884]/10">{ex}</button>)}</div>}
    <textarea aria-label="Pergunta para a IA" value={pergunta} onChange={e => { setPergunta(e.target.value); setResposta(""); setInfo(""); setErro("");setPedido(null);setCorrigindo(false);setFeedback(""); }} maxLength={1500} disabled={loading||salvando}
      rows={3} placeholder="Ex.: Quanto custa a marmita de 400g?" className="w-full resize-y rounded-lg border border-current/20 bg-transparent p-2"/>
    <div className="flex flex-wrap gap-2"><button type="button" onClick={()=>generate()} disabled={loading || !pergunta.trim()} className="flex items-center gap-2 rounded-lg bg-[#00a884] px-3 py-2 font-semibold text-white disabled:opacity-50">
      {loading ? <Loader2 className="animate-spin" size={16}/> : <Bot size={16}/>} {loading ? "Consultando site..." : "Gerar sugestão"}
    </button><button type="button" onClick={()=>generate("pedido")} disabled={loading||!pergunta.trim()} className="rounded-lg border border-[#00a884] text-[#00a884] px-3 py-2 font-semibold disabled:opacity-50">Montar pedido com IA</button>
    {conversationId && <button type="button" onClick={()=>generate("venda")} disabled={loading||!pergunta.trim()}
      className="rounded-lg bg-[#064D2F] px-3 py-2 font-semibold text-white disabled:opacity-50">
      {estadoVenda.itens.length?"Atualizar carrinho":"Iniciar venda assistida"}
    </button>}</div>
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
    {resumoVenda && modoAtivo==="venda" && pedido && <div className="space-y-3 rounded-lg border border-[#00a884]/40 p-3">
      <p className="flex items-center gap-2 font-semibold"><ClipboardCheck size={17}/> Resumo da venda para revisão</p>
      <p className="whitespace-pre-wrap rounded-lg bg-[#00a884]/10 p-3 text-xs">{resumoVenda.texto}</p>
      {resumoVenda.proximaFaixa && <p className="flex gap-2 text-xs"><Sparkles size={16} className="shrink-0 text-[#8BB924]"/>
        {resumoVenda.proximaFaixa}</p>}
      {sugestoesVenda.length>0 && <div className="space-y-1">
        <p className="text-xs font-semibold">Outros sabores disponíveis (não adicionados)</p>
        {sugestoesVenda.map(s=><div key={s.productId+":"+s.weight}
          className="flex flex-wrap items-center justify-between gap-2 rounded border border-current/15 px-2 py-2 text-xs">
          <span className="min-w-0 flex-1">{s.nome} · {s.weight}<span className="block opacity-60">{s.motivo}</span></span>
          <button type="button" disabled={loading} onClick={()=>void generate("venda","Adicione 1 unidade de "+s.nome+" de "+s.weight+" ao carrinho atual, mantendo todos os outros itens.")}
            className="rounded border border-[#00a884] px-2 py-1 font-semibold text-[#00a884] disabled:opacity-50">Adicionar 1</button>
        </div>)}
      </div>}
      <p className="text-xs font-semibold">Próxima pergunta: {resumoVenda.perguntaSeguinte}</p>
      <div className="flex flex-wrap gap-2">
        {onApply && <button type="button" onClick={()=>onApply(resumoVenda.texto)}
          className="rounded-lg border border-[#00a884] px-3 py-2 text-xs font-bold text-[#00a884]">
          Inserir prévia para conferir com o cliente
        </button>}
        {onOrder && <button type="button" disabled={!resumoVenda.aplicavelNoFormulario}
          onClick={()=>onOrder(pedido.itens.map(({productId,quantity,weight,unitPrice})=>({productId,quantity,weight,unitPrice})))}
          className="rounded-lg bg-[#00a884] px-3 py-2 font-bold text-white disabled:opacity-40">
          Conferir no formulário de pedidos
        </button>}
      </div>
      <p className="text-[11px] opacity-75">Valores provisórios. A equipe confirma pagamento, frete, horário, endereço e disponibilidade. Nenhum pedido é salvo ou pago aqui.</p>
    </div>}
    {pedido && modoAtivo!=="venda" && <div className="space-y-2 rounded-lg border border-current/20 p-3">
      <p className="font-bold">Rascunho sugerido — confira com o cliente</p>
      {info && <p className="text-xs opacity-70">{info}</p>}
      {pedido.itens.map(i=><div key={i.productId+":"+i.weight} className="flex justify-between gap-3 border-b border-current/10 pb-1 text-xs"><span>{i.quantity}× {i.nome} · {i.tamanho}{i.estoque===null?" · confirmar estoque":""}</span><span>{catalogMoney(i.unitPrice*i.quantity)}</span></div>)}
      {pedido.pendencias.map((p,i)=><p key={i} className="text-xs text-orange-500">⚠ {p}</p>)}
      <p className="font-bold">Subtotal estimado: {catalogMoney(pedido.subtotal)}</p><p className="text-xs opacity-70">Sem frete, adicionais ou cashback. Revise a faixa de desconto se já houver itens no rascunho. Nenhum item foi reservado.</p>
      {onOrder&&<button type="button" disabled={!pedido.itens.length||pedido.pendencias.length>0} className="rounded-lg bg-[#00a884] px-3 py-2 text-white font-semibold disabled:opacity-50" onClick={()=>onOrder(pedido.itens.map(({productId,quantity,weight,unitPrice})=>({productId,quantity,weight,unitPrice})))}>Abrir rascunho de pedido</button>}
    </div>}
  </section>;
}
