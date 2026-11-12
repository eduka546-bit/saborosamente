export type ClienteComercial = {
  id?: string;
  profileId?: string;
  sorteioLeadId?: string;
  sorteioCadastradoEm?: string;
  whatsappOfertasAutorizado?: boolean;
  whatsappOfertasCadastradoEm?: string;
  grupoOfertasCadastrado?: boolean;
  preCadastroWhatsApp?: boolean;
  preCadastroCarrinho?: boolean;
  carrinhoAbandonadoRecente?: boolean;
  carrinhoAbandonadoEm?: string;
  historicoWhatsapp?: boolean;
  historicoWhatsappId?: string;
  chave: string;
  nome?: string;
  telefone?: string;
  email: string;
  cpf?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  cep?: string;
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
  cadastrosCarrinho: any[] = [],
  carrinhosAbandonados: any[] = [],
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
      rua: p.endereco,
      numero: p.numero,
      bairro: p.bairro,
      complemento: p.complemento,
      cep: p.cep,
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
        rua: o.endereco_rua || o.endereco || undefined,
        numero: o.endereco_numero || undefined,
        bairro: o.endereco_bairro || undefined,
        complemento: o.endereco_complemento || undefined,
        cep: o.endereco_cep || undefined,
        cidade: o.endereco_cidade || o.cidade || null,
        cadastradoEm: null,
        totalPedidos: 0,
        valorGasto: 0,
        ultimoPedido: null,
        pedidos: [],
      });
    const c = clients.get(key)!;
    c.pedidos.push(o);
    if (!c.cidade && (o.endereco_cidade || o.cidade)) c.cidade = o.endereco_cidade || o.cidade;
    if (!c.rua && (o.endereco_rua || o.endereco)) c.rua = o.endereco_rua || o.endereco;
    if (!c.numero && o.endereco_numero) c.numero = o.endereco_numero;
    if (!c.bairro && o.endereco_bairro) c.bairro = o.endereco_bairro;
    if (!c.complemento && o.endereco_complemento) c.complemento = o.endereco_complemento;
    if (!c.cep && o.endereco_cep) c.cep = o.endereco_cep;
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
      existing.grupoOfertasCadastrado = contact.origem === "grupo_ofertas";
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
        grupoOfertasCadastrado: contact.origem === "grupo_ofertas",
        whatsappOfertasCadastradoEm: contact.cadastrado_em ?? undefined,
        totalPedidos: 0,
        valorGasto: 0,
        ultimoPedido: null,
        pedidos: [],
      });
    }
  }
  // Carrinhos identificados recebem uma ficha comercial persistente no banco,
  // mesmo quando a pessoa não conclui uma conta de acesso.
  for (const cadastro of cadastrosCarrinho) {
    // Carrinho anônimo não é ficha de cliente: só entra quem se identificou pelo nome.
    if (!String(cadastro.nome || "").trim()) continue;
    const tel = phone(cadastro.telefone);
    const email = normalize(cadastro.email);
    const candidates = new Set([
      ...(phones.get(tel) || []),
      ...(emails.get(email) || []),
    ]);
    const profileKey = cadastro.user_id ? `perfil:${cadastro.user_id}` : null;
    const key = profileKey && clients.has(profileKey)
      ? profileKey
      : candidates.size === 1 ? [...candidates][0]
        : String(cadastro.chave || `carrinho:${cadastro.id}`);
    const existing = clients.get(key);
    if (existing) {
      existing.preCadastroCarrinho = !existing.profileId;
      if (!existing.nome) existing.nome = cadastro.nome || undefined;
      if (!existing.telefone && tel) existing.telefone = tel;
      if ((!existing.email || existing.email === "Não informado") && cadastro.email) existing.email = cadastro.email;
      if (!existing.cadastradoEm) existing.cadastradoEm = cadastro.primeiro_contato_em || cadastro.created_at || null;
    } else {
      clients.set(key, {
        chave: key,
        nome: cadastro.nome || undefined,
        telefone: tel || undefined,
        email: cadastro.email || "Não informado",
        cidade: null,
        cadastradoEm: cadastro.primeiro_contato_em || cadastro.created_at || null,
        preCadastroCarrinho: true,
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
  const candidatos = [...clients.values()];
  const pai = candidatos.map((_, indice) => indice);
  const raiz = (indice: number): number => pai[indice] === indice ? indice : (pai[indice] = raiz(pai[indice]));
  const unir = (a: number, b: number) => {
    const ra = raiz(a), rb = raiz(b);
    if (ra !== rb) pai[rb] = ra;
  };
  const chaves = new Map<string, number>();
  candidatos.forEach((cliente, indice) => {
    const valores = [
      String(cliente.nome || "").trim() ? `nome:${normalize(cliente.nome)}` : "",
      /^\d{10,11}$/.test(phone(cliente.telefone)) ? `tel:${phone(cliente.telefone)}` : "",
      cliente.email && normalize(cliente.email) !== "nao informado" ? `email:${normalize(cliente.email)}` : "",
    ].filter(Boolean);
    for (const valor of valores) {
      const existente = chaves.get(valor);
      if (existente === undefined) chaves.set(valor, indice);
      else unir(indice, existente);
    }
  });
  const grupos = new Map<number, ClienteComercial[]>();
  candidatos.forEach((cliente, indice) => {
    const grupo = raiz(indice);
    grupos.set(grupo, [...(grupos.get(grupo) || []), cliente]);
  });
  const quantidadeInfo = (cliente: ClienteComercial) => [cliente.nome, cliente.telefone, cliente.email !== "Não informado" ? cliente.email : "", cliente.cpf, cliente.rua, cliente.numero, cliente.bairro, cliente.complemento, cliente.cep, cliente.cidade].filter(Boolean).length;
  const unificados = [...grupos.values()].map((grupo) => {
    const ordenados = [...grupo].sort((a, b) =>
      b.totalPedidos - a.totalPedidos ||
      quantidadeInfo(b) - quantidadeInfo(a) ||
      date(b.ultimoPedido || b.cadastradoEm) - date(a.ultimoPedido || a.cadastradoEm) ||
      a.chave.localeCompare(b.chave),
    );
    const principal = { ...ordenados[0], pedidos: [] as any[] };
    const porPedido = new Map<string, any>();
    for (const cliente of ordenados) {
      for (const pedido of cliente.pedidos) porPedido.set(String(pedido.id), pedido);
      for (const campo of ["id", "profileId", "sorteioLeadId", "historicoWhatsappId", "nome", "telefone", "cpf", "rua", "numero", "bairro", "complemento", "cep", "cidade"] as const) {
        if (!principal[campo] && cliente[campo]) (principal as any)[campo] = cliente[campo];
      }
      if ((!principal.email || principal.email === "Não informado") && cliente.email && cliente.email !== "Não informado") principal.email = cliente.email;
      // A data da ficha principal preserva o cadastro mais relevante (conta/pedido),
      // sem substituí-la por uma captura anterior de sorteio ou carrinho.
      if (!principal.cadastradoEm && cliente.cadastradoEm) principal.cadastradoEm = cliente.cadastradoEm;
      principal.sorteioCadastradoEm ||= cliente.sorteioCadastradoEm;
      principal.whatsappOfertasAutorizado ||= cliente.whatsappOfertasAutorizado;
      principal.grupoOfertasCadastrado ||= cliente.grupoOfertasCadastrado;
      principal.preCadastroWhatsApp ||= cliente.preCadastroWhatsApp;
      principal.preCadastroCarrinho ||= cliente.preCadastroCarrinho;
      principal.historicoWhatsapp ||= cliente.historicoWhatsapp;
    }
    principal.pedidos = [...porPedido.values()];
    principal.totalPedidos = principal.pedidos.filter((pedido) => !normalize(pedido.status).startsWith("cancel")).length;
    principal.valorGasto = principal.pedidos.filter((pedido) => !normalize(pedido.status).startsWith("cancel")).reduce((total, pedido) => total + (Number(pedido.valor_total) || 0), 0);
    principal.ultimoPedido = principal.pedidos.reduce<string | null>((ultimo, pedido) => date(pedido.created_at) > date(ultimo) ? pedido.created_at : ultimo, null);
    return principal;
  });
  const limiteCarrinho = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const carrinho of carrinhosAbandonados) {
    const quando = carrinho.updated_at || carrinho.created_at;
    if (normalize(carrinho.status) !== "abandonado" || date(quando) < limiteCarrinho) continue;
    const nome = normalize(carrinho.nome), tel = phone(carrinho.telefone), email = normalize(carrinho.email);
    for (const cliente of unificados) {
      if ((nome && normalize(cliente.nome) === nome) || (tel && phone(cliente.telefone) === tel) || (email && email !== "nao informado" && normalize(cliente.email) === email)) {
        cliente.carrinhoAbandonadoRecente = true;
        if (!cliente.carrinhoAbandonadoEm || date(quando) > date(cliente.carrinhoAbandonadoEm)) cliente.carrinhoAbandonadoEm = quando;
      }
    }
  }
  // Sem nome e sem cadastro/pedido não representa um cliente e não deve aparecer na base comercial.
  return unificados.filter((cliente) => Boolean(String(cliente.nome || "").trim()) || Boolean(cliente.profileId) || cliente.totalPedidos > 0);
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
      (!(c.profileId || c.sorteioLeadId || c.preCadastroWhatsApp || c.preCadastroCarrinho) ||
        !date(c.cadastradoEm) ||
        agora - date(c.cadastradoEm) > Number(filtros.cadastro) * day ||
        date(c.cadastradoEm) > agora)
    )
      return false;
    const s = filtros.segmento;
    if (s === "pre_cadastro_whatsapp" && !c.preCadastroWhatsApp) return false;
    if (s === "grupo_ofertas" && !c.grupoOfertasCadastrado) return false;
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
      case "ativos":
        delta = Number(Boolean(b.carrinhoAbandonadoRecente)) - Number(Boolean(a.carrinhoAbandonadoRecente)) ||
          date(b.carrinhoAbandonadoEm) - date(a.carrinhoAbandonadoEm) ||
          date(b.ultimoPedido || b.cadastradoEm) - date(a.ultimoPedido || a.cadastradoEm);
        break;
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
