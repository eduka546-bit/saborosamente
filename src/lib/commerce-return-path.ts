/** Preserve the customer's destination without allowing an external redirect. */
export function commerceReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  try {
    const url = new URL(value, "https://saborosamente.com");
    if (url.origin !== "https://saborosamente.com") return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}
