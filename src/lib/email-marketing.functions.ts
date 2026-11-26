import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerClient } from "@/integrations/supabase/server";

// Este segmento é exclusivo do marketing por e-mail. Não reutilizar o WhatsApp
// nem o segmento "General", que também pode receber contatos transacionais.
const EMAIL_MARKETING_SEGMENT_ID = "1b02150d-58d5-4ffe-afd7-c8105f2c9fb1";
const EMAIL_FROM_DEFAULT = "SaborosaMente <pedidos@saborosamente.com>";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("overview"), token: z.string().min(10) }),
  z.object({
    action: z.literal("add_contact"),
    token: z.string().min(10),
    email: z.email().max(320),
    nome: z.string().trim().min(2).max(140),
    consentConfirmed: z.literal(true),
  }),
  z.object({
    action: z.literal("create_draft"),
    token: z.string().min(10),
    nome: z.string().trim().min(3).max(120),
    assunto: z.string().trim().min(3).max(180),
    previa: z.string().trim().max(180),
    mensagem: z.string().trim().min(8).max(12000),
    botaoTexto: z.string().trim().max(65),
    botaoUrl: z.string().trim().max(500),
    imagemUrl: z.string().trim().max(500),
  }),
  z.object({
    action: z.literal("send"),
    token: z.string().min(10),
    id: z.uuid(),
    confirmed: z.literal(true),
    scheduledAt: z.string().optional(),
  }),
  z.object({
    action: z.literal("details"),
    token: z.string().min(10),
    id: z.uuid(),
  }),
]);
type Input = z.infer<typeof schema>;

