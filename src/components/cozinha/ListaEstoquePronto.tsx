import { useMemo, useState } from "react";
import { ArrowRightLeft, Pencil, Search } from "lucide-react";

type Produto = {
  id: string;
  nome: string;
  tipo_produto?: string | null;
  estoque_200g?: number | null;
  estoque_300g?: number | null;
  estoque_400g?: number | null;
};

type Saldo = {
  estoque_200g?: number | null;
  estoque_300g?: number | null;
  estoque_400g?: number | null;
};

type Props = {
  produtos: Produto[];
  local: "loja" | "cozinha";
  saldosCozinha?: Map<string, Saldo>;
  onTransferir?: (produto: Produto) => void;
  onAtualizar?: (produto: Produto) => void;
};

const grupos = [
  { tipo: "marmita", titulo: "Marmitas" },
  { tipo: "sopa", titulo: "Sopas e caldos" },
  { tipo: "complemento", titulo: "Complementos" },
];

const tamanhoProduto = (produto: Produto) =>
  produto.tipo_produto === "sopa" ? ["400"] :
  produto.tipo_produto === "complemento" ? ["150"] : ["200", "300", "400"];

const quantidadeProduto = (saldo: Saldo | undefined, tamanho: string) => {
  const coluna = tamanho === "150" ? "estoque_200g" : `estoque_${tamanho}g`;
  const valor = Number(saldo?.[coluna as keyof Saldo] ?? 0);
  return Number.isFinite(valor) ? valor : 0;
};

const textoBusca = (texto: string) => texto.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function ListaEstoquePronto({
  produtos, local, saldosCozinha, onTransferir, onAtualizar,
}: Props) {
  const [busca, setBusca] = useState("");
  const [somenteComEstoque, setSomenteComEstoque] = useState(false);
  const produtosVisiveis = useMemo(() => produtos.filter((produto) => {
    if (!textoBusca(produto.nome).includes(textoBusca(busca.trim()))) return false;
    const saldo = local === "cozinha" ? saldosCozinha?.get(produto.id) : produto;
    return !somenteComEstoque || tamanhoProduto(produto).some(
      (tamanho) => quantidadeProduto(saldo, tamanho) > 0,
    );
  }), [produtos, local, saldosCozinha, busca, somenteComEstoque]);

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#698477]" />
          <span className="sr-only">Buscar produto no estoque</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto ou código..."
            className="w-full rounded-xl border border-[#cbd8ce] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#087443]"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#62766b] sm:justify-end">
          <span>{produtosVisiveis.length} de {produtos.length} produtos</span>
          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={somenteComEstoque}
              onChange={(e) => setSomenteComEstoque(e.target.checked)}
              className="size-4 accent-[#087443]"
            />
            Somente com estoque
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#cbd8ce] bg-white">
        {grupos.map((grupo) => {
          const lista = produtosVisiveis.filter(
            (produto) => (produto.tipo_produto || "marmita") === grupo.tipo,
          );
          if (!lista.length) return null;
          return (
            <section key={grupo.tipo} aria-label={grupo.titulo}>
              <div className="flex items-center justify-between border-y border-[#deebe0] bg-[#f1f7f1] px-3 py-2 first:border-t-0 sm:px-4">
                <h4 className="text-xs font-black uppercase tracking-wide text-[#0a5735]">{grupo.titulo}</h4>
                <span className="text-xs font-semibold text-[#547367]">{lista.length} {lista.length === 1 ? "produto" : "produtos"}</span>
              </div>
              <div className="divide-y divide-[#edf0e9]">
                {lista.map((produto) => {
                  const saldo = local === "cozinha" ? saldosCozinha?.get(produto.id) : produto;
                  const codigo = produto.nome.match(/^(TD|SO|CO)\d{2}\b/i)?.[0];
                  const nome = codigo ? produto.nome.slice(codigo.length).replace(/^\s*[-–—]\s*/, "") : produto.nome;
                  const tamanhos = tamanhoProduto(produto);
                  return (
                    <div
                      key={produto.id}
                      className="min-w-0 px-3 py-2.5 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-4"
                    >
                      <div className="flex min-w-0 items-start gap-2 text-sm leading-snug sm:flex-1">
                        {codigo && <span className="shrink-0 rounded-md bg-[#e7f3e9] px-1.5 py-1 text-[11px] font-black text-[#075636]">{codigo}</span>}
                        <span className="min-w-0 break-words pt-0.5 font-semibold text-[#173a2d]">{nome}</span>
                      </div>
                      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 sm:mt-0 sm:shrink-0 sm:justify-end">
                        <div className="flex flex-wrap items-center gap-1.5" aria-label={`Quantidades de ${produto.nome}`}>
                          {tamanhos.map((tamanho) => {
                            const quantidade = quantidadeProduto(saldo, tamanho);
                            return (
                              <span key={tamanho}
                                aria-label={`${tamanho} gramas: ${quantidade} unidades`}
                                className={`inline-flex min-w-[59px] items-center justify-center gap-1 rounded-md px-2 py-1 text-xs ${quantidade > 0 ? "bg-[#e2f3e6] text-[#075636]" : "bg-[#f1f1ef] text-[#7f8881]"}`}
                              >
                                <span className="text-[10px]">{tamanho}g</span>
                                <b className="tabular-nums">{quantidade}</b>
                              </span>
                            );
                          })}
                        </div>
                        {local === "cozinha" && (
                          <div className="flex items-center gap-1.5 sm:ml-2">
                            <button
                              type="button"
                              onClick={() => onTransferir?.(produto)}
                              aria-label={`Transferir ${produto.nome} para loja`}
                              title="Transferir para loja"
                              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-[#bcd8c5] px-2 py-1.5 text-[11px] font-bold text-[#087443] hover:bg-[#f0f8f1]"
                            >
                              <ArrowRightLeft size={13} aria-hidden="true" /> Transferir
                            </button>
                            <button
                              type="button"
                              onClick={() => onAtualizar?.(produto)}
                              aria-label={`Atualizar estoque de ${produto.nome}`}
                              title="Atualizar estoque"
                              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-[#bcd8c5] px-2 py-1.5 text-[11px] font-bold text-[#087443] hover:bg-[#f0f8f1]"
                            >
                              <Pencil size={13} aria-hidden="true" /> Atualizar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        {!produtosVisiveis.length && (
          <p className="px-4 py-8 text-center text-sm text-[#62766b]">
            Nenhum produto encontrado. Ajuste a busca ou desmarque o filtro de estoque.
          </p>
        )}
      </div>
      <p className="mt-2 text-xs text-[#708778]">Os números representam unidades prontas por gramatura.</p>
    </div>
  );
}
