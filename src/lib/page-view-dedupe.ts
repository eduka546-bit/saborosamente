/**
 * Protege contra dois efeitos de montagem/hidratação registrarem a mesma
 * visualização imediatamente, sem impedir navegação A -> B -> A ou reload.
 * A instância é local ao módulo e, portanto, a cada documento do navegador.
 */
export function createPageViewDeduper(windowMs = 2000) {
  let lastPath = "";
  let lastAt = Number.NEGATIVE_INFINITY;

  return (pathname: string, now = Date.now()): boolean => {
    if (pathname === lastPath && now >= lastAt && now - lastAt < windowMs) {
      return false;
    }
    lastPath = pathname;
    lastAt = now;
    return true;
  };
}
