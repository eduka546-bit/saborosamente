# 🔐 Configuração RLS para o Campo Rating

Se você tiver **Row Level Security (RLS)** ativado na tabela `produtos`, pode precisar atualizar suas políticas para permitir leitura e escrita do campo `rating`.

## 📋 Verificação Inicial

1. No Supabase Dashboard, vá para **SQL Editor**
2. Execute esta query para verificar se RLS está ativado:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'produtos';
```

Se a coluna `rowsecurity` for `true`, você tem RLS ativado.

---

## 🔧 Se RLS está ativado

### Opção 1: Permitir SELECT do campo rating (Leitura)

```sql
-- Se você já tem uma política SELECT, você pode simplesmente deixar que ela funcione
-- pois a coluna rating é publica por padrão

-- Caso contrário, crie uma política permissiva:
CREATE POLICY "usuarios_podem_ler_produtos_com_rating" ON produtos
  FOR SELECT
  USING (true);
```

### Opção 2: Permitir UPDATE do campo rating (Escrita)

Se você quer que apenas admins atualizem ratings:

```sql
CREATE POLICY "admins_podem_atualizar_rating" ON produtos
  FOR UPDATE
  USING (
    -- Verifique se o usuário é admin
    auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    -- Garanta que apenas o campo rating é atualizado ou outros campos
    auth.jwt() ->> 'role' = 'admin'
  );
```

### Opção 3: Política mais restrita (apenas leitura do rating)

Se você quer que todos vejam o rating mas apenas admins editem:

```sql
-- Permitir leitura do rating para todos
CREATE POLICY "usuarios_leem_rating" ON produtos
  FOR SELECT
  USING (true);

-- Permitir atualização do rating apenas para admins
CREATE POLICY "admins_atualizam_rating" ON produtos
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

---

## 🧪 Teste suas Políticas RLS

Após criar as políticas, teste-as:

```sql
-- 1. Verifique se as políticas foram criadas
SELECT policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename = 'produtos';

-- 2. Tente fazer uma SELECT com uma nova conexão (simule usuário normal)
SELECT id, nome, rating FROM produtos LIMIT 1;

-- 3. Tente fazer um UPDATE (deve falhar se não é admin)
UPDATE produtos SET rating = 4.5 WHERE id = '...';
```

---

## 📝 Configurações Comuns

### Cenário 1: Público pode ler, admin pode editar

```sql
-- Política de SELECT para todos
CREATE POLICY "public_read_rating" ON produtos
  FOR SELECT
  USING (true);

-- Política de UPDATE apenas para admins
CREATE POLICY "admin_update_rating" ON produtos
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

### Cenário 2: Apenas usuários autenticados podem ver

```sql
-- Política de SELECT apenas autenticados
CREATE POLICY "authenticated_read_rating" ON produtos
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de UPDATE apenas admins
CREATE POLICY "admin_update_rating" ON produtos
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

### Cenário 3: Desativar RLS para a coluna rating

Se você quer que o rating seja sempre acessível sem RLS:

```sql
-- Isso geralmente não é recomendado, mas é possível
-- Melhor deixar as políticas acima
```

---

## 🔍 Se Encontrar Problemas

### "Permission denied" ao SELECT rating

**Solução**: Crie uma política de leitura pública:

```sql
CREATE POLICY "public_read_all_produtos" ON produtos
  FOR SELECT
  USING (true);
```

### "Permission denied" ao UPDATE rating

**Solução**: Verifique se você está autenticado como admin:

```sql
-- No seu aplicativo, verifique:
const user = await supabase.auth.getUser();
console.log(user.data.user?.user_metadata?.role); // deve ser 'admin'
```

### Rating aparece como NULL

**Solução**: Pode ser um problema de RLS. Tente:

```sql
-- Desabilitar RLS temporariamente para teste
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;

-- Teste se consegue ver o rating
SELECT * FROM produtos LIMIT 1;

-- Reabilitar
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
```

---

## 🚀 Checklist RLS

- [ ] Verifiquei se RLS está ativado na tabela
- [ ] Se ativado, criei políticas de SELECT
- [ ] Se ativado, criei políticas de UPDATE (se necessário)
- [ ] Testei leitura do campo rating
- [ ] Testei escrita do campo rating (como admin)
- [ ] Verifiquei permissões na aplicação (roles corretos)

---

## 📚 Referências

- [Documentação RLS do Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [JWT Claims no Supabase](https://supabase.com/docs/learn/auth-deep-dive/jwt-claims)
- [Políticas de RLS Avançadas](https://supabase.com/docs/guides/database/postgres/row-level-security-examples)

---

## 💡 Dica de Produção

Em produção, é melhor:

1. **Sempre ter RLS ativado** para dados sensíveis
2. **Usar políticas granulares** (não deixar tudo público)
3. **Testar bem** antes de fazer deploy
4. **Monitorar erros** de permissão nos logs

Exemplo de política segura para rating de admin:

```sql
CREATE POLICY "admins_manage_rating" ON produtos
  FOR ALL
  USING (
    -- Só admins podem acessar
    auth.jwt() ->> 'role' = 'admin'
    OR
    -- Ou proprietário do produto
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR
    auth.uid() = user_id
  );
```

---

**✅ Após configurar RLS, você pode executar a migration normalmente!**