type ResendList<T> = { data?: T[]; has_more?: boolean };
type ResendContact = {
  id: string; email: string; first_name?: string; last_name?: string;
  unsubscribed?: boolean; created_at?: string;
};
type ResendBroadcast = {
  id: string; name?: string; subject?: string; status?: string;
  segment_id?: string; audience_id?: string; created_at?: string;
  sent_at?: string; scheduled_at?: string; delivered?: number;
  sent?: number; opened?: number; clicked?: number;
};

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function validHttpsUrl(input: string): string | null {
  if (!input.trim()) return null;
  try {
    const url = new URL(input);
    if (url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

function emailHtml(input: Extract<Input, { action: "create_draft" }>) {
  const imagem = input.imagemUrl ? validHttpsUrl(input.imagemUrl) : null;
  if (input.imagemUrl && !imagem) throw new Error("A imagem precisa ter uma URL HTTPS.");
  const botao = input.botaoUrl ? validHttpsUrl(input.botaoUrl) : null;
  if ((input.botaoTexto && !botao) || (!input.botaoTexto && input.botaoUrl)) {
    throw new Error("Informe o texto do botão e uma URL HTTPS válida.");
  }
  const blocos = input.mensagem.split(/\n\s*\n/).map((p) =>
    `<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#34453a;margin:0 0 18px">${escapeHtml(p).replaceAll("\n", "<br>")}</p>`
  ).join("");
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"></head>
<body style="margin:0;padding:0;background-color:#f8f7ef;font-family:Arial,Helvetica,sans-serif">
<span style="display:none;font-size:1px;color:#f8f7ef;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(input.previa)}</span>
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#f8f7ef"><tr><td align="center" style="padding:28px 12px">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;background-color:#ffffff">
<tr><td bgcolor="#064D2F" align="center" style="background-color:#064D2F;padding:30px 24px">
<p style="font-family:Arial,Helvetica,sans-serif;font-size:21px;font-weight:800;letter-spacing:1px;line-height:1.3;color:#ffffff;margin:0">SaborosaMente</p>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#dbeac9;margin:6px 0 0">Sabor e praticidade para seu dia a dia</p></td></tr>
${imagem ? `<tr><td><img src="${escapeHtml(imagem)}" width="600" height="300" border="0" alt="Novidades da SaborosaMente" style="display:block;width:100%;max-width:600px;height:auto"></td></tr>` : ""}
<tr><td style="padding:32px 30px 20px">
<h1 style="font-family:Arial,Helvetica,sans-serif;font-size:27px;line-height:1.25;font-weight:800;color:#064D2F;margin:0 0 20px">${escapeHtml(input.assunto)}</h1>
${blocos}
${botao ? `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:24px 0 16px"><tr><td bgcolor="#8BB924" style="background-color:#8BB924;padding:13px 22px"><a href="${escapeHtml(botao)}" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#003923;text-decoration:none">${escapeHtml(input.botaoTexto)}</a></td></tr></table>` : ""}
</td></tr>
<tr><td bgcolor="#f2f6ec" align="center" style="background-color:#f2f6ec;padding:24px 28px">
<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#47604d;margin:0">Você está recebendo novidades da SaborosaMente.</p>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#47604d;margin:9px 0 0"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#064D2F;text-decoration:underline">Não quero mais receber esses e-mails</a></p>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#657466;margin:10px 0 0">São Bento do Sul - SC · saborosamente.com</p>
</td></tr></table></td></tr></table></body></html>`;
}

async function resend<T>(path: string, options?: { method?: string; body?: Record<string, unknown> }): Promise<T> {
  const key = String(process.env.RESEND_API_KEY ?? "").trim();
  if (!key) throw new Error("A chave RESEND_API_KEY não está configurada no servidor.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`https://api.resend.com${path}`, {
      method: options?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((result as { message?: string }).message || `Erro do Resend: HTTP ${response.status}`);
    }
    return result as T;
  } finally {
    clearTimeout(timeout);
  }
}

export const emailMarketingAdmin = createServerFn({ method: "POST" })
  .validator((input: Input) => schema.parse(input))
  .handler(async ({ data }) => {
    const db = createServerClient();
    const { data: session, error: authError } = await db.auth.getUser(data.token);
    if (authError || !session.user) throw new Error("Sessão expirada. Faça login novamente.");
    const { data: role, error: roleError } = await db.from("user_roles")
      .select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
    if (roleError || !role) throw new Error("Apenas administradores podem acessar E-mail Marketing.");

    if (data.action === "overview") {
      const [contacts, broadcasts] = await Promise.all([
        resend<ResendList<ResendContact>>(`/contacts?segment_id=${EMAIL_MARKETING_SEGMENT_ID}&limit=100`),
        resend<ResendList<ResendBroadcast>>("/broadcasts?limit=100"),
      ]);
      return {
        action: "overview" as const,
        contacts: contacts.data ?? [],
        contactsMore: !!contacts.has_more,
        broadcasts: (broadcasts.data ?? []).filter((c) =>
          (c.segment_id ?? c.audience_id) === EMAIL_MARKETING_SEGMENT_ID),
        segmentName: "SaborosaMente - Email Marketing",
      };
    }

    if (data.action === "add_contact") {
      const email = data.email.trim().toLowerCase();
      const parts = data.nome.trim().split(/\s+/);
      // Registrar a origem do consentimento antes de incluir no provedor.
      const { error: consentError } = await (db as any).from("email_marketing_consents").upsert({
        email, nome: data.nome.trim(), origem: "admin_confirmou_consentimento",
        consentido_em: new Date().toISOString(), registrado_por: session.user.id,
      }, { onConflict: "email" });
      if (consentError) throw new Error("Não foi possível registrar o consentimento: " + consentError.message);
      await resend("/contacts", {
        method: "POST",
        body: {
          email, first_name: parts[0] ?? "", last_name: parts.slice(1).join(" "),
          segments: [{ id: EMAIL_MARKETING_SEGMENT_ID }],
          unsubscribed: false,
        },
      });
      return { action: "add_contact" as const, email };
    }

    if (data.action === "create_draft") {
      const html = emailHtml(data);
      const result = await resend<{ id: string }>("/broadcasts", {
        method: "POST",
        body: {
          name: data.nome,
          segment_id: EMAIL_MARKETING_SEGMENT_ID,
          from: process.env.RESEND_FROM_EMAIL || EMAIL_FROM_DEFAULT,
          subject: data.assunto,
          preview_text: data.previa || undefined,
          html,
          text: `${data.assunto}\n\n${data.mensagem}\n\n${data.botaoTexto && data.botaoUrl ? `${data.botaoTexto}: ${data.botaoUrl}\n\n` : ""}Para cancelar o recebimento de e-mails, use o link no rodapé da versão HTML.`,
        },
      });
      return { action: "create_draft" as const, id: result.id };
    }

    if (data.action === "details") {
      const result = await resend<ResendBroadcast & { html?: string }>(`/broadcasts/${data.id}`);
      if ((result.segment_id ?? result.audience_id) !== EMAIL_MARKETING_SEGMENT_ID) {
        throw new Error("Campanha não pertence ao E-mail Marketing.");
      }
      return { action: "details" as const, broadcast: result };
    }

    // A autorização de envio é verificada novamente no servidor: nunca
    // disparar de maneira automática nem para segmentos de outros canais.
    const [campaign, contacts] = await Promise.all([
      resend<ResendBroadcast>(`/broadcasts/${data.id}`),
      resend<ResendList<ResendContact>>(`/contacts?segment_id=${EMAIL_MARKETING_SEGMENT_ID}&limit=100`),
    ]);
    if ((campaign.segment_id ?? campaign.audience_id) !== EMAIL_MARKETING_SEGMENT_ID) {
      throw new Error("Esta campanha não pertence ao segmento de e-mail.");
    }
    if (campaign.status !== "draft") throw new Error("Somente campanhas em rascunho podem ser enviadas.");
    if (!(contacts.data ?? []).some((contact) => !contact.unsubscribed)) {
      throw new Error("Não há contatos inscritos para receber esta campanha.");
    }
    if (data.scheduledAt) {
      const date = new Date(data.scheduledAt);
      if (!Number.isFinite(date.getTime()) || date.getTime() < Date.now() + 5 * 60000) {
        throw new Error("Agende para pelo menos cinco minutos a partir de agora.");
      }
    }
    const result = await resend<{ id?: string }>(`/broadcasts/${data.id}/send`, {
      method: "POST", body: data.scheduledAt ? { scheduled_at: data.scheduledAt } : {},
    });
    return { action: "send" as const, id: result.id ?? data.id };
  });
