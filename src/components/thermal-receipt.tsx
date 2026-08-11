/**
 * Comanda térmica para impressora POS58 (papel 58mm, ~32 colunas)
 *
 * Uso: window.print() com @media print mostrando só este componente.
 * O CSS de impressão está inline via <style> para garantir portabilidade.
 */

interface ReceiptItem {
  nome: string;
  quantidade: number;
  preco_unitario: number;
  observacao?: string | null;
}

interface ThermalReceiptProps {
  order: {
    id: string;
    nome_cliente: string;
    telefone_cliente?: string;
    created_at: string;
    status: string;
    metodo_entrega?: string;
    metodo_pagamento?: string;
    endereco_rua?: string;
    endereco_numero?: string;
    endereco_bairro?: string;
    endereco_cidade?: string;
    endereco_cep?: string;
    observacao?: string;
    valor_total: number;
    taxa_entrega?: number;
    desconto_aplicado?: number;
    cupom_codigo?: string;
    troco?: string;
    itens: ReceiptItem[];
  };
}

// Centra texto em N colunas
function center(text: string, cols = 32) {
  const len = text.length;
  if (len >= cols) return text.slice(0, cols);
  const pad = Math.floor((cols - len) / 2);
  return " ".repeat(pad) + text;
}

// Linha com label à esquerda e valor à direita
function row(label: string, value: string, cols = 32) {
  const total = cols - label.length - value.length;
  return label + " ".repeat(Math.max(1, total)) + value;
}

const SEP = "─".repeat(32);
const SEP_THIN = "·".repeat(32);

export function ThermalReceipt({ order }: ThermalReceiptProps) {
  const date = new Date(order.created_at);
  const dateStr = date.toLocaleDateString("pt-BR");
  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const seq = order.id.slice(-6).toUpperCase();
  const isDelivery = order.metodo_entrega === "entrega";

  const subtotal = order.itens.reduce(
    (s, i) => s + i.preco_unitario * i.quantidade,
    0
  );
  const desconto = order.desconto_aplicado ?? 0;
  const entrega = order.taxa_entrega ?? 0;
  const total = order.valor_total;

  return (
    <>
      <style>{`
        @media print {
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: white; }
          .no-print { display: none !important; }
          .receipt-root {
            width: 58mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: 9pt;
            line-height: 1.35;
            color: #000;
            page-break-after: always;
          }
        }
        .receipt-root {
          width: 58mm;
          font-family: 'Courier New', Courier, monospace;
          font-size: 9pt;
          line-height: 1.35;
          color: #000;
          background: white;
          padding: 2mm;
        }
        .receipt-root pre {
          white-space: pre-wrap;
          word-break: break-all;
          font-family: inherit;
          font-size: inherit;
          margin: 0;
        }
        .receipt-bold { font-weight: bold; }
        .receipt-center { text-align: center; }
        .receipt-lg { font-size: 11pt; font-weight: bold; }
      `}</style>

      <div className="receipt-root">
        <pre>
{center("SABOROSAMENTE")}
{center("Atacado de Refeicoes")}
{center("e Sopas Congeladas")}
{SEP}
{center(`PEDIDO #${seq}`)}
{center(`${dateStr}  ${timeStr}`)}
{SEP}
CLIENTE:
{order.nome_cliente}
{order.telefone_cliente ? order.telefone_cliente : ""}
{SEP}
{center(isDelivery ? "** DELIVERY **" : "** RETIRADA **")}
{isDelivery && order.endereco_rua ? `\nENTREGA:
${order.endereco_rua}${order.endereco_numero ? ", " + order.endereco_numero : ""}
${order.endereco_bairro ?? ""}  ${order.endereco_cidade ?? ""}
${order.endereco_cep ?? ""}` : ""}
{SEP}
ITENS
{SEP_THIN}
{order.itens.map((item) => {
  const total_item = item.preco_unitario * item.quantidade;
  const lineProd = `${item.quantidade}x ${item.nome}`;
  const lineVal = `R$ ${total_item.toFixed(2)}`;
  const gap = 32 - lineProd.length - lineVal.length;
  return [
    lineProd + " ".repeat(Math.max(1, gap)) + lineVal,
    item.observacao ? `  Obs: ${item.observacao}` : null,
  ].filter(Boolean).join("\n");
}).join("\n")}
{SEP_THIN}
{row("Subtotal:", `R$ ${subtotal.toFixed(2)}`)}
{entrega > 0 ? row("Entrega:", `R$ ${entrega.toFixed(2)}`) : row("Entrega:", "GRATIS")}
{desconto > 0 ? row(`Desconto${order.cupom_codigo ? ` (${order.cupom_codigo})` : ""}:`, `- R$ ${desconto.toFixed(2)}`) : ""}
{SEP}
{row("TOTAL:", `R$ ${total.toFixed(2)}`)}
{SEP}
PAGAMENTO:
{order.metodo_pagamento ?? "Nao informado"}
{order.troco ? `Troco para: R$ ${order.troco}` : ""}
{order.observacao ? `\nOBS: ${order.observacao}` : ""}
{SEP}
{center("Obrigado pela preferencia!")}
{center("prefirodelivery.com")}
{center("@saborosamente.sbs")}
{" "}
        </pre>
      </div>
    </>
  );
}

