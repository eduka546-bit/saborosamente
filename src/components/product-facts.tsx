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
      <section className="min-w-0 border-t border-[#075636]/15 pt-4 xl:border-l xl:border-t-0 xl:px-4 xl:pt-0">
        <h4 className={heading}>Valor Nutricional</h4>
        {weight && <p className="mt-1 text-sm text-muted-foreground">Porção de {weight}</p>}
        <dl className="mt-3 text-base">
          {nutrition?.kcal != null ? (
            [
              ["KCAL", nutrition.kcal],
              ["PROT", nutrition.prot == null ? "—" : `${nutrition.prot}g`],
              ["CARB", nutrition.carb == null ? "—" : `${nutrition.carb}g`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-2 border-b border-[#075636]/10 py-1.5 last:border-0"
              >
                <dt>{label}</dt>
                <dd className="font-semibold text-[#075636]">{value}</dd>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Consulte a embalagem para detalhes.</p>
          )}
        </dl>
      </section>
      <section className="min-w-0 border-t border-[#075636]/15 pt-4 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
        <h4 className={heading}>Restrições</h4>
        <dl className="mt-3 space-y-2 text-base">
          <div className="flex flex-wrap justify-between gap-2">
            <dt>Glúten</dt>
            <dd className="flex items-center gap-1.5">
              {glutenStatus}
              {glutenStatus === "não contém" && (
                <img src="/selo-sem-gluten.png" alt="Sem glúten" className="size-5" />
              )}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt>Lactose</dt>
            <dd className="flex items-center gap-1.5">
              {lactoseStatus}
              {lactoseStatus === "não contém" && (
                <img src="/selo-sem-lactose.png" alt="Sem lactose" className="size-5" />
              )}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
