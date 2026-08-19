/**
 * Migration: Adicionar campo rating à tabela produtos
 * Execute com: npx ts-node src/migrations/add_rating_field.ts
 */

import { getSupabaseAdmin } from '../integrations/supabase/client.server';

async function migrate() {
  const supabase = getSupabaseAdmin();

  const sqlStatements = [
    // Adicionar campo rating à tabela produtos se não existir
    `ALTER TABLE produtos 
     ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 1) DEFAULT 5.0;`,

    // Garantir que o rating está entre 3.5 e 5.0
    `ALTER TABLE produtos
     ADD CONSTRAINT check_rating CHECK (rating >= 3.5 AND rating <= 5.0);`,

    // Indexar para performance
    `CREATE INDEX IF NOT EXISTS idx_produtos_rating ON produtos(rating);`
  ];

  try {
    console.log('🚀 Iniciando migration: Adicionar campo rating...');

    for (const sql of sqlStatements) {
      console.log('\n📝 Executando SQL:');
      console.log(sql.trim());
      console.log('---');

      const { error, data } = await supabase.rpc('execute_sql', {
        sql_query: sql
      }).catch(async () => {
        // Fallback: tentar executar via raw query
        const response = await fetch(
          `${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/execute_sql`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SB_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql_query: sql })
          }
        );
        return { error: !response.ok, data: await response.json() };
      });

      if (error) {
        console.error('❌ Erro ao executar:', error);
      } else {
        console.log('✅ Executado com sucesso');
      }
    }

    console.log('\n✨ Migration concluída!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro geral na migration:', error);
    process.exit(1);
  }
}

migrate();
