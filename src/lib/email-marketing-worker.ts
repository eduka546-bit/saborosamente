import { createServerClient } from "@/integrations/supabase/server";

type ResendUsage = {
  emails?: {
    daily?: { used: number; limit: number | null; resets_at?: string };
    monthly?: { used: number; limit: number | null; resets_at?: string };
  };
};
type QueueItem = {
  dispatch_id:number; campaign_id:string; email:string; nome:string;
  assunto:string; previa:string; mensagem:string; html:string; unsub_token:string;
};
const API="https://api.resend.com";
const DAILY_MAX=80;
const ORDER_RESERVE=20;

async function api<T>(path:string, opts?:{method?:string;body?:Record<string,unknown>;headers?:Record<string,string>}) {
  const key=process.env.RESEND_API_KEY;
  if(!key)throw new Error("A chave de envio do Resend não está configurada.");
  const ac=new AbortController();
  const timer=setTimeout(()=>ac.abort(),12000);
  try{
    const r=await fetch(API+path,{
      method:opts?.method||"GET",
      headers:{Authorization:"Bearer "+key,"Content-Type":"application/json",...opts?.headers},
      ...(opts?.body?{body:JSON.stringify(opts.body)}:{}),
      signal:ac.signal,
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok){
      throw new Error("Resend HTTP "+r.status+": "+String((data as any)?.message||"Falha na requisição").slice(0,300));
    }
    return data as T;
  } finally {clearTimeout(timer);}
}
function remainingUsage(usage:ResendUsage){
  const d=usage.emails?.daily,m=usage.emails?.monthly;
  if(!d||!m||!Number.isFinite(d.used)||!Number.isFinite(m.used))
    throw new Error("Resend não retornou cotas diárias e mensais; envio suspenso preventivamente.");
  const daysToReset=m.resets_at ? Math.max(1,Math.ceil((Date.parse(m.resets_at)-Date.now())/86400000)) : 31;
  const safeDay=d.limit===null?DAILY_MAX:Math.max(0,d.limit-d.used-ORDER_RESERVE);
  const safeMonth=m.limit===null?DAILY_MAX:Math.max(0,m.limit-m.used-(ORDER_RESERVE*daysToReset));
  return Math.max(0,Math.min(DAILY_MAX,safeDay,safeMonth));
}

async function mark(id:number, status:string, fields:Record<string,unknown>={}){
  const db=createServerClient();
  const {error}=await (db as any).from("email_marketing_dispatches")
    .update({status,...fields}).eq("id",id).eq("status","processing");
  if(error)throw error;
}
async function deliver(item:QueueItem) {
  const db=createServerClient();
  try{
    const {data:consent,error:checkError}=await (db as any).from("email_marketing_consents")
      .select("revogado_em,unsubscribe_token").eq("email",item.email).maybeSingle();
    if(checkError)throw checkError;
    if(!consent || consent.revogado_em || consent.unsubscribe_token!==item.unsub_token){
      await mark(item.dispatch_id,"cancelled",{error_message:"Inscrição cancelada."});
      return "cancelled";
    }

    // Confirma também o estado do contato no Resend antes do envio; inscrições
    // canceladas fora do site não são reincluídas automaticamente.
    const contact=await api<{unsubscribed?:boolean;id?:string}>("/contacts/"+encodeURIComponent(item.email));
    if(contact.unsubscribed){
      await (db as any).from("email_marketing_consents").update({revogado_em:new Date().toISOString()})
        .eq("email",item.email);
      await mark(item.dispatch_id,"cancelled",{error_message:"Inscrição cancelada no Resend."});
      return "cancelled";
    }
    const fullName=(item.nome||"").trim();
    const firstName=/^(cliente|sem nome|não informado)$/i.test(fullName)?"":fullName.split(/\s+/)[0];
    const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]||ch));
    const personalize=(s:string,html=false)=>s
      .replace(/Olá,\s*\{\{primeiro_nome\}\}/gi,firstName?"Olá, "+(html?escapeHtml(firstName):firstName):"Olá")
      .replaceAll("{{primeiro_nome}}",html?escapeHtml(firstName||""):firstName||"")
      .replaceAll("{{nome_completo}}",html?escapeHtml(firstName?fullName:""):firstName?fullName:"");
    const url="https://saborosamente.com/email-cancelar?t="+item.unsub_token;
    const inlineHeader=item.html.match(/<!--INLINE_BF_HEADER:([A-Za-z0-9+/=]+)-->/);
    const emailBody=inlineHeader?item.html.replace(inlineHeader[0],""):item.html;
    if(emailBody.includes("cid:bf-header-2026")&&!inlineHeader)throw new Error("Banner da campanha ausente.");
    const response=await api<{id?:string}>("/emails",{
      method:"POST",
      headers:{"Idempotency-Key":`email-marketing/${item.campaign_id}/${item.dispatch_id}`},
      body:{
        from:process.env.RESEND_FROM_EMAIL||"SaborosaMente <pedidos@saborosamente.com>",
        to:[item.email],subject:personalize(item.assunto),
        html:personalize(emailBody,true).replaceAll("__EMAIL_UNSUBSCRIBE_URL__",url),
        ...(inlineHeader?{attachments:[{filename:"black-friday-2026.png",content:inlineHeader[1],content_type:"image/png",content_id:"bf-header-2026"}]}:{}),
        text:[personalize(item.assunto),personalize(item.mensagem),"","Cancelar inscrição: "+url].join("\n\n"),
        headers:{
          "List-Unsubscribe":"<"+url+">",
          "List-Unsubscribe-Post":"List-Unsubscribe=One-Click",
        },
        tags:[{name:"category",value:"email_marketing"},{name:"campaign",value:item.campaign_id}],
      },
    });
    await mark(item.dispatch_id,"sent",{resend_message_id:response.id||null,sent_at:new Date().toISOString(),error_message:null});
    return "sent";
  }catch(e){
    const msg=e instanceof Error?e.message:String(e);
    // Sem confirmação (timeout/queda) não reenviar automaticamente.
    // Uma chamada aceita pelo provedor pode ter perdido apenas a resposta.
    // 4xx/5xx explícitos também ficam para revisão manual (sem repetição).
    try { await mark(item.dispatch_id,"uncertain",{error_message:msg.slice(0,450)}); }
    catch(err){console.error("[email-marketing] não foi possível registrar falha",err);}
    console.error("[email-marketing] destinatário sem confirmação",item.dispatch_id,msg);
    return "uncertain";
  }
}

