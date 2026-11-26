import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { copyWhatsappText } from "@/lib/order-whatsapp-actions";
import { phoneForWhatsapp } from "@/lib/order-whatsapp";
import { toast } from "sonner";
import { useCommerceDialog } from "@/lib/use-commerce-dialog";
import type { CatalogOrderItem } from "@/lib/whatsapp-catalog";
import { WhatsappAdminOrderForm, type OrderConversation } from "@/routes/admin/pedidos/whatsapp";
import { WhatsAppCatalog } from "./WhatsAppCatalog";

export function WhatsAppOrderDialog({ conversation, catalogItem, catalogItems, onClose, onSaved, mode, canShare, onShare, onOrder }: {
  conversation: OrderConversation; catalogItem?: CatalogOrderItem; catalogItems?: CatalogOrderItem[]; onClose: () => void; onSaved: () => void;
  mode: "catalog" | "order"; canShare: boolean; onShare: (text: string, photo?: File) => boolean; onOrder: (item: CatalogOrderItem) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<{ text: string; phone: string } | null>(null);
  const samePhone = Boolean(confirmation?.phone && confirmation.phone === phoneForWhatsapp(conversation.telefone));
  const finish = () => onSaved();
  const close = () => { if (!saving) { if (confirmation) finish(); else onClose(); } };
  const lateral = mode === "order";
  const workspace = document.querySelector<HTMLElement>("[data-whatsapp-workspace]");
  const ref = useCommerceDialog(true, close, !lateral);
  return createPortal(<div className={lateral ? "fixed inset-0 z-[200] flex md:absolute md:inset-y-0 md:left-0 md:right-auto md:w-[380px]" : "fixed inset-0 z-[200] flex items-center justify-center bg-black/65 p-0 sm:p-4"}>
    <div ref={ref} role="dialog" aria-modal={!lateral} aria-label={mode === "catalog" ? "Catálogo SaborosaMente" : "Lançar pedido da conversa"} className={`relative flex w-full flex-col overflow-hidden bg-white text-gray-900 sm:rounded-xl shadow-xl ${mode === "catalog" ? "max-w-3xl max-h-[94dvh]" : "h-full min-w-0 md:rounded-none border-r border-gray-200"}`}>
      <div className="flex shrink-0 items-center justify-between gap-3 bg-[#064d2f] px-4 py-3 text-white"><div className="min-w-0"><p className="font-bold truncate">{mode === "catalog" ? "Catálogo SaborosaMente" : `Pedido pelo WhatsApp · ${conversation.nome || conversation.telefone}`}</p><p className="text-xs text-white/80">{mode === "catalog" ? "Cardápio e estoque integrados ao site" : "O rascunho fica nesta conversa. Confira os dados antes de salvar."}</p></div><button disabled={saving} onClick={close} aria-label="Fechar" className="rounded p-2 hover:bg-white/15 disabled:opacity-50"><X size={20}/></button></div>
      <div className="overflow-y-auto flex-1 min-h-0">{confirmation ? <div className="p-4 space-y-3"><h2 className="font-bold text-green-800">Pedido salvo! Confira a confirmação</h2><p className="text-xs text-gray-600">Edite o texto antes de colocar na conversa. Nada será enviado automaticamente.</p><textarea aria-label="Confirmação do pedido" className="w-full min-h-[360px] rounded-lg border p-3 text-sm" value={confirmation.text} onChange={e=>setConfirmation({...confirmation,text:e.target.value})}/>{!samePhone && <p className="text-xs text-amber-700">O telefone do pedido difere do contato desta conversa. Confira o destinatário antes de enviar.</p>}<button type="button" disabled={!canShare || !samePhone || !confirmation.text.trim()} className="w-full rounded-lg bg-[#064d2f] text-white p-2 font-semibold disabled:opacity-40" onClick={()=>{if(onShare(confirmation.text)) finish();}}>Colocar mensagem na conversa</button><button type="button" className="w-full rounded-lg border p-2" onClick={async()=>{try{await copyWhatsappText(confirmation.text);toast.success("Confirmação copiada.");}catch{toast.error("Não foi possível copiar.");}}}>Copiar confirmação</button><button type="button" className="w-full text-sm text-gray-600 p-2" onClick={finish}>Concluir sem enviar</button></div> : mode === "catalog" ? <WhatsAppCatalog canShare={canShare} onShare={onShare} onClose={onClose} onOrder={onOrder}/> : <WhatsappAdminOrderForm conversation={conversation} catalogItem={catalogItem} catalogItems={catalogItems} onSaved={value => { if (value) setConfirmation(value); else finish(); }} onSavingChange={setSaving}/>}</div>
    </div>
  </div>, lateral && workspace ? workspace : document.body);
}
