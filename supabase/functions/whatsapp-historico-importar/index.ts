import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.0";
import { authorizationError, authorizeAdminOrService } from "../_shared/authorization.ts";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization,x-client-info,apikey,content-type",
  "Access-Control-Allow-Methods":"POST,OPTIONS",
};
function json(body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store",...cors}});
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"Método não permitido"},405);
  const auth=await authorizeAdminOrService(req);
  if(!auth.ok)return authorizationError(auth,cors);
  try{
    const body=await req.json().catch(()=>null);
    const id=String(body?.conversaId??"");
    const itens=body?.mensagens;
    if(!uuid.test(id)||body?.confirmado!==true||!Array.isArray(itens)||
      !itens.length||itens.length>200)
      return json({error:"Conversa e lote de mensagens inválidos."},400);

    const agora=Date.now(),limiteAntigo=Date.UTC(2000,0,1);
    const mensagens:any[]=[];
    for(const item of itens){
      const role=item?.role;
      const content=item?.content;
      const horario=item?.timestamp;
      const tempo=Date.parse(String(horario??""));
      if(!["user","assistant"].includes(role)||typeof content!=="string"||
        !content.trim()||content.length>10000||
        !Number.isFinite(tempo)||tempo<limiteAntigo||tempo>agora+86400000){
        return json({error:"Lote possui mensagem, data ou remetente inválido."},400);
      }
      mensagens.push({
        role,
        content:content.trim(),
        timestamp:new Date(tempo).toISOString(),
        manual:role==="assistant",
        source:"business_app_export",
      });
    }

    const url=Deno.env.get("SUPABASE_URL")??"";
    const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
    if(!url||!key)return json({error:"Configuração interna indisponível."},503);
    const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:conversa,error:consultaErro}=await db.from("whatsapp_conversas")
      .select("id").eq("id",id).maybeSingle();
    if(consultaErro||!conversa)return json({error:"Conversa não localizada."},404);
    const {data, error}=await db.rpc("whatsapp_coexistencia_registrar_lote",{
      p_conversa_id:id,p_mensagens:mensagens,p_assumir_humano:false,p_nome:null,
    });
    if(error){
      console.error("Importação de histórico falhou:",error.message);
      return json({error:"Não foi possível salvar o histórico. Tente novamente."},503);
    }
    return json({success:true,processadas:mensagens.length,arquivo:"não armazenado",resultado:data});
  }catch(e){
    console.error("Erro interno ao importar histórico:",e instanceof Error?e.message:"desconhecido");
    return json({error:"Falha interna na importação."},500);
  }
});
