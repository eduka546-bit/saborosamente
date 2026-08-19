/**
 * Script para verificar se a migration foi executada com sucesso
 * 
 * Execute com:
 * - bun src/migrations/verify-migration.ts
 * - npx tsx src/migrations/verify-migration.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SB_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente ausentes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyMigration() {
  console.log('🔍 Verificando migration do campo rating...\n');

  try {
    // 1. Verificar se a coluna foi criada
    console.log('1️⃣  Verificando coluna rating...');
    const { data: columns, error: colError } = await supabase.rpc('get_table_columns', {
      table_name: 'produtos'
    }).catch(async () => {
      console.log('   ⚠️  RPC não disponível, usando query direta...');
      
      // Fallback: tentar pegar um registro para ver a estrutura
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .limit(1);
      
      if (error) {
        return { data: null, error };
      }
      
      if (data && data.length > 0) {
        const obj = data[0];
        return { 
          data: Object.keys(obj).map(key => ({
            column_name: key,
            data_type: typeof obj[key]
          })),
          error: null
        };
      }
      
      return { data: null, error: 'No rows found' };
    });

    if (!colError && columns) {
      const ratingColumn = columns.find((col: any) => col.column_name === 'rating');
      if (ratingColumn) {
        console.log('   ✅ Coluna "rating" existe!');
        console.log(`      Tipo: ${ratingColumn.data_type}`);
      } else {
        console.log('   ❌ Coluna "rating" NÃO encontrada');
        console.log('      Colunas disponíveis:', columns.map((c: any) => c.column_name).join(', '));
      }
    } else {
      console.log('   ⚠️  Não foi possível verificar as colunas');
    }

    // 2. Verificar constraints
    console.log('\n2️⃣  Verificando constraint check_rating...');
    const { data: constraints, error: conError } = await supabase.rpc('get_constraints', {
      table_name: 'produtos'
    }).catch(() => ({
      data: null,
      error: 'RPC not available'
    }));

    if (!conError && constraints) {
      const hasCheckRating = constraints.some((c: any) => c.constraint_name === 'check_rating');
      if (hasCheckRating) {
        console.log('   ✅ Constraint check_rating existe!');
      } else {
        console.log('   ⚠️  Constraint check_rating não encontrada');
      }
    } else {
      console.log('   ⚠️  Não foi possível verificar constraints');
    }

    // 3. Verificar índices
    console.log('\n3️⃣  Verificando índice idx_produtos_rating...');
    const { data: indexes, error: idxError } = await supabase.rpc('get_indexes', {
      table_name: 'produtos'
    }).catch(() => ({
      data: null,
      error: 'RPC not available'
    }));

    if (!idxError && indexes) {
      const hasIndex = indexes.some((i: any) => i.indexname === 'idx_produtos_rating');
      if (hasIndex) {
        console.log('   ✅ Índice idx_produtos_rating existe!');
      } else {
        console.log('   ⚠️  Índice idx_produtos_rating não encontrado');
      }
    } else {
      console.log('   ⚠️  Não foi possível verificar índices');
    }

    // 4. Verificar dados de exemplo
    console.log('\n4️⃣  Verificando dados de exemplo...');
    const { data: samples, error: sampleError } = await supabase
      .from('produtos')
      .select('id, nome, rating')
      .limit(3);

    if (!sampleError && samples) {
      console.log('   ✅ Exemplos de ratings encontrados:');
      samples.forEach((p: any) => {
        console.log(`      - ${p.nome}: ${p.rating ? `⭐ ${p.rating}` : 'sem rating'}`);
      });
    } else {
      console.log('   ⚠️  Não foi possível recuperar exemplos');
    }

    console.log('\n✨ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
    process.exit(1);
  }
}

verifyMigration();
