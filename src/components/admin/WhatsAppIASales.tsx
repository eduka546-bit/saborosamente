import { useEffect, useState } from "react";
import { Bot, ClipboardCheck, RefreshCw, ShoppingCart, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { catalogMoney, type CatalogOrderItem } from "@/lib/whatsapp-catalog";
import { perguntaSemIdentificadores } from "@/lib/whatsapp-ia-facts";
import { normalizarEstadoVenda, type EstadoVenda, type ResultadoVenda } from "@/lib/whatsapp-ia-sales";

const inicial: EstadoVenda = {
  itens: [],
  entrega: {modalidade:null,cidade:"",bairro:"",preferencia:""},
};
const expiraEm = 8 * 60 * 60 * 1000;
const chave = (id?:string) => id ? "saborosamente:venda-assistida:"+id : null;
function lerEstado(id?:string):EstadoVenda {
  if (!id || typeof sessionStorage==="undefined")return inicial;
  try {
    const raw=JSON.parse(sessionStorage.getItem(chave(id)!) ?? "null");
    if(raw && Date.now()-raw.at<expiraEm && raw.itens && raw.entrega)
      return normalizarEstadoVenda(raw);
  } catch {/* sessão indisponível */ }
  return inicial;
}
function salvarEstado(id:string|undefined,estado:EstadoVenda) {
  if (!id || typeof sessionStorage==="undefined")return;
  try {sessionStorage.setItem(chave(id)!,JSON.stringify({...estado,at:Date.now()}));}
  catch {/* navegador sem armazenamento */ }
}
type Movimento = { mensagem: string; resumo: string; momento: string };

export function WhatsAppIASales({dark,conversationId,onApply,onOrder}:{
  dark:boolean;conversationId?:string;
  onApply?:(texto:string)=>void;
  onOrder?:(items:CatalogOrderItem[])=>void;
}) {
  const [mensagem,setMensagem]=useState("");
  const [estado,setEstado]=useState<EstadoVenda>(()=>lerEstado(conversationId));
  const [resultado,setResultado]=useState<ResultadoVenda|null>(null);
  const [proposta,setProposta]=useState<ResultadoVenda|null>(null);
  const [historico,setHistorico]=useState<Movimento[]>([]);
  const [carregando,setCarregando]=useState(false);
  const [erro,setErro]=useState("");
  const [informacao,setInformacao]=useState("");
  // O componente deve receber key={conversationId || "simulador"} do pai.
  // Não copiar o estado de uma conversa para outra durante uma troca de cliente.
  useEffect(()=>{salvarEstado(conversationId,estado);},[estado,conversationId]);

  async function consultar(modo:"venda"|"venda_revisar",texto?:string,novoEstado?:EstadoVenda) {
    if(carregando)return;
    const pergunta=texto??mensagem;
    if(modo==="venda"&&!pergunta.trim())return;
    setCarregando(true);setErro("");setInformacao("");
    try{
      const {data,error}=await supabase.functions.invoke("whatsapp-ia-assistente",{
        body:{modo,pergunta:modo==="venda"?perguntaSemIdentificadores(pergunta):undefined,
          estadoVenda:novoEstado??estado,
          ...(conversationId?{conversationId}:{})},
      });
      if(error){
        const detalhes=await (error as any).context?.json?.().catch(()=>null);
        throw new Error(detalhes?.error??error.message??"Não foi possível consultar a IA.");
      }
      if(!data?.venda)throw new Error(data?.error??"A IA não retornou uma prévia de venda.");
      const venda=data.venda as ResultadoVenda;
      if(modo==="venda"){
        setProposta(venda);
        setHistorico(prev=>[...prev,{
          mensagem:pergunta,resumo:venda.proximaPergunta,momento:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),
        }].slice(-6));
        setInformacao("A sugestão ainda não alterou o carrinho. Confira e clique em Aplicar alterações.");
        setMensagem("");
      } else {
        // Revalidar um estado selecionado não equivale a salvar pedidos.
        setEstado(venda.estado);
        setResultado(venda);
        setProposta(null);
        setInformacao("Carrinho recalculado com preços e estoque atuais. Nada foi enviado nem confirmado.");
      }
    }catch(e){
      setErro(e instanceof Error?e.message:"Não consegui analisar a mensagem.");
    }finally{setCarregando(false);}
  }
  function aplicarProposta() {
    if(!proposta)return;
    setEstado(proposta.estado);
    setResultado(proposta);
    setProposta(null);
    setInformacao("Alterações aplicadas somente ao carrinho de simulação. Confira o resumo antes de abrir o formulário.");
  }
  function limpar() {
    if(!window.confirm("Limpar a simulação de venda desta conversa? Nenhum pedido oficial será alterado."))return;
    setEstado(inicial);setResultado(null);setProposta(null);setHistorico([]);
    if(conversationId)try{sessionStorage.removeItem(chave(conversationId)!);}catch{/* ignora */}
    setInformacao("Carrinho da simulação limpo.");
  }
  const atual=resultado;
  const total=estado.itens.reduce((n,i)=>n+i.quantity,0);
  return <section className={"space-y-3 rounded-xl border p-3 text-sm "+(dark?"border-[#3b4a54] bg-[#111b21] text-white":"border-gray-200 bg-[#f6fbf6] text-gray-900")}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="flex items-center gap-2 font-bold text-[#00a884]"><ShoppingCart size={17}/> Venda assistida com IA</p>
      <span className="text-xs opacity-75">{total} unidade(s) no carrinho de simulação</span>
    </div>
    <p className="text-xs opacity-75">Converse por etapas, acrescente ou troque sabores e confira a prévia antes de aplicar. Não envia WhatsApp, não reserva estoque, não cria ou confirma pedidos.</p>
    {estado.itens.length>0&&!atual&&!proposta && <p className="rounded-lg border border-amber-500/40 p-2 text-xs text-amber-600">
      Carrinho de uma sessão anterior recuperado. Revalide os valores e o estoque antes de usar.
    </p>}
    {historico.length>0&&<div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-current/10 p-2">
      {historico.map((h,i)=><div key={i} className="border-b border-current/10 pb-1 text-xs">
        <span className="font-semibold opacity-60">{h.momento}</span> {h.mensagem}
        <p className="opacity-70">Próxima etapa: {h.resumo}</p>
      </div>)}
    </div>}
    <textarea aria-label="Instrução de venda para a IA" value={mensagem}
      onChange={e=>setMensagem(e.target.value)} rows={2} maxLength={1500} disabled={carregando}
      placeholder="Ex.: Adicione 5 marmitas de frango de 300g e outras 5 sortidas. Depois troque 2 por opções mais leves."
      className="w-full resize-y rounded-lg border border-current/20 bg-transparent p-2"/>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={carregando||!mensagem.trim()}
        onClick={()=>void consultar("venda")}
        className="inline-flex items-center gap-2 rounded-lg bg-[#00a884] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
        <Bot size={14}/>{carregando?"Conferindo...":"Analisar próxima mensagem"}
      </button>
      <button type="button" disabled={carregando} onClick={()=>void consultar("venda_revisar")}
        className="inline-flex items-center gap-2 rounded-lg border border-[#00a884] px-3 py-2 text-xs font-semibold text-[#00a884] disabled:opacity-50">
        <RefreshCw size={14}/> Atualizar preços e estoque
      </button>
      <button type="button" disabled={carregando} onClick={limpar}
        className="inline-flex items-center gap-2 rounded-lg border border-current/20 px-3 py-2 text-xs disabled:opacity-50">
        <Trash2 size={14}/> Limpar simulação
      </button>
    </div>
    {erro&&<p role="alert" className="text-xs text-red-500">{erro}</p>}
    {informacao&&<p className="text-xs opacity-75">{informacao}</p>}
    {proposta&&<div className="space-y-2 rounded-lg border-2 border-[#00a884]/50 p-3">
      <p className="font-bold">Prévia das alterações propostas — confira antes de aplicar</p>
      {proposta.pedido.itens.length ? proposta.pedido.itens.map(i=><p key={i.productId+":"+i.weight} className="flex justify-between gap-3 text-xs">
        <span>{i.quantity}× {i.nome} · {i.tamanho}</span><span>{catalogMoney(i.quantity*i.unitPrice)}</span>
      </p>) : <p className="text-xs">Nenhum item identificado.</p>}
      <p className="font-semibold">Subtotal calculado: {catalogMoney(proposta.pedido.subtotal)}</p>
      {proposta.pendencias.map((a,i)=><p key={i} className="text-xs text-amber-600">⚠ {a}</p>)}
      <p className="text-xs"><strong>Próxima pergunta:</strong> {proposta.proximaPergunta}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={aplicarProposta} disabled={carregando}
          className="rounded-lg bg-[#00a884] px-3 py-2 text-xs font-semibold text-white">Aplicar ao carrinho de simulação</button>
        <button type="button" onClick={()=>{setProposta(null);setInformacao("Sugestão descartada. Carrinho preservado.");}}
          className="rounded-lg border border-current/30 px-3 py-2 text-xs">Descartar sugestão</button>
      </div>
    </div>}
    {atual&&!proposta&&<div className="space-y-2 rounded-lg border border-current/20 p-3">
      <p className="flex items-center gap-2 font-bold"><ClipboardCheck size={17}/> Resumo para conferência</p>
      <div className="space-y-1">
        {atual.pedido.itens.map(i=><div key={i.productId+":"+i.weight} className="flex justify-between gap-2 text-xs">
          <span>{i.quantity}× {i.nome} · {i.tamanho}{i.estoque===null?" · estoque a confirmar":""}</span>
          <span>{catalogMoney(i.quantity*i.unitPrice)}</span>
        </div>)}
      </div>
      <p className="font-bold">Subtotal: {catalogMoney(atual.pedido.subtotal)}</p>
      {atual.economiaFaixa>0&&<p className="text-xs text-[#00a884]">Economia estimada pela faixa: {catalogMoney(atual.economiaFaixa)} (já incluída no subtotal).</p>}
      {atual.fretePrevisto!==null&&<p className="text-xs">Frete estimado conforme rota e bairro: {catalogMoney(atual.fretePrevisto)}</p>}
      {atual.totalPrevisto!==null&&<p className="font-bold">Total estimado sem adicionais: {catalogMoney(atual.totalPrevisto)}</p>}
      <p className="text-xs opacity-75">
        {atual.estado.entrega.modalidade==="retirada"?"Retirada na loja":
          atual.estado.entrega.modalidade==="entrega"
          ?"Entrega"+(atual.estado.entrega.cidade?" — "+atual.estado.entrega.cidade:"")+
           (atual.estado.entrega.bairro?" / "+atual.estado.entrega.bairro:""):"Entrega ou retirada: a escolher"}.
        A taxa e o total final ainda dependem da conferência no checkout.
      </p>
      {atual.oportunidade&&<div className="space-y-1 rounded-lg bg-[#00a884]/10 p-3 text-xs">
        <p className="flex items-center gap-2 font-semibold"><Sparkles size={15}/> Sugestão de venda</p>
        <p>{atual.oportunidade.mensagem}</p>
        {atual.oportunidade.opcoes.length>0&&<p>Sabores disponíveis para sugerir: {atual.oportunidade.opcoes.map(i=>i.nome).join(" · ")}</p>}
        <p className="opacity-70">Nenhum produto extra é adicionado automaticamente.</p>
      </div>}
      {atual.pendencias.map((a,i)=><p key={i} className="text-xs text-orange-500">⚠ {a}</p>)}
      <p className="text-xs font-semibold">Próxima pergunta sugerida: {atual.proximaPergunta}</p>
      <div className="flex flex-wrap gap-2">
        {onApply&&<button type="button" onClick={()=>onApply(atual.pendencias.length?atual.proximaPergunta:atual.resumo)}
          className="rounded-lg border border-[#00a884] px-3 py-2 text-xs font-semibold text-[#00a884]">
          {atual.pendencias.length?"Inserir pergunta na mensagem":"Inserir resumo na mensagem"}
        </button>}
        {onOrder&&<button type="button" disabled={!atual.podeAbrirRascunho||carregando}
          onClick={()=>{
            if(!window.confirm("Abrir formulário para revisão? Se existir um rascunho nessa conversa, confira possíveis itens repetidos antes de salvar."))return;
            onOrder(atual.pedido.itens.map(({productId,quantity,weight,unitPrice})=>({productId,quantity,weight,unitPrice})));
          }}
          className="rounded-lg bg-[#00a884] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
          Abrir no formulário para revisão da equipe
        </button>}
      </div>
      <p className="text-[11px] opacity-70">Esta simulação não confirma disponibilidade, pagamento, dia de entrega ou preço final. Somente o pedido salvo pela equipe tem validade operacional.</p>
    </div>}
  </section>;
}
