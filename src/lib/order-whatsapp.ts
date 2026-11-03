import { sortOrderItems } from "./order-item-order";

export function phoneForWhatsapp(phone: unknown): string {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return "55" + digits;
  return "";
}

export function isOpenOrder(status: unknown): boolean {
  return ["pendente", "preparando", "pronto para retirada", "saiu para entrega"]
    .includes(String(status ?? "").trim().toLowerCase());
}

type WhatsappItem = {
  quantidade?: number | string | null;
  preco_unitario?: number | string | null;
  nome_item?: string | null;
  nome?: string | null;
  tamanho?: string | null;
  peso?: string | null;
  weight?: string | null;
  produtos?: { nome?: string | null } | null;
  product?: { nome?: string | null } | null;
  observacao?: string | null;
};

export type OrderWhatsapp = {
  id?: string;
  nome_cliente?: string | null;
  telefone_cliente?: string | null;
  origem?: string | null;
  status?: string;
  metodo_entrega?: string | null;
  horario_recebimento?: string | null;
  horario_entrega?: string | null;
  horario_agendado?: string | null;
  data_entrega?: string | null;
  data_agendada?: string | null;
  metodo_pagamento?: string | null;
  tipo_cartao?: string | null;
  endereco?: string | null;
  endereco_rua?: string | null;
  endereco_numero?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_complemento?: string | null;
  endereco_referencia?: string | null;
  endereco_cep?: string | null;
  valor_total?: number | string | null;
  itens?: WhatsappItem[] | null;
};

const LOJA_ENDERECO = "Rua Estevão Buschle, 114 - 25 de Julho - São Bento do Sul - CEP 89290075";
const currency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/[\u00a0\u202f]/g, " ");
const weekdays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function formattedTime(raw: string): string {
  const tokens = [...raw.matchAll(/\b([01]?\d|2[0-3])(?::([0-5]\d)|h([0-5]\d)?)\b/gi)];
  const fmt = (match: RegExpMatchArray) => Number(match[1]) + "h" +
    ((match[2] ?? match[3]) && (match[2] ?? match[3]) !== "00" ? (match[2] ?? match[3]) : "");
  if (!tokens.length) return raw.replace(/^[\s,.:•–—-]+|[\s,.:•–—-]+$/g, "").trim();
  if (/ap[oó]s/i.test(raw)) return "após " + fmt(tokens[0]);
  if (/a partir/i.test(raw)) return "a partir das " + fmt(tokens[0]);
  if (tokens.length >= 2) return "das " + fmt(tokens[0]) + " às " + fmt(tokens[1]);
  return "às " + fmt(tokens[0]);
}

/** Data do pedido é sempre DD/MM/AAAA ou ISO, sem parse ambíguo de fuso/idioma. */
function scheduledDelivery(order: OrderWhatsapp): { sentence: string; detail: string } {
  const raw = String(order.horario_recebimento || order.horario_entrega || order.horario_agendado || "").trim();
  const dateRaw = String(order.data_entrega || order.data_agendada || "").trim();
  const combined = [dateRaw, raw].filter(Boolean).join(" ");
  const full = combined.match(/\b(\d{4})-(\d{2})-(\d{2})\b/) ||
    combined.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  const partial = !full ? combined.match(/\b(\d{1,2})\/(\d{1,2})\b/) : null;

  let dayText = "";
  let withWeekday = false;
  if (full) {
    const iso = /^\d{4}-/.test(full[0]);
    const year = Number(iso ? full[1] : full[3]);
    const month = Number(full[2]);
    const day = Number(iso ? full[3] : full[1]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day) {
      dayText = weekdays[date.getUTCDay()] + " - " + String(day).padStart(2, "0") + "/" + String(month).padStart(2, "0");
      withWeekday = true;
    }
  } else if (partial) {
    dayText = String(Number(partial[1])).padStart(2, "0") + "/" + String(Number(partial[2])).padStart(2, "0");
  }

  const timeRaw = raw.replace(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}(?:\/\d{4})?\b/g, " ")
    .replace(/^[\s,.:•–—-]+|[\s,.:•–—-]+$/g, "").trim();
  const clock = "(\\d{1,2})(?::([0-5]\\d)|h([0-5]\\d)?)?\\s*h?";
  const range = new RegExp(clock + "\\s*(?:~|às|até|a|[-–—])\\s*" + clock, "i").exec(timeRaw);
  const time = /retirada na loja|separa[cç][aã]o em at[eé]/i.test(timeRaw)
    ? "separação em até 15 minutos, durante o atendimento"
    : range
      ? "entre " + [range[1], range[2] ?? range[3] ?? "00"].map((x, i) => i ? x : x.padStart(2, "0")).join(":") + "h ~ " +
      [range[4], range[5] ?? range[6] ?? "00"].map((x, i) => i ? x : x.padStart(2, "0")).join(":") + "h"
    : timeRaw ? formattedTime(timeRaw) : "";

  const detail = [dayText, time].filter(Boolean).join(", ") || "Horário a combinar";
  const sentence = dayText
    ? (withWeekday ? "na " : "no dia ") + detail
    : time ? (/^(após|a partir)/i.test(time) ? time : "no horário " + time) : "";
  return { sentence, detail };
}

