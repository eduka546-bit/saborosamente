# Saborosamente — Loja de Marmitas Congeladas

Sistema independente (frontend) para a loja de marmitas congeladas **Saborosamente**.
Esta primeira entrega cobre vitrine, catálogo, carrinho e checkout simulado, sem
dependência de ERP externo e **sem backend gerenciado** (Lovable Cloud desativado por decisão do projeto).

## Stack

- **React 19 + TypeScript** (strict)
- **TanStack Start / TanStack Router** (rotas por arquivo em `src/routes`)
- **Tailwind CSS v4** com design system em `src/styles.css` (tokens `oklch`)
- **react-hook-form + Zod** para validação de formulários
- **sonner** para notificações
- Estado do carrinho em React Context + `localStorage`

## Setup

```bash
bun install       # ou npm install
bun run dev       # http://localhost:8080
bun run build     # build de produção
bun run lint      # eslint
```

## Estrutura

```
src/
  assets/                 imagens dos produtos e hero
  components/             SiteHeader, SiteFooter, ProductCard, ui/ (shadcn)
  lib/
    products.ts           catálogo mock + tipos (schema futuro de `produtos`)
    cart.tsx              CartProvider / useCart (persistência em localStorage)
  routes/
    __root.tsx            shell, metadados, providers, header/footer
    index.tsx             página inicial (hero, benefícios, destaques, CTA)
    catalogo.tsx          catálogo com filtro por categoria
    carrinho.tsx          carrinho, quantidades, frete e total
    checkout.tsx          formulário validado + confirmação simulada
  styles.css              design system (cores da identidade visual, fontes, sombras)
```

## Identidade visual

Cores principais: `#086e45`, `#a8cf45`, `#fff688`, `#ffffff`, `#e76800`, `#119e8f`.
Secundárias: `#3d3c3c`, `#055635`, `#749c0b`, `#fff212`, `#0088c6`, `#ad1515`.
Tipografia: Poppins (títulos/corpo, substituindo Mazzard Soft L) + Pacifico (script).
Todas as cores são tokens semânticos — nunca use classes de cor fixas nos componentes.

## Modelo de dados planejado

Quando um backend for adotado (Supabase ou outro), as estruturas previstas são:

- `produtos`: id, nome, descricao, ingredientes[], preco, peso, categoria, imagem, destaque, estoque
- `pedidos`: id, cliente (nome, email, telefone), endereco, pagamento, status, total, created_at
- `pedido_itens`: id, pedido_id, produto_id, quantidade, preco_unitario

`src/lib/products.ts` já expõe o tipo `Product` alinhado a esse schema, então a troca
do mock por uma consulta real fica isolada nesse módulo.

## Próximos passos

- Persistência real de produtos e pedidos
- Autenticação de clientes e histórico de pedidos
- Pagamento real (PIX/cartão) e gestão de estoque
- Painel administrativo e integração com entregas

## Contribuição

1. Crie uma branch a partir de `main`.
2. Rode `bun run lint` e `bunx tsgo --noEmit` antes do commit.
3. Abra um Pull Request descrevendo o escopo da mudança.
