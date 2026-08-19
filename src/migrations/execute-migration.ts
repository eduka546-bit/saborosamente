#!/usr/bin/env -S node --loader tsx
/**
 * Script de Migration: Adicionar campo rating à tabela produtos
 * 
 * Execute com um dos seguintes comandos:
 * - bun src/migrations/execute-migration.ts
 * - npx tsx src/migrations/execute-migration.ts
 * - node --loader tsx src/migrations/execute-migration.ts
 * 
 * Certifique-se de ter as variáveis de ambiente configuradas:
 * - VITE_SUPABASE_URL
 * - SB_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SB_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente ausentes');
  console.error('   - VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   - SB_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const migrations = [
  {
    name: 'Adicionar coluna rating',
    sql: `ALTER TABLE produtos 
          ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 1) DEFAULT 5.0;`
  },
  {
    name: 'Adicionar constraint check_rating',
    sql: `ALTER TABLE produtos
          ADD CONSTRAINT IF NOT EXISTS check_rating CHECK (rating >= 3.5 AND rating <= 5.0);`
  },
  {
    name: 'Criar índice idx_produtos_rating',
    sql: `CREATE INDEX IF NOT EXISTS idx_produtos_rating ON produtos(rating);`
  }
];

async function executeMigration() {
  console.log('🚀 Iniciando migrations...\n');

  try {
    for (const migration of migrations) {
      console.log(`📝 ${migration.name}`);
      
      // Usar postgres RPC ou query direta
      const { error, data } = await supabase.rpc('exec', {
        sql: migration.sql
      }).catch(async () => {
        // Se RPC não funcionar, tentar via REST API
        console.log('   Tentando via REST API...');
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
          },
          body: JSON.stringify({ query: migration.sql })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return { error: errorData, data: null };
        }
        
        return { error: null, data: await response.json() };
      });

      if (error) {
        console.log(`   ⚠️  Aviso: ${JSON.stringify(error)}`);
        console.log(`   💡 Nota: Constraint ou índice pode já existir`);
      } else {
        console.log(`   ✅ Sucesso`);
      }
    }

    console.log('\n✨ Migrations concluídas!');
    
    // Tentar verificar o resultado
    console.log('\n📊 Verificando estrutura da tabela...');
    const { data: columns, error: colError } = await supabase
      .from('productos')
      .select('*')
      .limit(0);

    if (!colError) {
      console.log('✅ Tabela productos está acessível');
    } else {
      console.log('⚠️  Não foi possível verificar (pode estar com RLS habilitado)');
    }

  } catch (error) {
    console.error('❌ Erro durante a migration:', error);
    process.exit(1);
  }
}

executeMigration();
