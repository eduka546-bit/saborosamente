// Configuração de entrega programada.
// A agenda global continua configurável, mas as rotas regionais abaixo têm regras
// comerciais próprias que não podem ser ignoradas pelo checkout.

export interface EntregaConfig {
  // Índices de dia da semana permitidos (0=Dom, 1=Seg, ... 6=Sáb)
  diasPermitidos: number[];
  // Faixas de horário exibidas ao cliente (texto livre)
  horarios: string[];
  // Quantas datas oferecer no seletor
  qtdDatas: number;
}

export interface RegraEntregaCidade {
  diasPermitidos?: number[];
  horarios?: string[];
  minUnidades?: number;
  cutoffMesmoDia?: { hora: number; minuto: number };
  descricao?: string;
}

export const DEFAULT_ENTREGA_CONFIG: EntregaConfig = {
  diasPermitidos: [1, 2, 3, 4, 5, 6],
  horarios: [
    "09:30h ~ 10:30h",
    "10:30h ~ 11:30h",
    "11:30h ~ 12:30h",
    "12:30h ~ 13:30h",
    "13:30h ~ 14:30h",
    "14:30h ~ 15:30h",
    "15:30h ~ 16:30h",
    "16:30h ~ 17:30h",
    "17:30h ~ 18:30h",
    "18:30h ~ 19:00h",
  ],
  qtdDatas: 7,
};

const HORARIOS_TARDE = [
  "13:30h ~ 14:30h",
  "14:30h ~ 15:30h",
  "15:30h ~ 16:30h",
  "16:30h ~ 17:30h",
  "17:30h ~ 18:30h",
];

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

