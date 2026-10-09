import type { CompositionRow } from "@/lib/product-composition";
import { COMPOSITION_MARGIN, compositionForWeight } from "@/lib/product-composition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function ProductCompositionEditor({
  value,
  onChange,
  type,
}: {
  value: CompositionRow[];
  onChange: (rows: CompositionRow[]) => void;
  type: string;
}) {
  const sizes = type === "sopa" ? [400] : type === "complemento" ? [150] : [200, 300, 400];
  const update = (i: number, field: string, v: string) =>
    onChange(value.map((row, j) => (j === i ? { ...row, [field]: v } : row)));
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Composição exibida no site, preenchida a partir da montagem atual. Edite os nomes e gramas
        por tamanho; isso não altera receitas, custos ou montagem da cozinha. O peso de um preparo
        com molho inclui o molho.
      </p>
      <p className="text-sm text-gray-600">No site: {COMPOSITION_MARGIN}.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[430px] text-sm">
          <thead>
            <tr>
              <th className="pb-2 text-left">Preparo</th>
              {sizes.map((s) => (
                <th key={s} className="pb-2">
                  {s}g
                </th>
              ))}
              <th>
                <span className="sr-only">Remover</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {value.map((row, i) => (
              <tr key={i}>
                <td className="py-1 pr-2">
                  <Input
                    aria-label={`Nome do preparo ${i + 1}`}
                    value={row.nome}
                    onChange={(e) => update(i, "nome", e.target.value)}
                  />
                </td>
                {sizes.map((s) => (
                  <td key={s} className="px-1 py-1">
                    <Input
                      className="min-w-20"
                      type="number"
                      min="0"
                      step="0.1"
                      aria-label={`Gramas de ${row.nome || `preparo ${i + 1}`} em ${s}g`}
                      value={row[`gramas_${s}` as keyof CompositionRow] ?? ""}
                      onChange={(e) => update(i, `gramas_${s}`, e.target.value)}
                    />
                  </td>
                ))}
                <td>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Remover preparo ${i + 1}`}
                    onClick={() => onChange(value.filter((_, j) => j !== i))}
                  >
                    ×
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" onClick={() => onChange([...value, { nome: "" }])}>
        Adicionar preparo
      </Button>
      <div className="flex flex-wrap gap-3 text-sm">
        {sizes.map((s) => {
          const total = compositionForWeight(value, `${s}g`).reduce(
            (sum, row) => sum + row.gramas,
            0,
          );
          return (
            <span
              key={s}
              className={
                total && Math.abs(total - s) > s * 0.1 ? "text-amber-700" : "text-[#075636]"
              }
            >
              Total {s}g: {total.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}g
              {total && Math.abs(total - s) > s * 0.1 ? " — confira a montagem" : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}
