import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ACOES_CONFIGURAVEIS, normalizarCTA } from "@/lib/whatsapp-marketing-replies";
import { perguntaSemIdentificadores } from "@/lib/whatsapp-ia-facts";
import type { Treinamento } from "@/lib/whatsapp-ia-training";

const campo = "w-full rounded-lg border border-current/20 bg-transparent p-2";
const botao = "rounded-lg bg-[#00a884] px-3 py-2 font-semibold text-white disabled:opacity-50";

export async function salvarTreinamento(pergunta: string, resposta: string) {
  const p = perguntaSemIdentificadores(pergunta), r = perguntaSemIdentificadores(resposta);
  if (!p || !r) throw new Error("Preencha a pergunta e a resposta correta.");
  const { error } = await supabase.from("agente_treinamentos").insert({ pergunta: p, resposta: r, status: "pendente" });
  if (error) throw error;
}

export function WhatsAppTrainingCenter() {
  const qc = useQueryClient();
  const [pergunta,setPergunta] = useState("");
  const [resposta,setResposta] = useState("");
  const [busy,setBusy] = useState(false);
  const [filtro,setFiltro] = useState("pendente");
  const query = useQuery({queryKey:["wa-ia-treinamentos"],queryFn:async()=>{
    const {data,error}=await supabase.from("agente_treinamentos").select("id,pergunta,resposta,status").order("created_at",{ascending:false}).limit(200);
    if(error) throw error; return (data ?? []) as Treinamento[];
  }});
  async function criar() {
    setBusy(true);
    try { await salvarTreinamento(pergunta,resposta); setPergunta("");setResposta("");setFiltro("pendente");await qc.invalidateQueries({queryKey:["wa-ia-treinamentos"]});toast.success("Ensinamento enviado para revisão."); }
    catch(e){toast.error(e instanceof Error?e.message:"Não foi possível salvar.");}finally{setBusy(false);}
  }
  async function status(id:string, status:string) {
    if(status==="aprovado"&&!window.confirm("Aprovar este exemplo para as sugestões da IA? Confira se não há dados pessoais nem preços desatualizados."))return;
    setBusy(true);
    try {const {error}=await supabase.from("agente_treinamentos").update({status}).eq("id",id).select("id").single();if(error)throw error;await qc.invalidateQueries({queryKey:["wa-ia-treinamentos"]});toast.success("Status atualizado.");}
    catch{toast.error("Não foi possível atualizar o ensinamento.");}finally{setBusy(false);}
  }
  return <section className="space-y-3 text-sm">
    <h3 className="font-bold text-[#00a884]">Central de treinamento da Saborosa</h3>
    <p className="text-xs opacity-80">Cadastre perguntas frequentes ou correções. A IA só utiliza os exemplos aprovados nas sugestões do assistente, sempre priorizando os dados atuais do site. Não inclua informações pessoais.</p>
    <textarea className={campo} rows={2} maxLength={1500} value={pergunta} onChange={e=>setPergunta(e.target.value)} placeholder="Pergunta do cliente (sem dados pessoais)" aria-label="Pergunta do treinamento"/>
    <textarea className={campo} rows={3} maxLength={1500} value={resposta} onChange={e=>setResposta(e.target.value)} placeholder="Resposta correta" aria-label="Resposta correta"/>
    <button type="button" className={botao} disabled={busy||!pergunta.trim()||!resposta.trim()} onClick={criar}>Salvar para revisão</button>
    <div className="flex flex-wrap gap-2 border-t border-current/10 pt-3">{["pendente","aprovado","arquivado"].map(s=><button type="button" key={s} onClick={()=>setFiltro(s)} className={`rounded-full px-3 py-1 text-xs border border-current/20 ${filtro===s?"bg-[#00a884] text-white":""}`}>{s==="pendente"?"Pendentes":s==="aprovado"?"Aprovados":"Arquivados"} ({query.data?.filter(r=>r.status===s).length??0})</button>)}</div>
    {query.isError?<p className="text-red-500">Não foi possível carregar os ensinamentos.</p>:query.isLoading?<p>Carregando...</p>:!query.data?.some(r=>r.status===filtro)?<p className="text-xs opacity-70">Nenhum ensinamento nesta categoria.</p>:query.data.filter(r=>r.status===filtro).map(r=><div key={r.id} className="rounded-lg border border-current/20 p-3 space-y-2">
      <p className="font-semibold whitespace-pre-wrap">{r.pergunta}</p><p className="whitespace-pre-wrap text-xs opacity-90">{r.resposta}</p>
      <div className="flex flex-wrap gap-2">{r.status==="pendente"&&<button type="button" disabled={busy} className={botao} onClick={()=>status(r.id!,"aprovado")}>Aprovar</button>}{r.status!=="arquivado"&&<button type="button" disabled={busy} className="rounded border border-current/20 px-2 py-1" onClick={()=>status(r.id!,"arquivado")}>Arquivar</button>}
      {r.status!=="pendente"&&<button type="button" disabled={busy} className="rounded border border-current/20 px-2 py-1" onClick={()=>status(r.id!,"pendente")}>Revisar novamente</button>}
      <button type="button" className="rounded border border-current/20 px-2 py-1" onClick={()=>{setPergunta(r.pergunta);setResposta(r.resposta);}}>Usar como nova correção</button></div>
    </div>)}
  </section>;
}

