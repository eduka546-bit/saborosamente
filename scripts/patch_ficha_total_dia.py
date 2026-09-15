from pathlib import Path

p = Path("src/routes/cozinha.tsx")
s = p.read_text()

old_header = '''                    <Botao leve onClick={() => abrir("ficha-dia")}>
                      <BookOpen size={18} />
                      Ficha de produção do dia
                    </Botao>
'''
s = s.replace(old_header, "", 1)

marker = '''              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                {[["Planejadas", (producoes as any[]).filter((p) => p.status === "planejada").length, "bg-[#fff4d9] text-[#8b5a00]"], ["Em preparo", (producoes as any[]).filter((p) => p.status === "em_preparo").length, "bg-[#e8f1ff] text-[#175da8]"], ["Produzidas", (producoes as any[]).filter((p) => p.status === "concluida").length, "bg-[#e0f2e7] text-[#087443]"]].map(([label, quantidade, cor]) => <article key={String(label)} className={`rounded-xl p-3 ${cor}`}><p className="text-xs font-bold">{label}</p><p className="text-2xl font-black">{quantidade}</p></article>)}
              </div>
'''
addition = marker + '''              <div className="mb-5 flex justify-end">
                <Botao leve onClick={() => abrir("ficha-dia")}>
                  <BookOpen size={18} />
                  Ver ficha de produção total do dia
                </Botao>
              </div>
'''
if marker not in s:
    raise SystemExit("resumo produção não encontrado")
s = s.replace(marker, addition, 1)