function orderAddress(order: OrderWhatsapp): string {
  const main = [order.endereco_rua, order.endereco_numero].map(v => String(v ?? "").trim())
    .filter(Boolean).join(", ") || String(order.endereco ?? "").trim();
  return [
    main,
    order.endereco_complemento,
    order.endereco_bairro,
    order.endereco_cidade,
    order.endereco_cep ? "CEP " + String(order.endereco_cep).replace(/\D/g, "") : "",
    order.endereco_referencia ? "Ref.: " + order.endereco_referencia : "",
  ].map(v => String(v ?? "").trim()).filter(Boolean).join(" - ") || "Endereço a confirmar";
}

function paymentLabel(order: OrderWhatsapp): string {
  const method = String(order.metodo_pagamento ?? "").trim();
  const normalized = method.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const labels: Record<string, string> = {
    pix: "PIX",
    cartao: "Cartão",
    alimentacao: "Cartão alimentação/refeição",
    refeicao: "Cartão alimentação/refeição",
    mercadopago: "Mercado Pago",
    dinheiro: "Dinheiro",
    nao_informado: "A combinar",
  };
  const base = labels[normalized] || method || "A combinar";
  const type = String(order.tipo_cartao ?? "").trim();
  return type && normalized !== "nao_informado" ? base + " — " + type : base;
}

function orderItemLine(item: WhatsappItem): string {
  const name = String(item.produtos?.nome || item.product?.nome || item.nome_item || item.nome || "Produto").trim();
  const source = [item.tamanho, item.peso, item.weight, item.observacao].filter(Boolean).join(" ");
  const size = source.match(/(?:Peso:\s*)?\b(150|200|250|300|350|400|450|600)\s*g\b/i)?.[1];
  const suffix = size && !new RegExp("\\b" + size + "\\s*g\\b", "i").test(name) ? " (" + size + "g)" : "";
  const quantity = Math.max(0, Number(item.quantidade) || 0);
  return "• " + quantity + "x " + name + suffix;
}

/** Mensagem oficial de confirmação pronta para colar no WhatsApp, com *negrito* e • itens. */
export function orderWhatsappMessage(order: OrderWhatsapp): string {
  const id = String(order.id ?? "").slice(0, 8).toUpperCase() || "A CONFIRMAR";
  const firstName = String(order.nome_cliente ?? "").trim().split(/\s+/)[0] || "cliente";
  const pickup = String(order.metodo_entrega ?? "").toLowerCase() === "retirada";
  const source = String(order.origem ?? "site").toLowerCase();
  const origin = source === "site" ? " feito em nosso site" : "";
  const schedule = scheduledDelivery(order);
  const items = sortOrderItems(order.itens ?? []).map(orderItemLine);
  const total = order.valor_total === null || order.valor_total === undefined
    ? "A confirmar" : currency(Number(order.valor_total) || 0);

  return [
    "Olá, " + firstName + "! 🙌🏻",
    "",
    "Aqui é da *SaborosaMente Refeições, Marmitas e Sopas Congeladas* 🫶",
    "",
    "Seu pedido: *#" + id + "*" + origin + " está confirmado, e programado para " +
      (pickup ? "retirada" : "ser entregue") +
      (schedule.sentence ? " " + schedule.sentence : "") +
      ", agradecemos a preferência e confiança! 🙏🏻",
    "Temos certeza de que irá gostar e queremos estar presentes na sua alimentação por bastante tempo!! 💚",
    "",
    (pickup ? "*Retirada:* " : "*Entrega:* ") + schedule.detail,
    (pickup ? "*Local de Retirada:* " + LOJA_ENDERECO : "*Local de Entrega:* " + orderAddress(order)),
    "*Forma de Pagamento:* " + paymentLabel(order),
    "",
    "*Itens do pedido:*",
    "",
    ...(items.length ? items : ["Itens a confirmar"]),
    "",
    "*Total:* " + total,
    "",
    "Qualquer dúvida, estamos à disposição! 🥰",
  ].join("\n");
}

/** Mantido para integrações antigas; os botões do painel agora copiam, não abrem links. */
export function orderWhatsappUrl(order: OrderWhatsapp): string | null {
  if (!isOpenOrder(order.status)) return null;
  const phone = phoneForWhatsapp(order.telefone_cliente);
  return phone ? "https://wa.me/" + phone + "?text=" + encodeURIComponent(orderWhatsappMessage(order)) : null;
}
