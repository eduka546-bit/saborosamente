from pathlib import Path

p = Path('src/routes/cozinha.tsx')
s = p.read_text(encoding='utf-8')

s = s.replace(
    'return { tipo: "texto", valor: 0, exibicao: `${litros.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })} L` };',
    'return { tipo: "volume", valor: litros, exibicao: `${litros.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })} L` };'
)

marker = '  const resumo = TAMANHOS.filter((t) => quantidades[t.id] > 0).map((t) => `${quantidades[t.id]}×${t.label}`).join(" + ");\n'
helper = '''  const montagemExata = (tamanho: "200" | "300" | "400") => {
    const chave = `gramas_${tamanho}` as "gramas_200" | "gramas_300" | "gramas_400";
    const valores = (montagem as any[]).map((m: any) => n(m[chave]) > 0 ? arredondarProducao(m[chave], "g") : 0);
    const indices = valores.map((v: number, i: number) => v > 0 ? i : -1).filter((i: number) => i >= 0);
    if (indices.length) {
      const soma = valores.reduce((a: number, b: number) => a + b, 0);
      valores[indices[indices.length - 1]] = Math.max(0, valores[indices[indices.length - 1]] + n(tamanho) - soma);
    }
    return valores;
  };
  const montagem200 = montagemExata("200");
  const montagem300 = montagemExata("300");
  const montagem400 = montagemExata("400");
'''
if 'const montagem200 = montagemExata("200")' not in s:
    if marker not in s:
        raise SystemExit('marcador de resumo não encontrado')
    s = s.replace(marker, marker + helper, 1)

inicio = '  return <Janela titulo={`Ficha de produção — ${produto.nome}`} fechar={fechar}>\n'
i = s.find(inicio)
if i < 0:
    raise SystemExit('inicio do retorno da ficha não encontrado')
fim_marker = '  </Janela>;\n}\nfunction IngredienteModal'
j = s.find(fim_marker, i)
if j < 0:
    raise SystemExit('fim do retorno da ficha não encontrado')

