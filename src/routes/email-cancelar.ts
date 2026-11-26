import { createFileRoute } from "@tanstack/react-router";
import { createServerClient } from "@/integrations/supabase/server";

function page(title:string,body:string,token:string,showForm:boolean){
  return new Response(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} | SaborosaMente</title></head>
  <body style="background:#f8f7ef;color:#064d2f;font-family:Arial,Helvetica,sans-serif;margin:0;padding:40px 16px">
  <main style="max-width:470px;background:white;border:1px solid #dae7d8;border-radius:20px;padding:32px;margin:0 auto;text-align:center">
  <h1 style="font-size:24px">SaborosaMente</h1><h2 style="font-size:19px">${title}</h2>
  <p style="font-size:15px;line-height:1.6">${body}</p>
  ${showForm?'<form method="POST" action="/email-cancelar?t='+token+'"><button type="submit" style="border:0;border-radius:9px;background:#064d2f;color:white;padding:13px 20px;font-size:14px;cursor:pointer">Confirmar cancelamento</button></form>':''}
  <p style="font-size:12px;color:#667768;margin-top:26px">Seus e-mails de confirmação de pedido não serão afetados.</p>
  </main></body></html>`,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
}
function validToken(url:string){
  const t=new URL(url).searchParams.get("t")||"";
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t)?t:null;
}
export const Route=createFileRoute("/email-cancelar")({
  // @ts-expect-error TanStack Start aceita server.handlers em runtime; tipagem do Router ainda defasada.
  server:{
    handlers:{
      GET:async({request}:{request:Request})=>{
        const token=validToken(request.url);
        if(!token) return new Response("Link inválido.",{status:400});
        return page("Cancelar e-mails promocionais","Confirma que não deseja mais receber ofertas por e-mail?",token,true);
      },
      POST:async({request}:{request:Request})=>{
        const token=validToken(request.url);
        if(!token)return new Response("Link inválido.",{status:400});
        const db=createServerClient();
        const {data:row,error}=await (db as any).from("email_marketing_consents")
          .update({revogado_em:new Date().toISOString()})
          .eq("unsubscribe_token",token).select("email").maybeSingle();
        if(error){
          console.error("[email-unsubscribe] db",error.message);
          return new Response("Não foi possível atualizar. Tente novamente.",{status:503});
        }
        if(!row)return page("Inscrição não encontrada","O link não corresponde a uma inscrição ativa.",token,false);
        await (db as any).from("email_marketing_dispatches")
          .update({status:"cancelled",error_message:"Cancelamento solicitado pelo cliente."})
          .eq("email",row.email).eq("status","pending");
        try{
          const key=process.env.RESEND_API_KEY;
          if(key)await fetch("https://api.resend.com/contacts/"+encodeURIComponent(row.email),{
            method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+key},
            body:JSON.stringify({unsubscribed:true}),
          });
        }catch(error){console.warn("[email-unsubscribe] contato Resend não sincronizado",error);}
        return page("Inscrição cancelada","Você não receberá novos e-mails promocionais da SaborosaMente.",token,false);
      },
    },
  },
});