function semAcentos(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function regraEntregaCidade(cidade?: string): RegraEntregaCidade {
  const c = semAcentos(cidade || "");

  if (c === "mafra" || c === "rio negro") {
    return {
      diasPermitidos: [5],
      horarios: HORARIOS_TARDE,
      minUnidades: 5,
      cutoffMesmoDia: { hora: 11, minuto: 0 },
      descricao: "Entregas às sextas-feiras à tarde. Pedidos para a sexta devem ser feitos até 11h.",
    };
  }

  if (["corupa", "rio negrinho", "campo alegre", "pien"].includes(c)) {
    return {
      minUnidades: 5,
      cutoffMesmoDia: { hora: 11, minuto: 0 },
      descricao: "Pedidos para entrega no mesmo dia devem ser feitos até 11h. Pedido mínimo: 5 unidades.",
    };
  }

  return {};
}

export function normalizarEntregaConfig(raw: any): EntregaConfig {
  const cfg = raw ?? {};
  const dias = Array.isArray(cfg.diasPermitidos)
    ? cfg.diasPermitidos.map(Number).filter((n: number) => n >= 0 && n <= 6)
    : DEFAULT_ENTREGA_CONFIG.diasPermitidos;
  const horarios =
    Array.isArray(cfg.horarios) && cfg.horarios.length > 0
      ? cfg.horarios.map((h: any) => String(h)).filter(Boolean)
      : DEFAULT_ENTREGA_CONFIG.horarios;
  const qtd =
    Number.isFinite(Number(cfg.qtdDatas)) && Number(cfg.qtdDatas) > 0
      ? Math.min(30, Math.floor(Number(cfg.qtdDatas)))
      : DEFAULT_ENTREGA_CONFIG.qtdDatas;
  return {
    diasPermitidos: dias.length ? dias : DEFAULT_ENTREGA_CONFIG.diasPermitidos,
    horarios,
    qtdDatas: qtd,
  };
}

function agoraSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function dateKey(year: number, month: number, day: number) {
  return year * 10000 + month * 100 + day;
}

function parseDataBR(valor: string) {
  const [dd, mm, yyyy] = String(valor || "").split("/").map(Number);
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (
    d.getUTCFullYear() !== yyyy ||
    d.getUTCMonth() !== mm - 1 ||
    d.getUTCDate() !== dd
  ) {
    return null;
  }
  return { dd, mm, yyyy, weekday: d.getUTCDay() };
}

export function configEntregaParaCidade(raw: any, cidade?: string): EntregaConfig & RegraEntregaCidade {
  const base = normalizarEntregaConfig(raw);
  const regra = regraEntregaCidade(cidade);
  return {
    ...base,
    ...regra,
    diasPermitidos: regra.diasPermitidos ?? base.diasPermitidos,
    horarios: regra.horarios ?? base.horarios,
  };
}

export function gerarDatasEntrega(
  cfg: EntregaConfig & Pick<RegraEntregaCidade, "cutoffMesmoDia">,
): { valor: string; label: string }[] {
  const out: { valor: string; label: string }[] = [];
  const agora = agoraSaoPaulo();
  const hojeUtc = new Date(Date.UTC(agora.year, agora.month - 1, agora.day));
  let offset = 0;
  const permitidos = new Set(cfg.diasPermitidos);

  while (out.length < cfg.qtdDatas && offset < 90) {
    const dia = new Date(hojeUtc);
    dia.setUTCDate(hojeUtc.getUTCDate() + offset);
    offset++;

    if (!permitidos.has(dia.getUTCDay())) continue;

    const mesmoDia =
      dia.getUTCFullYear() === agora.year &&
      dia.getUTCMonth() + 1 === agora.month &&
      dia.getUTCDate() === agora.day;

    if (mesmoDia && cfg.cutoffMesmoDia) {
      const passou =
        agora.hour > cfg.cutoffMesmoDia.hora ||
        (agora.hour === cfg.cutoffMesmoDia.hora && agora.minute >= cfg.cutoffMesmoDia.minuto);
      if (passou) continue;
    }

    const dd = String(dia.getUTCDate()).padStart(2, "0");
    const mm = String(dia.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = dia.getUTCFullYear();

    out.push({
      valor: `${dd}/${mm}/${yyyy}`,
      label: `${dd}/${mm}/${yyyy} (${DIAS_SEMANA[dia.getUTCDay()]})`,
    });
  }

  return out;
}

export function validarEntregaProgramada(args: {
  cidade?: string;
  data: string;
  horario: string;
  rawConfig?: any;
  totalUnidades: number;
}) {
  const cfg = configEntregaParaCidade(args.rawConfig, args.cidade);
  const parsed = parseDataBR(args.data);
  if (!parsed) return { ok: false as const, erro: "Data de entrega inválida." };

  const agora = agoraSaoPaulo();
  if (dateKey(parsed.yyyy, parsed.mm, parsed.dd) < dateKey(agora.year, agora.month, agora.day)) {
    return { ok: false as const, erro: "A data de entrega já passou." };
  }

  if (!cfg.diasPermitidos.includes(parsed.weekday)) {
    return { ok: false as const, erro: "Esta cidade não possui entrega na data escolhida." };
  }

  if (!cfg.horarios.includes(args.horario)) {
    return { ok: false as const, erro: "Horário de entrega indisponível para esta cidade." };
  }

  const mesmoDia =
    parsed.yyyy === agora.year && parsed.mm === agora.month && parsed.dd === agora.day;
  if (mesmoDia && cfg.cutoffMesmoDia) {
    const passou =
      agora.hour > cfg.cutoffMesmoDia.hora ||
      (agora.hour === cfg.cutoffMesmoDia.hora && agora.minute >= cfg.cutoffMesmoDia.minuto);
    if (passou) {
      return { ok: false as const, erro: "O horário limite para pedidos de hoje já passou." };
    }
  }

  if ((cfg.minUnidades ?? 0) > 0 && args.totalUnidades < (cfg.minUnidades ?? 0)) {
    return {
      ok: false as const,
      erro: `Para esta cidade, o pedido mínimo é de ${cfg.minUnidades} unidades.`,
    };
  }

  return { ok: true as const, config: cfg };
}
