const ABANDONED_CART_SESSION_KEY = "saborosamente.session_id";

export function getAbandonedCartSessionId() {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(ABANDONED_CART_SESSION_KEY);
  if (!id) {
    id = `sess_${crypto.randomUUID().replaceAll("-", "")}`;
    window.localStorage.setItem(ABANDONED_CART_SESSION_KEY, id);
  }
  return id;
}
