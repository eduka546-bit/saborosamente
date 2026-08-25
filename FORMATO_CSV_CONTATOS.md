# 📋 Formato de CSV para Importar Contatos

## Como usar o Importador de CSV

Na página de campanhas (`/admin/campanhas`), você pode importar contatos de um arquivo CSV.

### Formatos Aceitos

#### Opção 1: Apenas Telefones (Simples)

```
5511987654321
5511987654322
5511987654323
```

#### Opção 2: Com Header

```
Telefone
5511987654321
5511987654322
5511987654323
```

#### Opção 3: CSV com Múltiplas Colunas

```
Nome,Telefone,Email
João,5511987654321,joao@email.com
Maria,5511987654322,maria@email.com
Pedro,5511987654323,pedro@email.com
```

#### Opção 4: Telefones com Caracteres Especiais

```
(11) 98765-4321
11 98765-4321
+55 11 98765-4321
11987654321
```

**O sistema remove automaticamente:**

- Parênteses `( )`
- Hífens `-`
- Espaços
- Símbolos `+`

E extrai apenas os dígitos!

---

## 📝 Passo a Passo

### 1. Preparar o CSV

- Abra Excel, Google Sheets ou qualquer editor de texto
- Crie uma coluna com os telefones
- Salve como `.csv`

### 2. Importar

- Acesse `/admin/campanhas`
- Clique em **"Ver/Editar Lista Completa"**
- Clique no botão **"📥 Importar CSV"**
- Selecione o arquivo `.csv`

### 3. Verificar

- Os contatos aparecem na lista
- Você pode editar, adicionar ou remover antes de enviar
- Clique **"Enviar"** quando pronto

---

## ✅ Validações

O sistema valida cada telefone:

- ✓ Mínimo 10 dígitos (celular/fixo)
- ✓ Máximo 15 dígitos (padrão internacional)
- ✓ Remove duplicatas automaticamente
- ✓ Pula linhas vazias

---

## 📊 Exemplo de Arquivo Excel

| Nome         | Telefone        | Email           |
| ------------ | --------------- | --------------- |
| João Silva   | (11) 98765-4321 | joao@email.com  |
| Maria Santos | 11 98765-4322   | maria@email.com |
| Pedro Costa  | 5511987654323   | pedro@email.com |

**Ao salvar em CSV:**

```
Nome,Telefone,Email
João Silva,(11) 98765-4321,joao@email.com
Maria Santos,11 98765-4322,maria@email.com
Pedro Costa,5511987654323,pedro@email.com
```

O sistema lê e importa automaticamente os telefones!

---

## 🎯 Dicas

- **Duplicatas**: O sistema detecta e evita
- **Formatos**: Misture formatos, o sistema normaliza
- **Interativo**: Edite antes de enviar
- **Copiar/Colar**: Também funciona direto na textarea

---

## 💡 Casos de Uso

### 1. Importar de CRM/Planilha

Exporte seus contatos como CSV e importe direto

### 2. Usar com Filtros

Importe CSV + filtre ainda mais por bairro/gasto

### 3. Lista Manual

Copie/cole telefones um por um ou em bloco

### 4. Adicionar Um por Um

Use o botão "+ Adicionar Contato"

---

**Pronto! Seu CSV está importado! 🚀**
