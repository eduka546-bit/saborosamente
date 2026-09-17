from pathlib import Path
import re

p = Path('src/routes/cozinha.tsx')
s = p.read_text(encoding='utf-8')

# Remove a lógica adaptativa que vinha alterando o layout de impressão conforme o tamanho do conteúdo.
start = s.index('const imprimirElemento = (id: string, titulo: string) => {')
end = s.index('\nconst receitaVazia', start)
imprimir = '''const imprimirElemento = (id: string, titulo: string) => {
  const elemento = document.getElementById(id);
  if (!elemento) return toast.error("Não foi possível preparar a ficha para impressão.");
  const janela = window.open("", "_blank", "width=1000,height=800");
  if (!janela) return toast.error("Permita pop-ups para imprimir a ficha.");
  janela.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${titulo}</title><style>
    @page{size:A4;margin:12mm 13mm 15mm 13mm;@bottom-left{content:"SaborosaMente - ficha operacional";font-family:Arial,sans-serif;font-size:7.5pt;color:#52695f}@bottom-right{content:"Página " counter(page);font-family:Arial,sans-serif;font-size:7.5pt;color:#52695f}}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#173a2d;margin:0;font-size:10.2pt;line-height:1.25}h1,h2,h3,h4,p{margin-top:0;margin-bottom:3px}button{display:none!important}.grid{display:grid;gap:4pt}.flex{display:flex}.flex-wrap{flex-wrap:wrap}.justify-between{justify-content:space-between}.items-center{align-items:center}.items-start{align-items:flex-start}.gap-1{gap:3pt}.gap-2,.gap-3,.gap-4,.gap-5{gap:4pt}.mb-2,.mb-3,.mb-4,.mb-5{margin-bottom:5pt}.mt-1,.mt-2,.mt-3,.mt-4{margin-top:4pt}.p-3,.p-4{padding:6pt}.px-3{padding-left:6pt;padding-right:6pt}.py-1,.py-2{padding-top:3.5pt;padding-bottom:3.5pt}.rounded-xl,.rounded-2xl{border-radius:4pt}.border{border:1px solid #dbe7dd}.border-t{border-top:1px solid #dbe7dd}.border-l{border-left:1px solid #dbe7dd}.border-t-0{border-top:0}.bg-white{background:#fff}.bg-\\[\\#edf5e6\\],.bg-\\[\\#f4f7f4\\],.bg-\\[\\#f4f8f4\\]{background:#f3f7f3}.bg-\\[\\#fff9ee\\]{background:#fff9ee}.bg-\\[\\#173a2d\\]{background:#173a2d!important;color:#fff!important;border:1px solid #173a2d}.text-white,.text-white\\/70{color:#fff!important}.text-\\[\\#087443\\]{color:#087443}.text-\\[\\#173a2d\\]{color:#173a2d}.text-\\[\\#527164\\],.text-\\[\\#62766b\\]{color:#52695f}.font-bold{font-weight:700}.font-black{font-weight:800}.text-xs{font-size:9pt}.text-sm{font-size:10.2pt}.text-lg{font-size:12pt}.text-xl{font-size:17pt}.text-2xl{font-size:19pt}.uppercase{text-transform:uppercase}.whitespace-pre-line{white-space:pre-line}article{break-inside:avoid;page-break-inside:avoid}section{break-inside:auto;page-break-inside:auto}.page-break-before{break-before:page!important;page-break-before:always!important}[data-screen-only]{display:none!important}.print-only{display:block!important}.sm\\:grid-cols-2,.md\\:grid-cols-2,.lg\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.sm\\:grid-cols-3,.lg\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}img{max-width:100%}
#ficha-producao-produto-impressao>section:first-child>div.mt-3{margin-left:12pt!important;margin-right:12pt!important}
#ficha-producao-produto-impressao>section:nth-of-type(3)>.grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:0!important}
#ficha-producao-produto-impressao>section:nth-of-type(3)>.grid>div{background:#fff9ee!important}
#ficha-producao-produto-impressao>section.page-break-before{padding-top:0!important}
#ficha-producao-produto-impressao>section.page-break-before>div.mt-3{margin-top:8pt!important}
#ficha-producao-produto-impressao>section.page-break-before img{width:76%!important;max-width:none!important;max-height:400pt!important}
#ficha-producao-produto-impressao>section.page-break-before>div.mt-4:last-child{margin-top:14pt!important}
#ficha-producao-produto-impressao>section.page-break-before>div.mt-4:last-child>div:first-child{width:95%!important;margin-bottom:8pt!important}
#ficha-producao-produto-impressao h2{line-height:1.12}
#ficha-producao-produto-impressao section>p.text-lg{margin-top:8pt;margin-bottom:5pt}
#ficha-producao-dia-impressao h2{line-height:1.12}
  </style></head><body>${elemento.innerHTML}</body></html>`);
  janela.document.close();
  janela.focus();
  const imagens = Array.from(janela.document.images);
  const prontas = imagens.map((img) => img.complete ? Promise.resolve() : new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve(); }));
  Promise.race([Promise.all(prontas), new Promise((resolve) => setTimeout(resolve, 1500))]).then(() => {
    setTimeout(() => { janela.print(); janela.close(); }, 150);
  });
};'''
s = s[:start] + imprimir + s[end:]

