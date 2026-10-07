type OrderEmailStatus =
  | "novo_pedido"
  | "pendente"
  | "preparando"
  | "saiu para entrega"
  | "pronto para retirada"
  | "entregue"
  | "cancelado";

interface EmailTag {
  name: string;
  value: string;
}

interface SendResendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  idempotencyKey: string;
  category: string;
  tags?: EmailTag[];
}

interface OrderReceivedEmailInput {
  orderId: string;
  email: string;
  nome: string;
  valorTotal: number;
  metodoEntrega: string;
  dataProgramada?: string;
  faixaHorario?: string;
}

interface OrderStatusEmailInput {
  orderId: string;
  email: string;
  nome: string;
  status: OrderEmailStatus;
  metodoEntrega?: string;
}

const siteUrl = (process.env.SITE_URL || "https://saborosamente.com").replace(/\/$/, "");

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || "cliente";
}

function money(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function orderProtocol(orderId: string) {
  return String(orderId).slice(0, 8).toUpperCase();
}

function trackingUrl(orderId: string) {
  return `${siteUrl}/pedido?p=${encodeURIComponent(orderProtocol(orderId))}`;
}

function emailShell({
  preheader,
  title,
  greeting,
  body,
  details,
  ctaLabel,
  ctaUrl,
  footer = "Este é um e-mail automático da SaborosaMente.",
}: {
  preheader: string;
  title: string;
  greeting: string;
  body: string;
  details?: Array<{ label: string; value: string }>;
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string;
}) {
  const detailsHtml =
    details && details.length
      ? `
        <div style="margin:24px 0;border:1px solid #e4eadf;border-radius:16px;overflow:hidden">
          ${details
            .map(
              (item) => `
                <div style="display:flex;justify-content:space-between;gap:16px;padding:12px 16px;border-bottom:1px solid #eef2eb;background:#fff">
                  <span style="color:#647064;font-size:14px">${escapeHtml(item.label)}</span>
                  <strong style="color:#1f3b2d;font-size:14px;text-align:right">${escapeHtml(item.value)}</strong>
                </div>`,
            )
            .join("")}
        </div>`
      : "";

  const ctaHtml =
    ctaLabel && ctaUrl
      ? `
        <div style="margin:28px 0 8px;text-align:center">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#214b35;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:999px">
            ${escapeHtml(ctaLabel)}
          </a>
        </div>`
      : "";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f5f2e9;font-family:Arial,Helvetica,sans-serif;color:#26332a">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
    <div style="padding:28px 14px">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5eadf">
        <div style="background:#214b35;padding:24px 28px;text-align:center">
          <div style="font-size:12px;letter-spacing:2px;color:#d9e8cf;font-weight:700">SABOROSAMENTE</div>
          <div style="margin-top:6px;font-size:12px;color:#ffffff">Alimentação saudável para o corpo e para a mente</div>
        </div>
        <div style="padding:30px 28px">
          <h1 style="margin:0 0 16px;color:#214b35;font-size:26px;line-height:1.2">${escapeHtml(title)}</h1>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.65">Oi, ${escapeHtml(greeting)}! 💚</p>
          <div style="font-size:15px;line-height:1.7;color:#445047">${body}</div>
          ${detailsHtml}
          ${ctaHtml}
          <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#7a847c;text-align:center">
            ${escapeHtml(footer)}
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

async function sendResendEmail(input: SendResendEmailInput) {
  const apiKey = String(process.env.RESEND_API_KEY ?? "").trim();
  if (!apiKey) {
    return { ok: false as const, skipped: true as const, reason: "missing_resend_api_key" };
  }

  const to = input.to.trim().toLowerCase();
  if (!to || !to.includes("@")) {
    return { ok: false as const, skipped: true as const, reason: "invalid_recipient" };
  }

  const from =
    String(process.env.RESEND_FROM_EMAIL ?? "").trim() ||
    "SaborosaMente <pedidos@saborosamente.com>";
  const replyTo = String(process.env.RESEND_REPLY_TO ?? "").trim();

  const body: Record<string, unknown> = {
    from,
    to: [to],
    subject: input.subject,
    html: input.html,
    tags: [{ name: "category", value: input.category }, ...(input.tags ?? [])],
  };
  if (input.text) body.text = input.text;
  if (replyTo) body.reply_to = replyTo;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey.slice(0, 256),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = (await response.text()).slice(0, 1000);
      console.error("[resend] falha ao enviar e-mail", {
        status: response.status,
        category: input.category,
        error: errorBody,
      });
      return { ok: false as const, skipped: false as const, status: response.status };
    }

    const result = await response.json().catch(() => ({}));
    return { ok: true as const, id: (result as any)?.id ?? null };
  } catch (error) {
    console.error("[resend] erro de rede ao enviar e-mail", {
      category: input.category,
      error,
    });
    return { ok: false as const, skipped: false as const };
  }
}

