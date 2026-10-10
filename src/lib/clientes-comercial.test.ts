import { describe, expect, it } from "vitest";
import { montarClientesComerciais, filtrarClientesComerciais } from "./clientes-comercial";
const profiles = [
  {
    id: "a",
    nome: "José",
    email: "a@example.com",
    telefone: "(47) 99999-0000",
    created_at: "2026-10-09",
    cidade: "São Bento do Sul",
  },
  { id: "b", nome: "Maria", created_at: "2026-09-01" },
];
const order = {
  id: "o1",
  user_id: "a",
  status: "entregue",
  valor_total: "40.50",
  created_at: "2026-08-01",
};
const filters = {
  busca: "",
  cidade: "TODAS",
  segmento: "todos",
  cadastro: "todos",
  ordem: "recentes",
};
describe("filtros comerciais de clientes", () => {
  it("vincula pedido convidado por telefone e não classifica comprador como sem pedidos", () => {
    const c = montarClientesComerciais(profiles, [
      { ...order, user_id: null, telefone_cliente: "+55 47 99999-0000" },
    ]);
    expect(c).toHaveLength(2);
    expect(c[0].valorGasto).toBe(40.5);
    expect(
      filtrarClientesComerciais(c, { ...filters, segmento: "sem_pedidos" }).map((x) => x.id),
    ).toEqual(["b"]);
  });
  it("preserva cancelados no histórico sem inflar indicadores", () => {
    const c = montarClientesComerciais(profiles, [{ ...order, status: "cancelado" }]);
    expect(c[0].pedidos).toHaveLength(1);
    expect(c[0].totalPedidos).toBe(0);
    expect(c[0].ultimoPedido).toBeNull();
    expect(filtrarClientesComerciais(c, { ...filters, segmento: "cancelados" })).toHaveLength(1);
  });
  it("combina cidade, busca sem acento e inatividade", () => {
    const c = montarClientesComerciais(profiles, [order]);
    expect(
      filtrarClientesComerciais(
        c,
        { ...filters, busca: "jose", cidade: "São Bento do Sul", segmento: "inativos_60" },
        Date.parse("2026-10-10"),
      ),
    ).toHaveLength(1);
    expect(
      filtrarClientesComerciais(
        c,
        { ...filters, segmento: "inativos_90" },
        Date.parse("2026-10-10"),
      ),
    ).toHaveLength(0);
  });
  it("ordena por cadastro real e não inventa cadastro para convidados", () => {
    const c = montarClientesComerciais(profiles, [
      { ...order, user_id: null, email_cliente: "convidado@example.com" },
    ]);
    expect(filtrarClientesComerciais(c, filters)[0].id).toBe("a");
    expect(
      filtrarClientesComerciais(c, { ...filters, cadastro: "7" }, Date.parse("2026-10-10")).map(
        (x) => x.id,
      ),
    ).toEqual(["a"]);
  });
  it("não associa telefone ambíguo nem une clientes sem contato", () => {
    const c = montarClientesComerciais(
      [...profiles, { ...profiles[0], id: "c" }],
      [
        { ...order, user_id: null, telefone_cliente: profiles[0].telefone },
        { ...order, id: "o2", user_id: null },
        { ...order, id: "o3", user_id: null },
      ],
    );
    expect(c).toHaveLength(6);
    expect(c.find((x) => x.id === "a")?.totalPedidos).toBe(0);
  });
  it("soma valores numéricos e organiza clientes recorrentes e maior gasto", () => {
    const c = montarClientesComerciais(profiles, [
      order,
      { ...order, id: "o2", valor_total: "60" },
    ]);
    expect(c[0].valorGasto).toBe(100.5);
    expect(
      filtrarClientesComerciais(c, { ...filters, segmento: "recorrentes", ordem: "gasto" })[0].id,
    ).toBe("a");
  });
});


describe("integração dos inscritos no sorteio à aba Clientes", () => {
  const lead = {
    id: "lead-1",
    nome: "Visitante sorteio",
    telefone: "47988887777",
    created_at: "2026-10-10T14:21:00Z",
    user_id: null,
  };
  it("mostra participante sem conta como contato e permite buscar, filtrar por data", () => {
    const base = montarClientesComerciais([], [], [lead]);
    expect(base).toHaveLength(1);
    expect(base[0].profileId).toBeUndefined();
    expect(base[0]).toMatchObject({
      nome: "Visitante sorteio",
      sorteioLeadId: "lead-1",
      totalPedidos: 0,
      cadastradoEm: lead.created_at,
    });
    expect(filtrarClientesComerciais(base, { ...filters, busca: "4798888" })).toHaveLength(1);
    expect(filtrarClientesComerciais(base, { ...filters, cadastro: "7" }, Date.parse("2026-10-10T16:00:00Z"))).toHaveLength(1);
  });
  it("une sorteio ao perfil existente com o mesmo telefone sem criar segundo contato", () => {
    const base = montarClientesComerciais(
      [{ ...profiles[0], telefone: "+55 (47) 98888-7777" }],
      [],
      [lead],
    );
    expect(base).toHaveLength(1);
    expect(base[0].sorteioLeadId).toBe("lead-1");
    expect(base[0].profileId).toBe("a");
  });
  it("une sorteio a pedidos de convidado por telefone", () => {
    const base = montarClientesComerciais([], [
      { ...order, user_id: null, telefone_cliente: "(47) 98888-7777", nome_cliente: "Convidado" },
    ], [lead]);
    expect(base).toHaveLength(1);
    expect(base[0].totalPedidos).toBe(1);
    expect(base[0].sorteioLeadId).toBe("lead-1");
  });
  it("não cola o lead em perfis com telefones ambíguos", () => {
    const duplicados = [
      { ...profiles[0], telefone: lead.telefone },
      { ...profiles[0], id: "b", telefone: lead.telefone },
    ];
    const base = montarClientesComerciais(duplicados, [], [lead]);
    expect(base).toHaveLength(3);
    expect(base.find(c => c.sorteioLeadId === "lead-1")?.profileId).toBeUndefined();
  });
});
