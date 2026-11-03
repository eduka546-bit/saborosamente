import { toast } from "sonner";
import { orderWhatsappMessage, phoneForWhatsapp } from "@/lib/order-whatsapp";

/** Copia no gesto do clique, com alternativa para navegadores sem Clipboard API. */
export async function copyWhatsappText(text: string): Promise<void> {
  if (!text.trim()) throw new Error("Conteúdo vazio");
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Alguns navegadores mobile exigem o fallback via seleção.
    }
  }
  if (typeof document === "undefined") throw new Error("Área de transferência indisponível");
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    if (!document.execCommand("copy")) throw new Error("Cópia bloqueada");
  } finally {
    document.body.removeChild(textarea);
  }
}

export async function copiarMensagemWhatsappPedido(order: { id?: string; [key: string]: unknown }) {
  try {
    await copyWhatsappText(orderWhatsappMessage(order));
    toast.success("Mensagem WhatsApp copiada! É só colar na conversa do cliente.");
  } catch {
    toast.error("Não foi possível copiar a mensagem. Verifique a permissão da área de transferência.");
  }
}

export async function copiarWhatsappClientePedido(order: { telefone_cliente?: string | null }) {
  const phone = phoneForWhatsapp(order.telefone_cliente);
  if (!phone) {
    toast.error("Este pedido não possui um WhatsApp válido.");
    return;
  }
  try {
    await copyWhatsappText("+" + phone);
    toast.success("WhatsApp do cliente copiado: +" + phone);
  } catch {
    toast.error("Não foi possível copiar o número do cliente.");
  }
}
