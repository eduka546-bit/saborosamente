import { comprasFicha, type CatalogoFicha } from '@/lib/cozinha-sincronizacao';

export function FichaSincronizacaoPreview({ anteriores, linhas, catalogo, tamanhos, pendencias }: {
  anteriores: Record<string, any>[]; linhas: Record<string, any>[]; catalogo: CatalogoFicha;
  tamanhos: {id: string | number}[]; pendencias: string[];
}) {
  const compras = tamanhos.map(t => ({ tamanho: Number(t.id), antes: comprasFicha(anteriores, Number(t.id), catalogo), depois: comprasFicha(linhas, Number(t.id), catalogo) }));
  const erros = [...new Set([...pendencias, ...compras.flatMap(c => c.depois.pendencias)])];
  const ids = new Set(compras.flatMap(c => [...c.antes.totais.keys(), ...c.depois.totais.keys()]));
  const alterados = [...ids].filter(id => compras.some(c => Math.abs((c.antes.totais.get(id) || 0) - (c.depois.totais.get(id) || 0)) > .000001));
  const fmt = (q: number) => q.toLocaleString('pt-BR', {maximumFractionDigits: 3});
  return <aside className="my-4 rounded-xl border border-[#bcd8c5] bg-[#f4f8f4] p-3 text-sm">
    <b className="text-[#087443]">Montagem e ingredientes sincronizados</b>
    <p className="mt-1 text-xs text-[#527164]">Editar os pesos em qualquer aba atualiza a outra. Camadas repetidas são somadas; ao editar o total nos ingredientes, as camadas mantêm a proporção. Os pesos editáveis são prontos; a compra abaixo considera perdas, ganhos e as receitas-base.</p>
    {erros.length > 0 && <ul role="alert" className="mt-2 list-disc pl-5 text-amber-800">{erros.map(e => <li key={e}>{e}</li>)}</ul>}
    {alterados.length > 0 ? <details className="mt-2" open><summary className="cursor-pointer font-bold">Mudanças na compra por marmita, antes → depois</summary><div className="mt-2 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr><th scope="col">Ingrediente</th>{compras.map(c => <th scope="col" key={c.tamanho}>{c.tamanho} g</th>)}</tr></thead><tbody>{alterados.map(id => {
      const ingrediente = catalogo.ingredientes.find(i => i.id === id);
      return <tr key={id} className="border-t border-[#dbe7dd]"><th scope="row" className="py-1 pr-2 font-medium">{ingrediente?.nome || 'Ingrediente'} ({ingrediente?.unidade_medida || 'g'})</th>{compras.map(c => <td className="px-2 py-1" key={c.tamanho}>{fmt(c.antes.totais.get(id) || 0)} → <b>{fmt(c.depois.totais.get(id) || 0)}</b></td>)}</tr>;
    })}</tbody></table></div></details> : <p className="mt-2 text-xs">Nenhuma alteração nas quantidades de compra.</p>}
    <p className="mt-2 text-xs text-[#527164]">Confira a prévia e clique em Salvar ficha técnica para aplicar. Rendimentos estimados continuam sujeitos à pesagem do lote; água de cocção não entra no peso servido.</p>
  </aside>;
}
