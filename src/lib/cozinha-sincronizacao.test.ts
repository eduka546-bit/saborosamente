import { describe, expect, it } from 'vitest';
import { comprasFicha, sincronizarIngredientes, sincronizarMontagem, type CatalogoFicha } from './cozinha-sincronizacao';

const catalogo: CatalogoFicha = {
  preparacoes: [{id:'molho',nome:'Molho Bolonhesa',rendimento_final_g:1000}],
  ingredientes: [{id:'carne',nome:'Carne moída',tipo_rendimento:'perda',quebra_percentual:30}, {id:'arroz',nome:'Arroz branco',tipo_rendimento:'ganho',fator_rendimento:2.9}],
  bases: new Map([['molho',[{ingrediente_id:'carne',quantidade:700}]]]),
};
const linha = {preparacao_id:'molho',gramas_200:120,gramas_300:180,gramas_400:240};
const camadas = [1,2,3].map(i=>({id:String(i),nome:'Molho Bolonhesa',gramas_200:40,gramas_300:60,gramas_400:80}));

describe('sincronização da ficha',()=>{
  it('soma todas as camadas e recalcula a compra uma única vez',()=>{
    const montagem=camadas.map((m,i)=>({...m,gramas_200:i===0?50:40}));
    const r=sincronizarMontagem([linha],montagem,catalogo);
    expect(r.linhas[0].gramas_200).toBe(130);
    expect(comprasFicha(r.linhas,200,catalogo).totais.get('carne')).toBe(91);
    expect(r.pendencias).toEqual([]);
  });
  it('distribui a alteração dos ingredientes nas camadas mantendo proporções',()=>{
    const desiguais=camadas.map((m,i)=>({...m,gramas_200:[20,40,60][i]}));
    const r=sincronizarIngredientes([linha],[{...linha,gramas_200:150}],desiguais,catalogo);
    expect(r.montagem.map(m=>m.gramas_200)).toEqual([25,50,75]);
    expect(r.linhas[0].gramas_200).toBe(150);
    expect(r.linhas[0].gramas_300).toBe(180);
  });
  it('resolve o nome exato antes de preparações com palavras parecidas',()=>{
    const c={...catalogo,preparacoes:[{id:'errado',nome:'Caldo de aipim com carne Bolonhesa'},...catalogo.preparacoes]};
    expect(sincronizarMontagem([linha],camadas,c).linhas[0].preparacao_id).toBe('molho');
  });
  it('não inventa um vínculo para nome desconhecido ou ambíguo',()=>{
    expect(sincronizarMontagem([linha],[{nome:'Novo preparo',gramas_200:40}],catalogo).pendencias).toHaveLength(1);
    const c={...catalogo,preparacoes:[...catalogo.preparacoes,{id:'outro',nome:'Outro molho bolonhesa'}]};
    expect(sincronizarMontagem([linha,{preparacao_id:'outro'}],[{nome:'bolonhesa',gramas_200:40}],c).pendencias).toHaveLength(1);
  });
  it('remove a compra do componente excluído e mantém água de cocção',()=>{
    const agua={ingrediente_id:'agua',gramas_200:.5,observacao:'Água de cocção descartada'};
    const c={...catalogo,ingredientes:[...catalogo.ingredientes,{id:'agua',nome:'Água'}]};
    const r=sincronizarMontagem([linha,agua],[],c);
    expect(r.linhas).toEqual([agua]);
    expect(sincronizarIngredientes([linha],[],camadas,c).montagem).toEqual([]);
  });
  it('adiciona ingrediente e converte o peso pronto para compra com ganho',()=>{
    const r=sincronizarIngredientes([], [{ingrediente_id:'arroz',gramas_200:58}],[],catalogo);
    expect(r.montagem[0].gramas_200).toBe(58);
    expect(comprasFicha(r.linhas,200,catalogo).totais.get('arroz')).toBe(20);
  });
  it('preserva porção personalizada de 150 g e não duplica ingredientes antigos da base',()=>{
    const r=sincronizarMontagem([linha,{ingrediente_id:'carne',gramas_200:80}], [{nome:'Molho Bolonhesa',gramas_150:150}],catalogo);
    expect(r.linhas).toHaveLength(1);
    expect(r.linhas[0].gramas_personalizada).toBe(150);
    expect(comprasFicha(r.linhas,150,catalogo).totais.get('carne')).toBe(105);
  });
  it('mantém a contagem de panquecas, sem tratar 55 g de disco como mistura crua',()=>{
    const c={...catalogo,preparacoes:[{id:'massa',nome:'Massa panqueca',rendimento_final_g:2844}],bases:new Map([['massa',[{ingrediente_id:'ovo',quantidade:8}]]])};
    expect(comprasFicha([{preparacao_id:'massa',gramas_300:110}],300,c).totais.get('ovo')).toBeCloseTo(8*2/30);
  });
  it('estabiliza ida e volta sem modificar pesos ou duplicar as linhas',()=>{
    const a=sincronizarMontagem([linha],camadas,catalogo);
    const b=sincronizarIngredientes(a.linhas,a.linhas,a.montagem,catalogo);
    expect(b).toEqual(a);
  });
  it('recalcula água de cocção quando o peso de massa muda',()=>{
    const c={...catalogo,ingredientes:[{id:'massa',nome:'Macarrão espaguete',tipo_rendimento:'ganho',fator_rendimento:2.44},{id:'agua',nome:'Água'}]};
    const linhas=[{ingrediente_id:'massa',gramas_200:70},{ingrediente_id:'agua',gramas_200:99,observacao:'Água de cocção descartada'}];
    const r=sincronizarMontagem(linhas,[{nome:'Macarrão espaguete',gramas_200:122}],c);
    expect(r.linhas.find(l=>l.ingrediente_id==='agua')?.gramas_200).toBeCloseTo(.5);
  });
});
