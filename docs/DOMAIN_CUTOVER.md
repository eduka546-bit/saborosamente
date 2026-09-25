# Cutover do domínio saborosamente.com

## Estado atual

O projeto Vercel `saborosamente` está publicado e validado em `saborosamente.vercel.app`.
O domínio oficial `saborosamente.com` / `www.saborosamente.com` deve ser associado ao projeto antes da troca de DNS.

## Ordem segura da troca

1. No projeto Vercel `saborosamente`, abrir **Settings > Domains**.
2. Adicionar:
   - `saborosamente.com`
   - `www.saborosamente.com`
3. Definir `www.saborosamente.com` como endereço principal e redirecionar o apex `saborosamente.com` para `www`.
4. Usar **os valores exatos mostrados pela Vercel** em Domains / Inspect.
5. Se a Vercel mostrar os valores gerais padrão, eles são:
   - `A` — host `@` — `76.76.21.21`
   - `CNAME` — host `www` — `cname.vercel-dns-0.com`
6. No provedor DNS atual, substituir apenas os registros WEB que hoje levam ao PrefiroDelivery.
7. Não remover nem alterar MX/TXT usados por e-mail, SPF, DKIM, DMARC ou verificações de serviços.
8. Se possível, reduzir o TTL dos registros web para 60–300 segundos antes da troca.
9. Após a propagação, conferir:
   - raiz redireciona para `https://www.saborosamente.com`
   - HTTPS/SSL válido
   - home, produto, carrinho, checkout, login e páginas públicas
   - links enviados por WhatsApp e indicação
10. Após o domínio estar estável, alterar o E2E para testar o domínio oficial como URL principal.

## Observação

Não trocar o DNS antes de o domínio estar adicionado ao projeto Vercel. Caso contrário, o tráfego pode chegar à Vercel sem que ela saiba qual projeto deve atender o hostname.