type Regra = {id:string;rotulo:string;chave:string;acao:string;ativo:boolean};
export function WhatsAppCampaignActions() {
  const qc=useQueryClient();
  const [rotulo,setRotulo]=useState("");
  const [acao,setAcao]=useState<string>("menu_cardapio");
  const [busy,setBusy]=useState(false);
  const query=useQuery({queryKey:["wa-acoes-botoes"],queryFn:async()=>{
    const {data,error}=await supabase.from("whatsapp_acoes_botoes").select("id,rotulo,chave,acao,ativo").order("rotulo");
    if(error)throw error;return (data??[]) as Regra[];
  }});
  async function salvar(){
    const chave=normalizarCTA(rotulo);
    if(!chave||/^(nao|parar|sair|cancelar|stop)( |$)/.test(chave))return toast.error("Escolha um botão de ação positiva.");
    setBusy(true);
    try{
      const {error}=await supabase.from("whatsapp_acoes_botoes").upsert({rotulo:rotulo.trim(),chave,acao,ativo:false},{onConflict:"chave"}).select("id").single();
      if(error)throw error;setRotulo("");await qc.invalidateQueries({queryKey:["wa-acoes-botoes"]});toast.success("Regra salva, ainda desativada.");
    }catch(e){toast.error("Não foi possível salvar a regra.");}finally{setBusy(false);}
  }
  async function toggle(r:Regra){
    if(!r.ativo&&!window.confirm("Ativar esta ação para futuras respostas rápidas de campanhas com este mesmo texto?"))return;
    setBusy(true);
    try{const {error}=await supabase.from("whatsapp_acoes_botoes").update({ativo:!r.ativo}).eq("id",r.id).select("id").single();if(error)throw error;await qc.invalidateQueries({queryKey:["wa-acoes-botoes"]});toast.success("Regra atualizada.");}catch{toast.error("Não foi possível atualizar.");}finally{setBusy(false);}
  }
  return <section className="space-y-3 text-sm">
    <h3 className="font-bold text-[#00a884]">Ações dos botões de marketing</h3>
    <p className="text-xs opacity-80">Use o mesmo texto do botão do modelo da Meta. A regra vale para futuras campanhas com esse rótulo quando a IA global estiver ativa. Conversas humanas continuam sob controle da equipe, salvo envio de cardápio solicitado. Botões conhecidos mantêm a ação padrão quando não há regra ativa.</p>
    <input className={campo} aria-label="Texto do botão" placeholder="Ex.: Solicitar cardápio" maxLength={80} value={rotulo} onChange={e=>setRotulo(e.target.value)}/>
    <select className={campo} aria-label="Ação do botão" value={acao} onChange={e=>setAcao(e.target.value)}>{ACOES_CONFIGURAVEIS.map(([id,label])=><option className="text-gray-900" key={id} value={id}>{label}</option>)}</select>
    <button type="button" className={botao} disabled={busy||!rotulo.trim()} onClick={salvar}>Salvar regra desativada</button>
    {query.isError?<p className="text-red-500">Não foi possível carregar as regras.</p>:query.isLoading?<p>Carregando...</p>:query.data?.map(r=><div key={r.id} className="rounded-lg border border-current/20 p-3 flex justify-between gap-2 items-center">
      <div><p className="font-semibold">{r.rotulo}</p><p className="text-xs opacity-80">{ACOES_CONFIGURAVEIS.find(a=>a[0]===r.acao)?.[1]??r.acao} · {r.ativo?"Ativa":"Desativada"}</p></div>
      <div className="flex gap-2"><button type="button" disabled={busy} onClick={()=>{setRotulo(r.rotulo);setAcao(r.acao);}} className="text-xs underline">Editar</button><button type="button" className="rounded border border-current/20 px-2 py-1 text-xs" disabled={busy} onClick={()=>toggle(r)}>{r.ativo?"Desativar":"Ativar"}</button></div>
    </div>)}
    <p className="text-xs opacity-70">Exemplo: “Solicitar cardápio” → PDF (ou link) → menu. Não é necessário criar uma regra para o botão padrão.</p>
  </section>;
}
