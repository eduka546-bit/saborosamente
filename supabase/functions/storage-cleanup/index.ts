// Storage Cleanup: Remove arquivos órfãos não referenciados
// Execute manualmente ou via cron para manter o storage limpo

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface FileStats {
  name: string;
  id: string;
  updated_at: string;
  metadata: any;
}

serve(async (req) => {
  // Apenas POST permitido
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    console.log("🧹 Iniciando limpeza de storage...");

    // 1. Listar todos os arquivos no bucket
    const { data: files, error: listError } = await supabase.storage
      .from("product-images")
      .list("", { limit: 1000 });

    if (listError) throw new Error(`Erro ao listar arquivos: ${listError.message}`);

    console.log(`📁 Total de arquivos no storage: ${files?.length || 0}`);

    // 2. Buscar todas as URLs de imagens referenciadas no banco
    const { data: produtos, error: prodError } = await supabase
      .from("produtos")
      .select("id, imagem_url, imagens");

    if (prodError) throw new Error(`Erro ao buscar produtos: ${prodError.message}`);

    const { data: config, error: configError } = await supabase
      .from("site_config")
      .select("hero_image_url, profile_image_url, banner_image, popup_imagem");

    if (configError) throw new Error(`Erro ao buscar config: ${configError.message}`);

    // 3. Compilar lista de arquivos usados
    const usedFiles = new Set<string>();

    // Adicionar imagens de produtos
    produtos?.forEach((p: any) => {
      if (p.imagem_url) {
        const fileName = p.imagem_url.split("/").pop();
        if (fileName) usedFiles.add(fileName);
      }

      // Imagens da galeria
      if (p.imagens && Array.isArray(p.imagens)) {
        p.imagens.forEach((img: any) => {
          if (img.url) {
            const fileName = img.url.split("/").pop();
            if (fileName) usedFiles.add(fileName);
          }
        });
      }
    });

    // Adicionar imagens de configuração
    if (config) {
      const configUrls = [
        config.hero_image_url,
        config.profile_image_url,
        config.banner_image,
        config.popup_imagem,
      ];

      configUrls.forEach((url: any) => {
        if (url) {
          const fileName = url.split("/").pop();
          if (fileName) usedFiles.add(fileName);
        }
      });
    }

    console.log(`✅ Arquivos referenciados: ${usedFiles.size}`);

    // 4. Encontrar arquivos órfãos
    const orphanedFiles: string[] = [];
    const fileSize: { [key: string]: number } = {};

    files?.forEach((f: any) => {
      if (!usedFiles.has(f.name) && !f.name.startsWith("gallery/")) {
        orphanedFiles.push(f.name);
        fileSize[f.name] = f.metadata?.size || 0;
      }
    });

    console.log(`🗑️ Arquivos órfãos encontrados: ${orphanedFiles.length}`);

    // 5. Calcular espaço que será liberado
    const totalSize = orphanedFiles.reduce((sum, name) => sum + (fileSize[name] || 0), 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    console.log(`💾 Espaço a liberar: ${totalSizeMB} MB`);

    // 6. Deletar arquivos órfãos (em lotes de 10 para não sobrecarregar)
    let deleted = 0;
    const BATCH_SIZE = 10;

    for (let i = 0; i < orphanedFiles.length; i += BATCH_SIZE) {
      const batch = orphanedFiles.slice(i, i + BATCH_SIZE);

      const { error: delError } = await supabase.storage.from("product-images").remove(batch);

      if (delError) {
        console.warn(`Erro ao deletar lote: ${delError.message}`);
      } else {
        deleted += batch.length;
        console.log(`✅ Deletados ${deleted}/${orphanedFiles.length} arquivos`);
      }

      // Pequeno delay entre lotes
      await new Promise((r) => setTimeout(r, 500));
    }

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Limpeza concluída",
        stats: {
          total_files: files?.length || 0,
          referenced_files: usedFiles.size,
          orphaned_files: orphanedFiles.length,
          deleted_files: deleted,
          space_freed_mb: totalSizeMB,
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("❌ Erro na limpeza:", error.message);
    return new Response(
      JSON.stringify({
        status: "error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
