import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useCommerceDialog } from "@/lib/use-commerce-dialog";
import type { CatalogOrderItem } from "@/lib/whatsapp-catalog";
import { WhatsappAdminOrderForm, type OrderConversation } from "@/routes/admin/pedidos/whatsapp";
import { WhatsAppCatalog } from "./WhatsAppCatalog";

export function WhatsAppOrderDialog({ conversation, catalogItem, catalogItems, onClose, onSaved, mode, canShare, onShare, onOrder }: {
  conversation: OrderConversation; catalogItem?: CatalogOrderItem; catalogItems?: CatalogOrderItem[]; onClose: () => void; onSaved: () => void;
  mode: "catalog" | "order"; canShare: boolean; onShare: (text: string, photo?: File) => boolean; onOrder: (item: CatalogOrderItem) => void;
}) {
  const [saving, setSaving] = useState(false);
  const close = () => { if (!saving) onClose(); };
  const lateral = mode === "order";
  const workspace = document.querySelector<HTMLElement>("[data-whatsapp-workspace]");
  const ref = useCommerceDialog(true, close, !lateral);
  return createPortal(<div className={lateral ? "fixed inset-0 z-[200] flex md:absolute md:inset-y-0 md:left-0 md:right-auto md:w-[380px]" : "fixed inset-0 z-[200] flex items-center justify-center bg-black/65 p-0 sm:p-4"}>
    <div ref={ref} role="dialog" aria-modal={!lateral} aria-label={mode === "catalog" ? "Catálogo SaborosaMente" : "Lançar pedido da conversa"} className={`relative flex w-full flex-col overflow-hidden bg-white text-gray-900 sm:rounded-xl shadow-xl ${mode === "catalog" ? "max-w-3xl max-h-[94dvh]" : "h-full min-w-0 md:rounded-none border-r border-gray-200"}`}>
      <div className="flex shrink-0 items-center justify-between gap-3 bg-[#064d2f] px-4 py-3 text-white"><div className="min-w-0"><p className="font-bold truncate">{mode === "catalog" ? "Catálogo SaborosaMente" : `Pedido pelo WhatsApp · ${conversation.nome || conversation.telefone}`}</p><p className="text-xs text-white/80">{mode === "catalog" ? "Cardápio e estoque integrados ao site" : "O rascunho fica nesta conversa. Confira os dados antes de salvar."}</p></div><button disabled={saving} onClick={close} aria-label="Fechar" className="rounded p-2 hover:bg-white/15 disabled:opacity-50"><X size={20}/></button></div>
      <div className="overflow-y-auto flex-1 min-h-0">{mode === "catalog" ? <WhatsAppCatalog canShare={canShare} onShare={onShare} onClose={onClose} onOrder={onOrder}/> : <WhatsappAdminOrderForm conversation={conversation} catalogItem={catalogItem} catalogItems={catalogItems} onSaved={onSaved} onSavingChange={setSaving}/>}</div>
    </div>
  </div>, lateral && workspace ? workspace : document.body);
}
