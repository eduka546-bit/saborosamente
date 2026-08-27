import fs from "node:fs";
import * as XLSX from "./node_modules/xlsx/xlsx.mjs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const URL = env.VITE_SUPABASE_URL;
const K = env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes("--apply");

// ── 1) Lê planilha ──
const wb = XLSX.readFile("listagem.xlsx.xlsx");
const rows = XLSX.utils.sheet_to_json(wb.Sheets["Cardápio"], { header: 1, defval: "" });

const norm = (v) => String(v ?? "").trim();
const simN = (v) => norm(v).toUpperCase() === "N"; // N = "não é sem X" (contém). S = sem.
const items = [];
for (let i = 2; i < rows.length; i++) {
  const r = rows[i];
  const cod = norm(r[1]).toUpperCase();
  if (!/^(TD|SO)\d+/.test(cod)) continue;
  const kcal = norm(r[10]);
  const carb = norm(r[11]);
  const prot = norm(r[12]);
  const ingredientes = norm(r[13]);
  const descResumida = norm(r[15]) || norm(r[14]);
  const semGluten = norm(r[8]); // S = sem glúten, N = contém
  const semLactose = norm(r[9]);
  const codigoBarras = norm(r[17]);
  const gluten = semGluten.toUpperCase() === "S" ? "Sem Glúten" : "Contém Glúten";
  const lactose = semLactose.toUpperCase() === "S" ? "Sem Lactose" : "Contém Lactose";
  const restricoes = `${gluten} | ${lactose}`;
  const infoNutri =
    kcal && carb && prot ? `${kcal} KCAL | ${prot}g PROT | ${carb}g CARB (a cada 100g)` : "";
  items.push({
    cod,
    sabor: norm(r[3]),
    kcal,
    carb,
    prot,
    ingredientes,
    descricao: descResumida,
    restricoes,
    infoNutri,
    codigoBarras,
  });
}

// ── 2) Busca produtos do banco ──
const res = await fetch(`${URL}/rest/v1/produtos?select=id,nome&limit=500`, {
  headers: { apikey: K, Authorization: "Bearer " + K },
});
const produtos = await res.json();

// Extrai o código TD/SO do início do nome do produto
function codeOf(nome) {
  const m = norm(nome)
    .toUpperCase()
    .match(/^(TD|SO)\s*0*(\d+)/);
  if (!m) return null;
  return m[1] + String(m[2]).padStart(2, "0");
}

const byCode = new Map();
for (const p of produtos) {
  const c = codeOf(p.nome);
  if (c) byCode.set(c, p);
}

// ── 3) Casa ──
const matched = [];
const naoCasadosPlanilha = [];
for (const it of items) {
  const p = byCode.get(it.cod);
  if (p) matched.push({ it, p });
  else naoCasadosPlanilha.push(it.cod + " - " + it.sabor);
}
const codsPlanilha = new Set(items.map((i) => i.cod));
const produtosSemMatch = produtos
  .filter((p) => {
    const c = codeOf(p.nome);
    return c && !codsPlanilha.has(c);
  })
  .map((p) => p.nome);

let log = `PLANILHA: ${items.length} itens | BANCO: ${produtos.length} produtos\n`;
log += `CASADOS: ${matched.length}\n`;
log += `\nNão casados (planilha sem produto no banco): ${naoCasadosPlanilha.length}\n${naoCasadosPlanilha.join("\n")}\n`;
log += `\nProdutos com código sem linha na planilha: ${produtosSemMatch.length}\n${produtosSemMatch.slice(0, 30).join("\n")}\n`;

// ── 4) Aplica (se --apply) ──
if (APPLY) {
  let ok = 0,
    err = 0;
  for (const { it, p } of matched) {
    const nutri = { kcal: it.kcal, carb: it.carb, prot: it.prot };
    const body = {
      descricao: it.ingredientes || it.descricao || null,
      ingredientes: it.ingredientes || null,
      tabela_nutricional: nutri,
      tabela_nutricional_300g: nutri,
      tabela_nutricional_400g: nutri,
      informacao_nutricional: it.infoNutri || null,
      restricoes: it.restricoes,
      codigo_integracao: it.codigoBarras || null,
    };
    const r = await fetch(`${URL}/rest/v1/produtos?id=eq.${p.id}`, {
      method: "PATCH",
      headers: {
        apikey: K,
        Authorization: "Bearer " + K,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    });
    if (r.ok) ok++;
    else {
      err++;
      log += `\nERRO ${it.cod}: ${r.status} ${(await r.text()).slice(0, 150)}`;
    }
  }
  log += `\n\nAPLICADO: ${ok} atualizados, ${err} erros`;
} else {
  log += `\n(DRY-RUN — nada foi gravado. Rode com --apply para aplicar.)`;
}

fs.writeFileSync("_import_result.txt", log);
