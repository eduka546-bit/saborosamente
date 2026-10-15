/**
 * Busca administrativa de clientes para lançamento manual de pedidos.
 * Uma ficha comercial de WhatsApp/Pedido NÃO é uma conta autenticada.
 */
export type FonteCliente = "conta" | "historico" | "pedido";

export type ClienteBuscaWhatsApp = {
  key: string;
  source: FonteCliente;
  id: string | null;
  nome: string;
  telefone: string;
  email: string;
  cidade: string;
  bairro: string;
  endereco: string;
  numero: string;
  complemento: string;
  cep: string;
};

type Row = Record<string, any>;

export function telefoneChave(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits.slice(2);
  return digits.length >= 10 && digits.length <= 11 ? digits : "";
}

const t = (v: unknown) => String(v ?? "").trim();

function textMatch(value: string, search: string): boolean {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR")
    .includes(search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR"));
}

export function montarBuscaWhatsapp(
  profiles: Row[],
  historicos: Row[],
  pedidos: Row[],
  searchTerm: string,
): ClienteBuscaWhatsApp[] {
  const found = new Map<string, ClienteBuscaWhatsApp>();
  const phoneTerms = searchTerm.replace(/\D/g, "");
  const add = (candidate: ClienteBuscaWhatsApp) => {
    if (!candidate.nome && !candidate.telefone) return;
    if (!textMatch(candidate.nome, searchTerm) &&
      !(phoneTerms.length >= 4 && telefoneChave(candidate.telefone).includes(phoneTerms))) return;
    // Nunca misturar perfil autenticado com pedido não autenticado só por nome/telefone.
    const key = candidate.source === "conta"
      ? "conta:" + candidate.id
      : "convidado:" + (telefoneChave(candidate.telefone) || candidate.key);
    if (!found.has(key)) found.set(key, candidate);
    else {
      const existing = found.get(key)!;
      // Para histórico, preservar a ficha consolidada em preferência a um pedido isolado.
      if (candidate.source === "historico" && existing.source === "pedido") found.set(key, candidate);
    }
  };
  for (const row of profiles) add({
    key: "conta:" + t(row.id), source: "conta", id: t(row.id),
    nome: t(row.nome), telefone: t(row.telefone), email: "",
    cidade: t(row.cidade), bairro: t(row.bairro),
    endereco: t(row.endereco), numero: t(row.numero), complemento: t(row.complemento), cep: t(row.cep),
  });
  for (const row of historicos) add({
    key: "historico:" + t(row.id), source: "historico", id: null,
    nome: t(row.nome), telefone: t(row.telefone_normalizado), email: t(row.email),
    cidade: t(row.cidade), bairro: t(row.bairro),
    endereco: t(row.rua), numero: t(row.numero), complemento: t(row.complemento), cep: t(row.cep),
  });
  for (const row of pedidos) add({
    key: "pedido:" + t(row.id), source: "pedido", id: null,
    nome: t(row.nome_cliente || row.cliente_nome), telefone: t(row.telefone_cliente || row.cliente_telefone),
    email: t(row.email_cliente || row.cliente_email),
    cidade: t(row.endereco_cidade), bairro: t(row.endereco_bairro),
    endereco: t(row.endereco_rua), numero: t(row.endereco_numero),
    complemento: t(row.endereco_complemento), cep: t(row.endereco_cep),
  });
  return [...found.values()].sort((a, b) => {
    const exactA = t(a.nome).toLocaleLowerCase("pt-BR") === searchTerm.toLocaleLowerCase("pt-BR") ? 0 : 1;
    const exactB = t(b.nome).toLocaleLowerCase("pt-BR") === searchTerm.toLocaleLowerCase("pt-BR") ? 0 : 1;
    return exactA - exactB || a.nome.localeCompare(b.nome, "pt-BR");
  }).slice(0, 20);
}
