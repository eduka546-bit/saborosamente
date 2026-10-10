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
    <div className="grid min-w-0 grid-cols-1 gap-5 rounded-2xl bg-[#f5f3e9] p-4 xl:grid-cols-3 xl:gap-0">
      <section className="min-w-0 xl:pr-4">
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
      <section className="min-w-0 border-t border-[#075636]/15 pt-4 text-center xl:border-l xl:border-t-0 xl:px-4 xl:pt-0">
        <h4 className={heading}>Valor Nutricional</h4>
        {weight && <p className="mt-1 text-sm text-muted-foreground">Porção de {weight}</p>}
        {nutrition?.kcal != null ? (
          <div
            className="mt-3 flex w-full flex-nowrap items-center justify-center gap-1 whitespace-nowrap text-[clamp(11px,2.9vw,15px)] font-semibold text-[#075636] sm:gap-2"
            aria-label={`${nutrition.kcal} quilocalorias, ${nutrition.prot ?? "não informado"} gramas de proteína, ${nutrition.carb ?? "não informado"} gramas de carboidratos`}
          >
            <span>{nutrition.kcal} KCAL</span>
            <span aria-hidden="true" className="text-[#91b28a]">|</span>
            <span>{nutrition.prot != null ? `${nutrition.prot}g` : "—"} PROT</span>
            <span aria-hidden="true" className="text-[#91b28a]">|</span>
            <span>{nutrition.carb != null ? `${nutrition.carb}g` : "—"} CARB</span>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Consulte a embalagem para detalhes.</p>
        )}
      </section>
      <section className="min-w-0 border-t border-[#075636]/15 pt-4 text-center xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
        <h4 className={heading}>Restrições</h4>
        <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-[clamp(10px,2.8vw,14px)] text-[#375244] sm:gap-x-2">
          <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
            <strong className="font-semibold">Glúten:</strong> {glutenStatus}
            {glutenStatus === "não contém" && (
              <img src="/selo-sem-gluten.png" alt="Sem glúten" className="size-4 shrink-0" />
            )}
          </span>
          <span aria-hidden="true" className="text-[#91b28a]">|</span>
          <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
            <strong className="font-semibold">Lactose:</strong> {lactoseStatus}
            {lactoseStatus === "não contém" && (
              <img src="/selo-sem-lactose.png" alt="Sem lactose" className="size-4 shrink-0" />
            )}
          </span>
        </div>
      </section>
    </div>
  );
}