export async function processEmailMarketingDay() {
  const db=createServerClient();
  let processed=0,success=0,issues=0,cancelled=0;
  let stopReason="Nenhum contato pendente.";
  for(let round=0;round<20;round++){
    // Checa as cotas ANTES de cada lote. Nunca usar fallback que dispare
    // campanhas enquanto a API de uso não estiver disponível.
    const usage=await api<ResendUsage>("/usage");
    const remaining=remainingUsage(usage);
    if(remaining<=0){stopReason="Reserva para e-mails de pedidos ou cota mensal atingida.";break;}
    const {data:day,error:dayError}=await (db as any).from("email_marketing_daily_usage")
      .select("claimed").eq("day_utc",new Date().toISOString().slice(0,10)).maybeSingle();
    if(dayError)throw dayError;
    const dailyLeft=Math.max(0,DAILY_MAX-Number(day?.claimed||0));
    if(!dailyLeft){stopReason="Limite de 80 tentativas diárias atingido.";break;}
    const amount=Math.min(5,dailyLeft,remaining);
    const {data:claimed,error:claimError}=await (db as any).rpc("email_marketing_claim_batch",{p_limit:amount});
    if(claimError)throw claimError;
    const batch=(claimed||[]) as QueueItem[];
    if(batch.length===0){stopReason="Fila diária vazia ou campanhas agendadas para depois.";break;}
    // Até 3 requisições simultâneas para respeitar o rate limit do Resend.
    for(let i=0;i<batch.length;i+=3){
      const outcomes=await Promise.all(batch.slice(i,i+3).map(deliver));
      processed+=outcomes.length;
      success+=outcomes.filter(x=>x==="sent").length;
      issues+=outcomes.filter(x=>x==="uncertain").length;
      cancelled+=outcomes.filter(x=>x==="cancelled").length;
    }
    stopReason="Lote processado.";
  }
  const {error:finishError}=await (db as any).rpc("email_marketing_finish_complete");
  if(finishError)console.warn("[email-marketing] não foi possível finalizar campanhas",finishError);
  return {processed,success,issues,cancelled,stopReason,at:new Date().toISOString()};
}
