import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerClient } from "@/integrations/supabase/server";

const EMAIL_MARKETING_SEGMENT_ID = "1b02150d-58d5-4ffe-afd7-c8105f2c9fb1";
const API_URL = "https://api.resend.com";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("overview"), token: z.string().min(10) }),
  z.object({
    action: z.literal("add_contact"), token: z.string().min(10),
    email: z.email().max(320), nome: z.string().trim().min(2).max(140),
    consentConfirmed: z.literal(true),
  }),
  z.object({
    action: z.literal("create_draft"), token: z.string().min(10),
    nome: z.string().trim().min(3).max(120),
    assunto: z.string().trim().min(3).max(180),
    previa: z.string().trim().max(180),
    mensagem: z.string().trim().min(8).max(12000),
    botaoTexto: z.string().trim().max(65),
    botaoUrl: z.string().trim().max(500),
    imagemUrl: z.string().trim().max(500),
  }),
  z.object({
    action: z.literal("send"), token: z.string().min(10),
    id: z.uuid(), confirmed: z.literal(true), scheduledAt: z.string().optional(),
  }),
  z.object({
    action: z.literal("details"), token: z.string().min(10), id: z.uuid(),
  }),
  z.object({
    action: z.literal("pause"), token: z.string().min(10), id: z.uuid(),
  }),
  z.object({
    action: z.literal("resume"), token: z.string().min(10), id: z.uuid(),
  }),
]);

type Input = z.infer<typeof schema>;

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function validHttpsUrl(input: string): string | null {
  if (!input.trim()) return null;
  try { const url = new URL(input); return url.protocol === "https:" ? url.href : null; }
  catch { return null; }
}