export async function sendOrderReceivedEmail(input: OrderReceivedEmailInput) {
  const protocolo = orderProtocol(input.orderId);
  const entrega =
    String(input.metodoEntrega).toLowerCase() === "retirada" ? "Retirada na loja" : "Entrega";

  const scheduleParts = [input.dataProgramada, input.faixaHorario].filter(Boolean);
  const schedule = scheduleParts.length ? scheduleParts.join(" · ") : "A confirmar";

  const html = emailShell({
    preheader: `Recebemos seu pedido #${protocolo}.`,
    title: "Pedido recebido!",
    greeting: firstName(input.nome),
    body:
      `Recebemos o seu pedido <strong>#${escapeHtml(protocolo)}</strong> com sucesso. ` +
      "Agora vamos conferir tudo e, assim que estiver confirmado, você será avisado.",
    details: [
      { label: "Protocolo", value: `#${protocolo}` },
      { label: "Total", value: money(input.valorTotal) },
      { label: "Recebimento", value: entrega },
      { label: "Data / horário", value: schedule },
    ],
    ctaLabel: "Acompanhar pedido",
    ctaUrl: trackingUrl(input.orderId),
  });

  return sendResendEmail({
    to: input.email,
    subject: `Pedido #${protocolo} recebido | SaborosaMente`,
    html,
    idempotencyKey: `pedido-recebido/${input.orderId}`,
    category: "pedido_recebido",
    tags: [{ name: "order_id", value: input.orderId }],
  });
}

function statusContent(
  status: OrderEmailStatus,
  metodoEntrega?: string,
): { subject: string; title: string; body: string } | null {
  const retirada = String(metodoEntrega ?? "").toLowerCase() === "retirada";

  if (status === "preparando" || status === "novo_pedido") return null;
  if (status === "pendente") {
    return {
      subject: "confirmado",
      title: "Pedido confirmado!",
      body: "Seu pedido foi conferido e está confirmado. Agora é só acompanhar as próximas atualizações.",
    };
  }
  if (status === "saiu para entrega") {
    return {
      subject: "saiu para entrega",
      title: "Seu pedido está a caminho!",
      body: "Seu pedido saiu para entrega. Já já ele chega até você. 🚚",
    };
  }
  if (status === "pronto para retirada") {
    return {
      subject: "pronto para retirada",
      title: "Pedido pronto para retirada!",
      body: "Seu pedido está pronto e esperando por você na loja. 🛍️",
    };
  }
  if (status === "entregue") {
    return {
      subject: retirada ? "retirado e finalizado" : "entregue e finalizado",
      title: "Pedido finalizado!",
      body:
        "Esperamos que você aproveite bastante. Obrigado por escolher a SaborosaMente — seu feedback é sempre muito bem-vindo. 💚",
    };
  }
  if (status === "cancelado") {
    return {
      subject: "cancelado",
      title: "Pedido cancelado",
      body:
        "Seu pedido foi cancelado. Se você tiver alguma dúvida ou precisar de ajuda, fale com a nossa equipe.",
    };
  }
  return null;
}

export async function sendOrderStatusEmail(input: OrderStatusEmailInput) {
  const content = statusContent(input.status, input.metodoEntrega);
  if (!content) {
    return { ok: false as const, skipped: true as const, reason: "status_without_email" };
  }

  const protocolo = orderProtocol(input.orderId);
  const html = emailShell({
    preheader: `Pedido #${protocolo}: ${content.subject}.`,
    title: content.title,
    greeting: firstName(input.nome),
    body:
      `<strong>#${escapeHtml(protocolo)}</strong> — ${escapeHtml(content.body)}`,
    details: [{ label: "Protocolo", value: `#${protocolo}` }],
    ctaLabel: "Acompanhar pedido",
    ctaUrl: trackingUrl(input.orderId),
  });

  return sendResendEmail({
    to: input.email,
    subject: `Pedido #${protocolo} ${content.subject} | SaborosaMente`,
    html,
    idempotencyKey: `pedido-status/${input.orderId}/${input.status.replaceAll(" ", "-")}`,
    category: `pedido_${input.status.replaceAll(" ", "_")}`,
    tags: [{ name: "order_id", value: input.orderId }],
  });
}


