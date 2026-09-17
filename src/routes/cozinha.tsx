import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SugestoesProducaoSinergia } from "@/components/cozinha/SugestoesProducaoSinergia";
import { EmbalagensManager } from "@/components/cozinha/EmbalagensManager";
import { DemandaProducao } from "@/components/cozinha/DemandaProducao";
import { ListaCompras } from "@/components/cozinha/ListaCompras";
import { GestaoOperacional } from "@/components/cozinha/GestaoOperacional";
import { EtiquetasManager } from "./cozinha.etiquetas";
import { toast } from "sonner";
import {
  BookOpen,
  BarChart3,
  Barcode,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  CookingPot,
  LogOut,
  Package,
  Pencil,
  Plus,
  Salad,
  Store,
  Trash2,
  X,
} from "lucide-react";

export const Route = createFileRoute("/cozinha")({ component: CozinhaPage, ssr: false });
type Aba = "producao" | "demanda" | "separar" | "compras" | "gestao" | "ingredientes" | "preparacoes" | "marmitas" | "estoque" | "embalagens" | "relatorio" | "etiquetas";
type Tamanho = "200" | "300" | "400" | "personalizada";
type ReceitaLinha = {
  ingrediente_id: string | null;
  preparacao_id: string | null;
  gramas_200: number;
  gramas_300: number;
  gramas_400: number;
  gramas_personalizada: number;
  rendimento_quebra: number;
  operacao_producao: "direto" | "acrescentar" | "dividir";
  fator_producao: number;
  observacao: string;
};
type MontagemLinha = { id?: string; nome: string; gramas_200: number; gramas_300: number; gramas_400: number; observacao: string };
const TAMANHOS: { id: Tamanho; label: string }[] = [
  { id: "200", label: "200 g" },
  { id: "300", label: "300 g" },
  { id: "400", label: "400 g" },
];
const labelGramatura = (gramatura: string) =>
  gramatura === "personalizada"
    ? "Personalizada"
    : TAMANHOS.find((t) => t.id === gramatura)?.label || "400 g";
const hoje = () => new Date().toISOString().slice(0, 10);
const n = (v: unknown) => Number(v || 0);
const arredondarProducao = (v: unknown, unidade: "g" | "un" = "g") => {
  const valor = Math.max(0, n(v));
  if (!(valor > 0)) return 0;
  const inteiro = Math.floor(valor);
  const fracao = valor - inteiro;
  const arredondado = fracao <= 0.2 + Number.EPSILON ? inteiro : inteiro + 1;
  return unidade === "un" ? Math.max(1, arredondado) : arredondado;
};
const normalizarRegraCozinha = (v: unknown) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const ehQB = (v: unknown) => /^(q\.?b\.?|qb|quanto baste|a gosto)$/i.test(normalizarRegraCozinha(v));
const textoCozinha = (v: unknown) => ehQB(v) ? "a gosto" : String(v || "").trim();
const ehMicroIngrediente = (nome: unknown) => /(^|\b)(sal|salsinha|cebolinha|cheiro verde|tempero|pimenta|oregano|alho em po|paprica|noz moscada)(\b|$)/i.test(normalizarRegraCozinha(nome));
const formatarQuantidadeProducao = (v: unknown, unidade: "g" | "un" = "g", nome: unknown = "") => {
  const qtd = Math.max(0, n(v));
  if (unidade === "un") return `${arredondarProducao(qtd, "un").toLocaleString("pt-BR")} un`;
  if (ehMicroIngrediente(nome) && qtd > 0 && qtd < 1) return `${qtd.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} g`;
  return `${arredondarProducao(qtd, "g").toLocaleString("pt-BR")} g`;
};
const valor = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const input =
  "w-full rounded-lg border border-[#cbd8ce] bg-white p-2.5 text-sm outline-none focus:border-[#087443]";
