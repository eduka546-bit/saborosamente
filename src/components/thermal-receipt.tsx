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

  const subtotal = order.itens.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0);
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
          {center("CNPJ: 52.596.019/0001-46")}
          {SEP}
          {center(`PEDIDO #${seq}`)}
          {center(`${dateStr}  ${timeStr}`)}
          {SEP}
          CLIENTE:
          {order.nome_cliente}
          {order.telefone_cliente ? order.telefone_cliente : ""}
          {SEP}
          {center(isDelivery ? "** DELIVERY **" : "** RETIRADA **")}
          {isDelivery && order.endereco_rua
            ? `\nENTREGA:
${order.endereco_rua}${order.endereco_numero ? ", " + order.endereco_numero : ""}
${order.endereco_bairro ?? ""}  ${order.endereco_cidade ?? ""}
${order.endereco_cep ?? ""}`
            : ""}
          {SEP}
          ITENS
          {SEP_THIN}
          {order.itens
            .map((item) => {
              const total_item = item.preco_unitario * item.quantidade;
              const lineProd = `${item.quantidade}x ${item.nome}`;
              const lineVal = `R$ ${total_item.toFixed(2)}`;
              const gap = 32 - lineProd.length - lineVal.length;
              return [
                lineProd + " ".repeat(Math.max(1, gap)) + lineVal,
                item.observacao ? `  Obs: ${item.observacao}` : null,
              ]
                .filter(Boolean)
                .join("\n");
            })
            .join("\n")}
          {SEP_THIN}
          {row("Subtotal:", `R$ ${subtotal.toFixed(2)}`)}
          {entrega > 0 ? row("Entrega:", `R$ ${entrega.toFixed(2)}`) : row("Entrega:", "GRATIS")}
          {desconto > 0
            ? row(
                `Desconto${order.cupom_codigo ? ` (${order.cupom_codigo})` : ""}:`,
                `- R$ ${desconto.toFixed(2)}`,
              )
            : ""}
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
          {center("@saborosamente.sbs")}{" "}
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
  const win = window.open("", "_blank", "width=400,height=700");
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

  // Linhas de itens — estilo P10: linha com qtd+desc+valor, obs abaixo com *
  const itensHtml = order.itens.map((item) => {
    const tot = (item.preco_unitario * item.quantidade).toFixed(2);
    const uni = item.preco_unitario.toFixed(2);
    // Extrai o sabor da observação ("Peso: 300g | TD01 - Nome" ou só "Peso: 300g")
    const obs = item.observacao ?? "";
    // Remove só o "Peso: XXXg" da observação pra não duplicar
    const obsLimpa = obs.replace(/Peso:\s*\d+\s*g\s*\|?\s*/i, "").trim();
    return `
      <tr class="item-row">
        <td class="qty">${item.quantidade}</td>
        <td class="desc">${item.nome}</td>
        <td class="uni">R$&nbsp;${uni}</td>
        <td class="tot">R$&nbsp;${tot}</td>
      </tr>
      ${obsLimpa ? `<tr><td></td><td colspan="3" class="obs"> * ${obsLimpa}</td></tr>` : ""}
    `;
  }).join("");

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Comanda #${seq}</title>
  <style>
    @page { margin: 3mm 2mm; size: 58mm auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 9pt;
      font-weight: bold;
      line-height: 1.4;
      width: 54mm;
      color: #000;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .center { text-align: center; }
    .sep { border-top: 1px dashed #000; margin: 3px 0; }
    .sep-solid { border-top: 2px solid #000; margin: 3px 0; }
    .label { font-size: 8pt; font-weight: normal; }
    .big { font-size: 11pt; font-weight: bold; }
    /* Tabela de itens */
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 7pt; font-weight: bold; border-bottom: 1px solid #000; padding: 1px 1px; }
    .th-qty  { width: 8%;  text-align: center; }
    .th-desc { width: 54%; text-align: left; }
    .th-uni  { width: 19%; text-align: right; }
    .th-tot  { width: 19%; text-align: right; }
    .qty  { text-align: center; vertical-align: top; padding: 1px 1px; font-size: 9pt; }
    .desc { text-align: left;   vertical-align: top; padding: 1px 2px; word-break: break-word; font-size: 9pt; }
    .uni  { text-align: right;  vertical-align: top; padding: 1px 1px; white-space: nowrap; font-size: 8pt; }
    .tot  { text-align: right;  vertical-align: top; padding: 1px 1px; white-space: nowrap; font-size: 9pt; }
    .obs  { font-size: 8pt; font-weight: normal; padding: 0 2px 2px 4px; color: #000; }
    /* Totais */
    .totals { width: 100%; margin-top: 2px; }
    .totals td { padding: 1px 1px; font-size: 9pt; }
    .totals .lbl { text-align: left; font-weight: normal; }
    .totals .val { text-align: right; white-space: nowrap; }
    .totals .total-row td { font-size: 10pt; font-weight: bold; border-top: 1px solid #000; padding-top: 2px; }
  </style>
</head>
<body>

  <div class="center big">SABOROSAMENTE</div>
  <div class="center label">CNPJ: 52.596.019/0001-46</div>
  <div class="sep-solid"></div>

  <div class="center big">PEDIDO #${seq}</div>
  <div class="center label">${dateStr} - ${timeStr}</div>
  <div class="sep"></div>

  <div><span class="label">Cliente: </span>${order.nome_cliente}</div>
  ${order.telefone_cliente ? `<div><span class="label">Fone: </span>${order.telefone_cliente}</div>` : ""}
  <div class="sep"></div>

  <div class="center big">${isDelivery ? "** ENTREGA EM CASA **" : "** RETIRADA **"}</div>
  ${isDelivery && order.endereco_rua ? `
    <div><span class="label">End.: </span>${order.endereco_rua}${order.endereco_numero ? ", " + order.endereco_numero : ""}</div>
    <div><span class="label">Bairro: </span>${order.endereco_bairro ?? ""} - ${order.endereco_cidade ?? ""}</div>
    ${order.endereco_cep ? `<div><span class="label">CEP: </span>${order.endereco_cep}</div>` : ""}
  ` : ""}
  <div class="sep"></div>

  <table>
    <thead>
      <tr>
        <th class="th-qty">Qtd</th>
        <th class="th-desc">Descrição</th>
        <th class="th-uni">V.Uni.</th>
        <th class="th-tot">V.Total</th>
      </tr>
    </thead>
    <tbody>
      ${itensHtml}
    </tbody>
  </table>

  <div class="sep"></div>

  <table class="totals">
    <tr><td class="lbl">Subtotal:</td><td class="val">R$ ${subtotal.toFixed(2)}</td></tr>
    <tr><td class="lbl">Tx. Entrega:</td><td class="val">${entrega > 0 ? "R$ " + entrega.toFixed(2) : "GRATIS"}</td></tr>
    ${desconto > 0 ? `<tr><td class="lbl">Desconto${order.cupom_codigo ? " (" + order.cupom_codigo + ")" : ""}:</td><td class="val">- R$ ${desconto.toFixed(2)}</td></tr>` : ""}
    <tr class="total-row">
      <td class="lbl">TOTAL PEDIDO:</td>
      <td class="val">R$ ${order.valor_total.toFixed(2)}</td>
    </tr>
  </table>

  <div class="sep"></div>
  <div><span class="label">F. Pagto.: </span>${order.metodo_pagamento ?? "Nao informado"}</div>
  ${order.troco ? `<div><span class="label">Troco para: </span>R$ ${order.troco}</div>` : ""}
  ${order.observacao ? `<div class="sep"></div><div><span class="label">OBS: </span>${order.observacao}</div>` : ""}

  <div class="sep-solid"></div>
  <div class="center">Obrigado pela preferencia!</div>
  <div class="center label">@saborosamente.sbs</div>
  <br>

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
