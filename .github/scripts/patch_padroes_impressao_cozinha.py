from pathlib import Path

p = Path('src/routes/cozinha.tsx')
s = p.read_text(encoding='utf-8')

s = s.replace(
    'body{font-family:Arial,sans-serif;color:#173a2d;margin:0;font-size:10px;line-height:1.28}',
    'body{font-family:Arial,sans-serif;color:#173a2d;margin:0;font-size:10.2px;line-height:1.32}'
)
s = s.replace(
    '.text-xs{font-size:8.5px}.text-sm{font-size:10px}.text-lg{font-size:12px}.text-xl{font-size:14px}.text-2xl{font-size:16px}',
    '.text-xs{font-size:9px}.text-sm{font-size:10.2px}.text-lg{font-size:12.5px}.text-xl{font-size:17px}.text-2xl{font-size:19px}'
)

marker = 'style={{ gridTemplateColumns: "170px 1fr", alignItems: "start" }}'
pos = s.find(marker)
if pos < 0:
    raise SystemExit('bloco da montagem individual não encontrado')
i = s.rfind('      <section>', 0, pos)
if i < 0:
    raise SystemExit('início da seção de montagem não encontrado')
end = '''      </section>\n    </div>\n  </Janela>;'''
j = s.find(end, pos)
if j < 0:
    raise SystemExit('fim da montagem individual não encontrado')

novo = '''      <section>
        <div className="mb-3">
          <p className="text-sm font-black uppercase text-[#087443]">Montagem por tamanho</p>
          <h3 className="mt-1 text-xl font-black">{produto.nome}</h3>
          <p className="mt-1 text-sm text-[#62766b]">Use a coluna correta para cada tamanho. A foto ampliada abaixo é a referência visual final da montagem.</p>
        </div>
        {!(montagem as any[]).length ? <Vazio texto="Montagem ainda não cadastrada para esta ficha." /> : <div className="rounded-2xl border border-[#dbe7dd] bg-white">
          <div className="grid gap-2 bg-[#173a2d] px-3 py-2 text-xs font-bold uppercase text-white" style={{ gridTemplateColumns: "minmax(220px,1fr) 90px 90px 90px", alignItems: "center" }}><span>Componente pronto</span><span>200 g</span><span>300 g</span><span>400 g</span></div>
          {(montagem as any[]).map((m: any, i: number) => <div key={m.id || i} className="grid items-center gap-2 border-t border-[#e2ebe3] px-3 py-2 text-sm" style={{ gridTemplateColumns: "minmax(220px,1fr) 90px 90px 90px" }}><div><b>{`${i + 1}. ${m.nome}`}</b>{m.observacao && !ehQB(m.observacao) && <p className="mt-1 text-xs text-[#62766b]">{textoCozinha(m.observacao)}</p>}</div><span>{n(m.gramas_200) > 0 ? `${arredondarProducao(m.gramas_200, "g").toLocaleString("pt-BR")} g` : (ehQB(m.observacao) ? "a gosto" : "—")}</span><span>{n(m.gramas_300) > 0 ? `${arredondarProducao(m.gramas_300, "g").toLocaleString("pt-BR")} g` : (ehQB(m.observacao) ? "a gosto" : "—")}</span><span>{n(m.gramas_400) > 0 ? `${arredondarProducao(m.gramas_400, "g").toLocaleString("pt-BR")} g` : (ehQB(m.observacao) ? "a gosto" : "—")}</span></div>)}
        </div>}
        <div className="mt-4 rounded-xl bg-[#f4f7f4] p-3">
          <p className="text-sm font-black uppercase text-[#173a2d]">Checklist antes de tampar</p>
          <p className="mt-1 text-sm">☐ Conferir o tamanho da embalagem antes de começar.</p>
          <p className="text-sm">☐ Pesar cada componente individualmente pela coluna correta.</p>
          <p className="text-sm">☐ Respeitar a ordem dos componentes mostrada na tabela.</p>
          <p className="text-sm">☐ Conferir o peso total da marmita antes de fechar.</p>
          <p className="text-sm">☐ Comparar visualmente o resultado com a foto de referência.</p>
        </div>
        <div className="mt-4" style={{ textAlign: "center", breakInside: "avoid", pageBreakInside: "avoid" }}>
          <div style={{ width: "90%", margin: "0 auto 8px", borderTop: "1px solid #dbe7dd" }} />
          <p className="text-sm font-black uppercase text-[#087443]">Referência visual da montagem final</p>
          <div style={{ width: "100%", margin: "8px auto 0", textAlign: "center" }}>
            {produto.imagem_url || produto.imagens?.[0] ? <img src={produto.imagem_url || produto.imagens?.[0]} alt={produto.nome} style={{ width: "82%", maxWidth: "560px", height: "auto", maxHeight: "360px", objectFit: "contain", objectPosition: "center center", display: "block", margin: "0 auto", borderRadius: "10px" }} /> : <div className="grid place-items-center" style={{ height: "220px" }}><ChefHat size={48} /></div>}
          </div>
          <p className="mt-2 text-sm font-bold text-[#087443]">Foto ampliada e centralizada para facilitar a conferência visual do produto pronto.</p>
        </div>
      </section>
    </div>
  </Janela>;'''

s = s[:i] + novo + s[j + len(end):]
p.write_text(s, encoding='utf-8')
print('patch aplicado')