const imprimirElemento = (id: string, titulo: string) => {
  const elemento = document.getElementById(id);
  if (!elemento) return toast.error("Não foi possível preparar a ficha para impressão.");
  const janela = window.open("", "_blank", "width=1000,height=800");
  if (!janela) return toast.error("Permita pop-ups para imprimir a ficha.");
  janela.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${titulo}</title><style>
    @page{size:A4;margin:12mm 13mm 15mm 13mm;@bottom-left{content:"SaborosaMente - ficha operacional";font-family:Arial,sans-serif;font-size:7.5pt;color:#52695f}@bottom-right{content:"Página " counter(page);font-family:Arial,sans-serif;font-size:7.5pt;color:#52695f}}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#173a2d;margin:0;font-size:10.2pt;line-height:1.25}h1,h2,h3,h4,p{margin-top:0;margin-bottom:3px}button{display:none!important}.grid{display:grid;gap:4pt}.flex{display:flex}.flex-wrap{flex-wrap:wrap}.justify-between{justify-content:space-between}.items-center{align-items:center}.items-start{align-items:flex-start}.gap-2,.gap-3,.gap-4,.gap-5{gap:4pt}.mb-2,.mb-3,.mb-4,.mb-5{margin-bottom:5pt}.mt-1,.mt-2,.mt-3,.mt-4{margin-top:4pt}.p-3,.p-4{padding:6pt}.px-3{padding-left:6pt;padding-right:6pt}.py-1,.py-2{padding-top:3.5pt;padding-bottom:3.5pt}.rounded-xl,.rounded-2xl{border-radius:4pt}.border{border:1px solid #dbe7dd}.bg-white{background:#fff}.bg-\[\#edf5e6\],.bg-\[\#f4f7f4\],.bg-\[\#f4f8f4\]{background:#f3f7f3}.bg-\[\#173a2d\]{background:#173a2d!important;color:#fff!important;border:1px solid #173a2d}.text-white,.text-white\/70{color:#fff!important}.text-\[\#087443\]{color:#087443}.text-\[\#527164\],.text-\[\#62766b\]{color:#52695f}.font-bold{font-weight:700}.font-black{font-weight:800}.text-xs{font-size:9pt}.text-sm{font-size:10.2pt}.text-lg{font-size:12pt}.text-xl{font-size:17pt}.text-2xl{font-size:19pt}.uppercase{text-transform:uppercase}.whitespace-pre-line{white-space:pre-line}article{break-inside:avoid;page-break-inside:avoid}section{break-inside:auto;page-break-inside:auto}.page-break-before{break-before:page!important;page-break-before:always!important}[data-screen-only]{display:none!important}.print-only{display:block!important}.sm\:grid-cols-2,.md\:grid-cols-2,.lg\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.sm\:grid-cols-3,.lg\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}img{max-width:100%}
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
};
const receitaVazia = (): ReceitaLinha => ({
  ingrediente_id: null,
  preparacao_id: null,
  gramas_200: 0,
  gramas_300: 0,
  gramas_400: 0,
  gramas_personalizada: 0,
  rendimento_quebra: 1,
  operacao_producao: "direto",
  fator_producao: 1,
  observacao: "",
});

function CozinhaPage() {
  const navigate = useNavigate(),
    qc = useQueryClient();
  const [ok, setOk] = useState(false),
    [aba, setAba] = useState<Aba>("producao"),
    [dataProducao, setDataProducao] = useState(hoje()),
    [filtroProducao, setFiltroProducao] = useState<"todos" | "planejada" | "em_preparo" | "concluida">("todos"),
    [buscaProducao, setBuscaProducao] = useState(""),
    [modal, setModal] = useState<null | "producao" | "ficha-producao" | "ficha-dia" | "ficha-montagem" | "ingrediente" | "preparacao" | "receita" | "transferencia" | "ajuste-estoque">(
      null,
    );
  const [edit, setEdit] = useState<any>(null),
    [estoqueAba, setEstoqueAba] = useState<"loja" | "cozinha">("loja");
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return navigate({ to: "/cozinha-login" as any, replace: true });
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["admin", "cozinha"]);
      if (!data?.length) {
        await supabase.auth.signOut();
        return navigate({ to: "/cozinha-login" as any, replace: true });
      }
      setOk(true);
    })();
  }, [navigate]);
  const useTableQuery = (key: string, table: string, select = "*", order?: string) =>
    useQuery({
      queryKey: [key],
      enabled: ok,
      queryFn: async () => {
        let q: any = supabase.from(table).select(select);
        if (order) q = q.order(order);
        const { data, error } = await q;
        if (error) throw error;
        return data ?? [];
      },
    });
  const { data: produtos = [] } = useTableQuery(
    "coz-prod",
    "produtos",
    "id,nome,imagem_url,imagens,estoque_200g,estoque_300g,estoque_400g,ativo,tipo_produto",
    "nome",
  );
  const { data: ingredientes = [] } = useTableQuery("coz-ing", "cozinha_ingredientes", "*", "nome");
  const { data: embalagens = [] } = useTableQuery("coz-embalagens", "cozinha_embalagens", "*", "nome");
  const { data: preparacoes = [] } = useTableQuery("coz-prep", "cozinha_preparacoes", "*", "nome");
  const { data: preparacaoItens = [] } = useTableQuery(
    "coz-prep-itens",
    "cozinha_preparacao_itens",
    "*",
    "ordem",
  );
  const { data: receitas = [] } = useTableQuery("coz-rec", "cozinha_receitas", "*");
  const { data: receitaItens = [] } = useTableQuery(
    "coz-rec-itens",
    "cozinha_receita_itens",
    "*",
    "ordem",
  );
  const { data: montagemItens = [] } = useTableQuery("coz-montagem-itens", "cozinha_receita_montagem_itens", "*", "ordem");
  const { data: estoque = [] } = useTableQuery(
    "coz-estoque",
    "cozinha_estoque",
    "*",
    "ingrediente",
  );
  const { data: estoqueMarmitas = [] } = useTableQuery(
    "coz-estoque-marmitas",
    "cozinha_estoque_marmitas",
    "*",
  );
  const { data: transferencias = [] } = useTableQuery("coz-transferencias", "cozinha_transferencias_estoque", "*", "created_at");
  const { data: movimentosIngredientes = [] } = useTableQuery("coz-movimentos-ingredientes", "cozinha_movimentacoes_ingredientes", "*", "created_at");
  const { data: producoes = [] } = useQuery({
    queryKey: ["coz-prod-dia", dataProducao],
    enabled: ok,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cozinha_producoes")
        .select("*")
        .eq("data_producao", dataProducao)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const marmitas = useMemo(
    () =>
      (produtos as any[]).filter((p) =>
        ["marmita", "sopa", "complemento"].includes(p.tipo_produto || "marmita"),
      ),
    [produtos],
  );
  const porId = (lista: any[]) => new Map(lista.map((x) => [x.id, x]));
  const produto = useMemo(() => porId(produtos as any[]), [produtos]),
    ing = useMemo(() => porId(ingredientes as any[]), [ingredientes]),
    prep = useMemo(() => porId(preparacoes as any[]), [preparacoes]),
    rec = useMemo(() => new Map((receitas as any[]).map((x) => [x.produto_id, x])), [receitas]);
  const agrupar = (linhas: any[], campo: string) => {
    const m = new Map<string, any[]>();
    linhas.forEach((x) => m.set(x[campo], [...(m.get(x[campo]) || []), x]));
    return m;
  };
  const itensPrep = useMemo(
      () => agrupar(preparacaoItens as any[], "preparacao_id"),
      [preparacaoItens],
    ),
    itensRec = useMemo(() => agrupar(receitaItens as any[], "receita_id"), [receitaItens]),
    itensMontagem = useMemo(() => agrupar(montagemItens as any[], "receita_id"), [montagemItens]);
  const custoIng = (x: any) =>
    x?.unidade_medida === "un" ? n(x.custo_por_unidade) : n(x?.custo_por_kg) / 1000;
  const quantidadeCorreta = (gramas: number, linha: any) => {
    const fator = n(linha?.fator_producao || 1);
    if (linha?.operacao_producao === "acrescentar") return gramas * (1 + fator);
    if (linha?.operacao_producao === "dividir") return gramas / fator;
    return gramas;
  };
  const quantidadeComRendimento = (gramas: number, ingrediente: any) => {
    if (ingrediente?.tipo_rendimento === "perda") {
      const perda = Math.min(99.999, Math.max(0, n(ingrediente.quebra_percentual))) / 100;
      return gramas / (1 - perda);
    }
    if (ingrediente?.tipo_rendimento === "ganho") {
      const fator = Math.max(0.000001, n(ingrediente.fator_rendimento || 1));
      return gramas / fator;
    }
    return gramas;
  };
  const custoPrep = (id: string) => {
    const p = prep.get(id);
    if (!p || !n(p.rendimento_final_g)) return 0;
    return (
      (itensPrep.get(id) || []).reduce(
        (s, l) =>
          s + n(l.quantidade) * n(ing.get(l.ingrediente_id)?.rendimento_padrao || 1) * custoIng(ing.get(l.ingrediente_id)),
        0,
      ) / n(p.rendimento_final_g)
    );
  };
  const separar = useMemo(() => {
  const mapa = new Map<string, { id: string; quantidade: number; pratos: string[]; unidade: "g" | "un"; item: any; qb: boolean }>();
  const normalizar = (v: unknown) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const tokens = (v: unknown) => normalizar(v).split(" ").filter((x) => x.length >= 4 && !["molho", "pronto", "cozido", "cozida", "grelhado", "grelhada"].includes(x));
  const mesmo = (a: unknown, b: unknown) => {
    const na = normalizar(a), nb = normalizar(b);
    if (!na || !nb) return false;
    if (na.includes(nb) || nb.includes(na)) return true;
    const ta = tokens(a), tb = tokens(b);
    return ta.some((x) => tb.includes(x));
  };
  const unidadeItemPreparacao = (item: any): "g" | "un" => {
    const texto = String(item?.quantidade_texto || "").trim();
    if (/\bkg\b|\bgr\b|grama|\bg\b|ml|litro|litros/i.test(texto)) return "g";
    if (texto && /^\s*[\d.,]+/.test(texto)) return "un";
    return ing.get(item?.ingrediente_id)?.unidade_medida === "un" ? "un" : "g";
  };
  const add = (id: string, q: number, nomePrato: string, unidade: "g" | "un", qb = false) => {
    const item = ing.get(id);
    if (!item || !Number.isFinite(q) || (q <= 0 && !qb)) return;
    const chave = `${id}:${unidade}`;
    const atual = mapa.get(chave) || { id, quantidade: 0, pratos: [], unidade, item, qb: false };
    if (!qb) atual.quantidade += q;
    atual.qb = atual.qb || qb;
    if (!atual.pratos.includes(nomePrato)) atual.pratos.push(nomePrato);
    mapa.set(chave, atual);
  };
  (producoes as any[]).forEach((p) => {
    const prato = produto.get(p.produto_id), r = rec.get(p.produto_id);
    if (!prato || !r) return;
    const campo = `gramas_${p.gramatura || "400"}`;
    const multiplicador = n(p.quantidade_planejada);
    const linhasReceita = itensRec.get(r.id) || [];
    const montagemReceita = itensMontagem.get(r.id) || [];
    const idsPreparacoes = Array.from(new Set([
      ...(Array.isArray(r.preparacoes) ? r.preparacoes.map((x: any) => x?.id).filter(Boolean) : []),
      ...linhasReceita.map((x: any) => x.preparacao_id).filter(Boolean),
    ]));
    const prepsVinculadas = idsPreparacoes.map((id: any) => prep.get(id)).filter(Boolean);
    const fallbackDireto = montagemReceita.length && montagemReceita.some((m: any) => {
      if (!(n(m[campo]) > 0)) return false;
      const preparacao = prepsVinculadas.find((x: any) => mesmo(m.nome, x.nome));
      if (preparacao) {
        const itens = itensPrep.get(preparacao.id) || [];
        const rendimentoInformado = n(preparacao.rendimento_final_g);
        const rendimentoBase = rendimentoInformado > 0 ? rendimentoInformado : itens.reduce((soma: number, item: any) => unidadeItemPreparacao(item) === "g" ? soma + n(item.quantidade) : soma, 0);
        return !(rendimentoBase > 0) || !itens.some((item: any) => n(item.quantidade) > 0 || ehQB(item.quantidade_texto));
      }
      return !(ingredientes as any[]).some((x: any) => mesmo(x.nome, m.nome));
    });
    if (fallbackDireto) {
      linhasReceita.forEach((linha: any) => {
        if (!linha.ingrediente_id) return;
        const ingrediente = ing.get(linha.ingrediente_id);
        if (!ingrediente) return;
        const unidade = ingrediente.unidade_medida === "un" ? "un" : "g";
        const qtd = quantidadeCorreta(n(linha[campo]), linha) * multiplicador;
        add(linha.ingrediente_id, unidade === "g" ? quantidadeComRendimento(qtd, ingrediente) : qtd, prato.nome, unidade);
      });
      return;
    }
    if (montagemReceita.length) {
      montagemReceita.forEach((m: any) => {
        const prontoPorUnidade = n(m[campo]);
        if (!(prontoPorUnidade > 0)) return;
        const prontoTotal = prontoPorUnidade * multiplicador;
        const preparacao = prepsVinculadas.find((x: any) => mesmo(m.nome, x.nome));
        if (preparacao) {
          const itens = itensPrep.get(preparacao.id) || [];
          const rendimentoInformado = n(preparacao.rendimento_final_g);
          const rendimentoBase = rendimentoInformado > 0 ? rendimentoInformado : itens.reduce((soma: number, item: any) => unidadeItemPreparacao(item) === "g" ? soma + n(item.quantidade) : soma, 0);
          if (!(rendimentoBase > 0)) return;
          const fator = prontoTotal / rendimentoBase;
          itens.forEach((item: any) => {
            if (ehQB(item.quantidade_texto)) {
              add(item.ingrediente_id, 0, prato.nome, unidadeItemPreparacao(item), true);
              return;
            }
            const qtdBase = n(item.quantidade);
            if (!(qtdBase > 0)) return;
            add(item.ingrediente_id, qtdBase * fator, prato.nome, unidadeItemPreparacao(item));
          });
          return;
        }
        const ingrediente = (ingredientes as any[]).find((x: any) => mesmo(x.nome, m.nome));
        if (!ingrediente) return;
        const unidade = ingrediente.unidade_medida === "un" ? "un" : "g";
        const bruto = unidade === "g" ? quantidadeComRendimento(prontoTotal, ingrediente) : prontoTotal;
        add(ingrediente.id, bruto, prato.nome, unidade);
      });
      return;
    }
    linhasReceita.forEach((linha: any) => {
      if (!linha.ingrediente_id) return;
      const ingrediente = ing.get(linha.ingrediente_id);
      if (!ingrediente) return;
      const unidade = ingrediente.unidade_medida === "un" ? "un" : "g";
      const qtd = quantidadeCorreta(n(linha[campo]), linha) * multiplicador;
      add(linha.ingrediente_id, unidade === "g" ? quantidadeComRendimento(qtd, ingrediente) : qtd, prato.nome, unidade);
    });
  });
  return [...mapa.values()].sort((a, b) => a.item.nome.localeCompare(b.item.nome));
}, [producoes, produto, rec, itensRec, itensMontagem, prep, itensPrep, ing, ingredientes]);
  const alertasEstoquePlanejado = useMemo(
    () =>
      separar
        .filter((x) => {
          if (x.qb) return false;
          const saldo = (estoque as any[]).find((e) => e.ingrediente_id === x.id);
          return n(saldo?.quantidade_atual) < n(x.quantidade);
        })
        .map((x) => x.item.nome),
    [separar, estoque],
  );
  const producoesVisiveis = useMemo(
    () =>
      (producoes as any[]).filter((p) => {
        const nome = String(produto.get(p.produto_id)?.nome || "").toLowerCase();
        return (filtroProducao === "todos" || p.status === filtroProducao) &&
          (!buscaProducao.trim() || nome.includes(buscaProducao.trim().toLowerCase()));
      }),
    [producoes, produto, filtroProducao, buscaProducao],
  );
  const producoesAgrupadasVisiveis = useMemo(() => {
    const grupos = new Map<string, any[]>();
    (producoesVisiveis as any[]).forEach((p: any) => grupos.set(p.produto_id, [...(grupos.get(p.produto_id) || []), p]));
    return Array.from(grupos.entries()).map(([produtoId, linhas]) => {
      const total = linhas.reduce((s: number, x: any) => s + n(x.quantidade_planejada), 0);
      const variacoes = TAMANHOS.map((t) => ({
        ...t,
        quantidade: linhas.filter((x: any) => x.gramatura === t.id).reduce((s: number, x: any) => s + n(x.quantidade_planejada), 0),
      })).filter((x) => x.quantidade > 0);
      const status = linhas.every((x: any) => x.status === "concluida")
        ? "concluida"
        : linhas.some((x: any) => x.status === "em_preparo" || x.status === "concluida")
          ? "em_preparo"
          : "planejada";
      return { produtoId, linhas, total, variacoes, status };
    });
  }, [producoesVisiveis]);
  const estoqueMarmitasPorProduto = useMemo(
    () => porId(estoqueMarmitas as any[]),
    [estoqueMarmitas],
  );
  const invalidar = (...keys: string[]) =>
    Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey: [queryKey] })));
  if (!ok)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f6f0]">Verificando acesso…</div>
    );
  const abas: { id: Aba; label: string; icon: any }[] = [
    { id: "producao", label: "Produção", icon: ClipboardList },
    { id: "demanda", label: "Demanda", icon: BarChart3 },
    { id: "separar", label: "Separar hoje", icon: Salad },
    { id: "compras", label: "Lista de compras", icon: Package },
    { id: "gestao", label: "Gestão operacional", icon: Store },
    { id: "ingredientes", label: "Ingredientes", icon: Package },
    { id: "marmitas", label: "Marmitas", icon: BookOpen },
    { id: "estoque", label: "Estoque", icon: Store },
    { id: "embalagens", label: "Embalagens", icon: Package },
    { id: "relatorio", label: "Relatórios", icon: BarChart3 },
    { id: "etiquetas", label: "Etiquetas", icon: Barcode },
  ];
  const abrir = (tipo: any, item?: any) => {
    setEdit(item || null);
    setModal(tipo);
  };
  return (
    <div className="min-h-screen bg-[#f7f6f0] text-[#173a2d]">
      <header className="sticky top-0 z-10 border-b border-[#dbe7dd] bg-white/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#087443] text-white">
              <ChefHat size={22} />
            </div>
            <div>
              <h1 className="font-black">Cozinha Saborosa</h1>
              <p className="text-xs text-[#62766b]">Produção e fichas técnicas</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/cozinha-login" as any });
            }}
            className="flex items-center gap-2 text-sm font-semibold text-[#587066]"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl md:grid-cols-[220px_1fr]">
        <aside className="border-b bg-white p-3 md:min-h-[calc(100vh-65px)] md:border-b-0 md:border-r">
          {abas.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${aba === id ? "bg-[#e0f2e7] text-[#087443]" : "text-[#52695f] hover:bg-[#f3f6f3]"}`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </aside>
        <main className="p-4 md:p-8">
          {aba === "demanda" && <DemandaProducao />}
          {aba === "producao" && (
            <section>
              <Titulo
                titulo="Produção"
                texto="Planeje, acompanhe e corrija a produção de qualquer dia."
                acao={
                  <div className="flex flex-wrap gap-2">
                    <Botao onClick={() => abrir("producao")}>
                      <Plus size={18} />
                      Adicionar produção
                    </Botao>
                  </div>
                }
              />
              <div className="mb-5 grid gap-3 rounded-2xl border border-[#dbe7dd] bg-white p-4 lg:grid-cols-[185px_1fr_auto]">
                <Campo label="Dia da produção"><input className={input} type="date" value={dataProducao} onChange={(e) => setDataProducao(e.target.value)} /></Campo>
                <Campo label="Buscar item"><input className={input} value={buscaProducao} onChange={(e) => setBuscaProducao(e.target.value)} placeholder="Ex.: frango, sopa, lasanha..." /></Campo>
                <Campo label="Status"><select className={input} value={filtroProducao} onChange={(e) => setFiltroProducao(e.target.value as typeof filtroProducao)}><option value="todos">Todos os status</option><option value="planejada">Planejadas</option><option value="em_preparo">Em preparo</option><option value="concluida">Produzidas</option></select></Campo>
              </div>
              <SugestoesProducaoSinergia
                dataProducao={dataProducao}
                producoes={producoes as any[]}
                produtos={produtos as any[]}
                receitas={receitas as any[]}
                receitaItens={receitaItens as any[]}
                ingredientes={ingredientes as any[]}
                estoqueMarmitas={estoqueMarmitas as any[]}
              />
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                {[["Planejadas", (producoes as any[]).filter((p) => p.status === "planejada").length, "bg-[#fff4d9] text-[#8b5a00]"], ["Em preparo", (producoes as any[]).filter((p) => p.status === "em_preparo").length, "bg-[#e8f1ff] text-[#175da8]"], ["Produzidas", (producoes as any[]).filter((p) => p.status === "concluida").length, "bg-[#e0f2e7] text-[#087443]"]].map(([label, quantidade, cor]) => <article key={String(label)} className={`rounded-xl p-3 ${cor}`}><p className="text-xs font-bold">{label}</p><p className="text-2xl font-black">{quantidade}</p></article>)}
              </div>
              <div className="mb-5 flex justify-end">
                <Botao leve onClick={() => abrir("ficha-dia")}>
                  <BookOpen size={18} />
                  Ver ficha de produção total do dia
                </Botao>
              </div>
              {!(producoesAgrupadasVisiveis as any[]).length ? (
                <Vazio texto="Nenhuma produção encontrada para estes filtros." />
              ) : (
                <div className="grid gap-3">
                  {(producoesAgrupadasVisiveis as any[]).map((grupo) => {
                    const pr = produto.get(grupo.produtoId);
                    const ids = grupo.linhas.map((x: any) => x.id);
                    const resumoVariacoes = grupo.variacoes.map((v: any) => `${v.quantidade}×${v.label}`).join(" + ");
                    return (
                      <article key={grupo.produtoId} className="rounded-2xl border bg-white p-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="min-w-[220px] flex-1">
                            <h3 className="font-bold">{pr?.nome}</h3>
                            <p className="text-sm text-[#62766b]">{grupo.total} unidades · {resumoVariacoes}</p>
                          </div>
                          <span className="rounded-full bg-[#e0f2e7] px-3 py-1 text-xs font-bold text-[#087443]">
                            {grupo.status === "concluida" ? "Concluída" : grupo.status === "em_preparo" ? "Em preparo" : "Planejada"}
                          </span>
                          <Botao leve onClick={() => abrir("ficha-producao", pr)}><BookOpen size={16} />Ver ficha da produção</Botao>
                          <Botao leve onClick={() => abrir("ficha-montagem", pr)}><CookingPot size={16} />Ver ficha de montagem</Botao>
                          {grupo.status === "planejada" && <Botao leve onClick={async () => {
                            const { error } = await supabase.from("cozinha_producoes").update({ status: "em_preparo", updated_at: new Date().toISOString() }).in("id", ids);
                            if (error) toast.error(error.message); else invalidar("coz-prod-dia");
                          }}>Começar preparo</Botao>}
                          {grupo.status !== "concluida" && <Botao onClick={async () => {
                            if (alertasEstoquePlanejado.length) toast.warning(`Atenção: estoque insuficiente para ${alertasEstoquePlanejado.join(", ")}. A produção será registrada mesmo assim.`);
                            for (const linha of grupo.linhas.filter((x: any) => x.status !== "concluida")) {
                              const { error } = await supabase.rpc("concluir_producao_cozinha", { p_producao_id: linha.id } as any);
                              if (error) return toast.error(error.message);
                            }
                            invalidar("coz-prod-dia", "coz-estoque-marmitas");
                            toast.success("Produção concluída e adicionada ao estoque da cozinha.");
                          }}><CheckCircle2 size={16} />Marcar como produzida</Botao>}
                          {grupo.status === "concluida" && <Botao leve onClick={async () => {
                            for (const linha of grupo.linhas) {
                              const { error } = await supabase.rpc("reverter_conclusao_producao_cozinha", { p_producao_id: linha.id } as any);
                              if (error) return toast.error(error.message);
                            }
                            invalidar("coz-prod-dia", "coz-estoque-marmitas");
                            toast.success("Produção voltou para planejada e o saldo da cozinha foi corrigido.");
                          }}>Marcar como pendente</Botao>}
                          <button aria-label={`Excluir ${pr?.nome || "produção"}`} onClick={async () => {
                            if (!window.confirm(`Excluir todos os lançamentos de ${pr?.nome || "produção"} deste dia?`)) return;
                            if (grupo.linhas.some((x: any) => x.status === "concluida")) return toast.error("Antes de excluir, marque esta produção como pendente para corrigir o estoque.");
                            const { error } = await supabase.from("cozinha_producoes").delete().in("id", ids);
                            if (error) toast.error(error.message); else { invalidar("coz-prod-dia"); toast.success("Lançamentos excluídos."); }
                          }} className="rounded-xl p-2.5 text-red-600 hover:bg-red-50"><Trash2 size={18} /></button>
                        </div>
                        {grupo.linhas.length > 1 && <details className="mt-3 border-t border-[#edf1ed] pt-3">
                          <summary className="cursor-pointer text-xs font-bold text-[#527164]">Ver variações separadas</summary>
                          <div className="mt-2 grid gap-2 sm:grid-cols-3">{grupo.variacoes.map((v: any) => <div key={v.id} className="rounded-xl bg-[#f4f7f4] px-3 py-2 text-sm"><b>{v.label}</b><span className="ml-2 text-[#62766b]">{v.quantidade} un</span></div>)}</div>
                        </details>}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}
          {aba === "separar" && (
            <section>
              <Titulo
                titulo="Separar e preparar hoje"
                texto="Totais calculados conforme as fichas técnicas e a produção planejada."
                acao={separar.length ? (
                  <Botao leve onClick={() => imprimirElemento("separar-hoje-impressao", `Separar hoje — ${new Date(`${dataProducao}T12:00:00`).toLocaleDateString("pt-BR")}`)}>
                    <BookOpen size={18} />
                    Exportar PDF
                  </Botao>
                ) : null}
              />
              <div className="grid gap-3 md:grid-cols-2">
                {!separar.length ? (
                  <Vazio texto="Adicione produção e cadastre fichas técnicas para gerar a lista." />
                ) : (
                  separar.map((x) => (
                    <article key={x.id} className="rounded-2xl border bg-white p-4">
                      <h3 className="font-bold">{x.item.nome}</h3>
                      <p className="mt-2 text-2xl font-black text-[#087443]">
                        {x.qb ? "a gosto" : formatarQuantidadeProducao(x.quantidade, x.unidade, x.item?.nome)}
                      </p>
                      <p className="mt-2 text-xs text-[#62766b]">
                        Usado em: {x.pratos.join(" · ")}
                      </p>
                    </article>
                  ))
                )}
              </div>

              {separar.length > 0 && (
                <div id="separar-hoje-impressao" className="hidden print-only">
                  <section>
                    <p className="text-sm font-black text-[#087443]">SaborosaMente - Separar e preparar hoje</p>
                    <h2 className="mt-1 text-2xl font-black text-[#173a2d]">Lista de separação da cozinha</h2>
                    <p className="mt-1 text-sm text-[#62766b]">Produção de {new Date(`${dataProducao}T12:00:00`).toLocaleDateString("pt-BR")}</p>
                    <p className="mt-2 text-sm text-[#62766b]">Quantidades cruas para separar, já considerando os ganhos × e perdas % cadastrados.</p>
                  </section>
                  <section className="mt-4">
                    <div className="rounded-xl border border-[#dbe7dd] bg-white">
                      <div className="grid bg-[#173a2d] px-3 py-2 text-xs font-bold uppercase text-white" style={{gridTemplateColumns:"minmax(260px,1fr) 150px 1fr"}}>
                        <span>Ingrediente</span><span>Quantidade</span><span>Usado em</span>
                      </div>
                      {separar.map((x) => (
                        <div key={`pdf-${x.id}-${x.unidade}`} className="grid items-center border-t border-[#dbe7dd] px-3 py-2 text-sm" style={{gridTemplateColumns:"minmax(260px,1fr) 150px 1fr"}}>
                          <b>{x.item.nome}</b>
                          <b className="text-[#087443]">{x.qb ? "QB · a gosto" : formatarQuantidadeProducao(x.quantidade, x.unidade, x.item?.nome)}</b>
                          <span className="text-xs text-[#62766b]">{(x.pratos || []).map((nome: string) => String(nome).match(/\b([A-Z]{2}\d{2})\b/)?.[1] || nome).join(" · ")}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </section>
          )}
          {aba === "compras" && (
            <ListaCompras
              dataProducao={dataProducao}
              necessidades={separar}
              estoque={estoque as any[]}
            />
          )}
          {aba === "gestao" && <GestaoOperacional />}
          {aba === "ingredientes" && (
            <section>
              <Titulo
                titulo="Ingredientes"
                texto="Cadastre cada item uma vez, com último valor pago, custo e rendimento."
                acao={
                  <Botao onClick={() => abrir("ingrediente")}>
                    <Plus size={18} />
                    Novo ingrediente
                  </Botao>
                }
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {!(ingredientes as any[]).length ? (
                  <Vazio texto="Cadastre o primeiro ingrediente para começar." />
                ) : (
                  (ingredientes as any[]).map((x) => (
                    <article key={x.id} className="rounded-2xl border bg-white p-4">
                      <div className="flex justify-between">
                        <h3 className="font-bold">{x.nome}</h3>
                        <button onClick={() => abrir("ingrediente", x)} className="text-[#087443]">
                          <Pencil size={17} />
                        </button>
                      </div>
                      <p className="mt-3 font-bold text-[#087443]">
                        {x.unidade_medida === "un"
                          ? `${valor(n(x.custo_por_unidade))}/un`
                          : `${valor(n(x.custo_por_kg))}/kg`}
                      </p>
                      <p className="mt-1 text-xs text-[#62766b]">
                        Último pago:{" "}
                        {x.ultimo_valor_pago == null ? "—" : valor(n(x.ultimo_valor_pago))} ·
                        {x.tipo_rendimento === "perda"
                          ? `Perda: ${n(x.quebra_percentual)}%`
                          : x.tipo_rendimento === "ganho"
                            ? `Ganho: ×${n(x.fator_rendimento)}`
                            : "Sem perda ou ganho"}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
          {aba === "preparacoes" && (
            <section>
              <Titulo
                titulo="Preparações"
                texto="Molhos, purês e bases: cada cadastro representa uma receita-base que escala proporcionalmente na produção."
                acao={
                  <Botao onClick={() => abrir("preparacao")}>
                    <Plus size={18} />
                    Nova preparação
                  </Botao>
                }
              />
              <div className="grid gap-4 lg:grid-cols-2">
                {!(preparacoes as any[]).length ? (
                  <Vazio texto="Cadastre um molho ou outra preparação pronta." />
                ) : (
                  (preparacoes as any[]).map((x) => (
                    <article key={x.id} className="rounded-2xl border bg-white p-5">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-bold">{x.nome}</h3>
                          <p className="mt-1 text-sm text-[#087443]">
                            Receita-base proporcional · {(itensPrep.get(x.id) || []).length} ingrediente(s)
                          </p>
                        </div>
                        <button onClick={() => abrir("preparacao", x)} className="text-[#087443]">
                          <Pencil size={17} />
                        </button>
                      </div>
                      <p className="mt-3 text-xs text-[#62766b]">
                        {(itensPrep.get(x.id) || [])
                          .map((l) => ing.get(l.ingrediente_id)?.nome)
                          .filter(Boolean)
                          .join(" · ") || "Sem ingredientes cadastrados"}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
          {aba === "marmitas" && (
            <section>
              <Titulo
                titulo="Itens de produção e fichas técnicas"
                texto="Escolha refeições, sopas ou complementos e informe as gramas de cada componente por tamanho."
              />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {marmitas.map((x: any) => {
                  const r = rec.get(x.id),
                    quantidade = (itensRec.get(r?.id) || []).length;
                  return (
                    <article key={x.id} className="overflow-hidden rounded-2xl border bg-white">
                      <div className="h-36 bg-[#e9f1e8]">
                        {x.imagem_url || x.imagens?.[0] ? (
                          <img
                            src={x.imagem_url || x.imagens?.[0]}
                            className="size-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="grid size-full place-items-center text-[#087443]">
                            <ChefHat />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold">{x.nome}</h3>
                        <p className="mt-1 text-xs text-[#62766b]">
                          {quantidade
                            ? `${quantidade} componente(s) cadastrado(s)`
                            : "Ficha técnica ainda não cadastrada"}
                        </p>
                        <div className="mt-3">
                          <Botao leve onClick={() => abrir("receita", x)}>
                            <Pencil size={16} />
                            {quantidade ? "Editar ficha" : "Cadastrar ficha"}
                          </Botao>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
          {aba === "estoque" && (
            <section>
              <Titulo
                titulo="Estoque geral"
                texto="Saldo de refeições, sopas, complementos e ingredientes da cozinha."
              />
              <div className="mb-5 inline-flex rounded-xl bg-[#e7eee8] p-1">
                <button
                  onClick={() => setEstoqueAba("loja")}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${estoqueAba === "loja" ? "bg-white text-[#087443]" : "text-[#62766b]"}`}
                >
                  Loja
                </button>
                <button
                  onClick={() => setEstoqueAba("cozinha")}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${estoqueAba === "cozinha" ? "bg-white text-[#087443]" : "text-[#62766b]"}`}
                >
                  Cozinha
                </button>
              </div>
              {estoqueAba === "loja" ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {marmitas.map((x: any) => (
                    <article key={x.id} className="rounded-2xl border bg-white p-4">
                      <h3 className="font-bold">{x.nome}</h3>
                      <p className="mt-3 text-sm">
                        {x.estoque_200g || 0} · 200g &nbsp; {x.estoque_300g || 0} · 300g &nbsp;{" "}
                        {x.estoque_400g || 0} · 400g
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6">
                  <div>
                    <h3 className="mb-1 text-lg font-black">Marmitas prontas na cozinha</h3>
                    <p className="mb-3 text-sm text-[#62766b]">Transfira daqui para somar automaticamente no estoque da loja.</p>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {marmitas.map((x: any) => {
                        const saldo = estoqueMarmitasPorProduto.get(x.id);
                        return <article key={x.id} className="rounded-2xl border bg-white p-4">
                          <h4 className="font-bold">{x.nome}</h4>
                          <p className="mt-2 text-sm text-[#62766b]">{saldo?.estoque_200g || 0} · 200 g &nbsp; {saldo?.estoque_300g || 0} · 300 g &nbsp; {saldo?.estoque_400g || 0} · 400 g</p>
                          <div className="mt-3"><Botao leve onClick={() => abrir("transferencia", x)}>Transferir para loja</Botao></div>
                        </article>;
                      })}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-black">Ingredientes da cozinha</h3>
                    {(estoque as any[]).filter((x) => n(x.quantidade_atual) <= n(x.quantidade_minima)).length > 0 && <p className="mb-3 rounded-xl bg-[#fff4d9] px-3 py-2 text-sm font-bold text-[#8b5a00]">{(estoque as any[]).filter((x) => n(x.quantidade_atual) <= n(x.quantidade_minima)).length} ingrediente(s) no estoque mínimo ou abaixo.</p>}
                    <div className="grid gap-3 md:grid-cols-2">
                      {(estoque as any[]).map((x) => (
                        <article key={x.id} className="rounded-2xl border bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-bold">{x.ingrediente}</h4><p className={`mt-2 font-black ${n(x.quantidade_atual) <= n(x.quantidade_minima) ? "text-[#b45309]" : "text-[#087443]"}`}>{x.quantidade_atual} {x.unidade}</p><p className="text-xs text-[#62766b]">Mínimo: {x.quantidade_minima} {x.unidade}</p></div><Botao leve onClick={() => abrir("ajuste-estoque", x)}>Ajustar</Botao></div></article>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
          {aba === "relatorio" && (
            <section>
              <Titulo titulo="Relatório diário" texto="Acompanhe a produção, transferências e consumo do dia selecionado." />
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <article className="rounded-2xl bg-[#e0f2e7] p-4"><p className="text-xs font-bold">Produzidas</p><p className="mt-1 text-2xl font-black">{(producoes as any[]).filter((p) => p.status === "concluida").reduce((s, p) => s + n(p.quantidade_produzida), 0)}</p></article>
                <article className="rounded-2xl bg-[#e8f1ff] p-4"><p className="text-xs font-bold">Transferidas para a loja</p><p className="mt-1 text-2xl font-black">{(transferencias as any[]).filter((t) => String(t.created_at).slice(0,10) === dataProducao).reduce((s, t) => s + n(t.quantidade), 0)}</p></article>
                <article className="rounded-2xl bg-[#fff4d9] p-4"><p className="text-xs font-bold">Alertas de ingrediente</p><p className="mt-1 text-2xl font-black">{(estoque as any[]).filter((x) => n(x.quantidade_atual) <= n(x.quantidade_minima)).length}</p></article>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border bg-white p-4"><h3 className="font-black">Transferências para a loja</h3><div className="mt-3 grid gap-2">{(transferencias as any[]).filter((t) => String(t.created_at).slice(0,10) === dataProducao).length ? (transferencias as any[]).filter((t) => String(t.created_at).slice(0,10) === dataProducao).map((t) => <div key={t.id} className="flex justify-between rounded-xl bg-[#f4f7f4] p-3 text-sm"><span>{produto.get(t.produto_id)?.nome || "Marmita"} · {labelGramatura(t.tamanho)}</span><b>{t.quantidade} un</b></div>) : <p className="text-sm text-[#62766b]">Nenhuma transferência neste dia.</p>}</div></div>
                <div className="rounded-2xl border bg-white p-4"><h3 className="font-black">Últimos consumos de ingredientes</h3><div className="mt-3 grid gap-2">{(movimentosIngredientes as any[]).filter((m) => m.tipo === "consumo_producao" && String(m.created_at).slice(0,10) === dataProducao).length ? (movimentosIngredientes as any[]).filter((m) => m.tipo === "consumo_producao" && String(m.created_at).slice(0,10) === dataProducao).map((m) => <div key={m.id} className="flex justify-between rounded-xl bg-[#f4f7f4] p-3 text-sm"><span>{ing.get(m.ingrediente_id)?.nome || "Ingrediente"}</span><b>{Math.abs(n(m.quantidade)).toLocaleString("pt-BR")} g</b></div>) : <p className="text-sm text-[#62766b]">Nenhum consumo registrado neste dia.</p>}</div></div>
              </div>
            </section>
          )}
          {aba === "embalagens" && <EmbalagensManager />}
          {aba === "etiquetas" && <EtiquetasManager />}
        </main>
      </div>
      {modal === "producao" && (
        <ProducaoModal
          marmitas={marmitas}
          dataInicial={dataProducao}
          fechar={() => setModal(null)}
          salvar={async (produtoId: string, data: string, qs: any, observacao: string) => {
            if (!produtoId) return toast.error("Escolha o item de produção.");
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const linhas = TAMANHOS.filter((t) => n(qs[t.id]) > 0).map((t) => ({
              data_producao: data,
              produto_id: produtoId,
              gramatura: t.id,
              quantidade_planejada: n(qs[t.id]),
              observacao: observacao || null,
              created_by: user?.id,
            }));
            if (!linhas.length) return toast.error("Informe ao menos uma quantidade.");
            const { error } = await supabase.from("cozinha_producoes").insert(linhas);
            if (error) toast.error(error.message);
            else {
              invalidar("coz-prod-dia");
              setModal(null);
              toast.success("Produção adicionada.");
            }
          }}
        />
      )}
      {modal === "ficha-producao" && edit && (
        <FichaProducaoModal
          produto={edit}
          dataProducao={dataProducao}
          producoes={(producoes as any[]).filter((p) => p.produto_id === edit.id)}
          receita={rec.get(edit.id)}
          montagem={itensMontagem.get(rec.get(edit.id)?.id) || []}
          preparacoes={preparacoes as any[]}
          embalagens={embalagens as any[]}
          itensPreparacao={itensPrep}
          itensReceita={itensRec.get(rec.get(edit.id)?.id) || []}
          ingredientes={ingredientes as any[]}
          fechar={() => setModal(null)}
        />
      )}
      {modal === "ficha-dia" && (
        <FichaProducaoDiaModal
          dataProducao={dataProducao}
          producoes={producoes as any[]}
          produtos={produtos as any[]}
          receitas={receitas as any[]}
          montagemPorReceita={itensMontagem}
          separar={separar}
          preparacoes={preparacoes as any[]}
          itensPreparacao={itensPrep}
          ingredientes={ingredientes as any[]}
          fechar={() => setModal(null)}
        />
      )}
      {modal === "ficha-montagem" && edit && (
        <FichaMontagemModal
          produto={edit}
          dataProducao={dataProducao}
          producoes={(producoes as any[]).filter((p) => p.produto_id === edit.id)}
          receita={rec.get(edit.id)}
          montagem={itensMontagem.get(rec.get(edit.id)?.id) || []}
          fechar={() => setModal(null)}
        />
      )}
      {modal === "transferencia" && (
        <TransferenciaEstoqueModal
          produto={edit}
          saldo={estoqueMarmitasPorProduto.get(edit?.id)}
          fechar={() => setModal(null)}
          salvar={async (tamanho: string, quantidade: number) => {
            const { error } = await supabase.rpc("transferir_cozinha_para_loja", {
              p_produto_id: edit.id,
              p_tamanho: tamanho,
              p_quantidade: quantidade,
            } as any);
            if (error) return toast.error(error.message);
            invalidar("coz-estoque-marmitas", "coz-prod");
            setModal(null);
            toast.success("Transferência concluída. Estoque da loja atualizado.");
          }}
        />
      )}
      {modal === "ajuste-estoque" && <AjusteEstoqueModal item={edit} fechar={() => setModal(null)} salvar={async (quantidade: number, minimo: number, observacao: string) => {
        const { error } = await supabase.rpc("ajustar_estoque_ingrediente", { p_ingrediente_id: edit.ingrediente_id, p_quantidade: quantidade, p_minimo: minimo, p_observacao: observacao || null } as any);
        if (error) return toast.error(error.message);
        invalidar("coz-estoque", "coz-movimentos-ingredientes"); setModal(null); toast.success("Estoque do ingrediente atualizado.");
      }} />}
      {modal === "ingrediente" && (
        <IngredienteModal
          item={edit}
          fechar={() => setModal(null)}
          salvar={async (d: any) => {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const payload = { ...d, updated_by: user?.id, updated_at: new Date().toISOString() };
            const { error } = edit?.id
              ? await supabase.from("cozinha_ingredientes").update(payload).eq("id", edit.id)
              : await supabase.from("cozinha_ingredientes").insert(payload);
            if (error) toast.error(error.message);
            else {
              invalidar("coz-ing");
              setModal(null);
              toast.success("Ingrediente salvo.");
            }
          }}
        />
      )}
      {modal === "preparacao" && (
        <PreparacaoModal
          item={edit}
          ingredientes={ingredientes as any[]}
          linhasIniciais={itensPrep.get(edit?.id) || []}
          fechar={() => setModal(null)}
          salvar={async (d: any, linhas: any[]) => {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const payload = { ...d, updated_by: user?.id, updated_at: new Date().toISOString() };
            const { data, error } = edit?.id
              ? await supabase
                  .from("cozinha_preparacoes")
                  .update(payload)
                  .eq("id", edit.id)
                  .select()
                  .single()
              : await supabase.from("cozinha_preparacoes").insert(payload).select().single();
            if (error || !data) return toast.error(error?.message || "Erro ao salvar.");
            await supabase.from("cozinha_preparacao_itens").delete().eq("preparacao_id", data.id);
            const validas = linhas.filter((x) => x.ingrediente_id);
            if (validas.length) {
              const { error: e } = await supabase
                .from("cozinha_preparacao_itens")
                .insert(validas.map((x, i) => ({ ...x, preparacao_id: data.id, ordem: i })));
              if (e) return toast.error(e.message);
            }
            invalidar("coz-prep", "coz-prep-itens");
            setModal(null);
            toast.success("Preparação salva.");
          }}
        />
      )}
      {modal === "receita" && (
        <ReceitaModal
          produto={edit}
          receita={rec.get(edit?.id)}
          linhasIniciais={itensRec.get(rec.get(edit?.id)?.id) || []}
          montagemInicial={itensMontagem.get(rec.get(edit?.id)?.id) || []}
          ingredientes={ingredientes as any[]}
          preparacoes={preparacoes as any[]}
          embalagens={embalagens as any[]}
          itensPreparacao={itensPrep}
          custoIng={custoIng}
          custoPrep={custoPrep}
          criarIngrediente={async (nome: string, custoPorKg: number, rendimento: number) => {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const { data, error } = await supabase
              .from("cozinha_ingredientes")
              .insert({
                nome: nome.trim(),
                unidade_medida: "g",
                custo_por_kg: custoPorKg,
                rendimento_padrao: rendimento,
                updated_by: user?.id,
              })
              .select()
              .single();
            if (error || !data) {
              toast.error(error?.message || "Não foi possível criar o ingrediente.");
              return null;
            }
            await invalidar("coz-ing");
            return data;
          }}
          fechar={() => setModal(null)}
          salvar={async (linhas: any[], montagem: MontagemLinha[]) => {
            const { data: { user } } = await supabase.auth.getUser();
            const preparacoesExistentes = Array.isArray(rec.get(edit?.id)?.preparacoes) ? rec.get(edit?.id)?.preparacoes : [];
            const preparacoesFicha = Array.from(
              new Map(
                [
                  ...preparacoesExistentes.map((p: any) => [p.id, p]),
                  ...linhas
                    .filter((x) => x.preparacao_id)
                    .map((x) => [
                      x.preparacao_id,
                      {
                        id: x.preparacao_id,
                        nome: (preparacoes as any[]).find((p) => p.id === x.preparacao_id)?.nome || "Preparação",
                      },
                    ]),
                ].filter(([id]) => id),
              ).values(),
            );
            const { data, error } = await supabase.from("cozinha_receitas").upsert({ produto_id: edit.id, ingredientes: [], modo_preparo: null, preparacoes: preparacoesFicha, updated_by: user?.id, updated_at: new Date().toISOString() }, { onConflict: "produto_id" }).select().single();
            if (error || !data) return toast.error(error?.message || "Erro ao salvar.");
            const { error: apagarIngredientes } = await supabase.from("cozinha_receita_itens").delete().eq("receita_id", data.id);
            if (apagarIngredientes) return toast.error(apagarIngredientes.message);
            const validas = linhas.filter((x) => x.ingrediente_id || x.preparacao_id);
            if (validas.length) {
              const { error: e } = await supabase.from("cozinha_receita_itens").insert(validas.map((x, i) => ({ ...x, receita_id: data.id, ordem: i, operacao_producao: x.operacao_producao || "direto", fator_producao: n(x.fator_producao || 1) })));
              if (e) return toast.error(e.message);
            }
            const { error: apagarMontagem } = await supabase.from("cozinha_receita_montagem_itens").delete().eq("receita_id", data.id);
            if (apagarMontagem) return toast.error(apagarMontagem.message);
            const final = montagem.filter((x) => x.nome.trim());
            if (final.length) {
              const { error: e } = await supabase.from("cozinha_receita_montagem_itens").insert(final.map((x, i) => ({ receita_id: data.id, nome: x.nome.trim(), gramas_200: n(x.gramas_200), gramas_300: n(x.gramas_300), gramas_400: n(x.gramas_400), observacao: x.observacao || null, ordem: i })));
              if (e) return toast.error(e.message);
            }
            invalidar("coz-rec", "coz-rec-itens", "coz-montagem-itens");
            setModal(null); toast.success("Ficha técnica salva.");
          }}        />
      )}
    </div>
  );
}
function Titulo({ titulo, texto, acao }: any) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-3xl font-black">{titulo}</h2>
        <p className="mt-1 text-sm text-[#62766b]">{texto}</p>
      </div>
      {acao}
    </div>
  );
}
function Vazio({ texto }: any) {
  return (
    <div className="rounded-2xl border border-dashed border-[#bed2c4] bg-white p-10 text-center text-sm text-[#62766b]">
      {texto}
    </div>
  );
}
function Botao({ children, onClick, leve = false }: any) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${leve ? "border border-[#bcd8c5] bg-white text-[#087443]" : "bg-[#087443] text-white"}`}
    >
      {children}
    </button>
  );
}
function Janela({ titulo, fechar, children }: any) {
  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-black/45 p-4">
      <div className="mx-auto my-4 w-full max-w-6xl rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex justify-between">
          <h3 className="text-xl font-black">{titulo}</h3>
          <button onClick={fechar}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Campo({ label, children }: any) {
  return (
    <label className="block text-sm font-bold text-[#355445]">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
function ProducaoModal({ marmitas, dataInicial, fechar, salvar }: any) {
  const [produto, setProduto] = useState(""),
    [data, setData] = useState(dataInicial || hoje()),
    [q, setQ] = useState<any>({}),
    [obs, setObs] = useState("");
  const produtoSelecionado = marmitas.find((x: any) => x.id === produto);
  const tamanhosDisponiveis = produtoSelecionado?.tipo_produto === "sopa" ? TAMANHOS.filter((t) => t.id === "400") : TAMANHOS;
  return (
    <Janela titulo="Adicionar à produção" fechar={fechar}>
      <div className="grid gap-4">
        <Campo label="Dia da produção">
          <input className={input} type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Campo>
        <Campo label="Item de produção">
          <select className={input} value={produto} onChange={(e) => setProduto(e.target.value)}>
            <option value="">Selecione o item</option>
            {marmitas.map((x: any) => (
              <option key={x.id} value={x.id}>
                {x.nome}
              </option>
            ))}
          </select>
        </Campo>
        <div className="grid gap-3 sm:grid-cols-4">
          {tamanhosDisponiveis.map((t) => (
            <Campo key={t.id} label={t.label}>
              <input
                className={input}
                min="0"
                type="number"
                value={q[t.id] || ""}
                onChange={(e) => setQ({ ...q, [t.id]: e.target.value })}
              />
            </Campo>
          ))}
        </div>
        <Campo label="Observação">
          <input
            className={input}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Opcional"
          />
        </Campo>
        <Botao onClick={() => salvar(produto, data, q, obs)}>Adicionar produção</Botao>
      </div>
    </Janela>
  );
}
function FichaProducaoDiaModal({ dataProducao, producoes, produtos, receitas, montagemPorReceita, separar, preparacoes, itensPreparacao, ingredientes, fechar }: any) {
  const produtoPorId = new Map((produtos as any[]).map((x: any) => [x.id, x]));
  const receitaPorProduto = new Map((receitas as any[]).map((x: any) => [x.produto_id, x]));
  const prepPorId = new Map((preparacoes as any[]).map((x: any) => [x.id, x]));
  const ingPorId = new Map((ingredientes as any[]).map((x: any) => [x.id, x]));
  const normalizar = (v: unknown) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const mesmo = (a: unknown, b: unknown) => { const x=normalizar(a), y=normalizar(b); return !!x && !!y && (x.includes(y) || y.includes(x) || x.split(' ').some((t)=>t.length>=4 && y.includes(t))); };
  const codigo = (nome: string) => String(nome || '').match(/\b([A-Z]{2}\d{2})\b/)?.[1] || nome;
  const grupos = new Map<string, any[]>();
  (producoes as any[]).forEach((p: any) => grupos.set(p.produto_id, [...(grupos.get(p.produto_id) || []), p]));
  const pratos = Array.from(grupos.entries()).map(([produtoId, linhas]) => {
    const produto = produtoPorId.get(produtoId) as any;
    const receita = receitaPorProduto.get(produtoId) as any;
    const montagem = receita ? (montagemPorReceita.get(receita.id) || []) : [];
    const q = { '200': 0, '300': 0, '400': 0 } as Record<string, number>;
    linhas.forEach((p: any) => { if (q[p.gramatura] != null) q[p.gramatura] += n(p.quantidade_planejada); });
    const montagemTotal = montagem.map((m: any) => ({ ...m, total: n(m.gramas_200)*q['200'] + n(m.gramas_300)*q['300'] + n(m.gramas_400)*q['400'] })).filter((m:any)=>m.total>0 || m.observacao);
    return { produto, receita, q, montagem, montagemTotal, total:q['200']+q['300']+q['400'] };
  }).filter((x:any)=>x.produto).sort((a:any,b:any)=>a.produto.nome.localeCompare(b.produto.nome));

  const prepDia = new Map<string, any>();
  pratos.forEach((prato:any) => {
    const vinculadas = (Array.isArray(prato.receita?.preparacoes) ? prato.receita.preparacoes : []).map((r:any)=>prepPorId.get(r?.id)).filter(Boolean) as any[];
    prato.montagemTotal.forEach((m:any) => {
      const prep = vinculadas.find((x:any)=>mesmo(x.nome,m.nome)) || (preparacoes as any[]).find((x:any)=>mesmo(x.nome,m.nome));
      if (!prep || !(m.total>0)) return;
      const atual = prepDia.get(prep.id) || { prep, total:0, pratos:[] as any[] };
      atual.total += m.total;
      const ja = atual.pratos.find((x:any)=>x.produto_id===prato.produto.id);
      if (ja) ja.total += m.total; else atual.pratos.push({produto_id:prato.produto.id,nome:prato.produto.nome,codigo:codigo(prato.produto.nome),total:m.total});
      prepDia.set(prep.id, atual);
    });
  });
  const preparacoesConsolidadas = Array.from(prepDia.values()).sort((a:any,b:any)=>a.prep.nome.localeCompare(b.prep.nome));
  const formatPeso = (g:number) => formatarQuantidadeProducao(arredondarProducao(g,'g'),'g');
  const fmtItemPrep = (item:any, fator:number) => {
    const ing = ingPorId.get(item.ingrediente_id) as any;
    const txt = String(item.quantidade_texto || '').trim();
    if (ehQB(txt) || !n(item.quantidade)) return `${ing?.nome || 'Ingrediente'}: QB`;
    if (/\blitro(s)?\b|\bl\b/i.test(txt)) { const litros=(n(item.quantidade)*fator)/1000; return `${ing?.nome || 'Ingrediente'}: ${litros.toLocaleString('pt-BR',{maximumFractionDigits:3})} L`; }
    const qtd = n(item.quantidade)*fator;
    return `${ing?.nome || 'Ingrediente'}: ${formatarQuantidadeProducao(arredondarProducao(qtd,'g'),'g',ing?.nome)}`;
  };
  const totalMarmitas = pratos.reduce((s:number,x:any)=>s+x.total,0);
  const dataFmt = new Date(`${dataProducao}T12:00:00`).toLocaleDateString('pt-BR');
  const exatos = (montagem:any[], tamanho:'200'|'300'|'400') => {
    const chave=`gramas_${tamanho}`;
    const vals=montagem.map((m:any)=>n(m[chave])>0?arredondarProducao(m[chave],'g'):0);
    const ids=vals.map((v:number,i:number)=>v>0?i:-1).filter((i:number)=>i>=0);
    if(ids.length){const soma=vals.reduce((a:number,b:number)=>a+b,0); vals[ids[ids.length-1]]=Math.max(0,vals[ids[ids.length-1]]+n(tamanho)-soma);}
    return vals;
  };

  return <Janela titulo={`Ficha de produção total do dia — ${dataFmt}`} fechar={fechar}>
    <div className="mb-4 flex justify-end"><Botao leve onClick={() => imprimirElemento("ficha-producao-dia-impressao", `Ficha de produção do dia — ${dataFmt}`)}>Imprimir ficha do dia</Botao></div>
    <div id="ficha-producao-dia-impressao">
      <section>
        <p className="text-sm font-black text-[#087443]">SaborosaMente - Ficha operacional da cozinha</p>
        <h2 className="mt-1 text-2xl font-black text-[#173a2d]">Produção do dia</h2>
        <p className="mt-1 text-sm text-[#62766b]">{dataFmt}</p>
        <div className="mt-3 grid gap-1" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
          <div className="border border-[#dbe7dd] bg-[#edf5e6] p-3 text-center"><p className="text-xs font-bold uppercase text-[#62766b]">Unidades</p><p className="mt-1 text-xl font-black text-[#087443]">{totalMarmitas}</p></div>
          <div className="border border-[#dbe7dd] bg-[#edf5e6] p-3 text-center"><p className="text-xs font-bold uppercase text-[#62766b]">Produtos</p><p className="mt-1 text-xl font-black text-[#087443]">{pratos.length}</p></div>
          <div className="border border-[#dbe7dd] bg-[#edf5e6] p-3 text-center"><p className="text-xs font-bold uppercase text-[#62766b]">Preparações</p><p className="mt-1 text-xl font-black text-[#087443]">{preparacoesConsolidadas.length}</p></div>
        </div>
      </section>
      <section className="mt-4">
        <p className="mb-2 text-lg font-black uppercase text-[#087443]">1. Produção planejada</p>
        <div className="border border-[#dbe7dd] bg-white">
          <div className="grid bg-[#173a2d] px-3 py-2 text-xs font-bold text-white" style={{gridTemplateColumns:"minmax(300px,1fr) 72px 72px 72px 72px"}}><span>Produto</span><span>200 g</span><span>300 g</span><span>400 g</span><span>Total</span></div>
          {pratos.map((x:any)=><div key={x.produto.id} className="grid items-center border-t border-[#dbe7dd] px-3 py-2 text-sm" style={{gridTemplateColumns:"minmax(300px,1fr) 72px 72px 72px 72px"}}><b>{x.produto.nome}</b><span>{x.q["200"]||"—"}</span><span>{x.q["300"]||"—"}</span><span>{x.q["400"]||"—"}</span><b className="text-[#087443]">{x.total} un</b></div>)}
        </div>
      </section>
      <section className="mt-4">
        <p className="mb-2 text-lg font-black uppercase text-[#087443]">2. Preparações consolidadas do dia</p>
        <p className="mb-2 text-sm text-[#62766b]">Produzir cada preparação uma única vez para o dia inteiro e depois separar a quantidade pronta indicada para cada prato.</p>
        <div className="border border-[#dbe7dd] bg-white">
          <div className="grid bg-[#173a2d] px-3 py-2 text-xs font-bold text-white" style={{gridTemplateColumns:"190px minmax(280px,1fr) minmax(280px,1fr)"}}><span>Preparação</span><span>Quantidade / ingredientes</span><span>Modo de preparo</span></div>
          {preparacoesConsolidadas.map((g:any)=>{const rendimento=n(g.prep.rendimento_final_g); const fator=rendimento>0?g.total/rendimento:0; const itens=(itensPreparacao.get(g.prep.id)||[]) as any[]; return <div key={g.prep.id} className="grid border-t border-[#dbe7dd] text-sm" style={{gridTemplateColumns:"190px minmax(280px,1fr) minmax(280px,1fr)"}}>
            <div className="p-3"><b>{g.prep.nome}</b><p className="mt-1 text-xs text-[#62766b]">Produzir <b className="text-[#087443]">{formatPeso(g.total)}</b> no total</p></div>
            <div className="border-l border-[#dbe7dd] p-3"><p className="text-xs font-black uppercase text-[#527164]">Separar por prato</p>{g.pratos.map((pr:any)=><p key={pr.produto_id} className="mt-1"><b>{pr.codigo}</b>: {formatPeso(pr.total)}</p>)}<p className="mt-2 text-xs font-black uppercase text-[#527164]">Ingredientes do lote</p>{itens.map((item:any)=><p key={item.id} className="mt-1">{fmtItemPrep(item,fator)}</p>)}</div>
            <div className="border-l border-[#dbe7dd] p-3"><p className="whitespace-pre-line text-sm">{textoCozinha(g.prep.modo_preparo).replace(/\\n/g,"\n") || "Modo de preparo não informado."}</p></div>
          </div>})}
        </div>
      </section>
      <section className="mt-4">
        <p className="mb-2 text-lg font-black uppercase text-[#087443]">3. Ingredientes necessários do dia</p>
        <p className="mb-2 text-sm text-[#62766b]">Quantidades cruas para separar, já considerando os ganhos × e as perdas % cadastradas.</p>
        <div className="border border-[#dbe7dd] bg-white">
          <div className="grid bg-[#173a2d] px-3 py-2 text-xs font-bold text-white" style={{gridTemplateColumns:"minmax(250px,1fr) 140px 1fr"}}><span>Ingrediente</span><span>Quantidade</span><span>Usado em</span></div>
          {(separar as any[]).map((x:any)=>{const codigos=(x.pratos||[]).map((nome:string)=>codigo(nome)); return <div key={`${x.id}-${x.unidade}`} className="grid items-center border-t border-[#dbe7dd] px-3 py-2 text-sm" style={{gridTemplateColumns:"minmax(250px,1fr) 140px 1fr"}}><b>{x.item?.nome}</b><b className="text-[#087443]">{x.qb?"QB · a gosto":formatarQuantidadeProducao(x.quantidade,x.unidade,x.item?.nome)}</b><span className="text-xs text-[#62766b]">{codigos.join(" · ")||"—"}</span></div>})}
        </div>
      </section>
      <section className="page-break-before">
        <p className="text-sm font-black uppercase text-[#087443]">4. Montagem por tamanho</p>
        <h2 className="mt-1 text-2xl font-black text-[#173a2d]">Referência de montagem do dia</h2>
        <p className="mt-1 text-sm text-[#62766b]">As preparações acima já devem estar prontas e separadas. Aqui é somente a montagem final das marmitas.</p>
        <div className="mt-3 grid gap-3">{pratos.map((x:any)=>{const v200=exatos(x.montagem,"200"),v300=exatos(x.montagem,"300"),v400=exatos(x.montagem,"400"); return <article key={x.produto.id} className="border border-[#dbe7dd] bg-white">
          <div className="flex items-center justify-between gap-3 bg-[#edf5e6] p-3"><div><h3 className="text-lg font-black">{x.produto.nome}</h3><p className="mt-1 text-xs text-[#62766b]">Produção: {TAMANHOS.filter(t=>x.q[t.id]>0).map(t=>`${x.q[t.id]}×${t.label}`).join(" + ")}</p></div><b className="text-[#087443]">{x.total} un</b></div>
          <div className="grid bg-[#173a2d] px-3 py-2 text-xs font-bold text-white" style={{gridTemplateColumns:"minmax(250px,1fr) 90px 90px 90px"}}><span>Componente pronto</span><span>200 g</span><span>300 g</span><span>400 g</span></div>
          {x.montagem.map((m:any,i:number)=><div key={m.id||i} className="grid items-center border-t border-[#dbe7dd] px-3 py-2 text-sm" style={{gridTemplateColumns:"minmax(250px,1fr) 90px 90px 90px"}}><b>{`${i+1}. ${m.nome}`}</b><span>{v200[i]>0?`${v200[i]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span><span>{v300[i]>0?`${v300[i]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span><span>{v400[i]>0?`${v400[i]} g`:(ehQB(m.observacao)?"a gosto":"—")}</span></div>)}
          <div className="grid border-t border-[#dbe7dd] bg-[#edf5e6] px-3 py-2 text-sm font-black" style={{gridTemplateColumns:"minmax(250px,1fr) 90px 90px 90px"}}><span>TOTAL</span><span>200 g</span><span>300 g</span><span>400 g</span></div>
        </article>})}</div>
      </section>
    </div>
  </Janela>;
}

function FichaMontagemModal({ produto, dataProducao, producoes, receita, montagem, fechar }: any) {
  const q = { "200": 0, "300": 0, "400": 0 } as Record<string, number>;
  (producoes as any[]).forEach((p: any) => { if (q[p.gramatura] != null) q[p.gramatura] += n(p.quantidade_planejada); });
  const dataFmt = new Date(`${dataProducao}T12:00:00`).toLocaleDateString("pt-BR");
  const fmt = (v: unknown, observacao?: unknown) => n(v) > 0 ? `${arredondarProducao(v, "g").toLocaleString("pt-BR")} g` : (ehQB(observacao) ? "a gosto" : "—");
  return <Janela titulo={`Ficha de montagem — ${produto.nome}`} fechar={fechar}>
    <div className="mb-5 rounded-2xl bg-[#edf5e6] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#087443]">Montagem por tamanho</p><p className="mt-1 text-sm text-[#527164]">Referência para montar cada marmita individualmente. Produção de {dataFmt}: {TAMANHOS.filter(t => q[t.id] > 0).map(t => `${q[t.id]}×${t.label}`).join(" + ") || "nenhuma quantidade lançada"}.</p></div>
    {!receita || !(montagem as any[]).length ? <Vazio texto="Esta ficha ainda não possui montagem cadastrada." /> : <div className="overflow-x-auto rounded-2xl border border-[#dbe7dd]"><div className="min-w-[720px]"><div className="grid grid-cols-[minmax(260px,1fr)_140px_140px_140px] gap-2 bg-[#edf5e6] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#527164]"><span>Componente pronto</span><span>200 g</span><span>300 g</span><span>400 g</span></div>{(montagem as any[]).map((m: any, i: number) => <div key={m.id || i} className="grid grid-cols-[minmax(260px,1fr)_140px_140px_140px] items-center gap-2 border-t border-[#e2ebe3] bg-white px-4 py-3"><div><b>{m.nome}</b>{m.observacao && !ehQB(m.observacao) && <p className="mt-1 text-xs text-[#62766b]">{textoCozinha(m.observacao)}</p>}</div><span>{fmt(m.gramas_200, m.observacao)}</span><span>{fmt(m.gramas_300, m.observacao)}</span><span>{fmt(m.gramas_400, m.observacao)}</span></div>)}</div></div>}
    <div className="mt-5 grid gap-3 sm:grid-cols-3">{TAMANHOS.map(t => <div key={t.id} className="rounded-xl bg-[#f4f7f4] p-3"><p className="text-xs font-bold text-[#62766b]">Produzir {t.label}</p><p className="mt-1 text-lg font-black text-[#087443]">{q[t.id]} un</p></div>)}</div>
  </Janela>;
}

function FichaProducaoModal({ produto, dataProducao, producoes, receita, montagem, preparacoes, itensPreparacao, itensReceita = [], ingredientes, fechar }: any) {
  const normalizar = (v: unknown) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const tokens = (v: unknown) => normalizar(v).split(" ").filter((x) => x.length >= 4 && !["molho", "pronto", "cozido", "cozida", "grelhado", "grelhada"].includes(x));
  const mesmo = (a: unknown, b: unknown) => {
    const na = normalizar(a), nb = normalizar(b);
    if (!na || !nb) return false;
    if (na.includes(nb) || nb.includes(na)) return true;
    const ta = tokens(a), tb = tokens(b);
    return ta.some((x) => tb.includes(x));
  };
  const porId = new Map((ingredientes as any[]).map((x: any) => [x.id, x]));
  const quantidades = { "200": 0, "300": 0, "400": 0 } as Record<string, number>;
  (producoes as any[]).forEach((p: any) => { if (quantidades[p.gramatura] != null) quantidades[p.gramatura] += n(p.quantidade_planejada); });
  const montagemTotal = (montagem as any[]).map((m: any) => ({
    ...m,
    total: n(m.gramas_200) * quantidades["200"] + n(m.gramas_300) * quantidades["300"] + n(m.gramas_400) * quantidades["400"],
  })).filter((m: any) => m.total > 0 || m.observacao);
  const idsPreps = Array.from(new Set((Array.isArray(receita?.preparacoes) ? receita.preparacoes : []).map((p: any) => p?.id).filter(Boolean)));
  const preps = idsPreps.map((id: any) => (preparacoes as any[]).find((p: any) => p.id === id)).filter(Boolean);
  const formatPeso = (g: number) => `${arredondarProducao(g, "g").toLocaleString("pt-BR")} g`;
  const interpretar = (item: any, fator: number) => {
    const texto = String(item.quantidade_texto || "").trim();
    const ingrediente = porId.get(item.ingrediente_id) as any;
    if (ehQB(texto) || !n(item.quantidade)) return { tipo: "texto", valor: 0, exibicao: ehQB(texto) || !texto ? "a gosto" : textoCozinha(texto) };
    const volumeLitros = /\blitro(s)?\b|\bl\b/i.test(texto);
    if (volumeLitros) {
      const litros = (n(item.quantidade) * fator) / 1000;
      return { tipo: "volume", valor: litros, exibicao: `${litros.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })} L` };
    }
    const peso = /\bkg\b|\bgr\b|grama|\bg\b/i.test(texto);
    if (peso) {
      const bruto = n(item.quantidade) * fator;
      if (ehMicroIngrediente(ingrediente?.nome) && bruto > 0 && bruto < 1) return { tipo: "peso", valor: bruto, exibicao: formatarQuantidadeProducao(bruto, "g", ingrediente?.nome) };
      const g = arredondarProducao(bruto, "g");
      return { tipo: "peso", valor: g, exibicao: formatPeso(g) };
    }
    const semNumero = textoCozinha(texto.replace(/^\s*[\d.,]+\s*/i, "").trim());
    const un = arredondarProducao(n(item.quantidade) * fator, "un");
    return { tipo: "un", valor: un, exibicao: `${un.toLocaleString("pt-BR")}${semNumero ? ` ${semNumero}` : " un"}` };
  };
  const totalReceitaPorIngrediente = new Map<string, number>();
  (itensReceita as any[]).filter((x: any) => x.ingrediente_id).forEach((x: any) => {
    const total = n(x.gramas_200) * n(quantidades["200"]) + n(x.gramas_300) * n(quantidades["300"]) + n(x.gramas_400) * n(quantidades["400"]);
    if (total > 0) totalReceitaPorIngrediente.set(x.ingrediente_id, (totalReceitaPorIngrediente.get(x.ingrediente_id) || 0) + total);
  });

  const preparacoesCalculadas = preps.map((prep: any) => {
    const componente = montagemTotal.find((m: any) => mesmo(m.nome, prep.nome));
    const pronto = n(componente?.total);
    const fator = n(prep.rendimento_final_g) > 0 ? pronto / n(prep.rendimento_final_g) : 0;
    const itens = (itensPreparacao.get(prep.id) || []).map((item: any) => {
      const ingrediente = porId.get(item.ingrediente_id);
      const fallbackExato = n(totalReceitaPorIngrediente.get(item.ingrediente_id));
      const calculadoBase = interpretar(item, fator);
      const usarFallback = !(n(prep.rendimento_final_g) > 0) || !(n(item.quantidade) > 0) || calculadoBase.tipo === "texto" || !(n(calculadoBase.valor) > 0);
      const calculado = usarFallback && fallbackExato > 0
        ? { tipo: "peso", valor: fallbackExato, exibicao: formatarQuantidadeProducao(fallbackExato, "g", ingrediente?.nome) }
        : calculadoBase;
      const pendente = usarFallback && !(fallbackExato > 0) && !(n(calculadoBase.valor) > 0);
      return { ...item, ingrediente, calculado, pendente };
    });
    return { prep, componente, pronto, fator, itens };
  }).filter((x: any) => x.pronto > 0 || x.itens.length);
  const nomesPrep = preps.map((p: any) => p.nome);
  const montagemDireta = montagemTotal.filter((m: any) => !nomesPrep.some((nome: string) => mesmo(m.nome, nome)));
  const diretos = montagemDireta.map((m: any) => {
    const ingrediente = (ingredientes as any[]).find((x: any) => mesmo(x.nome, m.nome));
    let bruto = m.total;
    if (ingrediente?.tipo_rendimento === "perda") {
      const perda = Math.min(99.999, Math.max(0, n(ingrediente.quebra_percentual))) / 100;
      bruto = m.total / (1 - perda);
    }
    if (ingrediente?.tipo_rendimento === "ganho") bruto = m.total / Math.max(0.000001, n(ingrediente.fator_rendimento || 1));
    return { montagem: m, ingrediente, bruto };
  });
  const idsEmPreparacoes = new Set(preparacoesCalculadas.flatMap((pc: any) => pc.itens.map((item: any) => item.ingrediente_id).filter(Boolean)));
  const idsDiretosMontagem = new Set(diretos.map((d: any) => d.ingrediente?.id).filter(Boolean));
  const ingredientesSemVinculo = (itensReceita as any[])
    .filter((x: any) => x.ingrediente_id && !idsEmPreparacoes.has(x.ingrediente_id) && !idsDiretosMontagem.has(x.ingrediente_id))
    .map((x: any) => ({
      ...x,
      ingrediente: porId.get(x.ingrediente_id),
      total: n(x.gramas_200) * n(quantidades["200"]) + n(x.gramas_300) * n(quantidades["300"]) + n(x.gramas_400) * n(quantidades["400"]),
    }))
    .filter((x: any) => x.total > 0);
  const totais = new Map<string, { nome: string; peso: number; unidades: number; textos: string[] }>();
  const addTotal = (id: string, nome: string, tipo: string, valor: number, exibicao?: string) => {
    const atual = totais.get(id) || { nome, peso: 0, unidades: 0, textos: [] };
    if (tipo === "peso") atual.peso += valor;
    else if (tipo === "un") atual.unidades += valor;
    else if (exibicao && !atual.textos.includes(exibicao)) atual.textos.push(exibicao);
    totais.set(id, atual);
  };
  if ((itensReceita as any[]).some((x: any) => x.ingrediente_id && totalReceitaPorIngrediente.get(x.ingrediente_id))) {
    totalReceitaPorIngrediente.forEach((qtd: number, ingredienteId: string) => {
      const ingrediente = porId.get(ingredienteId);
      if (ingrediente) addTotal(ingredienteId, ingrediente.nome, "peso", qtd);
    });
  } else {
    preparacoesCalculadas.forEach((pc: any) => pc.itens.forEach((item: any) => addTotal(item.ingrediente_id, item.ingrediente?.nome || "Ingrediente", item.calculado.tipo, item.calculado.valor, item.calculado.exibicao)));
  }
  diretos.forEach((d: any) => {
    if (!d.ingrediente) return;
    totais.delete(d.ingrediente.id);
    addTotal(d.ingrediente.id, d.ingrediente.nome, "peso", d.bruto);
  });
  const listaSeparar = Array.from(totais.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  const resumo = TAMANHOS.filter((t) => quantidades[t.id] > 0).map((t) => `${quantidades[t.id]}×${t.label}`).join(" + ");
  const montagemExata = (tamanho: "200" | "300" | "400") => {
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
  const totalLoteProduto = montagemTotal.reduce((s:number,m:any)=>s+n(m.total),0);
  return <Janela titulo={`Ficha de produção — ${produto.nome}`} fechar={fechar}>
    <div className="mb-4 flex justify-end"><Botao leve onClick={() => imprimirElemento("ficha-producao-produto-impressao", `Ficha de produção — ${produto.nome}`)}>Imprimir ficha</Botao></div>
    <div id="ficha-producao-produto-impressao">
      <section>
        <p className="text-sm font-black text-[#087443]">SaborosaMente - Ficha operacional da cozinha</p>
        <h2 className="mt-1 text-2xl font-black text-[#173a2d]">{produto.nome}</h2>
        <p className="mt-1 text-sm text-[#62766b]">Produção do dia: <b className="text-[#173a2d]">{resumo || "Sem quantidade planejada"}</b></p>
        <div className="mt-3 border border-[#dbe7dd] bg-[#edf5e6]">{["Receber da ficha do dia todos os componentes já preparados e separados.","Conferir o total pronto necessário de cada componente para este produto.","Usar a coluna correta de 200 g, 300 g ou 400 g.","Montar a marmita respeitando exatamente a ordem indicada.","Conferir o peso e comparar com a foto antes de tampar."].map((txt,i)=><div key={txt} className="grid border-t border-[#dbe7dd] px-3 py-2 text-sm first:border-t-0" style={{gridTemplateColumns:"28px 1fr"}}><b>{i+1}.</b><span>{txt}</span></div>)}</div>
      </section>
      <section className="mt-4">
        <p className="mb-2 text-lg font-black uppercase text-[#087443]">1. Componentes prontos do lote</p>
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
        <div className="mt-4" style={{textAlign:"center",breakInside:"avoid",pageBreakInside:"avoid"}}><div style={{width:"90%",margin:"0 auto 8px",borderTop:"1px solid #dbe7dd"}} /><p className="text-sm font-black uppercase text-[#087443]">Referência visual da montagem final</p><div style={{width:"100%",margin:"10px auto 0",textAlign:"center"}}>{produto.imagem_url || produto.imagens?.[0] ? <img src={produto.imagem_url || produto.imagens?.[0]} alt={produto.nome} style={{width:"76%",maxWidth:"none",height:"auto",maxHeight:"400px",objectFit:"contain",objectPosition:"center center",display:"block",margin:"0 auto"}} /> : <div className="grid place-items-center" style={{height:"220px"}}><ChefHat size={48}/></div>}</div><p className="mt-2 text-sm font-bold text-[#087443]">Foto ampliada e centralizada para facilitar a conferência visual do produto pronto.</p></div>
      </section>
    </div>
  </Janela>;
}
function IngredienteModal({ item, fechar, salvar }: any) {
  const [d, setD] = useState<any>({
    nome: item?.nome || "",
    unidade_medida: item?.unidade_medida || "g",
    rendimento_padrao: String(item?.rendimento_padrao ?? 1),
    tipo_rendimento: item?.tipo_rendimento || "nenhum",
    quebra_percentual: String(item?.quebra_percentual ?? 0),
    fator_rendimento: String(item?.fator_rendimento ?? 1),
    custo_por_kg: String(item?.custo_por_kg ?? 0),
    custo_por_unidade: String(item?.custo_por_unidade ?? 0),
    ultimo_valor_pago: item?.ultimo_valor_pago == null ? "" : String(item.ultimo_valor_pago),
    observacao: item?.observacao || "",
    calorias_100g: item?.calorias_100g == null ? "" : String(item.calorias_100g),
    carboidratos_100g: item?.carboidratos_100g == null ? "" : String(item.carboidratos_100g),
    proteinas_100g: item?.proteinas_100g == null ? "" : String(item.proteinas_100g),
    gorduras_totais_100g: item?.gorduras_totais_100g == null ? "" : String(item.gorduras_totais_100g),
    gorduras_saturadas_100g: item?.gorduras_saturadas_100g == null ? "" : String(item.gorduras_saturadas_100g),
    gorduras_trans_100g: item?.gorduras_trans_100g == null ? "" : String(item.gorduras_trans_100g),
    fibra_100g: item?.fibra_100g == null ? "" : String(item.fibra_100g),
    sodio_mg_100g: item?.sodio_mg_100g == null ? "" : String(item.sodio_mg_100g),
    contem_gluten: Boolean(item?.contem_gluten),
    contem_lactose: Boolean(item?.contem_lactose),
    alergenos_confirmados: Boolean(item?.alergenos_confirmados),
  });
  const set = (k: string, v: string) => setD({ ...d, [k]: v });
  return (
    <Janela titulo={item ? "Editar ingrediente" : "Novo ingrediente"} fechar={fechar}>
      <div className="grid gap-4 md:grid-cols-2">
        <Campo label="Nome">
          <input
            autoFocus
            className={input}
            value={d.nome}
            onChange={(e) => set("nome", e.target.value)}
          />
        </Campo>
        <Campo label="Medida">
          <select
            className={input}
            value={d.unidade_medida}
            onChange={(e) => set("unidade_medida", e.target.value)}
          >
            <option value="g">Gramas</option>
            <option value="un">Unidade</option>
          </select>
        </Campo>
        <Campo label="Perda ou ganho">
          <select className={input} value={d.tipo_rendimento} onChange={(e) => set("tipo_rendimento", e.target.value)}>
            <option value="nenhum">Sem perda ou ganho</option>
            <option value="perda">Perda percentual</option>
            <option value="ganho">Ganho por multiplicador</option>
          </select>
        </Campo>
        {d.tipo_rendimento === "perda" && <Campo label="Perda (%)">
          <input className={input} type="number" min="0" step="0.01" value={d.quebra_percentual} onChange={(e) => set("quebra_percentual", e.target.value)} />
        </Campo>}
        {d.tipo_rendimento === "ganho" && <Campo label="Ganho (×)">
          <input className={input} type="number" min="0.01" step="0.01" value={d.fator_rendimento} onChange={(e) => set("fator_rendimento", e.target.value)} />
        </Campo>}
        <Campo label="Último valor pago">
          <input
            className={input}
            type="number"
            step="0.01"
            value={d.ultimo_valor_pago}
            onChange={(e) => set("ultimo_valor_pago", e.target.value)}
          />
        </Campo>
        <Campo label={d.unidade_medida === "g" ? "Custo por kg" : "Custo por unidade"}>
          <input
            className={input}
            type="number"
            step="0.01"
            value={d.unidade_medida === "g" ? d.custo_por_kg : d.custo_por_unidade}
            onChange={(e) =>
              set(d.unidade_medida === "g" ? "custo_por_kg" : "custo_por_unidade", e.target.value)
            }
          />
        </Campo>
        <Campo label="Observação">
          <input
            className={input}
            value={d.observacao}
            onChange={(e) => set("observacao", e.target.value)}
          />
        </Campo>
      </div>
      <div className="mt-5 rounded-2xl border border-[#dbe7dd] bg-[#f7fbf7] p-4">
        <p className="text-sm font-black text-[#173a2d]">Informação nutricional por 100 g</p>
        <p className="mb-3 text-xs text-[#62766b]">Preencha conforme a embalagem ou ficha do fornecedor. A marmita será calculada automaticamente pelas gramas da receita.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[["calorias_100g","KCAL"],["carboidratos_100g","Carboidratos (g)"],["proteinas_100g","Proteínas (g)"],["gorduras_totais_100g","Gorduras totais (g)"],["gorduras_saturadas_100g","Gorduras saturadas (g)"],["gorduras_trans_100g","Gorduras trans (g)"],["fibra_100g","Fibra (g)"],["sodio_mg_100g","Sódio (mg)"]].map(([campo,label]) => <Campo key={campo} label={label}><input className={input} type="number" min="0" step="0.01" value={d[campo]} onChange={(e) => set(campo, e.target.value)} /></Campo>)}
        </div>
        <div className="mt-4 flex flex-wrap gap-5 text-sm font-bold">
          <label className="flex items-center gap-2"><input type="checkbox" checked={d.contem_gluten} onChange={(e) => setD({ ...d, contem_gluten: e.target.checked })} />Contém glúten</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={d.contem_lactose} onChange={(e) => setD({ ...d, contem_lactose: e.target.checked })} />Contém lactose</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={d.alergenos_confirmados} onChange={(e) => setD({ ...d, alergenos_confirmados: e.target.checked })} />Restrições conferidas</label>
        </div>
      </div>
      <div className="mt-5">
        <Botao
          onClick={() => {
            if (!d.nome.trim()) return toast.error("Informe o nome.");
            salvar({
              ...d,
              rendimento_padrao: n(d.rendimento_padrao),
              tipo_rendimento: d.tipo_rendimento,
              quebra_percentual: d.tipo_rendimento === "perda" ? n(d.quebra_percentual) : 0,
              fator_rendimento: d.tipo_rendimento === "ganho" ? n(d.fator_rendimento) || 1 : 1,
              custo_por_kg: n(d.custo_por_kg),
              custo_por_unidade: n(d.custo_por_unidade),
              ultimo_valor_pago: d.ultimo_valor_pago === "" ? null : n(d.ultimo_valor_pago),
              calorias_100g: d.calorias_100g === "" ? null : n(d.calorias_100g),
              carboidratos_100g: d.carboidratos_100g === "" ? null : n(d.carboidratos_100g),
              proteinas_100g: d.proteinas_100g === "" ? null : n(d.proteinas_100g),
              gorduras_totais_100g: d.gorduras_totais_100g === "" ? null : n(d.gorduras_totais_100g),
              gorduras_saturadas_100g: d.gorduras_saturadas_100g === "" ? null : n(d.gorduras_saturadas_100g),
              gorduras_trans_100g: d.gorduras_trans_100g === "" ? null : n(d.gorduras_trans_100g),
              fibra_100g: d.fibra_100g === "" ? null : n(d.fibra_100g),
              sodio_mg_100g: d.sodio_mg_100g === "" ? null : n(d.sodio_mg_100g),
              contem_gluten: Boolean(d.contem_gluten),
              contem_lactose: Boolean(d.contem_lactose),
              alergenos_confirmados: Boolean(d.alergenos_confirmados),
            });
          }}
        >
          Salvar ingrediente
        </Botao>
      </div>
    </Janela>
  );
}
function PreparacaoModal({ item, ingredientes, linhasIniciais, fechar, salvar }: any) {
  const [d, setD] = useState<any>({
      nome: item?.nome || "",
      rendimento_final_g: String(item?.rendimento_final_g || ""),
      modo_preparo: item?.modo_preparo || "",
      observacao: item?.observacao || "",
    }),
    [linhas, setLinhas] = useState<any[]>(
      linhasIniciais.length
        ? linhasIniciais.map((x: any) => ({
            ingrediente_id: x.ingrediente_id,
            quantidade: n(x.quantidade),
            rendimento_quebra: n(x.rendimento_quebra || 1),
          }))
        : [{ ingrediente_id: "", quantidade: 0, rendimento_quebra: 1 }],
    );
  const edit = (i: number, k: string, v: any) =>
    setLinhas(linhas.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <Janela titulo={item ? "Editar preparação" : "Nova preparação"} fechar={fechar}>
      <div className="grid gap-4 md:grid-cols-2">
        <Campo label="Nome">
          <input
            className={input}
            value={d.nome}
            onChange={(e) => setD({ ...d, nome: e.target.value })}
          />
        </Campo>
        <Campo label="Rendimento de referência (g)">
          <input
            className={input}
            type="number"
            value={d.rendimento_final_g}
            onChange={(e) => setD({ ...d, rendimento_final_g: e.target.value })}
          />
        </Campo>
      </div>
      <p className="mb-2 mt-5 text-sm font-bold">Ingredientes da receita-base</p>
      <p className="mb-3 text-xs text-[#62766b]">Cadastre aqui o lote de referência. Na produção, todas as quantidades são reduzidas ou aumentadas na mesma proporção.</p>
      {linhas.map((x, i) => (
        <div
          key={i}
          className="mb-2 grid gap-2 rounded-xl bg-[#f4f7f4] p-3 md:grid-cols-[1fr_110px_110px_auto]"
        >
          <select
            className={input}
            value={x.ingrediente_id}
            onChange={(e) => edit(i, "ingrediente_id", e.target.value)}
          >
            <option value="">Ingrediente</option>
            {ingredientes.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          <input
            className={input}
            type="number"
            value={x.quantidade || ""}
            placeholder="Qtd."
            onChange={(e) => edit(i, "quantidade", n(e.target.value))}
          />
          <input
            className={input}
            type="number"
            step="0.01"
            value={x.rendimento_quebra}
            placeholder="Rend."
            onChange={(e) => edit(i, "rendimento_quebra", n(e.target.value))}
          />
          <button
            onClick={() => setLinhas(linhas.filter((_, j) => j !== i))}
            className="font-bold text-red-500"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() =>
          setLinhas([...linhas, { ingrediente_id: "", quantidade: 0, rendimento_quebra: 1 }])
        }
        className="mt-2 text-sm font-bold text-[#087443]"
      >
        + Adicionar ingrediente
      </button>
      <div className="mt-4">
        <Campo label="Modo de preparo">
          <textarea
            className={`${input} min-h-24`}
            value={d.modo_preparo}
            onChange={(e) => setD({ ...d, modo_preparo: e.target.value })}
          />
        </Campo>
      </div>
      <div className="mt-5">
        <Botao
          onClick={() => {
            if (!d.nome || !n(d.rendimento_final_g))
              return toast.error("Informe nome e rendimento de referência.");
            salvar({ ...d, rendimento_final_g: n(d.rendimento_final_g) }, linhas);
          }}
        >
          Salvar preparação
        </Botao>
      </div>
    </Janela>
  );
}
function ReceitaModal({ produto, receita, linhasIniciais, montagemInicial, ingredientes, preparacoes = [], embalagens = [], itensPreparacao, custoIng, custoPrep, criarIngrediente, fechar, salvar }: any) {
  const [abaFicha, setAbaFicha] = useState<"ingredientes" | "montagem" | "preparacoes" | "custos">("ingredientes");
  const tamanhosFicha = produto?.tipo_produto === "sopa" ? TAMANHOS.filter((t) => t.id === "400") : TAMANHOS;
  const colunasFicha = produto?.tipo_produto === "sopa" ? "grid-cols-[minmax(220px,1fr)_120px_42px]" : "grid-cols-[minmax(220px,1fr)_120px_120px_120px_42px]";
  const [linhas, setLinhas] = useState<ReceitaLinha[]>(linhasIniciais.map((x: any) => ({ ...receitaVazia(), ...x, ingrediente_id: x.ingrediente_id || null, preparacao_id: x.preparacao_id || null })));
  const [montagem, setMontagem] = useState<MontagemLinha[]>(montagemInicial.map((x: any) => ({ id:x.id, nome:x.nome || "", gramas_200:n(x.gramas_200), gramas_300:n(x.gramas_300), gramas_400:n(x.gramas_400), observacao:x.observacao || "" })));
  const [selecionado, setSelecionado] = useState("");
  const [novo, setNovo] = useState(false);
  const [novoD, setNovoD] = useState({ nome:"", custo:"", rendimento:"1" });
  const nome = (x: ReceitaLinha) => x.preparacao_id ? (preparacoes.find((a:any) => a.id === x.preparacao_id)?.nome || "Preparação") : (ingredientes.find((a:any) => a.id === x.ingrediente_id)?.nome || "Ingrediente");
  const editar = (i:number,k:string,v:any) => setLinhas(linhas.map((x,j) => j === i ? {...x,[k]:v}:x));
  const editarMontagem = (i:number,k:string,v:any) => setMontagem(montagem.map((x,j) => j === i ? {...x,[k]:v}:x));
  const addComponente = () => { if(!selecionado) return toast.error("Escolha um ingrediente ou preparação."); const [tipo,id] = selecionado.split(":"); if(tipo === "p" && linhas.some(x => x.preparacao_id === id)) return toast.error("Essa preparação já está na ficha."); if(tipo === "i" && linhas.some(x => x.ingrediente_id === id)) return toast.error("Esse ingrediente já está na ficha."); setLinhas([...linhas,{...receitaVazia(),ingrediente_id:tipo === "i" ? id : null,preparacao_id:tipo === "p" ? id : null}]); setSelecionado(""); };
  const addNovo = async () => { if(!novoD.nome.trim()) return toast.error("Informe o nome."); const criado = await criarIngrediente(novoD.nome,n(novoD.custo),n(novoD.rendimento)||1); if(!criado) return; setLinhas([...linhas,{...receitaVazia(),ingrediente_id:criado.id}]); setNovoD({nome:"",custo:"",rendimento:"1"});setNovo(false); };
  const qCorreta = (g:number, item:any) => {
    if (item?.tipo_rendimento === "perda") {
      const perda = Math.min(99.999, Math.max(0, n(item.quebra_percentual))) / 100;
      return g / (1 - perda);
    }
    if (item?.tipo_rendimento === "ganho") return g / Math.max(0.000001, n(item.fator_rendimento || 1));
    return g;
  };
  const custoLinha = (x:ReceitaLinha,t:Tamanho) => x.preparacao_id
    ? n(x[`gramas_${t}` as keyof ReceitaLinha]) * n(custoPrep(x.preparacao_id))
    : qCorreta(n(x[`gramas_${t}` as keyof ReceitaLinha]),ingredientes.find((a:any)=>a.id===x.ingrediente_id))*custoIng(ingredientes.find((a:any)=>a.id===x.ingrediente_id));
  const custoIngredientes=(t:Tamanho)=>linhas.reduce((a,x)=>a+custoLinha(x,t),0);
  const custoEmbalagem=(t:Tamanho)=>{
    const etiqueta = embalagens.find((x:any)=>x.categoria === "etiqueta" && x.ativo !== false);
    const categoria = produto?.tipo_produto === "sopa" ? "sopa" : `marmita_${t}`;
    const embalagem = embalagens.find((x:any)=>x.categoria === categoria && x.ativo !== false);
    return n(embalagem?.custo_unitario) + n(etiqueta?.custo_unitario);
  };
  const custo=(t:Tamanho)=>custoIngredientes(t)+custoEmbalagem(t);
  const peso=(t:Tamanho)=>linhas.reduce((a,x)=>a+n(x[`gramas_${t}` as keyof ReceitaLinha]),0);
  const novaMontagem=()=>({nome:"",gramas_200:0,gramas_300:0,gramas_400:0,observacao:""});
  const idsPreparacoesFicha = Array.from(new Set([
    ...(Array.isArray(receita?.preparacoes) ? receita.preparacoes.map((p:any) => p?.id).filter(Boolean) : []),
    ...linhas.filter((x) => x.preparacao_id).map((x) => x.preparacao_id).filter(Boolean),
  ]));
  const preparacoesFicha = idsPreparacoesFicha.map((id) => preparacoes.find((p:any) => p.id === id)).filter(Boolean);
  const formatarGramas = (v: unknown) => arredondarProducao(v, "g").toLocaleString("pt-BR");
  const formatarQuantidadeCusto = (v: unknown, itemNome: unknown = "", unidade: "g" | "un" = "g") => {
    const qtd = Math.max(0, n(v));
    if (unidade === "un") return formatarQuantidadeProducao(qtd, "un", itemNome);
    return formatarQuantidadeProducao(qtd, "g", itemNome);
  };
  return <Janela titulo={`Ficha técnica — ${produto.nome}`} fechar={fechar}>
    <div className="mb-6 grid gap-4 rounded-2xl bg-[#edf5e6] p-4 md:grid-cols-[180px_1fr]"><div className="h-32 overflow-hidden rounded-xl bg-white">{produto.imagem_url || produto.imagens?.[0] ? <img src={produto.imagem_url || produto.imagens?.[0]} alt="" className="size-full object-cover" />:<div className="grid size-full place-items-center text-[#087443]"><ChefHat /></div>}</div><div><p className="text-xs font-bold uppercase tracking-wide text-[#087443]">Monte a ficha técnica</p><h4 className="mt-1 text-xl font-black">{produto.nome}</h4><p className="mt-2 text-sm text-[#527164]">Ingredientes são a base de custo e produção. Em Montagem, registre somente o que entra pronto na embalagem.</p></div></div>
    <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#e7eee8] p-1 sm:grid-cols-4">{[["ingredientes","1. Ingredientes"],["montagem","2. Montagem"],["preparacoes","3. Preparações"],["custos","4. Custos"]].map(([id,label])=><button key={id} type="button" onClick={()=>setAbaFicha(id as typeof abaFicha)} className={`rounded-lg px-2 py-2.5 text-sm font-bold ${abaFicha===id?"bg-white text-[#087443] shadow-sm":"text-[#62766b]"}`}>{label}</button>)}</div>
    {abaFicha==="ingredientes" && <section><p className="text-xs font-bold uppercase tracking-wide text-[#087443]">1. Ingredientes da receita</p><p className="mb-3 mt-1 text-sm text-[#62766b]">Informe as quantidades por tamanho. Perdas e ganhos são aplicados automaticamente na lista de produção.</p>{Array.isArray(receita?.preparacoes) && receita.preparacoes.length>0 && <div className="mb-4 rounded-xl border border-[#cfe1d3] bg-[#f5faf3] p-3"><p className="text-xs font-bold uppercase tracking-wide text-[#087443]">Preparações desta ficha</p><div className="mt-2 flex flex-wrap gap-2">{receita.preparacoes.map((p:any)=><span key={p.id || p.nome} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-[#355445] shadow-sm">{p.nome}</span>)}</div><p className="mt-2 text-xs text-[#62766b]">As preparações ficam vinculadas à ficha e são escaladas proporcionalmente na produção.</p></div>}<div className="flex flex-col gap-2 sm:flex-row"><select className={input} value={selecionado} onChange={e=>setSelecionado(e.target.value)}><option value="">Escolha ingrediente ou preparação</option><optgroup label="Ingredientes">{ingredientes.map((x:any)=><option key={`i:${x.id}`} value={`i:${x.id}`}>{x.nome}</option>)}</optgroup><optgroup label="Preparações prontas">{preparacoes.map((x:any)=><option key={`p:${x.id}`} value={`p:${x.id}`}>{x.nome}</option>)}</optgroup></select><Botao onClick={addComponente}><Plus size={17}/>Adicionar componente</Botao></div><button type="button" onClick={()=>setNovo(!novo)} className="mt-3 text-sm font-bold text-[#087443]">{novo?"− Fechar cadastro":"+ Cadastrar ingrediente novo"}</button>{novo&&<div className="mt-3 grid gap-2 rounded-xl border border-[#cfe1d3] bg-white p-3 md:grid-cols-[1fr_150px_150px_auto]"><input className={input} value={novoD.nome} placeholder="Nome" onChange={e=>setNovoD({...novoD,nome:e.target.value})}/><input className={input} type="number" value={novoD.custo} placeholder="Custo/kg" onChange={e=>setNovoD({...novoD,custo:e.target.value})}/><input className={input} type="number" value={novoD.rendimento} placeholder="Rendimento" onChange={e=>setNovoD({...novoD,rendimento:e.target.value})}/><Botao onClick={addNovo}>Salvar e usar</Botao></div>}
    {!linhas.length?<Vazio texto="Nenhum ingrediente adicionado ainda."/>:<TabelaCabecalho titulo="Ingrediente" tamanhos={tamanhosFicha}>{linhas.map((x,i)=><div key={i} className={`grid ${colunasFicha} items-center gap-2 border-t border-[#e2ebe3] bg-white px-3 py-3`}><div><b>{nome(x)}</b><span className="ml-2 rounded-full bg-[#e8f3eb] px-2 py-0.5 text-[10px] font-bold text-[#087443]">{x.preparacao_id ? "PREPARAÇÃO" : "INGREDIENTE"}</span><input className="mt-1 w-full rounded border border-[#dbe7dd] px-2 py-1 text-xs" value={x.observacao||""} placeholder="Observação" onChange={e=>editar(i,"observacao",e.target.value)}/></div>{tamanhosFicha.map(t=><input key={t.id} className={input} type="number" min="0" value={n(x[`gramas_${t.id}` as keyof ReceitaLinha])||""} placeholder="0 g" onChange={e=>editar(i,`gramas_${t.id}`,n(e.target.value))}/>)}<button onClick={()=>setLinhas(linhas.filter((_,j)=>j!==i))} className="p-2 text-red-600"><Trash2 size={17}/></button></div>)}</TabelaCabecalho>}</section>}
    {abaFicha==="montagem" && <section><p className="text-xs font-bold uppercase tracking-wide text-[#087443]">2. Lista de montagem</p><p className="mb-3 mt-1 text-sm text-[#62766b]">Cadastre somente os componentes prontos que entram na marmita: por exemplo, frango empanado, molho, arroz e brócolis.</p><Botao onClick={()=>setMontagem([...montagem,novaMontagem()])}><Plus size={17}/>Adicionar componente pronto</Botao>{!montagem.length?<div className="mt-4"><Vazio texto="Nenhum componente pronto cadastrado." /></div>:<div className="mt-4"><TabelaCabecalho titulo="Componente pronto" tamanhos={tamanhosFicha}>{montagem.map((x,i)=><div key={x.id||i} className={`grid ${colunasFicha} items-center gap-2 border-t border-[#e2ebe3] bg-white px-3 py-3`}><div><input className={input} value={x.nome} placeholder="Ex.: Frango empanado americano" onChange={e=>editarMontagem(i,"nome",e.target.value)}/><input className="mt-1 w-full rounded border border-[#dbe7dd] px-2 py-1 text-xs" value={x.observacao||""} placeholder="Observação" onChange={e=>editarMontagem(i,"observacao",e.target.value)}/></div>{tamanhosFicha.map(t=><input key={t.id} className={input} type="number" min="0" value={n(x[`gramas_${t.id}` as keyof MontagemLinha])||""} placeholder="0 g" onChange={e=>editarMontagem(i,`gramas_${t.id}`,n(e.target.value))}/>)}<button onClick={()=>setMontagem(montagem.filter((_,j)=>j!==i))} className="p-2 text-red-600"><Trash2 size={17}/></button></div>)}</TabelaCabecalho></div>}</section>}
    {abaFicha==="preparacoes" && <section><p className="text-xs font-bold uppercase tracking-wide text-[#087443]">3. Preparações vinculadas</p><p className="mb-4 mt-1 text-sm text-[#62766b]">Cada preparação mostra sua receita-base, ingredientes e modo de preparo. Na produção, o lote é reduzido ou aumentado mantendo a mesma proporção.</p>{!preparacoesFicha.length?<Vazio texto="Nenhuma preparação vinculada a esta ficha."/>:<div className="grid gap-4">{preparacoesFicha.map((preparacao:any)=>{const itens=itensPreparacao.get(preparacao.id)||[];return <article key={preparacao.id} className="rounded-2xl border border-[#dbe7dd] bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-black text-[#173a2d]">{preparacao.nome}</h3><p className="mt-1 text-sm text-[#62766b]">Receita-base proporcional conforme as quantidades abaixo.</p></div><span className="rounded-full bg-[#edf5e6] px-3 py-1 text-xs font-bold text-[#087443]">BASE PROPORCIONAL</span></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-xl bg-[#f4f8f4] p-3"><p className="text-xs font-bold uppercase tracking-wide text-[#527164]">Ingredientes</p>{!itens.length?<p className="mt-2 text-sm text-[#62766b]">Ingredientes não informados.</p>:<div className="mt-2 grid gap-2">{itens.map((item:any)=><div key={item.id} className="flex justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"><span>{ingredientes.find((ingrediente:any)=>ingrediente.id===item.ingrediente_id)?.nome||"Ingrediente"}</span><b>{item.quantidade_texto||`${formatarGramas(item.quantidade)} g`}</b></div>)}</div>}</div><div><p className="text-xs font-bold uppercase tracking-wide text-[#527164]">Modo de preparo</p><div className="mt-2 whitespace-pre-line rounded-xl border border-[#e2ebe3] bg-white p-3 text-sm leading-relaxed text-[#355445]">{preparacao.modo_preparo||"Modo de preparo não informado."}</div></div></div></article>})}</div>}</section>}
    {abaFicha==="custos" && <section><div className="mb-5 rounded-2xl bg-[#edf5e6] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#087443]">Resumo de custos</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{tamanhosFicha.map(t=><div key={t.id} className="rounded-xl bg-white p-3"><p className="text-xs font-bold text-[#62766b]">{t.label}</p><p className="mt-1 text-lg font-black text-[#087443]">{formatarGramas(peso(t.id))} g</p><p className="text-sm font-bold text-[#355445]">{valor(custo(t.id))} de custo total</p><p className="mt-1 text-xs text-[#62766b]">Ingredientes {valor(custoIngredientes(t.id))} · Embalagem + etiqueta {valor(custoEmbalagem(t.id))}</p></div>)}</div></div>{!linhas.length?<Vazio texto="Adicione ingredientes ou preparações para ver os custos."/>:<TabelaCustos linhas={linhas} ingredientes={ingredientes} nome={nome} custoLinha={custoLinha} custoPrep={custoPrep} formatarQuantidadeCusto={formatarQuantidadeCusto}/>}</section>}
    <div className="mt-5"><Botao onClick={()=>salvar(linhas,montagem)}>Salvar ficha técnica</Botao></div>
  </Janela>;
}
function TabelaCabecalho({titulo,children,tamanhos=TAMANHOS}:any){
  const grid = `minmax(220px,1fr) ${tamanhos.map(() => "120px").join(" ")} 42px`;
  return <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7dd]"><div className="min-w-[480px]"><div className="grid gap-2 bg-[#edf5e6] px-3 py-3 text-xs font-bold uppercase tracking-wide text-[#527164]" style={{gridTemplateColumns:grid}}><span>{titulo}</span>{tamanhos.map((t:any)=><span key={t.id}>{t.label}</span>)}<span/></div>{children}</div></div>
}
function TabelaCustos({linhas,ingredientes,nome,custoLinha,custoPrep,formatarGramas,tamanhos=TAMANHOS}:any){
  const grid = `minmax(220px,1fr) 100px ${tamanhos.map(() => "125px").join(" ")}`;
  const visiveis = linhas.filter((x:any)=>tamanhos.some((t:any)=>n(x[`gramas_${t.id}`]) > 0));
  return <div className="overflow-x-auto rounded-2xl border border-[#dbe7dd]"><div className="min-w-[520px]"><div className="grid gap-2 bg-[#edf5e6] px-3 py-3 text-xs font-bold uppercase tracking-wide text-[#527164]" style={{gridTemplateColumns:grid}}><span>Componente</span><span>Custo/kg</span>{tamanhos.map((t:any)=><span key={t.id}>{t.label}</span>)}</div>{visiveis.map((x:any,i:number)=>{const item=ingredientes.find((a:any)=>a.id===x.ingrediente_id);const custoKg=x.preparacao_id?valor(n(custoPrep(x.preparacao_id))*1000):item?valor(n(item.custo_por_kg)):"—";return <div key={i} className="grid gap-2 border-t border-[#e2ebe3] bg-white px-3 py-3 text-sm" style={{gridTemplateColumns:grid}}><b>{nome(x)}</b><span>{custoKg}</span>{tamanhos.map((t:any)=><span key={t.id}>{formatarQuantidadeProducao(x[`gramas_${t.id}`], item?.unidade_medida === "un" ? "un" : "g", item?.nome || nome(x))} · <b>{valor(custoLinha(x,t.id))}</b></span>)}</div>})}</div></div>
}