a = s.index("function FichaProducaoDiaModal(")
b = s.index("\nfunction FichaMontagemModal(", a)
novo = r'''function FichaProducaoDiaModal({ dataProducao, producoes, produtos, receitas, montagemPorReceita, separar, fechar }: any) {
  const [abaDia, setAbaDia] = useState<"producao" | "ingredientes">("producao");
  const produtoPorId = new Map((produtos as any[]).map((x: any) => [x.id, x]));
  const receitaPorProduto = new Map((receitas as any[]).map((x: any) => [x.produto_id, x]));
  const grupos = new Map<string, any[]>();
  (producoes as any[]).forEach((p: any) => grupos.set(p.produto_id, [...(grupos.get(p.produto_id) || []), p]));
  const pratos = Array.from(grupos.entries()).map(([produtoId, linhas]) => {
    const produto = produtoPorId.get(produtoId);
    const receita = receitaPorProduto.get(produtoId);
    const montagem = receita ? (montagemPorReceita.get(receita.id) || []) : [];
    const q = { "200": 0, "300": 0, "400": 0 } as Record<string, number>;
    linhas.forEach((p: any) => { if (q[p.gramatura] != null) q[p.gramatura] += n(p.quantidade_planejada); });
    const montagemTotal = montagem.map((m: any) => ({
      nome: m.nome,
      total: n(m.gramas_200) * q["200"] + n(m.gramas_300) * q["300"] + n(m.gramas_400) * q["400"],
      observacao: m.observacao || "",
    })).filter((m: any) => m.total > 0 || m.observacao);
    return { produto, q, montagemTotal, total: q["200"] + q["300"] + q["400"] };
  }).filter((x: any) => x.produto).sort((a: any, b: any) => a.produto.nome.localeCompare(b.produto.nome));

  const formatPeso = (g: number) => `${arredondarProducao(g, "g").toLocaleString("pt-BR")} g`;
  const dataFmt = new Date(`${dataProducao}T12:00:00`).toLocaleDateString("pt-BR");
  const totalMarmitas = pratos.reduce((s: number, x: any) => s + x.total, 0);

  return <Janela titulo={`Ficha de produção total do dia — ${dataFmt}`} fechar={fechar}>
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-2xl bg-[#edf5e6] p-4"><p className="text-xs font-bold uppercase text-[#527164]">Total do dia</p><p className="mt-1 text-2xl font-black text-[#087443]">{totalMarmitas} unidades</p></div>
      <div className="rounded-2xl bg-[#f4f7f4] p-4"><p className="text-xs font-bold uppercase text-[#527164]">Produtos</p><p className="mt-1 text-2xl font-black text-[#173a2d]">{pratos.length}</p></div>
      <div className="rounded-2xl bg-[#f4f7f4] p-4"><p className="text-xs font-bold uppercase text-[#527164]">Ingredientes</p><p className="mt-1 text-2xl font-black text-[#173a2d]">{(separar as any[]).length}</p></div>
    </div>

    <div className="mb-5 grid grid-cols-2 rounded-xl bg-[#e7eee8] p-1">
      <button type="button" onClick={() => setAbaDia("producao")} className={`rounded-lg px-3 py-3 text-sm font-bold ${abaDia === "producao" ? "bg-white text-[#087443] shadow-sm" : "text-[#62766b]"}`}>
        Produção do dia
      </button>
      <button type="button" onClick={() => setAbaDia("ingredientes")} className={`rounded-lg px-3 py-3 text-sm font-bold ${abaDia === "ingredientes" ? "bg-white text-[#087443] shadow-sm" : "text-[#62766b]"}`}>
        Ingredientes do dia
      </button>
    </div>

    {abaDia === "producao" && (
      !pratos.length ? <Vazio texto="Nenhuma produção lançada neste dia." /> : <div className="grid gap-4">
        {pratos.map((x: any) => <article key={x.produto.id} className="rounded-2xl border border-[#dbe7dd] bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-black">{x.produto.nome}</h3>
              <p className="mt-1 text-sm text-[#62766b]">{TAMANHOS.filter(t => x.q[t.id] > 0).map(t => `${x.q[t.id]}×${t.label}`).join(" + ")}</p>
            </div>
            <span className="rounded-full bg-[#edf5e6] px-3 py-1 text-sm font-black text-[#087443]">{x.total} un</span>
          </div>
          {x.montagemTotal.length > 0 && <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#527164]">Montagem total deste produto</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {x.montagemTotal.map((m: any, i: number) => <div key={`${m.nome}-${i}`} className="rounded-xl bg-[#f4f8f4] px-3 py-2">
                <div className="flex justify-between gap-3 text-sm"><span>{m.nome}</span><b>{m.total > 0 ? formatPeso(m.total) : (ehQB(m.observacao) ? "a gosto" : textoCozinha(m.observacao))}</b></div>
                {m.observacao && !ehQB(m.observacao) && <p className="mt-1 text-xs text-[#62766b]">{textoCozinha(m.observacao)}</p>}
              </div>)}
            </div>
          </div>}
        </article>)}
      </div>
    )}

    {abaDia === "ingredientes" && (
      !(separar as any[]).length ? <Vazio texto="Nenhum ingrediente calculado para a produção deste dia." /> : <div>
        <div className="mb-4 rounded-2xl bg-[#edf5e6] p-4">
          <p className="font-black text-[#173a2d]">Lista consolidada de ingredientes</p>
          <p className="mt-1 text-sm text-[#527164]">Soma todos os produtos do dia, incluindo preparações, rendimentos e perdas.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(separar as any[]).map((x: any) => <article key={`${x.id}-${x.unidade}`} className="rounded-2xl border border-[#dbe7dd] bg-white p-4">
            <p className="font-black text-[#173a2d]">{x.item?.nome}</p>
            <p className="mt-2 text-xl font-black text-[#087443]">{x.qb ? "a gosto" : formatarQuantidadeProducao(x.quantidade, x.unidade, x.item?.nome)}</p>
            {x.pratos?.length > 0 && <p className="mt-2 text-xs text-[#62766b]">Usado em: {x.pratos.join(" · ")}</p>}
          </article>)}
        </div>
      </div>
    )}
  </Janela>;
}
'''
s = s[:a] + novo + s[b:]
p.write_text(s)
