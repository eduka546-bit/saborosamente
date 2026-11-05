import { useMemo, useState } from "react";
import { useCommerceDialog } from "@/lib/use-commerce-dialog";
import { createPortal } from "react-dom";
import { ArrowLeft, ChevronRight, Gift, X } from "lucide-react";
import { ComboSaboresModal } from "@/components/combo-sabores-modal";
import { formatBRL } from "@/lib/products";
import { imgUrl } from "@/lib/image-proxy";

interface CombosProntosModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  allProducts: any[];
}

type GrupoCombo = "vendidos" | "leves";

const grupos = [
  {
    id: "vendidos" as const,
    titulo: "Mais Vendidos",
    descricao: "Os pratos favoritos dos nossos clientes.",
    imagemCapa: "/combo-capa-mais-vendidos.svg",
  },
  {
    id: "leves" as const,
    titulo: "Mais Leves",
    descricao: "Sabores selecionados com menos calorias.",
    imagemCapa: "/combo-capa-mais-leves.svg",
  },
];

function identificarGrupo(produto: any): GrupoCombo | null {
  const subgrupo = String(produto.subgrupo ?? "").trim().toUpperCase();
  const nome = String(produto.nome ?? "").toLowerCase();
  if (subgrupo === "MAIS LEVES" || /pratos mais leves/.test(nome)) return "leves";
  if (subgrupo === "MAIS VENDIDOS" || /pratos mais vendidos/.test(nome)) return "vendidos";
  return null;
}

function totalDeUnidades(produto: any) {
  return Number(String(produto.nome ?? "").match(/(\d+)\s*un/i)?.[1] ?? 0);
}

