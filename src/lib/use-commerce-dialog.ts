import { useEffect, useRef } from "react";
import { useModalBackNavigation } from "@/lib/use-modal-back-navigation";

/** Keep keyboard navigation inside custom commerce dialogs; browser Back / Escape
 * are handled by the shared modal stack so only the topmost overlay closes. */
export function useCommerceDialog(open: boolean, onClose: () => void, focusActive = true) {
  useModalBackNavigation(open, onClose);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!open || !focusActive || !root) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const controls = () => Array.from(root.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
    )).filter((element) => element.getClientRects().length > 0);
    controls()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (!root.contains(document.activeElement)) return;
      if (event.key === "Tab") {
        const items = controls();
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (previous?.isConnected) previous.focus();
    };
  }, [open, focusActive]);
  return ref;
}