function emailHtml(input: Extract<Input, { action: "create_draft" }>) {
  const imagem = input.imagemUrl ? validHttpsUrl(input.imagemUrl) : null;
  if (input.imagemUrl && !imagem) throw new Error("A imagem precisa ter uma URL HTTPS.");
  const botao = input.botaoUrl ? validHttpsUrl(input.botaoUrl) : null;
  if ((input.botaoTexto && !botao) || (!input.botaoTexto && input.botaoUrl)) {
    throw new Error("Informe texto do botão e URL HTTPS.");
  }
  const blocos = input.mensagem.split(/\n\s*\n/).map((p) =>
    '<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#34453a;margin:0 0 18px">' +
    escapeHtml(p).replaceAll("\n", "<br>") + '</p>'
  ).join("");
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"></head>
<body style="margin:0;padding:0;background-color:#f8f7ef;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#f8f7ef"><tr><td align="center" style="padding:28px 12px">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;background-color:#ffffff">
<tr><td bgcolor="#064D2F" align="center" style="background-color:#064D2F;padding:30px 24px"><p style="font-family:Arial,Helvetica,sans-serif;font-size:21px;font-weight:800;letter-spacing:1px;line-height:1.3;color:#ffffff;margin:0">SaborosaMente</p>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#dbeac9;margin:6px 0 0">Sabor e praticidade para seu dia a dia</p></td></tr>
${imagem ? '<tr><td><img src="' + escapeHtml(imagem) + '" width="600" height="300" border="0" alt="Novidades da SaborosaMente" style="display:block;width:100%;max-width:600px;height:auto"></td></tr>' : ""}
<tr><td style="padding:32px 30px 20px"><h1 style="font-family:Arial,Helvetica,sans-serif;font-size:27px;line-height:1.25;font-weight:800;color:#064D2F;margin:0 0 20px">${escapeHtml(input.assunto)}</h1>
${blocos}
${botao ? '<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:24px 0 16px"><tr><td bgcolor="#8BB924" style="background-color:#8BB924;padding:13px 22px"><a href="' + escapeHtml(botao) + '" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#003923;text-decoration:none">' + escapeHtml(input.botaoTexto) + '</a></td></tr></table>' : ""}
</td></tr><tr><td bgcolor="#f2f6ec" align="center" style="background-color:#f2f6ec;padding:24px 28px">
<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#47604d;margin:0">Você recebe novidades da SaborosaMente por ter autorizado o recebimento.</p>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#47604d;margin:9px 0 0"><a href="__EMAIL_UNSUBSCRIBE_URL__" style="color:#064D2F;text-decoration:underline">Cancelar inscrição</a></p>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#657466;margin:10px 0 0">Rua Augusto Wunderwald, 7, Sala 1, Progresso · São Bento do Sul - SC</p>
</td></tr></table></td></tr></table></body></html>`;
}

async function resend<T>(path: string, options?: { method?: string; body?: Record<string, unknown> }): Promise<T> {
  const key = String(process.env.RESEND_API_KEY ?? "").trim();
  if (!key) throw new Error("RESEND_API_KEY ausente.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(API_URL + path, {
      method: options?.method ?? "GET",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((result as { message?: string }).message || `Resend: HTTP ${response.status}`);
    return result as T;
  } finally { clearTimeout(timeout); }
}

export const emailMarketingAdmin = createServerFn({ method: "POST" })
  .validator((input: Input) => schema.parse(input))
  .handler(async ({ data }) => {
    const db = createServerClient();
    const { data: session, error: authError } = await db.auth.getUser(data.token);
    if (authError || !session.user) throw new Error("Sessão expirada.");
    const { data: role, error: roleError } = await db.from("user_roles")
      .select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
    if (roleError || !role) throw new Error("Apenas administradores podem acessar E-mail Marketing.");

    if (data.action === "overview") {
      const [people, campaigns, stats, daily, usage] = await Promise.all([
        (db as any).from("email_marketing_consents").select("email,nome,revogado_em,consentido_em",{ count:"exact" }).order("consentido_em",{ ascending:false }).limit(1000),
        (db as any).from("email_marketing_campaigns").select("id,nome,assunto,status,inicia_em,created_at,updated_at").order("created_at",{ ascending:false }).limit(150),
        (db as any).from("email_marketing_campaign_stats").select("*"),
        (db as any).from("email_marketing_daily_usage").select("claimed").eq("day_utc",new Date().toISOString().slice(0,10)).maybeSingle(),
        resend<{ emails?:{ daily?:{ used:number; limit:number|null; resets_at:string }; monthly?:{ used:number; limit:number|null; resets_at:string }} }>("/usage").catch(() => null),
      ]);
      const error = people.error || campaigns.error || stats.error || daily.error;
      if (error) throw error;
      const statMap = new Map((stats.data ?? []).map((s:any)=>[s.campaign_id,s]));
      return {
        action: "overview" as const,
        contacts: (people.data??[]).map((p:any)=>({
          id:p.email,email:p.email,first_name:p.nome,unsubscribed:!!p.revogado_em,
        })),
        contactsMore: (people.count??0)>1000,
        broadcasts: (campaigns.data??[]).map((c:any)=>({
          ...c,name:c.nome,subject:c.assunto,scheduled_at:c.inicia_em,created_at:c.created_at,
          progress:statMap.get(c.id)??{total:0,pendentes:0,processando:0,enviados:0,falhas:0,incertos:0,cancelados:0},
        })),
        dailyMarketing: Number(daily.data?.claimed??0),
        usage: usage?.emails ?? null,
        maxDailyMarketing: 80, reservedForOrders: 20,
      };
    }

    if (data.action === "add_contact") {
      const email = data.email.trim().toLowerCase();
      const parts = data.nome.trim().split(/\s+/);
      // O Resend deve aceitar o contato antes de gravá-lo como inscrito.
      // Nunca reativar um contato que cancelou sem novo consentimento explícito.
      try {
        await resend("/contacts", {
          method:"POST",body:{email,first_name:parts[0]??"",last_name:parts.slice(1).join(" "),
            segments:[{id:EMAIL_MARKETING_SEGMENT_ID}],unsubscribed:false},
        });
      } catch(e) {
        // O endereço pode já existir no provedor. Confirmar via GET antes de considerar erro.
        const existing=await resend<{id?:string}>(`/contacts/${encodeURIComponent(email)}`).catch(()=>null);
        if(!existing?.id) throw e;
        await resend(`/contacts/${encodeURIComponent(email)}`,{
          method:"PATCH",body:{unsubscribed:false,first_name:parts[0]??"",last_name:parts.slice(1).join(" ")},
        });
        await resend(`/contacts/${encodeURIComponent(email)}/segments/${EMAIL_MARKETING_SEGMENT_ID}`,{method:"POST"});
      }
      const { error } = await (db as any).from("email_marketing_consents").upsert({
        email,nome:data.nome.trim(),origem:"admin_confirmou_consentimento",
        consentido_em:new Date().toISOString(),revogado_em:null,registrado_por:session.user.id,
      },{onConflict:"email"});
      if(error)throw error;
      return { action:"add_contact" as const,email };
    }

    if (data.action === "create_draft") {
      const html=emailHtml(data);
      const { data: campaign,error }=await (db as any).from("email_marketing_campaigns").insert({
        nome:data.nome,assunto:data.assunto,previa:data.previa,mensagem:data.mensagem,
        botao_texto:data.botaoTexto,botao_url:data.botaoUrl,imagem_url:data.imagemUrl,
        html,criado_por:session.user.id,status:"draft",
      }).select("id").single();
      if(error)throw error;
      return { action:"create_draft" as const,id:String(campaign.id) };
    }

    if (data.action === "details") {
      const [campaign, rows] = await Promise.all([
        (db as any).from("email_marketing_campaigns").select("id,nome,assunto,status,inicia_em,created_at").eq("id",data.id).single(),
        (db as any).from("email_marketing_dispatches").select("email,nome,status,sent_at,error_message").eq("campaign_id",data.id).order("id",{ascending:true}).limit(150),
      ]);
      if(campaign.error)throw campaign.error;
      if(rows.error)throw rows.error;
      return {action:"details" as const,broadcast:{...campaign.data, name:campaign.data.nome,subject:campaign.data.assunto,recipients:rows.data}};
    }

    if (data.action === "send") {
      let start: string | null=null;
      if(data.scheduledAt){
        const date=new Date(data.scheduledAt);
        if(!Number.isFinite(date.getTime()) || date.getTime()<Date.now()+5*60*1000)
          throw new Error("Agende para pelo menos cinco minutos a partir de agora.");
        start=date.toISOString();
      }
      const { data: amount,error }=await (db as any).rpc("email_marketing_activate_campaign",{
        p_id:data.id,p_start_at:start,
      });
      if(error)throw new Error(error.message);
      return {action:"send" as const,id:data.id,recipients:Number(amount??0)};
    }

    if(data.action==="pause" || data.action==="resume"){
      const status=data.action==="pause"?"paused":"running";
      const where=data.action==="pause"?"running":"paused";
      const {data:row,error}=await (db as any).from("email_marketing_campaigns")
        .update({status,updated_at:new Date().toISOString()}).eq("id",data.id).eq("status",where).select("id").maybeSingle();
      if(error)throw error;
      if(!row)throw new Error("Campanha não está no status esperado.");
      return {action:data.action,id:data.id};
    }

    throw new Error("Ação inválida.");
  });