/**
 * Abre janela de impressão com a comanda.
 * Chamar após montar o componente no DOM.
 */
export function printReceipt(order: ThermalReceiptProps["order"]) {
  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) {
    alert("Permita pop-ups para imprimir a comanda.");
    return;
  }

  const date = new Date(order.created_at);
  const dateStr = date.toLocaleDateString("pt-BR");
  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const seq = order.id.slice(-6).toUpperCase();
  const isDelivery = order.metodo_entrega === "entrega";
  const subtotal = order.itens.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0);
  const desconto = order.desconto_aplicado ?? 0;
  const entrega = order.taxa_entrega ?? 0;

  const c = (t: string) => t.padStart(Math.floor((32 + t.length) / 2)).padEnd(32);
  const r = (l: string, v: string) => l + " ".repeat(Math.max(1, 32 - l.length - v.length)) + v;
  const sep = "─".repeat(32);
  const thin = "·".repeat(32);

  const itensLines = order.itens.map((item) => {
    const tot = item.preco_unitario * item.quantidade;
    const prod = `${item.quantidade}x ${item.nome}`;
    const val = `R$ ${tot.toFixed(2)}`;
    const line = prod + " ".repeat(Math.max(1, 32 - prod.length - val.length)) + val;
    return item.observacao ? `${line}\n  Obs: ${item.observacao}` : line;
  }).join("\n");

  const body = [
    c("SABOROSAMENTE"),
    c("Atacado de Refeicoes"),
    c("e Sopas Congeladas"),
    sep,
    c(`PEDIDO #${seq}`),
    c(`${dateStr}  ${timeStr}`),
    sep,
    "CLIENTE:",
    order.nome_cliente,
    order.telefone_cliente ?? "",
    sep,
    c(isDelivery ? "** DELIVERY **" : "** RETIRADA **"),
    ...(isDelivery && order.endereco_rua ? [
      "ENTREGA:",
      `${order.endereco_rua}${order.endereco_numero ? ", " + order.endereco_numero : ""}`,
      `${order.endereco_bairro ?? ""}  ${order.endereco_cidade ?? ""}`,
      order.endereco_cep ?? "",
    ] : []),
    sep,
    "ITENS",
    thin,
    itensLines,
    thin,
    r("Subtotal:", `R$ ${subtotal.toFixed(2)}`),
    r("Entrega:", entrega > 0 ? `R$ ${entrega.toFixed(2)}` : "GRATIS"),
    ...(desconto > 0 ? [r(`Desconto${order.cupom_codigo ? ` (${order.cupom_codigo})` : ""}:`, `- R$ ${desconto.toFixed(2)}`)] : []),
    sep,
    r("TOTAL:", `R$ ${order.valor_total.toFixed(2)}`),
    sep,
    "PAGAMENTO:",
    order.metodo_pagamento ?? "Nao informado",
    ...(order.troco ? [`Troco para: R$ ${order.troco}`] : []),
    ...(order.observacao ? [`\nOBS: ${order.observacao}`] : []),
    sep,
    c("Obrigado pela preferencia!"),
    c("@saborosamente.sbs"),
    " ",
  ].filter((l) => l !== null && l !== undefined).join("\n");

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Comanda #${seq}</title>
  <style>
    @page { margin: 2mm; size: 58mm auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10pt;
      font-weight: bold;
      line-height: 1.4;
      width: 58mm;
      background: white;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    pre {
      white-space: pre;
      font-family: inherit;
      font-size: inherit;
      font-weight: inherit;
      color: #000;
    }
  </style>
</head>
<body>
<pre>${body}</pre>
<script>
  window.onload = function() {
    window.print();
    setTimeout(function() { window.close(); }, 1000);
  };
</script>
</body>
</html>`);
  win.document.close();
}