novo = r'''  return <Janela titulo={`Ficha de produção — ${produto.nome}`} fechar={fechar}>
    <div className="mb-4 flex justify-end"><Botao leve onClick={() => imprimirElemento("ficha-producao-produto-impressao", `Ficha de produção — ${produto.nome}`)}>Imprimir ficha</Botao></div>
    <div id="ficha-producao-produto-impressao" className="grid gap-4">
      <section>
        <p className="text-sm font-black text-[#087443]">SaborosaMente — Ficha operacional da cozinha</p>
        <h2 className="mt-1 text-2xl font-black text-[#173a2d]">{produto.nome}</h2>
        <p className="mt-1 text-sm text-[#62766b]">Produção do dia {String(dataProducao).split("-").reverse().join("/")}: <b className="text-[#173a2d]">{resumo || "Sem quantidade planejada"}</b></p>
        <div className="mt-3 grid gap-1 rounded-xl bg-[#edf5e6] p-3">
          <p className="text-sm"><b>1.</b> Separar todos os ingredientes do lote antes de iniciar.</p>
          <p className="text-sm"><b>2.</b> Fazer as preparações abaixo nas quantidades indicadas.</p>
          <p className="text-sm"><b>3.</b> Conferir os rendimentos e a quantidade pronta de cada preparação.</p>
          <p className="text-sm"><b>4.</b> Montar por tamanho usando a tabela da página seguinte.</p>
          <p className="text-sm"><b>5.</b> Comparar a montagem final com a foto antes de tampar.</p>
        </div>
      </section>

      <section>
        <p className="mb-2 text-lg font-black uppercase text-[#087443]">1. Preparações do lote</p>
        {!preparacoesCalculadas.length ? <Vazio texto="Nenhuma preparação vinculada foi encontrada para este prato."/> : <div className="rounded-xl border border-[#dbe7dd] bg-white">
          <div className="grid bg-[#173a2d] px-3 py-2 text-xs font-bold uppercase text-white" style={{gridTemplateColumns:"170px 1fr 1.15fr"}}><span>Preparação</span><span>Quantidade / ingredientes</span><span>Modo de preparo</span></div>
          {preparacoesCalculadas.map((pc:any) => <div key={pc.prep.id} className="grid border-t border-[#dbe7dd] px-3 py-2" style={{gridTemplateColumns:"170px 1fr 1.15fr", gap:"12px", alignItems:"start"}}>
            <div><b>{pc.prep.nome}</b><p className="mt-1 text-xs text-[#62766b]">{pc.pronto ? <>Produzir <b className="text-[#087443]">{formatPeso(pc.pronto)}</b></> : "Produzir conforme necessidade"}</p></div>
            <div className="grid gap-1">{pc.itens.map((item:any)=><div key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.ingrediente?.nome || "Ingrediente"}</span><b>{item.pendente ? (/\d/.test(String(item.quantidade_texto || "")) ? textoCozinha(item.quantidade_texto) : "QB") : item.calculado.exibicao}</b></div>)}</div>
            <div className="whitespace-pre-line text-sm leading-relaxed">{textoCozinha(pc.prep.modo_preparo).replace(/\\n/g,"\n") || "Modo de preparo não informado."}</div>
          </div>)}
        </div>}
      </section>

      <section>
        <p className="mb-2 text-lg font-black uppercase text-[#087443]">2. Total a separar</p>
        <div className="grid gap-1 sm:grid-cols-3">{listaSeparar.map((x:any)=><div key={x.nome} className="rounded-lg border border-[#dbe7dd] bg-[#fff9ee] px-3 py-2"><p className="text-xs font-bold">{x.nome}</p><p className="mt-1 text-sm font-black text-[#087443]">{[x.peso > 0 ? formatarQuantidadeProducao(x.peso,"g",x.nome) : "", x.unidades > 0 ? formatarQuantidadeProducao(x.unidades,"un",x.nome) : "", ...x.textos.map((t:string)=>textoCozinha(t))].filter(Boolean).join(" · ") || "QB"}</p></div>)}</div>
      </section>

      {ingredientesSemVinculo.length > 0 && <section className="rounded-xl border border-[#f0cf67] bg-[#fff9e8] p-3">
        <p className="text-sm font-black text-[#6f4b00]">Observação da ficha</p>
        <p className="mt-1 text-xs text-[#6f4b00]">Os itens abaixo constam na composição geral, mas o ponto exato de aplicação ainda não está descrito na ficha. <b>Não omitir.</b></p>
        <div className="mt-2 grid gap-1 sm:grid-cols-3">{ingredientesSemVinculo.map((x:any)=><div key={x.id} className="rounded-lg bg-white px-2 py-2 text-xs"><div className="flex justify-between gap-2"><b>{x.ingrediente?.nome || "Ingrediente"}</b><b>{formatarQuantidadeProducao(x.total,"g",x.ingrediente?.nome)}</b></div><p className="mt-1 text-[#62766b]">200 g: {n(x.gramas_200)>0?`${arredondarProducao(x.gramas_200,"g")} g`:"QB"} · 300 g: {n(x.gramas_300)>0?`${arredondarProducao(x.gramas_300,"g")} g`:"QB"} · 400 g: {n(x.gramas_400)>0?`${arredondarProducao(x.gramas_400,"g")} g`:"QB"}</p></div>)}</div>
      </section>}

      <section className="page-break-before">
        <p className="text-sm font-black text-[#087443]">MONTAGEM POR TAMANHO</p>
        <h2 className="mt-1 text-2xl font-black text-[#173a2d]">{produto.nome}</h2>
        <p className="mt-1 text-sm text-[#62766b]">Use a coluna correta para cada tamanho. Os valores abaixo fecham exatamente 200 g, 300 g e 400 g.</p>

        {!(montagem as any[]).length ? <Vazio texto="Montagem ainda não cadastrada para esta ficha."/> : <div className="mt-3 rounded-xl border border-[#dbe7dd] bg-white">
          <div className="grid bg-[#173a2d] px-3 py-2 text-xs font-bold uppercase text-white" style={{gridTemplateColumns:"minmax(260px,1fr) 90px 90px 90px"}}><span>Componente pronto</span><span>200 g</span><span>300 g</span><span>400 g</span></div>
          {(montagem as any[]).map((m:any,idx:number)=><div key={m.id || idx} className="grid items-center border-t border-[#dbe7dd] px-3 py-3 text-sm" style={{gridTemplateColumns:"minmax(260px,1fr) 90px 90px 90px"}}><b>{`${idx+1}. ${m.nome}`}</b><span>{montagem200[idx]>0?`${montagem200[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span><span>{montagem300[idx]>0?`${montagem300[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span><span>{montagem400[idx]>0?`${montagem400[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span></div>)}
          <div className="grid items-center border-t border-[#dbe7dd] bg-[#edf5e6] px-3 py-2 text-sm font-black" style={{gridTemplateColumns:"minmax(260px,1fr) 90px 90px 90px"}}><span>TOTAL</span><span>200 g</span><span>300 g</span><span>400 g</span></div>
        </div>}

        <div className="mt-4">
          <p className="text-lg font-black uppercase text-[#087443]">Checklist antes de tampar</p>
          <div className="mt-2 grid gap-1">
            <p className="text-sm">☐ Conferir o tamanho da embalagem antes de começar.</p>
            <p className="text-sm">☐ Pesar cada componente individualmente pela coluna correta.</p>
            <p className="text-sm">☐ Respeitar a ordem das camadas mostrada na tabela.</p>
            <p className="text-sm">☐ Conferir o peso total da marmita antes de fechar.</p>
            <p className="text-sm">☐ Comparar visualmente o resultado com a foto de referência.</p>
          </div>
        </div>

        <div className="mt-4" style={{textAlign:"center",breakInside:"avoid",pageBreakInside:"avoid"}}>
          <div style={{width:"90%",margin:"0 auto 8px",borderTop:"1px solid #dbe7dd"}} />
          <p className="text-sm font-black uppercase text-[#087443]">Referência visual da montagem final</p>
          <div style={{width:"100%",margin:"8px auto 0",textAlign:"center"}}>
            {produto.imagem_url || produto.imagens?.[0] ? <img src={produto.imagem_url || produto.imagens?.[0]} alt={produto.nome} style={{width:"82%",maxWidth:"560px",height:"auto",maxHeight:"390px",objectFit:"contain",objectPosition:"center center",display:"block",margin:"0 auto"}} /> : <div className="grid place-items-center" style={{height:"220px"}}><ChefHat size={48}/></div>}
          </div>
          <p className="mt-2 text-sm font-bold text-[#087443]">Foto ampliada e centralizada para facilitar a conferência visual do produto pronto.</p>
        </div>
      </section>
    </div>
  </Janela>;
'''

s = s[:i] + novo + s[j + len('  </Janela>;\n'):]
p.write_text(s, encoding='utf-8')
print('layout aplicado')