# Ficha individual: somente montagem final, em duas páginas fixas, como na prévia aprovada.
marker_start = '  return <Janela titulo={`Ficha de produção — ${produto.nome}`} fechar={fechar}>'
start = s.index(marker_start, s.index('function FichaProducaoModal'))
end_marker = '\n}\nfunction IngredienteModal'
end = s.index(end_marker, start)
retorno = '''  return <Janela titulo={`Ficha de produção — ${produto.nome}`} fechar={fechar}>
    <div className="mb-4 flex justify-end"><Botao leve onClick={() => imprimirElemento("ficha-producao-produto-impressao", `Ficha de produção — ${produto.nome}`)}>Imprimir ficha</Botao></div>
    <div id="ficha-producao-produto-impressao">
      <section>
        <p className="text-sm font-black text-[#087443]">SaborosaMente - Ficha operacional da cozinha</p>
        <h2 className="mt-1 text-2xl font-black text-[#173a2d]">{produto.nome}</h2>
        <p className="mt-1 text-sm text-[#62766b]">Produção do dia: <b className="text-[#173a2d]">{resumo || "Sem quantidade planejada"}</b></p>
        <div className="mt-3 border border-[#dbe7dd] bg-[#edf5e6]">{["Receber da ficha do dia todos os componentes já preparados e separados.","Conferir o total pronto necessário de cada componente para este produto.","Usar a coluna correta de 200 g, 300 g ou 400 g.","Montar a marmita respeitando exatamente a ordem indicada.","Conferir o peso e comparar com a foto antes de tampar."].map((txt,i)=><div key={txt} className="grid border-t border-[#dbe7dd] px-3 py-2 text-sm first:border-t-0" style={{gridTemplateColumns:"28px 1fr"}}><b>{i+1}.</b><span>{txt}</span></div>)}</div>
      </section>
      <section className="mt-4">
        <p className="mb-2 text-lg font-black uppercase text-[#087443]">1. Componentes prontos para este produto</p>
        <div className="border border-[#dbe7dd] bg-white">
          <div className="grid bg-[#173a2d] px-3 py-2 text-xs font-bold text-white" style={{gridTemplateColumns:"minmax(240px,1fr) 150px minmax(280px,1fr)"}}><span>Componente pronto</span><span>Total do prato</span><span>Quantidade por unidade</span></div>
          {(montagem as any[]).map((m:any,idx:number)=><div key={m.id||idx} className="grid border-t border-[#dbe7dd] text-sm" style={{gridTemplateColumns:"minmax(240px,1fr) 150px minmax(280px,1fr)"}}><div className="p-3"><b>{m.nome}</b>{m.observacao && !ehQB(m.observacao) && <p className="mt-1 text-xs text-[#62766b]">{textoCozinha(m.observacao)}</p>}</div><div className="border-l border-[#dbe7dd] p-3"><b className="text-[#087443]">{montagemTotal[idx]?.total>0?formatPeso(montagemTotal[idx].total):(ehQB(m.observacao)?"QB · a gosto":"—")}</b></div><div className="border-l border-[#dbe7dd] p-3">200 g: <b>{montagem200[idx]>0?`${montagem200[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</b> · 300 g: <b>{montagem300[idx]>0?`${montagem300[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</b> · 400 g: <b>{montagem400[idx]>0?`${montagem400[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</b></div></div>)}
        </div>
      </section>
      <section className="mt-4">
        <p className="mb-2 text-lg font-black uppercase text-[#087443]">2. Total a separar</p>
        <div className="grid gap-0 sm:grid-cols-3">{montagemTotal.map((m:any)=><div key={m.id||m.nome} className="border border-[#dbe7dd] bg-[#fff9ee] px-3 py-2"><p className="text-xs font-bold">{m.nome}</p><p className="mt-1 text-sm font-black text-[#087443]">{m.total>0?formatPeso(m.total):(ehQB(m.observacao)?"QB · a gosto":"—")}</p></div>)}</div>
        <div className="border border-t-0 border-[#dbe7dd] bg-[#fff9ee] px-3 py-2 text-sm"><b>Total de componentes do lote deste produto:</b> {formatPeso(totalLoteProduto)}</div>
      </section>
      <section className="page-break-before">
        <p className="text-sm font-black uppercase text-[#087443]">Montagem por tamanho</p>
        <h2 className="mt-1 text-2xl font-black text-[#173a2d]">{produto.nome}</h2>
        <p className="mt-1 text-sm text-[#62766b]">Use a coluna correta para cada tamanho. Os valores abaixo fecham exatamente 200 g, 300 g e 400 g.</p>
        <div className="mt-3 border border-[#dbe7dd] bg-white">
          <div className="grid bg-[#173a2d] px-3 py-2 text-xs font-bold text-white" style={{gridTemplateColumns:"minmax(260px,1fr) 100px 100px 100px"}}><span>Componente pronto</span><span>200 g</span><span>300 g</span><span>400 g</span></div>
          {(montagem as any[]).map((m:any,idx:number)=><div key={m.id||idx} className="grid items-center border-t border-[#dbe7dd] px-3 py-2 text-sm" style={{gridTemplateColumns:"minmax(260px,1fr) 100px 100px 100px"}}><b>{`${idx+1}. ${m.nome}`}</b><span>{montagem200[idx]>0?`${montagem200[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span><span>{montagem300[idx]>0?`${montagem300[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span><span>{montagem400[idx]>0?`${montagem400[idx]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span></div>)}
          <div className="grid border-t border-[#dbe7dd] bg-[#edf5e6] px-3 py-2 text-sm font-black" style={{gridTemplateColumns:"minmax(260px,1fr) 100px 100px 100px"}}><span>TOTAL</span><span>200 g</span><span>300 g</span><span>400 g</span></div>
        </div>
        <div className="mt-4"><p className="text-lg font-black uppercase text-[#087443]">Checklist antes de tampar</p><div className="mt-2 grid gap-1"><p className="text-sm">■ Conferir o tamanho da embalagem antes de começar.</p><p className="text-sm">■ Pesar cada componente individualmente pela coluna correta.</p><p className="text-sm">■ Respeitar a ordem das camadas mostrada na tabela.</p><p className="text-sm">■ Conferir o peso total da marmita antes de fechar.</p><p className="text-sm">■ Comparar visualmente o resultado com a foto de referência.</p></div></div>
        <div className="mt-4" style={{textAlign:"center",breakInside:"avoid",pageBreakInside:"avoid"}}><div style={{width:"90%",margin:"0 auto 8px",borderTop:"1px solid #dbe7dd"}} /><p className="text-lg font-black uppercase text-[#087443]">Referência visual da montagem final</p><div style={{width:"100%",margin:"10px auto 0",textAlign:"center"}}>{produto.imagem_url || produto.imagens?.[0] ? <img src={produto.imagem_url || produto.imagens?.[0]} alt={produto.nome} style={{width:"76%",maxWidth:"none",height:"auto",maxHeight:"400px",objectFit:"contain",objectPosition:"center center",display:"block",margin:"0 auto"}} /> : <div className="grid place-items-center" style={{height:"220px"}}><ChefHat size={48}/></div>}</div><p className="mt-2 text-sm font-bold text-[#087443]">Foto ampliada e centralizada para facilitar a conferência visual do produto pronto.</p></div>
      </section>
    </div>
  </Janela>;'''
s = s[:start] + retorno + s[end:]

# Validações para evitar voltar ao layout adaptativo.
assert 'montagem-fluida' not in s
assert 'ficha-produto-longa' not in s
assert '1. Componentes prontos para este produto' in s
assert 'className="page-break-before"' in s
assert 'width:"76%"' in s

p.write_text(s, encoding='utf-8')
