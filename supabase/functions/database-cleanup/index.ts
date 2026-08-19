// Database Cleanup: Remove dados órfãos do banco de dados
// Pode ser executada manualmente ou via cron

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Apenas POST permitido
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    console.log("🧹 Iniciando limpeza do banco de dados...");

    // Executar a função master de limpeza
    const { data, error } = await supabase.rpc("cleanup_all_orphaned_data");

    if (error) {
      throw new Error(`Erro ao executar limpeza: ${error.message}`);
    }

    console.log("✅ Limpeza concluída:");

    // Calcular total
    let totalRecords = 0;
    const stats = data as any[];
    
    stats.forEach((row: any) => {
      console.log(`  • ${row.task}: ${row.records_deleted} registros`);
      totalRecords += row.records_deleted || 0;
    });

    // Calcular economia aproximada (assumindo ~1KB por registro)
    const estimatedSpaceMB = (totalRecords / 1024).toFixed(2);

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Limpeza concluída",
        stats: stats,
        summary: {
          total_records_deleted: totalRecords,
          estimated_space_freed_mb: estimatedSpaceMB,
          timestamp: new Date().toISOString(),
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
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
      }
    );
  }
});
