import { describe, expect, it } from "vitest";
import { createPageViewDeduper } from "./page-view-dedupe";

describe("createPageViewDeduper", () => {
  it("registra a primeira abertura e bloqueia a montagem duplicada", () => {
    const shouldTrack = createPageViewDeduper();
    expect(shouldTrack("/", 1000)).toBe(true);
    expect(shouldTrack("/", 1010)).toBe(false);
    expect(shouldTrack("/", 2999)).toBe(false);
    expect(shouldTrack("/", 3000)).toBe(true);
  });

  it("preserva navegação real entre páginas, inclusive retorno rápido", () => {
    const shouldTrack = createPageViewDeduper();
    expect(shouldTrack("/", 1000)).toBe(true);
    expect(shouldTrack("/produto/1", 1100)).toBe(true);
    expect(shouldTrack("/", 1200)).toBe(true);
  });

  it("não bloqueia sessões diferentes ou reinício do documento", () => {
    const firstTab = createPageViewDeduper();
    const secondTab = createPageViewDeduper();
    expect(firstTab("/", 1000)).toBe(true);
    expect(secondTab("/", 1000)).toBe(true);
  });
});
