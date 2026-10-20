import { useEffect, useRef } from "react";

/**
 * Each open modal gets a same-URL history entry. Hardware Back / iOS swipe
 * consumes that entry and closes the topmost modal, not the underlying page.
 * Escape follows the same topmost-only rule.
 */
const MODAL_KEY = "__saborosamente_open_modal";
type Entry = { id: string; close: () => void; popped: boolean; url: string };
const active: Entry[] = [];
let nextId = 0;
let ignoredPopstates = 0;
let listenersInstalled = false;

function onPopState() {
  // Manual dismissals already closed their modal before restoring history.
  if (ignoredPopstates > 0) {
    ignoredPopstates -= 1;
    return;
  }
  const top = active.at(-1);
  if (!top) return;
  top.popped = true;
  top.close();
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape" || event.defaultPrevented) return;
  const top = active.at(-1);
  if (!top) return;
  event.preventDefault();
  event.stopPropagation();
  top.close();
}

function installListeners() {
  if (listenersInstalled || typeof window === "undefined") return;
  window.addEventListener("popstate", onPopState);
  window.addEventListener("keydown", onKeyDown, true);
  listenersInstalled = true;
}

export function useModalBackNavigation(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    installListeners();

    const id = `sm-modal-${++nextId}`;
    const url = window.location.href;
    const entry: Entry = { id, close: () => closeRef.current(), popped: false, url };
    active.push(entry);

    const prior = window.history.state;
    window.history.pushState(
      { ...(prior && typeof prior === "object" ? prior : {}), [MODAL_KEY]: id },
      "",
      url,
    );

    return () => {
      const index = active.indexOf(entry);
      if (index !== -1) active.splice(index, 1);
      // If dismissed using X / overlay, consume the modal's own history entry.
      // On a route change we must NOT navigate backwards again.
      if (!entry.popped && window.location.href === url &&
          window.history.state?.[MODAL_KEY] === id) {
        ignoredPopstates += 1;
        window.history.back();
      }
    };
  }, [open]);
}
