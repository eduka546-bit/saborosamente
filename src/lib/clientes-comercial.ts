export type ClienteComercial = {
  id?: string;
  profileId?: string;
  sorteioLeadId?: string;
  sorteioCadastradoEm?: string;
  whatsappOfertasAutorizado?: boolean;
  whatsappOfertasCadastradoEm?: string;
  preCadastroWhatsApp?: boolean;
  historicoWhatsapp?: boolean;
  historicoWhatsappId?: string;
  chave: string;
  nome?: string;
  telefone?: string;
  email: string;
  cpf?: string;
  bairro?: string;
  cidade: string | null;
  cadastradoEm: string | null;
  totalPedidos: number;
  valorGasto: number;
  ultimoPedido: string | null;
  pedidos: any[];
};
const normalize = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
const phone = (v: unknown) => {
  const n = String(v ?? "").replace(/\D/g, "");
  return n.length > 11 && n.startsWith("55") ? n.slice(2) : n;
};
const date = (v: unknown) => {
  const n = Date.parse(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};
export function montarClientesComerciais(
  profiles: any[],
  orders: any[],
  leads: any[] = [],
  whatsappContacts: any[] = [],
  historicoWhatsapp: any[] = [],
): ClienteComercial[] {
  const clients = new Map<string, ClienteComercial>();
  const phones = new Map<string, Set<string>>(),
    emails = new Map<string, Set<string>>();
  const alias = (map: Map<string, Set<string>>, value: string, key: string) => {
    if (!value) return;
    const set = map.get(value) || new Set<string>();
    set.add(key);
    map.set(value, set);
  };
  for (const p of profiles) {
    const key = `perfil:${p.id}`;
    clients.set(key, {
      id: p.id,
      profileId: p.id,
      chave: key,
      nome: p.nome,
      telefone: p.telefone,
      email: p.email || "Não informado",
      cpf: p.cpf,
      bairro: p.bairro,
      cidade: p.cidade || null,
      cadastradoEm: p.created_at || null,
      totalPedidos: 0,
      valorGasto: 0,
      ultimoPedido: null,
      pedidos: [],
    });
    alias(phones, phone(p.telefone), key);
    alias(emails, normalize(p.email), key);
  }
  for (const o of [...orders].sort(
    (a, b) => date(b.created_at) - date(a.created_at) || String(a.id).localeCompare(String(b.id)),
  )) {
    const direct = o.user_id ? `perfil:${o.user_id}` : null;
    const candidates = new Set([
      ...(phones.get(phone(o.telefone_cliente)) || []),
      ...(emails.get(normalize(o.email_cliente)) || []),
    ]);
    const key =
      direct ||
      (candidates.size === 1
        ? [...candidates][0]
        : `convidado:${phone(o.telefone_cliente) || normalize(o.email_cliente) || o.id}`);
    if (!clients.has(key))
      clients.set(key, {
        id: o.user_id || undefined,
        chave: key,
        nome: o.nome_cliente,
        telefone: o.telefone_cliente,
        email: o.email_cliente || "Não informado",
        cidade: o.cidade || null,
        cadastradoEm: null,
        totalPedidos: 0,
        valorGasto: 0,
        ultimoPedido: null,
        pedidos: [],
      });
    const c = clients.get(key)!;
    c.pedidos.push(o);
    if (!c.cidade && o.cidade) c.cidade = o.cidade;
    if (normalize(o.status).startsWith("cancel")) continue;
    c.totalPedidos++;
    c.valorGasto += Number(o.valor_total) || 0;
    if (date(o.created_at) > date(c.ultimoPedido)) c.ultimoPedido = o.created_at;
  }
  // Inclui participantes do sorteio sem lhes criar artificialmente uma conta de acesso.
  // Combina com perfil ou cliente convidado apenas se o telefone identificar
  // exatamente um contato, evitando colar dados de pessoas diferentes.
  for (const lead of leads) {
    const tel = phone(lead.telefone);
    const candidateKeys = [...clients.entries()]
      .filter(([, c]) => tel.length >= 10 && phone(c.telefone) === tel)
      .map(([key]) => key);
    const profileKey = lead.user_id ? `perfil:${lead.user_id}` : null;
    const key = profileKey && clients.has(profileKey)
      ? profileKey
      : candidateKeys.length === 1
        ? candidateKeys[0]
        : `sorteio:${lead.id}`;
    const existing = clients.get(key);
    if (existing) {
      existing.sorteioLeadId = lead.id;
      existing.sorteioCadastradoEm = lead.created_at ?? null;
      if (!existing.nome) existing.nome = lead.nome;
      if (!existing.telefone) existing.telefone = lead.telefone;
    } else {
      clients.set(key, {
        chave: key,
        sorteioLeadId: lead.id,
        sorteioCadastradoEm: lead.created_at ?? null,
        nome: lead.nome,
        telefone: lead.telefone,
        email: "Não informado",
        cidade: null,
        cadastradoEm: lead.created_at ?? null,
        totalPedidos: 0,
        valorGasto: 0,
        ultimoPedido: null,
        pedidos: [],
      });
    }
  }
  // Capturas somente por WhatsApp entram na mesma ficha comercial quando já
  // existe o telefone, sem criar conta no Auth nem sobrescrever nome do cliente.
  // Conflitos antigos entre contas distintas são preservados: a autorização
  // fica em uma ficha existente, nunca criando uma terceira duplicata.
  for (const contact of whatsappContacts) {
    const tel = phone(contact.telefone);
    if (!/^\d{10,11}$/.test(tel)) continue;
    const matchingKeys = [...clients.entries()]
      .filter(([, c]) => phone(c.telefone) === tel)
      .map(([key]) => key);
    const key = matchingKeys.find((k) => Boolean(clients.get(k)?.profileId)) ||
      matchingKeys.find((k) => Boolean(clients.get(k)?.totalPedidos)) ||
      matchingKeys[0] || `whatsapp:${tel}`;
    const existing = clients.get(key);
    if (existing) {
      existing.whatsappOfertasAutorizado = Boolean(contact.consentimento);
      existing.whatsappOfertasCadastradoEm = contact.cadastrado_em ?? undefined;
      if (!existing.nome && String(contact.nome ?? "").trim()) {
        existing.nome = String(contact.nome).trim();
      }
      if (!existing.telefone) existing.telefone = tel;
      // Não substituir a data do cadastro real de uma conta existente.
      if (!existing.cadastradoEm) existing.cadastradoEm = contact.cadastrado_em ?? null;
      if (!existing.profileId && !existing.sorteioLeadId) {
        existing.preCadastroWhatsApp = true;
      }
    } else {
      clients.set(key, {
        chave: key,
        nome: String(contact.nome ?? "").trim() || undefined,
        telefone: tel,
        email: "Não informado",
        cidade: null,
        cadastradoEm: contact.cadastrado_em ?? null,
        preCadastroWhatsApp: true,
        whatsappOfertasAutorizado: Boolean(contact.consentimento),
        whatsappOfertasCadastradoEm: contact.cadastrado_em ?? undefined,
        totalPedidos: 0,
        valorGasto: 0,
        ultimoPedido: null,
        pedidos: [],
      });
    }
  }
  // Fichas persistentes de pedidos manuais, inclusive quando ainda não existe
  // cadastro com login. Nunca geram consentimento de marketing.
  for (const ficha of historicoWhatsapp) {
    const tel = phone(ficha.telefone_normalizado);
    const candidates = [...clients.entries()]
      .filter(([, c]) => tel.length >= 10 && phone(c.telefone) === tel)
      .map(([key]) => key);
    const key = candidates.length === 1 ? candidates[0] : "whatsapp-historico:" + ficha.id;
    const existing = clients.get(key);
    if (existing) {
      existing.historicoWhatsapp = true;
      existing.historicoWhatsappId = ficha.id;
      if (!existing.nome) existing.nome = ficha.nome || undefined;
      if (!existing.telefone && tel) existing.telefone = tel;
      if ((!existing.email || existing.email === "Não informado") && ficha.email) existing.email = ficha.email;
      if (!existing.cidade && ficha.cidade) existing.cidade = ficha.cidade;
      if (!existing.bairro && ficha.bairro) existing.bairro = ficha.bairro;
      if (!existing.cadastradoEm) existing.cadastradoEm = ficha.primeiro_pedido_em ?? null;
    } else {
      clients.set(key, {
        chave: key,
        nome: ficha.nome || undefined,
        telefone: tel || undefined,
        email: ficha.email || "Não informado",
        bairro: ficha.bairro || undefined,
        cidade: ficha.cidade || null,
        cadastradoEm: ficha.primeiro_pedido_em ?? null,
        historicoWhatsapp: true,
        historicoWhatsappId: ficha.id,
        totalPedidos: 0,
        valorGasto: 0,
        ultimoPedido: null,
        pedidos: [],
      });
    }
  }
  return [...clients.values()];
}
export type FiltrosClientes = {
  busca: string;
  cidade: string;
  segmento: string;
  cadastro: string;
  ordem: string;
};
export function filtrarClientesComerciais(
  clients: ClienteComercial[],
  filtros: FiltrosClientes,
  agora = Date.now(),
) {
  const term = normalize(filtros.busca),
    digits = phone(filtros.busca);
  const day = 86400000;
  const result = clients.filter((c) => {
    if (
      term &&
      ![c.nome, c.email, c.telefone].some((v) => normalize(v).includes(term)) &&
      !(digits && phone(c.telefone).includes(digits))
    )
      return false;
    if (
      filtros.cidade !== "TODAS" &&
      (filtros.cidade === "SEM_CIDADE"
        ? !!c.cidade?.trim()
        : normalize(c.cidade) !== normalize(filtros.cidade))
    )
      return false;
    if (
      filtros.cadastro !== "todos" &&
      (!(c.profileId || c.sorteioLeadId || c.preCadastroWhatsApp) ||
        !date(c.cadastradoEm) ||
        agora - date(c.cadastradoEm) > Number(filtros.cadastro) * day ||
        date(c.cadastradoEm) > agora)
    )
      return false;
    const s = filtros.segmento;
    if (s === "pre_cadastro_whatsapp" && !c.preCadastroWhatsApp) return false;
    if (s === "sem_pedidos" && c.pedidos.length !== 0) return false;
    if (s === "cancelados" && !(c.pedidos.length > 0 && c.totalPedidos === 0)) return false;
    if (s === "primeira" && c.totalPedidos !== 1) return false;
    if (s === "recorrentes" && c.totalPedidos < 2) return false;
    if (
      s.startsWith("inativos_") &&
      (!c.ultimoPedido || agora - date(c.ultimoPedido) < Number(s.split("_")[1]) * day)
    )
      return false;
    return true;
  });
  return result.sort((a, b) => {
    let delta = 0;
    switch (filtros.ordem) {
      case "nome":
        delta = String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
        break;
      case "pedidos":
        delta = b.totalPedidos - a.totalPedidos;
        break;
      case "gasto":
        delta = b.valorGasto - a.valorGasto;
        break;
      case "ticket":
        delta =
          (b.totalPedidos ? b.valorGasto / b.totalPedidos : 0) -
          (a.totalPedidos ? a.valorGasto / a.totalPedidos : 0);
        break;
      case "ultima":
        delta = date(b.ultimoPedido) - date(a.ultimoPedido);
        break;
      case "inativos":
        delta = (date(a.ultimoPedido) || Infinity) - (date(b.ultimoPedido) || Infinity);
        break;
      default:
        delta = date(b.cadastradoEm) - date(a.cadastradoEm);
    }
    return (Number.isNaN(delta) ? 0 : delta) || a.chave.localeCompare(b.chave);
  });
}
