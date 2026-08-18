"""
Script de upload de imagens dos produtos para o Supabase Storage
Uso: python3 upload_imagens.py
"""

import os
import re
import json
import mimetypes
import urllib.request
import urllib.parse
import urllib.error

# ── Configuração ──────────────────────────────────────────────────────────────

# Lê do .env
env = {}
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()

SUPABASE_URL = env.get("VITE_SUPABASE_URL", "https://lxcgbrovdmpjatywweiv.supabase.co")
SERVICE_KEY  = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
BUCKET       = "product-images"
IMAGENS_DIR  = os.path.join(os.path.dirname(__file__), "Imagens")
IMG_EXTS     = {".png", ".jpg", ".jpeg", ".webp"}

if not SERVICE_KEY:
    print("❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env")
    exit(1)

HEADERS_JSON = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def supabase_get(path, params=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=HEADERS_JSON)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def supabase_patch(path, where_key, where_val, data):
    url = f"{SUPABASE_URL}/rest/v1/{path}?{where_key}=eq.{urllib.parse.quote(str(where_val))}"
    body = json.dumps(data).encode()
    headers = dict(HEADERS_JSON)
    headers["Content-Type"] = "application/json"
    headers["Prefer"] = "return=minimal"
    req = urllib.request.Request(url, data=body, headers=headers, method="PATCH")
    with urllib.request.urlopen(req) as r:
        return r.status

def storage_upload(path_in_bucket, file_bytes, mime):
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{urllib.parse.quote(path_in_bucket)}"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": mime,
        "x-upsert": "true",  # sobrescreve se já existir
    }
    req = urllib.request.Request(url, data=file_bytes, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status in (200, 201)
    except urllib.error.HTTPError as e:
        print(f"    ⚠️  HTTP {e.code}: {e.read().decode()[:200]}")
        return False

def storage_public_url(path_in_bucket):
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{urllib.parse.quote(path_in_bucket)}"

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("🚀 Iniciando upload de imagens...\n")

    pastas = sorted([
        d for d in os.listdir(IMAGENS_DIR)
        if os.path.isdir(os.path.join(IMAGENS_DIR, d))
    ])

    print(f"📁 {len(pastas)} pastas encontradas\n")

    sucessos = 0
    erros = 0

    for pasta in pastas:
        # Extrai código: "TD01 - Tiras de Alcatra" → "TD01"
        m = re.match(r"^([A-Z]{2}\d{2,})", pasta, re.IGNORECASE)
        if not m:
            print(f"⚠️  Ignorando '{pasta}' — sem código reconhecível")
            continue
        codigo = m.group(1).upper()

        # Busca produto no banco
        try:
            produtos = supabase_get("produtos", {
                "select": "id,nome",
                "nome": f"ilike.{codigo}%",
                "limit": 1,
            })
        except Exception as e:
            print(f"❌ Erro ao buscar {codigo}: {e}")
            erros += 1
            continue

        if not produtos:
            print(f"❌ Produto '{codigo}' não encontrado no banco")
            erros += 1
            continue

        produto = produtos[0]
        pasta_path = os.path.join(IMAGENS_DIR, pasta)

        # Lista imagens da pasta
        arquivos = sorted([
            f for f in os.listdir(pasta_path)
            if os.path.splitext(f)[1].lower() in IMG_EXTS
        ])

        if not arquivos:
            print(f"⚠️  '{pasta}' não tem imagens")
            continue

        print(f"📦 {codigo} — {produto['nome']} — {len(arquivos)} imagem(ns)")

        urls = []
        for arq in arquivos:
            caminho = os.path.join(pasta_path, arq)
            ext = os.path.splitext(arq)[1].lower()
            nome_limpo = re.sub(r"\s+", "_", os.path.splitext(arq)[0])
            storage_path = f"{codigo}_{nome_limpo}{ext}"
            mime = "image/png" if ext == ".png" else "image/jpeg"

            with open(caminho, "rb") as f:
                dados = f.read()

            ok = storage_upload(storage_path, dados, mime)
            if ok:
                url = storage_public_url(storage_path)
                urls.append(url)
                print(f"  ✅ {arq}")
            else:
                print(f"  ❌ Falha no upload de {arq}")

        if not urls:
            erros += 1
            continue

        # Atualiza banco: imagem_url = primeira, imagens = galeria completa
        try:
            supabase_patch(
                "produtos", "id", produto["id"],
                {
                    "imagem_url": urls[0],
                    "imagens": [{"url": u} for u in urls],
                }
            )
            print(f"  💾 Banco atualizado — {len(urls)} imagem(ns)\n")
            sucessos += 1
        except Exception as e:
            print(f"  ❌ Erro ao atualizar banco: {e}\n")
            erros += 1

    print("─" * 50)
    print(f"✅ Concluído! {sucessos} produtos atualizados, {erros} erros")

if __name__ == "__main__":
    main()
