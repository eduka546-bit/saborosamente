import { readFile, writeFile } from "node:fs/promises";

const SITE_URL = "https://www.saborosamente.com";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://lxcgbrovdmpjatywweiv.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const SITEMAP_PATH = new URL("../public/sitemap.xml", import.meta.url);

const staticUrls = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/fale-conosco", changefreq: "monthly", priority: "0.6" },
  { loc: "/indicar", changefreq: "monthly", priority: "0.5" },
  { loc: "/privacidade", changefreq: "yearly", priority: "0.3" },
];

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

function renderUrl({ loc, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${escapeXml(SITE_URL + loc)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    "  </url>",
  ].filter(Boolean).join("\n");
}

async function main() {
  try {
    if (!SUPABASE_KEY) {
      throw new Error("VITE_SUPABASE_ANON_KEY não configurada");
    }

    const url = new URL("/rest/v1/rpc/produtos_publicos", SUPABASE_URL);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });

    if (!response.ok) throw new Error(`Supabase respondeu ${response.status}`);

    const products = await response.json();
    const productUrls = products.map((product) => ({
      loc: `/produto/${product.id}`,
      changefreq: "monthly",
      priority: "0.7",
    }));

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...[...staticUrls, ...productUrls].map(renderUrl),
      "</urlset>",
      "",
    ].join("\n");

    await writeFile(SITEMAP_PATH, xml, "utf8");
    console.log(`Sitemap gerado com ${staticUrls.length + productUrls.length} URLs.`);
  } catch (error) {
    await readFile(SITEMAP_PATH, "utf8");
    console.warn("Não foi possível atualizar sitemap; mantendo arquivo existente:", error);
  }
}

await main();
