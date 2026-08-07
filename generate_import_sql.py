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
    
    # Updated SQL: Handling CPF conflicts by setting it to NULL or existing value if already taken
    # Also handles duplicate users by checking email first.
    sql = f"""
DO $$
DECLARE
    new_user_id UUID;
    existing_cpf_user_id UUID;
BEGIN
    -- 1. Find or Create User
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

    -- 2. Handle Profile with CPF conflict check
    -- If the CPF is not empty and already exists for ANOTHER user, we don't update it to avoid constraint error
    IF '{cpf_safe}' != '' THEN
        SELECT id INTO existing_cpf_user_id FROM public.profiles WHERE cpf = '{cpf_safe}' AND id != new_user_id LIMIT 1;
    ELSE
        existing_cpf_user_id := NULL;
    END IF;

    INSERT INTO public.profiles (id, nome, cpf, telefone, bairro)
    VALUES (
        new_user_id, 
        '{nome_safe}', 
        CASE WHEN existing_cpf_user_id IS NULL THEN '{cpf_safe}' ELSE NULL END, 
        '{tel_safe}', 
        '{bairro_safe}'
    )
    ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        cpf = CASE WHEN existing_cpf_user_id IS NULL THEN EXCLUDED.cpf ELSE public.profiles.cpf END,
        telefone = EXCLUDED.telefone,
        bairro = EXCLUDED.bairro;
END $$;"""
    sql_statements.append(sql)

with open('/mnt/documents/import_clientes_v3.sql', 'w') as f:
    f.write("-- Script de Importação de Clientes (Versão 3 - Tratamento de CPF duplicado)\n")
    f.write("-- Cole este script no Editor SQL do seu Painel do Supabase\n\n")
    f.write("\n".join(sql_statements))

print(f"Gerado SQL v3 para {len(sql_statements)} clientes em /mnt/documents/import_clientes_v3.sql")
