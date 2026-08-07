import pandas as pd
import json

def clean_cpf(cpf):
    if pd.isna(cpf): return None
    clean = ''.join(filter(str.isdigit, str(cpf)))
    return clean if clean else None

def clean_str(val):
    if pd.isna(val): return None
    s = str(val).strip().replace('\u00a0', ' ')
    return s if s and s != '' else None

df = pd.read_excel('/mnt/user-uploads/Cadastro_de_Clientes-3.xlsx', skiprows=1)

sql_statements = []

for _, row in df.iterrows():
    nome = clean_str(row.get('Nome'))
    email = clean_str(row.get('Email'))
    cpf = clean_cpf(row.get('CPF'))
    telefone = clean_str(row.get('Telefone'))
    bairro = clean_str(row.get('Bairro'))
    
    if not email:
        continue
        
    email = email.lower().replace("'", "''")
    nome_safe = (nome or "Cliente Importado").replace("'", "''")
    cpf_safe = (cpf or "").replace("'", "''")
    tel_safe = (telefone or "").replace("'", "''")
    bairro_safe = (bairro or "").replace("'", "''")
    
    # Updated SQL: Removed 'email' column from public.profiles insert/update
    sql = f"""
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    SELECT id INTO new_user_id FROM auth.users WHERE email = '{email}';
    
    IF new_user_id IS NULL THEN
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            '{email}',
            crypt('{cpf if cpf else "123456"}', gen_salt('bf')),
            now(),
            '{{"provider":"email","providers":["email"]}}',
            '{json.dumps({"nome": nome_safe, "telefone": tel_safe})}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO new_user_id;
    END IF;

    INSERT INTO public.profiles (id, nome, cpf, telefone, bairro)
    VALUES (new_user_id, '{nome_safe}', '{cpf_safe}', '{tel_safe}', '{bairro_safe}')
    ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        cpf = EXCLUDED.cpf,
        telefone = EXCLUDED.telefone,
        bairro = EXCLUDED.bairro;
END $$;"""
    sql_statements.append(sql)

with open('/mnt/documents/import_clientes_v2.sql', 'w') as f:
    f.write("-- Script de Importação de Clientes (Versão 2 - Sem coluna email em profiles)\n")
    f.write("-- Cole este script no Editor SQL do seu Painel do Supabase\n\n")
    f.write("\n".join(sql_statements))

print(f"Gerado SQL v2 para {len(sql_statements)} clientes em /mnt/documents/import_clientes_v2.sql")