interface AccountActionEmailInput {
  email: string;
  nome?: string;
  actionUrl: string;
  userId: string;
}

interface PasswordChangedEmailInput {
  email: string;
  nome?: string;
  userId: string;
  eventId: string;
}

export async function sendAccountConfirmationEmail(input: AccountActionEmailInput) {
  const nome = firstName(input.nome || "");
  const html = emailShell({
    preheader: "Confirme seu e-mail para ativar sua conta SaborosaMente.",
    title: "Confirme seu e-mail",
    greeting: nome,
    body:
      "Seu cadastro está quase pronto. Confirme este endereço de e-mail para ativar sua conta e acessar seus pedidos, cashback e benefícios.",
    ctaLabel: "Confirmar meu e-mail",
    ctaUrl: input.actionUrl,
    footer:
      "Se você não criou uma conta na SaborosaMente, pode ignorar este e-mail com segurança.",
  });

  return sendResendEmail({
    to: input.email,
    subject: "Confirme seu e-mail | SaborosaMente",
    html,
    text:
      "Confirme seu e-mail para ativar sua conta SaborosaMente. Acesse o link: " +
      input.actionUrl +
      "\n\nSe você não criou uma conta, ignore esta mensagem.",
    idempotencyKey: `auth-confirmacao/${input.userId}`,
    category: "auth_confirmacao_email",
    tags: [{ name: "user_id", value: input.userId }],
  });
}

export async function sendPasswordRecoveryEmail(input: AccountActionEmailInput) {
  const nome = firstName(input.nome || "");
  const html = emailShell({
    preheader: "Use este link para criar uma nova senha da sua conta.",
    title: "Crie uma nova senha",
    greeting: nome,
    body:
      "Recebemos uma solicitação para redefinir a senha da sua conta. Use o botão abaixo para escolher uma nova senha.",
    ctaLabel: "Criar nova senha",
    ctaUrl: input.actionUrl,
    footer:
      "Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha atual continuará válida.",
  });

  return sendResendEmail({
    to: input.email,
    subject: "Redefina sua senha | SaborosaMente",
    html,
    text:
      "Recebemos uma solicitação para redefinir sua senha. Crie uma nova senha pelo link: " +
      input.actionUrl +
      "\n\nSe você não solicitou essa alteração, ignore esta mensagem.",
    idempotencyKey: `auth-recuperacao/${input.userId}/${Date.now()}`,
    category: "auth_recuperacao_senha",
    tags: [{ name: "user_id", value: input.userId }],
  });
}

export async function sendPasswordChangedEmail(input: PasswordChangedEmailInput) {
  const nome = firstName(input.nome || "");
  const html = emailShell({
    preheader: "A senha da sua conta SaborosaMente foi alterada.",
    title: "Senha alterada com sucesso",
    greeting: nome,
    body:
      "A senha da sua conta foi alterada com sucesso. Se foi você, nenhuma outra ação é necessária.",
    ctaLabel: "Acessar minha conta",
    ctaUrl: `${siteUrl}/auth`,
    footer:
      "Não reconhece esta alteração? Redefina sua senha imediatamente e entre em contato com a SaborosaMente.",
  });

  return sendResendEmail({
    to: input.email,
    subject: "Sua senha foi alterada | SaborosaMente",
    html,
    text:
      "A senha da sua conta SaborosaMente foi alterada. Se foi você, nenhuma ação é necessária. " +
      "Se não reconhece esta alteração, acesse https://saborosamente.com/auth e redefina sua senha.",
    idempotencyKey: `auth-senha-alterada/${input.userId}/${input.eventId}`,
    category: "auth_senha_alterada",
    tags: [{ name: "user_id", value: input.userId }],
  });
}
