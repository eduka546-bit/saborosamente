import { compositionForWeight, COMPOSITION_MARGIN } from "@/lib/product-composition";

export function ProductFacts({
  product,
  weight,
  nutrition,
  glutenStatus,
  lactoseStatus,
}: {
  product: any;
  weight: string;
  nutrition: any;
  glutenStatus: string;
  lactoseStatus: string;
}) {
  const rows = compositionForWeight(product.composicao_site, weight);
  const total = rows.reduce((sum, row) => sum + row.gramas, 0);
  const format = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  const heading = "text-lg font-semibold leading-snug text-[#075636]";
  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 rounded-2xl bg-[#f5f3e9] p-4 xl:grid-cols-2 xl:gap-4">
      <section className="min-w-0 xl:col-span-2">
        <h4 className={heading}>Composição</h4>
        <p className="mt-1 text-sm leading-snug text-muted-foreground">{COMPOSITION_MARGIN}</p>
        <div className="mt-3 space-y-3 text-base">
          {rows.length ? (
            rows.map((row, i) => (
              <div key={i}>
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 break-words">{row.nome}</span>
                  <strong className="shrink-0 font-semibold">{format(row.gramas)}g</strong>
                </div>
                <div
                  aria-hidden="true"
                  className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e3e7dc]"
                >
                  <div
                    className="h-full rounded-full bg-[#91b28a]"
                    style={{ width: `${Math.min(100, (row.gramas / total) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Composição deste tamanho não informada.</p>
          )}
        </div>
      </section>
      <section className="min-w-0 border-t border-[#075636]/15 pt-4 text-center xl:border-l-0 xl:border-t xl:px-0 xl:pt-4">
        <h4 className={heading}>Valor Nutricional</h4>
        {weight && <p className="mt-1 text-sm text-muted-foreground">Porção de {weight}</p>}
        {nutrition?.kcal != null ? (
          <div
            className="mt-3 grid w-full grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1.5 text-center text-base font-semibold leading-relaxed text-[#075636] sm:gap-2 sm:text-base"
            aria-label={`${nutrition.kcal} quilocalorias, ${nutrition.prot ?? "não informado"} gramas de proteína, ${nutrition.carb ?? "não informado"} gramas de carboidratos`}
          >
            <span className="whitespace-nowrap">{nutrition.kcal} KCAL</span>
            <span aria-hidden="true" className="text-[#91b28a]">|</span>
            <span className="whitespace-nowrap">{nutrition.prot != null ? `${nutrition.prot}g` : "—"} PROT</span>
            <span aria-hidden="true" className="text-[#91b28a]">|</span>
            <span className="whitespace-nowrap">{nutrition.carb != null ? `${nutrition.carb}g` : "—"} CARB</span>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Consulte a embalagem para detalhes.</p>
        )}
      </section>
      <section className="min-w-0 border-t border-[#075636]/15 pt-4 text-center xl:border-l xl:border-t xl:pl-4 xl:pt-4">
        <h4 className={heading}>Restrições</h4>
        <div className="mt-3 grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-2 text-center text-base leading-snug text-[#375244] sm:text-base">
          <span className="flex min-w-0 flex-wrap items-center justify-center gap-x-1 gap-y-0.5 border-r border-[#91b28a]/60 pr-1.5">
            <strong className="font-semibold">Glúten:</strong> <span>{glutenStatus}</span>
            {glutenStatus === "não contém" && (
              <img src="/selo-sem-gluten.png" alt="Sem glúten" className="size-5 shrink-0" />
            )}
          </span>
          <span className="flex min-w-0 flex-wrap items-center justify-center gap-x-1 gap-y-0.5 pl-0.5">
            <strong className="font-semibold">Lactose:</strong> <span>{lactoseStatus}</span>
            {lactoseStatus === "não contém" && (
              <img src="/selo-sem-lactose.png" alt="Sem lactose" className="size-5 shrink-0" />
            )}
          </span>
        </div>
      </section>
    </div>
  );
}
