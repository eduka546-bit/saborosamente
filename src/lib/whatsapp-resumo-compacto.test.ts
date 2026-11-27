import { describe, expect, it } from "vitest";
import { interpretarResumoWhatsapp } from "./whatsapp-order-parser";

describe("pedidos curtos por WhatsApp sem cabeçalho", () => {
  const curto = "20x14,00\n12xTD(8) + 8xTD(23)";

  it("reconhece vinte marmitas P Black e o subtotal integral", () => {
    const p = interpretarResumoWhatsapp(curto, { blackFridayAtiva: true });
    expect(p.itens).toEqual([
      { codigo: "TD08", quantidade: 12 },
      { codigo: "TD23", quantidade: 8 },
    ]);
    expect(p.quantidadeDeclarada).toBe(20);
    expect(p.subtotalDeclarado).toBe(280);
    expect(p.precoUnitario).toBe(14);
    expect(p.peso).toBe("200g");
    expect(p.itensDetalhados).toEqual([
      { codigo: "TD08", quantidade: 12, peso: "200g", pesoExibicao: "200g", precoUnitario: 14 },
      { codigo: "TD23", quantidade: 8, peso: "200g", pesoExibicao: "200g", precoUnitario: 14 },
    ]);
    expect(p.avisos).toEqual([]);
    expect(p.nome).toBeNull();
    expect(p.taxaEntrega).toBeNull();
    expect(p.pagamento).toBeNull();
    expect(p.totalPedido).toBeNull();
  });

  it("infere M por R$17 e G por R$20 apenas na Black", () => {
    for (const [preco, peso] of [[17,"300g"],[20,"400g"]] as const) {
      const p = interpretarResumoWhatsapp(`5x${preco},00\n2xTD08 + 3xTD23`, {blackFridayAtiva:true});
      expect(p.peso).toBe(peso);
      expect(p.itensDetalhados.every(item=>item.peso===peso && item.precoUnitario===preco)).toBe(true);
      expect(p.avisos).toEqual([]);
    }
  });

  it("fora da Black exige conferir a gramatura, sem supor P pelo preço", () => {
    const p = interpretarResumoWhatsapp(curto);
    expect(p.itens.reduce((sum,i)=>sum+i.quantidade,0)).toBe(20);
    expect(p.precoUnitario).toBe(14);
    expect(p.peso).toBe("300g");
    expect(p.avisos).toContain("Tamanho não informado: confirme 200g (P), 300g (M) ou 400g (G) antes de salvar.");
  });

  it("lê tamanho declarado mesmo fora da Black", () => {
    const p = interpretarResumoWhatsapp("20x14,00\nTamanho: P\n12xTD(8) + 8xTD(23)");
    expect(p.peso).toBe("200g");
    expect(p.avisos).toEqual([]);
  });

  it("avisa sobre divergência entre quantidade anunciada e códigos", () => {
    const p = interpretarResumoWhatsapp("20x14,00\n12xTD(8) + 7xTD(23)", {blackFridayAtiva:true});
    expect(p.quantidadeDeclarada).toBe(20);
    expect(p.itens.reduce((n,i)=>n+i.quantidade,0)).toBe(19);
    expect(p.avisos.some(m=>m.includes("20 unidades")&&m.includes("19"))).toBe(true);
  });

  it("não altera resumos de códigos sem preço informado", () => {
    const p = interpretarResumoWhatsapp("3xTD(01-09)\n2xTD28", {blackFridayAtiva:true});
    expect(p.itens.map(i=>i.quantidade)).toEqual([3,3,2]);
    expect(p.precoUnitario).toBeNull();
    expect(p.avisos).toEqual([]);
  });
});