export function CombosProntosModal({
  isOpen,
  onClose,
  products,
}: CombosProntosModalProps) {
  const dialogRef = useCommerceDialog(isOpen, onClose);
  const [categoria, setCategoria] = useState<GrupoCombo | null>(null);
  const [comboEscolhido, setComboEscolhido] = useState<any>(null);
  const [pesoEscolhido, setPesoEscolhido] = useState("200g");

  const porGrupo = useMemo(() => {
    const resultados: Record<GrupoCombo, any[]> = { vendidos: [], leves: [] };
    for (const produto of products) {
      const grupo = identificarGrupo(produto);
      if (grupo && [5, 10, 20].includes(totalDeUnidades(produto))) {
        resultados[grupo].push(produto);
      }
    }
    resultados.vendidos.sort((a, b) => totalDeUnidades(a) - totalDeUnidades(b));
    resultados.leves.sort((a, b) => totalDeUnidades(a) - totalDeUnidades(b));
    return resultados;
  }, [products]);

  const categoriasDisponiveis = grupos.filter((grupo) => porGrupo[grupo.id].length > 0);
  const grupoAtual = grupos.find((grupo) => grupo.id === categoria);

  const escolherTamanho = (combo: any, peso: string) => {
    setPesoEscolhido(peso);
    setComboEscolhido(combo);
  };

  const fecharTudo = () => {
    setComboEscolhido(null);
    setCategoria(null);
    onClose();
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9000] flex items-end justify-center md:items-center md:p-5">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={fecharTudo} aria-hidden="true" />

      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Combos Prontos"
        className="relative flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[2rem] bg-[#fbfaf5] shadow-2xl md:max-h-[90vh] md:rounded-[2rem]">
        <div className="flex shrink-0 items-start justify-between gap-3 bg-[#086e45] px-4 py-4 text-white md:px-7 md:py-6">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/80">
              <Gift size={15} /> Combinações prontas
            </div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              {grupoAtual ? grupoAtual.titulo : "Combos Prontos"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-snug text-white/85 md:text-base">
              {grupoAtual
                ? "Escolha 5, 10 ou 20 unidades e a gramatura para montar seu combo."
                : "Escolha o tipo de combo e veja as opções de 5, 10 ou 20 unidades."}
            </p>
          </div>
          <button type="button" onClick={fecharTudo}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label="Fechar combos prontos">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-7 md:py-6">
          {categoria === null ? (
            categoriasDisponiveis.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base font-semibold text-[#315440]">
                  Nenhum combo pronto disponível no momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                {categoriasDisponiveis.map((grupo) => (
                  <button
                    type="button"
                    key={grupo.id}
                    onClick={() => setCategoria(grupo.id)}
                    aria-label={`Ver opções do combo ${grupo.titulo}`}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-[1.4rem] border border-[#e4e9d8] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086e45]">
                    {/* Capas no estilo das artes Em Breve, com a tipografia oficial do site. */}
                    <div className="relative h-36 w-full overflow-hidden bg-[#f8f7ef] sm:h-52">
                      <img
                        src={grupo.imagemCapa}
                        alt=""
                        aria-hidden="true"
                        loading="eager"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                      />
                      <div className="absolute inset-y-0 left-0 flex w-[77%] flex-col justify-center px-3 py-3 sm:px-5">
                        <span className="mb-2 inline-flex w-fit items-center rounded-full bg-[#e6efc5] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#064d2f] sm:text-xs">
                          Combos
                        </span>
                        <span className="font-display text-[clamp(1.08rem,3.6vw,2.45rem)] font-black leading-[0.98] tracking-tight text-[#064d2f]">
                          Mais
                          <span className="block">{grupo.id === "vendidos" ? "Vendidos" : "Leves"}</span>
                        </span>
                        <span className="mt-2 h-1 w-12 rounded-full bg-[#8bb924] sm:w-20" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 px-3 py-3 sm:px-5 sm:py-4">
                      <p className="min-h-9 text-xs leading-snug text-[#58645e] sm:text-sm">
                        {grupo.descricao}
                      </p>
                      <span className="mt-auto self-start rounded-full bg-[#e4f092] px-2.5 py-1 text-xs font-bold text-[#064d2f] sm:text-sm">
                        5 • 10 • 20 un
                      </span>
                      <span className="mt-1 flex min-h-10 w-full items-center justify-center gap-1 rounded-xl bg-[#086e45] px-2 py-2 text-sm font-bold text-white sm:text-base">
                        Ver opções <ChevronRight size={17} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div>
              <button type="button" onClick={() => setCategoria(null)}
                className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#d3e2cf] bg-white px-3 py-2 text-sm font-bold text-[#086e45] hover:bg-[#edf5e6]">
                <ArrowLeft size={17} /> Voltar às categorias
              </button>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {porGrupo[categoria].map((produto: any) => {
                  const unidades = totalDeUnidades(produto);
                  const pesos = [
                    { nome: "P", descricao: "200g", peso: "200g", preco: produto.preco },
                    ...(produto.preco_300g != null ? [{ nome: "M", descricao: "300g", peso: "300g", preco: produto.preco_300g }] : []),
                    ...(produto.preco_400g != null ? [{ nome: "G", descricao: "400g", peso: "400g", preco: produto.preco_400g }] : []),
                  ];
                  return (
                    <article key={produto.id} className="rounded-2xl border border-[#dde8d9] bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#718278]">{grupoAtual?.titulo}</p>
                          <h3 className="text-xl font-extrabold text-[#064d2f]">{unidades} refeições</h3>
                        </div>
                        <span className="rounded-full bg-[#edf5e6] px-3 py-1 text-sm font-bold text-[#086e45]">{unidades} un</span>
                      </div>
                      <p className="mb-3 text-xs text-[#596c63]">Selecione a gramatura para ver os sabores incluídos.</p>
                      <div className="grid grid-cols-3 gap-2">
                        {pesos.map((p) => (
                          <button type="button" key={p.peso}
                            onClick={() => escolherTamanho(produto, p.peso)}
                            aria-label={`Selecionar combo de ${unidades} unidades, ${p.descricao}, por ${formatBRL(Number(p.preco))}`}
                            className="flex min-h-[76px] flex-col items-center justify-center rounded-xl border-2 border-[#d8e6d8] bg-[#fafdf9] px-1 py-2 text-center text-[#064d2f] transition hover:border-[#086e45] hover:bg-[#edf5e6]">
                            <span className="text-sm font-extrabold">{p.nome} <span className="text-xs font-medium">({p.descricao})</span></span>
                            <span className="mt-1 text-sm font-bold">{formatBRL(Number(p.preco))}</span>
                            <ChevronRight size={14} className="mt-1" />
                          </button>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {comboEscolhido && (
        <ComboSaboresModal
          isOpen={!!comboEscolhido}
          onClose={() => setComboEscolhido(null)}
          combo={comboEscolhido}
          initialWeight={pesoEscolhido}
        />
      )}
    </div>
  );
  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
