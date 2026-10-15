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

type OrderWhatsapp = {
  id?: string;
  nome_cliente?: string | null;
  telefone_cliente?: string | null;
  status?: string;
  metodo_entrega?: string | null;
  horario_recebimento?: string | null;
  valor_total?: number | null;
  itens?: Array<{
    quantidade?: number;
    preco_unitario?: number;
    nome_item?: string | null;
    nome?: string | null;
    produtos?: { nome?: string | null } | null;
    observacao?: string | null;
  }>;
};

export function orderWhatsappMessage(order: OrderWhatsapp): string {
  const id = String(order.id ?? "").slice(0, 8).toUpperCase();
  const name = String(order.nome_cliente ?? "").trim().split(/\s+/)[0] || "cliente";
  const delivery = order.metodo_entrega === "retirada" ? "Retirada na loja" : "Entrega";
  const products = sortOrderItems(order.itens ?? []).map((item) => {
    const product = item.produtos?.nome || item.nome_item || item.nome || "Produto";
    const weight = String(item.observacao ?? "").match(/(?:Peso:\s*)?(200|300|400|250|350|450|600)\s*g\b/i);
    return "• " + (Number(item.quantidade) || 0) + "x " + product + (weight ? " (" + weight[1] + "g)" : "");
  });
  return [
    "Olá, " + name + "! 😊",
    "Aqui é a equipe da SaborosaMente. 💚",
    "",
    "Estamos entrando em contato sobre o seu pedido #" + id + ".",
    "Situação: " + (order.status || "em andamento") + ".",
    delivery + (order.horario_recebimento ? " • " + order.horario_recebimento : ""),
    ...(products.length ? ["", "Itens do pedido:", ...products] : []),
    ...(Number.isFinite(Number(order.valor_total)) ? ["", "Total: " + Number(order.valor_total).toLocaleString("pt-BR", {style:"currency",currency:"BRL"})] : []),
    "",
    "Qualquer dúvida, estamos à disposição!",
  ].join("\n");
}

export function orderWhatsappUrl(order: OrderWhatsapp): string | null {
  if (!isOpenOrder(order.status)) return null;
  const phone = phoneForWhatsapp(order.telefone_cliente);
  return phone ? "https://wa.me/" + phone + "?text=" + encodeURIComponent(orderWhatsappMessage(order)) : null;
}
