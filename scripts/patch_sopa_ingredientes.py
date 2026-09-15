from pathlib import Path

p = Path('src/routes/cozinha.tsx')
s = p.read_text()
ini = s.index('function ReceitaModal(')
fim = s.index('function TabelaCabecalho', ini)
sec = s[ini:fim]

alvo = '  const preparacoesFicha = idsPreparacoesFicha.map((id) => preparacoes.find((p:any) => p.id === id)).filter(Boolean);\n'
novo = alvo + '''  const ingredientesPreparacoesSopa = produto?.tipo_produto === "sopa" ? preparacoesFicha.flatMap((preparacao:any) => {\n    const rendimento = n(preparacao.rendimento_final_g);\n    const fator400 = rendimento > 0 ? 400 / rendimento : 0;\n    return (itensPreparacao.get(preparacao.id) || []).map((item:any) => {\n      const ingrediente = ingredientes.find((a:any) => a.id === item.ingrediente_id);\n      const unidade = ingrediente?.unidade_medida === "un" ? "un" : "g";\n      const qb = ehQB(item.quantidade_texto);\n      const quantidade = qb ? 0 : n(item.quantidade) * fator400;\n      return { preparacao, item, ingrediente, unidade, qb, quantidade };\n    }).filter((x:any) => x.ingrediente);\n  }) : [];\n'''
if alvo not in sec:
    raise SystemExit('preparacoesFicha nao encontrado')
sec = sec.replace(alvo, novo, 1)

marcador = '}</div>}<div className="flex flex-col gap-2 sm:flex-row">'
bloco = '''}</div>}{produto?.tipo_produto === "sopa" && ingredientesPreparacoesSopa.length > 0 && <div className="mb-4 rounded-xl border border-[#dbe7dd] bg-white p-3"><p className="text-xs font-bold uppercase tracking-wide text-[#087443]">Ingredientes usados em 400 g</p><p className="mt-1 text-xs text-[#62766b]">Quantidades proporcionais calculadas automaticamente a partir da receita-base da preparação.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{ingredientesPreparacoesSopa.map((x:any, i:number)=><div key={String(x.preparacao.id)+":"+String(x.item.id || i)} className="flex items-center justify-between gap-3 rounded-lg bg-[#f4f8f4] px-3 py-2 text-sm"><span><b>{x.ingrediente.nome}</b><span className="ml-2 text-xs text-[#62766b]">{x.preparacao.nome}</span></span><b className="text-[#087443]">{x.qb ? "a gosto" : formatarQuantidadeProducao(x.quantidade, x.unidade, x.ingrediente.nome)}</b></div>)}</div></div>}<div className="flex flex-col gap-2 sm:flex-row">'''
if marcador not in sec:
    raise SystemExit('marcador da aba ingredientes nao encontrado')
sec = sec.replace(marcador, bloco, 1)

s = s[:ini] + sec + s[fim:]
p.write_text(s)
