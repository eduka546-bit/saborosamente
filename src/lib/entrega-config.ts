// Configuração de entrega programada (dias e horários que o cliente pode escolher).
// Fonte única usada pelo admin (aba Parâmetros) e pelo checkout.
// Os defaults abaixo espelham exatamente o que o site já mostrava:
//   - dias: segunda a sábado (pula domingo)
//   - horários: faixas de 1h das 09:30 às 19:00
//   - janela: próximos 7 dias úteis

export interface EntregaConfig {
  // Índices de dia da semana permitidos (0=Dom, 1=Seg, ... 6=Sáb)
  diasPermitidos: number[];
  // Faixas de horário exibidas ao cliente (texto livre)
  horarios: string[];
  // Quantas datas oferecer no seletor
  qtdDatas: number;
}

export const DEFAULT_ENTREGA_CONFIG: EntregaConfig = {
  diasPermitidos: [1, 2, 3, 4, 5, 6], // seg a sáb (pula domingo)
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

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

// Normaliza o que vier do banco (parametros_loja.entrega) para uma config válida,
// caindo nos defaults quando algum campo faltar ou vier inválido.
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
  return { diasPermitidos: dias.length ? dias : DEFAULT_ENTREGA_CONFIG.diasPermitidos, horarios, qtdDatas: qtd };
}

// Gera as próximas datas de entrega respeitando os dias permitidos.
export function gerarDatasEntrega(cfg: EntregaConfig): { valor: string; label: string }[] {
  const out: { valor: string; label: string }[] = [];
  const hoje = new Date();
  let offset = 0;
  const permitidos = new Set(cfg.diasPermitidos);
  while (out.length < cfg.qtdDatas && offset < 60) {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() + offset);
    offset++;
    if (!permitidos.has(dia.getDay())) continue;
    const dd = String(dia.getDate()).padStart(2, "0");
    const mm = String(dia.getMonth() + 1).padStart(2, "0");
    const yyyy = dia.getFullYear();
    out.push({
      valor: `${dd}/${mm}/${yyyy}`,
      label: `${dd}/${mm}/${yyyy} (${DIAS_SEMANA[dia.getDay()]})`,
    });
  }
  return out;
}
