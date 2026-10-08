// Composições confirmadas para a apresentação do catálogo. Não altera fichas de cozinha.
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function displayIngredients(product: { nome?: string; ingredientes?: unknown }): string[] {
  const code = product.nome?.match(/^(TD|SO|CO)\d{2}/i)?.[0].toUpperCase();
  const ingredients = Array.isArray(product.ingredientes)
    ? product.ingredientes.map(String)
    : String(product.ingredientes || "").split(/[,;]+/);
  const result: string[] = [];
  const seen = new Set<string>();
  const add = (text: string) => {
    const key = normalize(text).replace(/^mucarela$/, "mussarela").replace(/^tilapia em tiras$/, "tilapia");
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(text);
  };

  if (code === "TD04") {
    return ["Aipim", "Carne de patinho", "Água", "Tomate", "Cebola", "Sal marinho", "Salsinha", "Alho", "Óleo de girassol"];
  }

  for (const raw of ingredients) {
    let text = raw.replace(/\([^)]*(?:industr|marca)[^)]*\)/gi, "").replace(/\bindustr\w*/gi, "").replace(/\bmarca\s+[\p{L}\d._-]+/giu, "").trim();
    const key = normalize(text);
    if (!key || key === "pimenta" || key.startsWith("pimenta ")) continue;
    if (key.startsWith("caldo de ")) continue;
    if (/^demi ?glace|^molho madeira/.test(key)) {
      add("Molho madeira");
      continue;
    }
    if (key.startsWith("molho de tomate") || key.startsWith("extrato de tomate")) {
      add("Tomate");
      continue;
    }
    if (key.startsWith("molho 4 queijos")) continue;
    if (key === "margarina" || key.startsWith("manteiga")) text = "Manteiga";
    else if (/^oleo(?: de)? /.test(key)) text = "Óleo de girassol";
    else if (/^sal(?: marinho| mineral| refinado)?$/.test(key)) text = "Sal marinho";
    else if (key === "nhoque" || key === "nhoque de batata") text = "Nhoque de batata";
    else if (key === "massa lasanha" || key === "massa de lasanha") continue;
    else if (code === "SO12" && key.startsWith("tilapia")) text = "Tilápia";
    else if ((code === "TD19" || code === "TD20") && (key === "agua" || key === "agua mineral")) text = "Água mineral";
    if (/^carne bovina|^carne de boi|^carne de patinho|^carne bovina em cubos pequenos/.test(normalize(text))) text = "Carne de patinho";
    else if (/^carne moida(?: de patinho)?$/.test(normalize(text))) text = "Carne moída de patinho";
    else if (/^carne desfiada(?: de patinho)?$/.test(normalize(text))) text = "Carne de patinho desfiada";
    add(text);
  }
  if (["TD01", "TD28", "CO06"].includes(code || "")) add("Molho madeira");
  if (code === "TD27") ["Mussarela", "Queijo prato", "Catupiry", "Requeijão"].forEach(add);
  if (code === "TD19" || code === "TD20") ["Farinha de trigo", "Água mineral", "Ovo", "Leite"].forEach(add);
  if (code === "SO12") ["Tilápia", "Água", "Sal marinho", "Cebola", "Tomate", "Batata", "Óleo de girassol", "Salsinha"].forEach(add);
  if (code) add("Óleo de girassol");
  return result;
}

export function withDisplayIngredients<T extends { nome?: string; ingredientes?: unknown }>(product: T) {
  return { ...product, nome: product.nome?.replace(/alcatra/gi, "Patinho").replace(/carne bovina/gi, "Carne de patinho").replace(/carne moída(?! de patinho)/gi, "Carne moída de patinho"), ingredientes: displayIngredients(product) };
}
