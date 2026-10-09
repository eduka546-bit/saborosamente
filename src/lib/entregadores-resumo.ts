/** Resumo para o motorista: somente dados de entrega e cobranças presenciais. */
export type PedidoRota = {
  id: string;
  created_at?: string | null;
  status?: string | null;
  nome_cliente?: string | null;
  cliente_nome?: string | null;
  metodo_entrega?: string | null;
  metodo_pagamento?: string | null;
  tipo_cartao?: string | null;
  valor_total?: number | string | null;
  total?: number | string | null;
  endereco_cidade?: string | null;
  endereco_rua?: string | null;
  endereco_numero?: string | null;
  endereco_bairro?: string | null;
  endereco_complemento?: string | null;
  endereco_referencia?: string | null;
  endereco_cep?: string | null;
  endereco?: string | null;
  horario_recebimento?: string | null;
};

export type DiaRota = "terca" | "sexta";
const normalizar = (value: unknown) => String(value ?? "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .trim().replace(/\s+/g, " ").toLowerCase();

export function rotaDaCidade(cidade: unknown): DiaRota | null {
  const c = normalizar(cidade);
  if (!c || ["sao bento do sul", "sbs"].includes(c)) return null;
  return c === "corupa" ? "terca" : "sexta";
}

export function dataEntregaProgramada(pedido: PedidoRota): string | null {
  const horario = String(pedido.horario_recebimento ?? "");
  const match = horario.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  if (!match) return null;
  const [, d, m, a] = match;
  const iso = a + "-" + m + "-" + d;
  const utc = new Date(iso + "T12:00:00Z");
  if (Number.isNaN(utc.getTime()) || utc.getUTCFullYear() !== Number(a) ||
    utc.getUTCMonth() + 1 !== Number(m) || utc.getUTCDate() !== Number(d)) return null;
  return iso;
}

export function pedidoDaRota(pedido: PedidoRota, rota: DiaRota, dataISO: string): boolean {
  const status = normalizar(pedido.status);
  if (["cancelado", "cancelada", "entregue", "finalizado", "retirado"].includes(status)) return false;
  if (normalizar(pedido.metodo_entrega) !== "entrega") return false;
  if (rotaDaCidade(pedido.endereco_cidade) !== rota) return false;
  const data = dataEntregaProgramada(pedido);
  return !data || data === dataISO;
}

export function enderecoCompleto(p: PedidoRota): string {
  const rua = String(p.endereco_rua ?? "").trim();
  const numero = String(p.endereco_numero ?? "").trim();
  const bairro = String(p.endereco_bairro ?? "").trim();
  const complemento = String(p.endereco_complemento ?? "").trim();
  const referencia = String(p.endereco_referencia ?? "").trim();
  const cep = String(p.endereco_cep ?? "").trim();
  const partes = [
    [rua, numero].filter(Boolean).join(", "),
    bairro ? "Bairro " + bairro : "",
    complemento ? "Compl.: " + complemento : "",
    referencia ? "Ref.: " + referencia : "",
    cep ? "CEP " + cep : "",
  ].filter(Boolean);
  if (partes.length > 0) return partes.join(" - ");
  return String(p.endereco ?? "").trim();
}

export function enderecoIncompleto(p: PedidoRota) {
  return !String(p.endereco_rua ?? "").trim() && !String(p.endereco ?? "").trim();
}

const moeda = (valor: number | string | null | undefined) =>
  Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** PIX, link, gateway, alimentação e formas desconhecidas NÃO revelam preço ao motorista. */
export function cobrancaNoMotorista(p: PedidoRota): string | null {
  const forma = normalizar(p.metodo_pagamento);
  const tipo = normalizar(p.tipo_cartao);
  // Cartões alimentação/refeição não são crédito/débito para cobrança no motorista.
  if (/alimentac|refeic|vale/.test(forma)) return null;
  const ehDinheiro = /(^|\W)dinheiro(\W|$)|especie/.test(forma);
  const ehCartao = /\bcartao\b|\bcredito\b|\bdebito\b/.test(forma);
  if (!ehDinheiro && !ehCartao) return null;
  const valor = Number(p.valor_total ?? p.total);
  if (!Number.isFinite(valor) || valor < 0) return null;
  if (ehDinheiro) return moeda(valor) + " — Dinheiro";
  const modalidade = /\bdebito\b/.test(forma + " " + tipo) ? "Cartão de débito"
    : /\bcredito\b/.test(forma + " " + tipo) ? "Cartão de crédito"
    : "Cartão (crédito/débito)";
  return moeda(valor) + " — " + modalidade;
}

export function diaDaSemana(dataISO: string): number {
  const value = new Date(dataISO + "T12:00:00Z");
  return Number.isNaN(value.getTime()) ? -1 : value.getUTCDay();
}

export function proximaDataRota(rota: DiaRota, dataHoje: string): string {
  const dia = rota === "terca" ? 2 : 5;
  const base = new Date(dataHoje + "T12:00:00Z");
  const avancar = (dia - base.getUTCDay() + 7) % 7;
  base.setUTCDate(base.getUTCDate() + avancar);
  return base.toISOString().slice(0, 10);
}

export function textoResumoEntregador(pedidos: PedidoRota[], rota: DiaRota, dataISO: string) {
  const data = dataISO.split("-").reverse().join("/");
  const cabecalho = rota === "terca" ? "TERÇA-FEIRA · CORUPÁ" : "SEXTA-FEIRA · OUTRAS CIDADES";
  const grupos = new Map<string, PedidoRota[]>();
  for (const pedido of pedidos) {
    if (!pedidoDaRota(pedido, rota, dataISO) || enderecoIncompleto(pedido)) continue;
    const cidade = String(pedido.endereco_cidade ?? "").trim();
    const chave = normalizar(cidade);
    const atual = grupos.get(chave) ?? [];
    atual.push(pedido);
    grupos.set(chave, atual);
  }
  const gruposOrdenados = [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
  const partes = ["🚚 *ENTREGAS SABOROSAMENTE*", "📅 " + cabecalho + " · " + data, ""];
  let numero = 0;
  for (const [, lista] of gruposOrdenados) {
    lista.sort((a, b) => String(a.nome_cliente ?? a.cliente_nome ?? "").localeCompare(
      String(b.nome_cliente ?? b.cliente_nome ?? ""), "pt-BR"));
    partes.push("*" + String(lista[0].endereco_cidade ?? "").trim().toUpperCase() + "*", "");
    for (const p of lista) {
      numero++;
      partes.push(numero + ". Nome: " + String(p.nome_cliente ?? p.cliente_nome ?? "Cliente não identificado").trim() +
        " - Cidade: " + String(p.endereco_cidade ?? "").trim());
      partes.push("Endereço: " + enderecoCompleto(p));
      const pagamento = cobrancaNoMotorista(p);
      if (pagamento) partes.push("Valor e forma de pagamento: " + pagamento);
      partes.push("");
    }
  }
  partes.push("Total de entregas: " + numero);
  return partes.join("\n").trim();
}
