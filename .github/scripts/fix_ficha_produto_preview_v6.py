from pathlib import Path

p = Path('src/routes/cozinha.tsx')
s = p.read_text()

ini = s.index('  const totalLoteProduto = montagemTotal.reduce((s:number,m:any)=>s+n(m.total),0);')
ini_return = s.index('  return <Janela titulo={`Ficha de produção — ${produto.nome}`}', ini)
fim = s.index('\n}\nfunction IngredienteModal', ini_return)

novo = r'''  const totalLoteProduto = montagemTotal.reduce((s:number,m:any)=>s+n(m.total),0);
  const preparacoesExibicao = preparacoesCalculadas.filter((pc:any)=>pc.pronto>0 || pc.itens.length>0);
  const instrucoesFicha = preparacoesExibicao.length > 0
    ? [
        "Separar todos os ingredientes do lote antes de iniciar.",
        `Preparar ${preparacoesExibicao.map((pc:any)=>pc.prep.nome).join(", ")}.`,
        "Conferir os rendimentos e a quantidade pronta de cada preparação.",
        "Montar por tamanho usando a tabela da página seguinte.",
        "Comparar a montagem final com a foto antes de tampar.",
      ]
    : [
        "Separar todos os componentes do lote antes de iniciar.",
        "Conferir as quantidades prontas necessárias para este produto.",
        "Usar a coluna correta de 200 g, 300 g ou 400 g.",
        "Montar por tamanho usando a tabela da página seguinte.",
        "Comparar a montagem final com a foto antes de tampar.",
      ];
  return <Janela titulo={`Ficha de produção — ${produto.nome}`} fechar={fechar}>
    <div className="mb-4 flex justify-end"><Botao leve onClick={() => imprimirElemento("ficha-producao-produto-impressao", `Ficha de produção — ${produto.nome}`)}>Imprimir ficha</Botao></div>
    <div id="ficha-producao-produto-impressao">
      <section>
        <p className="text-sm font-black text-[#087443]">SaborosaMente - Ficha operacional da cozinha</p>
        <h2 className="mt-1 text-2xl font-black text-[#173a2d]">{produto.nome}</h2>
        <p className="mt-1 text-sm text-[#62766b]">Produção do dia: <b className="text-[#173a2d]">{resumo || "Sem quantidade planejada"}</b></p>
        <div className="mt-3 border border-[#dbe7dd] bg-[#edf5e6]">
          {instrucoesFicha.map((txt:string,i:number)=><div key={txt} className="grid border-t border-[#dbe7dd] px-3 py-2 text-sm first:border-t-0" style={{gridTemplateColumns:"28px 1fr"}}><b>{i+1}.</b><span>{txt}</span></div>)}
        </div>
      </section>

      <section className="mt-4">
        <p className="mb-2 text-lg font-black uppercase text-[#087443]">1. Preparações do lote</p>
        {preparacoesExibicao.length ? <div className="border border-[#dbe7dd] bg-white">
          <div className="grid bg-[#173a2d] px-3 py-2 text-xs font-bold text-white" style={{gridTemplateColumns:"200px minmax(280px,1fr) minmax(280px,1fr)"}}><span>Preparação</span><span>Quantidade / ingredientes</span><span>Modo de preparo</span></div>
          {preparacoesExibicao.map((pc:any)=><div key={pc.prep.id} className="grid border-t border-[#dbe7dd] text-sm" style={{gridTemplateColumns:"200px minmax(280px,1fr) minmax(280px,1fr)"}}>
            <div className="p-3"><b>{pc.prep.nome}</b>{pc.pronto>0 && <p className="mt-1 text-sm text-[#62766b]">Produzir {formatPeso(pc.pronto)}</p>}</div>
            <div className="border-l border-[#dbe7dd] p-3">
              {pc.itens.length ? pc.itens.map((item:any)=><p key={item.id || `${pc.prep.id}-${item.ingrediente_id}`} className="mt-1"><b>{item.ingrediente?.nome || "Ingrediente"}:</b> {item.calculado?.exibicao || (item.pendente ? "QB" : "—")}</p>) : <p>Sem ingredientes cadastrados.</p>}
            </div>
            <div className="border-l border-[#dbe7dd] p-3"><p className="whitespace-pre-line text-sm">{textoCozinha(pc.prep.modo_preparo).replace(/\\n/g,"\n") || "Modo de preparo não informado."}</p></div>
          </div>)}
        </div> : <div className="border border-[#dbe7dd] bg-white p-3 text-sm text-[#62766b]">Este produto não possui preparação intermediária cadastrada. Seguir diretamente para a montagem.</div>}
      </section>

      <section className="mt-4">
        <p className="mb-2 text-lg font-black uppercase text-[#087443]">2. Total a separar</p>
        <div className="grid gap-0 sm:grid-cols-3">
          {listaSeparar.map((x:any)=><div key={x.nome} className="border border-[#dbe7dd] bg-[#fff9ee] px-3 py-2"><p className="text-xs font-bold text-[#52695f]">{x.nome}</p><p className="mt-1 text-sm font-black text-[#087443]">{x.peso>0?formatPeso(x.peso):x.unidades>0?`${x.unidades.toLocaleString("pt-BR")} un`:x.textos.join(" · ")||"QB · a gosto"}</p></div>)}
        </div>
        {ingredientesSemVinculo.length>0 && <div className="mt-3 border border-[#e5c36b] bg-[#fff9ee] px-3 py-2 text-sm text-[#52695f]"><b>Observação da ficha:</b> há ingredientes da composição sem ponto de aplicação definido na preparação. Eles continuam listados acima para separação e conferência.</div>}
      </section>

      <section className="page-break-before">
        <p className="text-lg font-black uppercase text-[#087443]">Montagem por tamanho</p>
        <h2 className="mt-1 text-2xl font-black text-[#173a2d]">{produto.nome}</h2>
        <p className="mt-1 text-sm text-[#62766b]">Use a coluna correta para cada tamanho. Os valores abaixo fecham exatamente 200 g, 300 g e 400 g.</p>
        <div className="mt-3 border border-[#dbe7dd] bg-white">
          <div className="grid bg-[#173a2d] px-3 py-2 text-xs font-bold text-white" style={{gridTemplateColumns:"minmax(260px,1fr) 100px 100px 100px"}}><span>Componente pronto</span><span>200 g</span><span>300 g</span><span>400 g</span></div>
          {(montagem as any[]).map((m:any,idx:number)=><div key={m.id||idx} className="grid items-center border-t border-[#dbe7dd] px-3 py-2 text-sm" style={{gridTemplateColumns:"minmax(260px,1fr) 100px 100px 100px"}}><b>{`${idx+1}. ${m.nome}`}</b><span>{montagem200[idx]>0?`${montagem200[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span><span>{montagem300[idx]>0?`${montagem300[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span><span>{montagem400[idx]>0?`${montagem400[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span></div>)}
          <div className="grid border-t border-[#dbe7dd] bg-[#edf5e6] px-3 py-2 text-sm font-black" style={{gridTemplateColumns:"minmax(260px,1fr) 100px 100px 100px"}}><span>TOTAL</span><span>200 g</span><span>300 g</span><span>400 g</span></div>
        </div>
        <div className="mt-4"><p className="text-lg font-black uppercase text-[#087443]">Checklist antes de tampar</p><div className="mt-2 grid gap-1"><p className="text-sm">■ Conferir o tamanho da embalagem antes de começar.</p><p className="text-sm">■ Pesar cada componente individualmente pela coluna correta.</p><p className="text-sm">■ Respeitar a ordem das camadas mostrada na tabela.</p><p className="text-sm">■ Conferir o peso total da marmita antes de fechar.</p><p className="text-sm">■ Comparar visualmente o resultado com a foto de referência.</p></div></div>
        <div className="mt-4" style={{textAlign:"center",breakInside:"avoid",pageBreakInside:"avoid"}}><div style={{width:"90%",margin:"0 auto 8px",borderTop:"1px solid #dbe7dd"}} /><p className="text-lg font-black uppercase text-[#087443]">Referência visual da montagem final</p><div style={{width:"100%",margin:"10px auto 0",textAlign:"center"}}>{produto.imagem_url || produto.imagens?.[0] ? <img src={produto.imagem_url || produto.imagens?.[0]} alt={produto.nome} style={{width:"82%",maxWidth:"560px",height:"auto",maxHeight:"390px",objectFit:"contain",objectPosition:"center center",display:"block",margin:"0 auto"}} /> : <div className="grid place-items-center" style={{height:"220px"}}><ChefHat size={48}/></div>}</div><p className="mt-2 text-sm font-bold text-[#087443]">Foto ampliada e centralizada para facilitar a conferência visual do produto pronto.</p></div>
      </section>
    </div>
  </Janela>;'''

s = s[:ini] + novo + s[fim:]
p.write_text(s)
