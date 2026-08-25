/**
 * Script de upload de imagens dos produtos para o Supabase Storage
 *
 * Como usar:
 *   bun run upload_imagens.ts
 *
 * O script:
 * 1. Varre as pastas em ./Imagens/
 * 2. Extrai o código do produto (TD01, SO01, etc.) do nome da pasta
 * 3. Faz upload de todas as imagens para o bucket product-images
 * 4. Atualiza imagem_url (primeira imagem) e imagens (galeria) no banco
 */

import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "fs/promises";
import { join, extname, basename } from "path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "https://lxcgbrovdmpjatywweiv.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY não definida no .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const IMAGENS_DIR = "./Imagens";
const BUCKET = "product-images";
const IMG_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

async function main() {
  console.log("🚀 Iniciando upload de imagens...\n");

  // Lista todas as pastas
  const pastas = (await readdir(IMAGENS_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  console.log(`📁 ${pastas.length} pastas encontradas\n`);

  let sucessos = 0;
  let erros = 0;

  for (const pasta of pastas) {
    // Extrai o código: "TD01 - Tiras de Alcatra" → "TD01"
    const codigoMatch = pasta.match(/^([A-Z]{2}\d{2,})/i);
    if (!codigoMatch) {
      console.log(`⚠️  Ignorando "${pasta}" — sem código reconhecível`);
      continue;
    }
    const codigo = codigoMatch[1].toUpperCase();

    // Busca produto pelo nome que começa com o código
    const { data: produtos, error: buscarErr } = await supabase
      .from("produtos")
      .select("id, nome, imagem_url")
      .ilike("nome", `${codigo}%`)
      .limit(1);

    if (buscarErr || !produtos?.length) {
      console.log(`❌ Produto "${codigo}" não encontrado no banco`);
      erros++;
      continue;
    }

    const produto = produtos[0];

    // Lista imagens da pasta
    const arquivos = (await readdir(join(IMAGENS_DIR, pasta)))
      .filter((f) => IMG_EXTS.has(extname(f).toLowerCase()))
      .sort(); // ordena para consistência

    if (!arquivos.length) {
      console.log(`⚠️  "${pasta}" não tem imagens`);
      continue;
    }

    console.log(`📦 ${codigo} — ${produto.nome} — ${arquivos.length} imagem(ns)`);

    const urlsUploadadas: string[] = [];

    for (const arquivo of arquivos) {
      const caminhoLocal = join(IMAGENS_DIR, pasta, arquivo);
      const ext = extname(arquivo);
      const nomeStorage = `${codigo}_${basename(arquivo, ext).replace(/\s+/g, "_")}${ext}`;

      try {
        const conteudo = await readFile(caminhoLocal);

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(nomeStorage, conteudo, {
            contentType: ext === ".png" ? "image/png" : "image/jpeg",
            upsert: true, // sobrescreve se já existir
          });

        if (uploadErr) {
          console.log(`  ⚠️  Erro upload ${arquivo}: ${uploadErr.message}`);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(nomeStorage);

        urlsUploadadas.push(publicUrl);
        console.log(`  ✅ ${arquivo} → ${publicUrl}`);
      } catch (e: any) {
        console.log(`  ❌ Erro ao ler ${arquivo}: ${e.message}`);
      }
    }

    if (!urlsUploadadas.length) {
      erros++;
      continue;
    }

    // Atualiza produto no banco
    // Primeira imagem = imagem_url principal
    // Todas = campo imagens (galeria)
    const { error: updateErr } = await supabase
      .from("produtos")
      .update({
        imagem_url: urlsUploadadas[0],
        imagens: urlsUploadadas.map((url) => ({ url })),
      })
      .eq("id", produto.id);

    if (updateErr) {
      console.log(`  ❌ Erro ao atualizar banco: ${updateErr.message}`);
      erros++;
    } else {
      console.log(
        `  💾 Banco atualizado — imagem principal + ${urlsUploadadas.length - 1} na galeria\n`,
      );
      sucessos++;
    }
  }

  console.log("\n" + "─".repeat(50));
  console.log(`✅ Concluído! ${sucessos} produtos atualizados, ${erros} erros`);
}

main().catch(console.error);
