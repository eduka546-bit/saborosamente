from pathlib import Path

p = Path('src/routes/cozinha.tsx')
s = p.read_text()

old = '  const totais = new Map<string, { nome: string; peso: number; unidades: number; textos: string[] }>();'
new = '''  const idsEmPreparacoes = new Set(preparacoesCalculadas.flatMap((pc: any) => pc.itens.map((item: any) => item.ingrediente_id).filter(Boolean)));
  const idsDiretosMontagem = new Set(diretos.map((d: any) => d.ingrediente?.id).filter(Boolean));
  const ingredientesSemVinculo = (itensReceita as any[])
    .filter((x: any) => x.ingrediente_id && !idsEmPreparacoes.has(x.ingrediente_id) && !idsDiretosMontagem.has(x.ingrediente_id))
    .map((x: any) => ({
      ...x,
      ingrediente: porId.get(x.ingrediente_id),
      total: n(x.gramas_200) * n(quantidades["200"]) + n(x.gramas_300) * n(quantidades["300"]) + n(x.gramas_400) * n(quantidades["400"]),
    }))
    .filter((x: any) => x.total > 0);
  const totais = new Map<string, { nome: string; peso: number; unidades: number; textos: string[] }>();'''
if old not in s:
    raise SystemExit('ancora totais nao encontrada')
s = s.replace(old, new, 1)

old = '''      <section>
        <p className="mb-3 text-sm font-black uppercase text-[#087443]">3. Ingredientes diretos / rendimento</p>'''
new = '''      {ingredientesSemVinculo.length > 0 && <section className="rounded-2xl border border-[#f0cf67] bg-[#fff9e8] p-3">
        <p className="text-sm font-black uppercase text-[#6f4b00]">Atenção — ingredientes da receita ainda sem vínculo de execução</p>
        <p className="mt-1 text-xs text-[#6f4b00]">Estes itens constam com quantidade na ficha, mas ainda não estão ligados a uma preparação nem a um componente da montagem. <b>Não omitir.</b></p>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">{ingredientesSemVinculo.map((x: any) => <div key={x.id} className="rounded-lg bg-white px-2 py-1.5 text-xs"><div className="flex justify-between gap-2"><b>{x.ingrediente?.nome || "Ingrediente"}</b><b>{formatarQuantidadeProducao(x.total, "g", x.ingrediente?.nome)}</b></div><p className="mt-1 text-xs text-[#62766b]">200 g: {n(x.gramas_200) > 0 ? `${arredondarProducao(x.gramas_200, "g")} g` : "QB"} · 300 g: {n(x.gramas_300) > 0 ? `${arredondarProducao(x.gramas_300, "g")} g` : "QB"} · 400 g: {n(x.gramas_400) > 0 ? `${arredondarProducao(x.gramas_400, "g")} g` : "QB"}</p></div>)}</div>
      </section>}
      <section>
        <p className="mb-3 text-sm font-black uppercase text-[#087443]">3. Ingredientes diretos / rendimento</p>'''
if old not in s:
    raise SystemExit('secao diretos nao encontrada')
s = s.replace(old, new, 1)

old = '''        <div className="mt-3 grid gap-2 sm:grid-cols-2">{listaSeparar.map((x: any) => <div key={x.nome} className="flex items-center justify-between gap-3 rounded-xl bg-white/10 p-3"><p className="text-sm font-bold">{x.nome}</p><p className="text-right text-sm font-black">{[x.peso > 0 ? formatarQuantidadeProducao(x.peso, "g", x.nome) : "", x.unidades > 0 ? formatarQuantidadeProducao(x.unidades, "un", x.nome) : "", ...x.textos.map((t: string) => textoCozinha(t))].filter(Boolean).join(" · ") || "a gosto"}</p></div>)}</div>'''
new = '''        <div className="mt-2 grid gap-1 sm:grid-cols-3">{listaSeparar.map((x: any) => <div key={x.nome} className="flex items-center justify-between gap-2 rounded-lg bg-white/10 px-2 py-1.5"><p className="text-xs font-bold">{x.nome}</p><p className="text-right text-xs font-black">{[x.peso > 0 ? formatarQuantidadeProducao(x.peso, "g", x.nome) : "", x.unidades > 0 ? formatarQuantidadeProducao(x.unidades, "un", x.nome) : "", ...x.textos.map((t: string) => textoCozinha(t))].filter(Boolean).join(" · ") || "a gosto"}</p></div>)}</div>'''
if old not in s:
    raise SystemExit('lista total nao encontrada')
s = s.replace(old, new, 1)

p.write_text(s)
