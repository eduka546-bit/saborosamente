from pathlib import Path

p = Path('src/routes/cozinha.tsx')
s = p.read_text(encoding='utf-8')
fi = s.find('function FichaProducaoDiaModal(')
fj = s.find('function FichaMontagemModal(', fi)
if fi < 0 or fj < 0:
    raise SystemExit('componente da ficha do dia não encontrado')
bloco = s[fi:fj]
start = bloco.find('    <div className="hidden print-only">')
end = bloco.rfind('  </Janela>;')
if start < 0 or end < 0 or end <= start:
    raise SystemExit('bloco de impressão da ficha do dia não encontrado')

novo = r'''    <div className="hidden print-only">
      <section>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-[#087443]">SaborosaMente — Ficha operacional da cozinha</p>
            <h2 className="mt-1 text-2xl font-black text-[#173a2d]">Produção do dia</h2>
            <p className="mt-1 text-sm text-[#62766b]">{dataFmt}</p>
          </div>
          <div className="grid gap-1" style={{gridTemplateColumns:"repeat(3,110px)"}}>
            <div className="rounded-xl bg-[#edf5e6] p-3 text-center"><p className="text-xs font-bold uppercase text-[#62766b]">Unidades</p><p className="mt-1 text-xl font-black text-[#087443]">{totalDia}</p></div>
            <div className="rounded-xl bg-[#edf5e6] p-3 text-center"><p className="text-xs font-bold uppercase text-[#62766b]">Produtos</p><p className="mt-1 text-xl font-black text-[#087443]">{pratos.length}</p></div>
            <div className="rounded-xl bg-[#edf5e6] p-3 text-center"><p className="text-xs font-bold uppercase text-[#62766b]">Ingredientes</p><p className="mt-1 text-xl font-black text-[#087443]">{(separar as any[]).length}</p></div>
          </div>
        </div>

        <p className="mb-2 text-lg font-black uppercase text-[#087443]">1. Produção planejada</p>
        {!pratos.length ? <Vazio texto="Nenhuma produção lançada neste dia."/> : <div className="rounded-xl border border-[#dbe7dd] bg-white">
          <div className="grid bg-[#173a2d] px-3 py-2 text-xs font-bold uppercase text-white" style={{gridTemplateColumns:"minmax(300px,1fr) 72px 72px 72px 72px"}}><span>Produto</span><span>200 g</span><span>300 g</span><span>400 g</span><span>Total</span></div>
          {pratos.map((x:any)=><div key={`dia-prod-${x.produto.id}`} className="grid items-center border-t border-[#dbe7dd] px-3 py-2 text-sm" style={{gridTemplateColumns:"minmax(300px,1fr) 72px 72px 72px 72px"}}><b>{x.produto.nome}</b><span>{x.q["200"] || "—"}</span><span>{x.q["300"] || "—"}</span><span>{x.q["400"] || "—"}</span><b className="text-[#087443]">{x.total} un</b></div>)}
        </div>}
      </section>

      <section className="mt-4">
        <p className="mb-2 text-lg font-black uppercase text-[#087443]">2. Ingredientes necessários do dia</p>
        <p className="mb-2 text-sm text-[#62766b]">Separe estas quantidades antes de iniciar. Os códigos mostram em quais pratos cada ingrediente será usado.</p>
        {!(separar as any[]).length ? <Vazio texto="Nenhum ingrediente calculado para a produção deste dia."/> : <div className="rounded-xl border border-[#dbe7dd] bg-white">
          <div className="grid bg-[#edf5e6] px-3 py-2 text-xs font-bold uppercase text-[#527164]" style={{gridTemplateColumns:"minmax(250px,1fr) 120px 1fr"}}><span>Ingrediente</span><span>Quantidade</span><span>Usado em</span></div>
          {(separar as any[]).map((x:any)=>{
            const codigos=(x.pratos || []).map((nome:string)=>{ const m=String(nome).match(/\b([A-Z]{2}\d{2})\b/); return m ? m[1] : nome; });
            return <div key={`dia-ing-${x.id}-${x.unidade}`} className="grid items-center border-t border-[#dbe7dd] px-3 py-2 text-sm" style={{gridTemplateColumns:"minmax(250px,1fr) 120px 1fr"}}><b>{x.item?.nome}</b><b className="text-[#087443]">{x.qb ? "QB · a gosto" : formatarQuantidadeProducao(x.quantidade,x.unidade,x.item?.nome)}</b><span className="text-xs text-[#62766b]">{codigos.join(" · ") || "—"}</span></div>;
          })}
        </div>}
      </section>

      <section className="page-break-before">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div><p className="text-sm font-black uppercase text-[#087443]">3. Montagem por tamanho</p><h2 className="mt-1 text-xl font-black text-[#173a2d]">Referência de montagem do dia</h2><p className="mt-1 text-sm text-[#62766b]">Siga a coluna do tamanho correto. Cada bloco mostra quanto vai de cada componente em uma unidade.</p></div>
          <b className="text-sm text-[#173a2d]">{dataFmt}</b>
        </div>
        {!pratos.length ? <Vazio texto="Nenhuma montagem disponível para este dia."/> : <div className="grid gap-4">
          {pratos.map((x:any)=>{
            const montagem=(x.montagem || []) as any[];
            const exatos=(tamanho:"200"|"300"|"400")=>{
              const chave=`gramas_${tamanho}`;
              const vals=montagem.map((m:any)=>n(m[chave])>0?arredondarProducao(m[chave],"g"):0);
              const idxs=vals.map((v:number,i:number)=>v>0?i:-1).filter((i:number)=>i>=0);
              if(idxs.length){const soma=vals.reduce((a:number,b:number)=>a+b,0); vals[idxs[idxs.length-1]]=Math.max(0,vals[idxs[idxs.length-1]]+n(tamanho)-soma);}
              return vals;
            };
            const v200=exatos("200"),v300=exatos("300"),v400=exatos("400");
            return <article key={`dia-mont-${x.produto.id}`} className="rounded-xl border border-[#dbe7dd] bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div><h3 className="text-lg font-black">{x.produto.nome}</h3><p className="mt-1 text-xs text-[#62766b]">Produção: {TAMANHOS.filter(t=>x.q[t.id]>0).map(t=>`${x.q[t.id]}×${t.label}`).join(" + ") || "sem quantidade lançada"}</p></div>
                <b className="text-right text-[#087443]">{x.total} un</b>
              </div>
              {!montagem.length ? <p className="text-sm text-[#62766b]">Montagem ainda não cadastrada para esta ficha.</p> : <div className="rounded-xl border border-[#dbe7dd]">
                <div className="grid bg-[#edf5e6] px-3 py-2 text-xs font-bold uppercase text-[#527164]" style={{gridTemplateColumns:"minmax(250px,1fr) 90px 90px 90px"}}><span>Componente pronto</span><span>200 g</span><span>300 g</span><span>400 g</span></div>
                {montagem.map((m:any,idx:number)=><div key={m.id || idx} className="grid items-center border-t border-[#dbe7dd] px-3 py-2 text-sm" style={{gridTemplateColumns:"minmax(250px,1fr) 90px 90px 90px"}}><div><b>{m.nome}</b>{m.observacao && !ehQB(m.observacao) && <p className="mt-1 text-xs text-[#62766b]">{textoCozinha(m.observacao)}</p>}</div><span>{v200[idx]>0?`${v200[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span><span>{v300[idx]>0?`${v300[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span><span>{v400[idx]>0?`${v400[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span></div>)}
              </div>}
            </article>;
          })}
        </div>}
      </section>
    </div>
'''
bloco = bloco[:start] + novo + bloco[end:]
s = s[:fi] + bloco + s[fj:]
p.write_text(s, encoding='utf-8')
