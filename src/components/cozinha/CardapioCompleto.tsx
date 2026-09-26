import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, ImageIcon, Pencil, RotateCcw, Search, SlidersHorizontal, Table2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { normalizarPrecosMarmita } from "@/lib/combo-rules";
import { nomesCozinhaCorrespondem, quantidadeBrutaPorRendimento } from "@/lib/cozinha-planejamento";

type Props = {
  produtos: any[];
  receitas: any[];
  receitaItens: any[];
  montagemItens: any[];
  preparacoes: any[];
  preparacaoItens: any[];
  ingredientes: any[];
  embalagens: any[];
  onOpenRecipe: (produto: any) => void;
};

type TamanhoCardapio = 200 | 300 | 400;
type FaixaPreco = "unit" | "t5" | "t10" | "t20";

const tamanhos: TamanhoCardapio[] = [200, 300, 400];
const n = (v: unknown) => Number(v || 0);
const brl = (v: number) =>
  Number.isFinite(v) && v !== 0
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";
const numeroFiltro = (v: unknown) => {
  const texto = String(v ?? "").trim();
  if (!texto) return null;
  const valor = Number(texto.replace(",", "."));
  return Number.isFinite(valor) ? valor : null;
};
const mediaValida = (valores: number[]) => {
  const validos = valores.filter((v) => Number.isFinite(v) && v !== 0);
  return validos.length ? validos.reduce((a, b) => a + b, 0) / validos.length : 0;
};
const percentual = (v: number) =>
  Number.isFinite(v) ? `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—";

const codigoProduto = (produto: any) =>
  String(produto?.nome || "").match(/\b((?:TD|SO|CO)\d{2})\b/i)?.[1]?.toUpperCase() || "";

const nomeProduto = (produto: any) => {
  const codigo = codigoProduto(produto);
  return codigo
    ? String(produto?.nome || "").replace(new RegExp("^\\s*" + codigo + "\\s*[-–—:]?\\s*", "i"), "").trim()
    : String(produto?.nome || "");
};

const tamanhosProduto = (produto: any): number[] => {
  if (produto?.tipo_produto === "sopa") return [400];
  if (produto?.tipo_produto === "complemento") return [150];
  return [200, 300, 400];
};

const tabelaNutricional = (produto: any, tamanho: TamanhoCardapio) =>
  produto?.["tabela_nutricional_" + tamanho + "g"] ||
  (tamanho === 200 ? produto?.tabela_nutricional : null) ||
  {};

const restricoesTamanho = (produto: any, tamanho: TamanhoCardapio): string[] => {
  const valor = produto?.["restricoes_" + tamanho + "g"];
  return Array.isArray(valor) ? valor.map(String) : [];
};

const temRestricao = (lista: string[], termo: string, sem = false) =>
  lista.some((item) => {
    const txt = item.toUpperCase();
    if (!txt.includes(termo.toUpperCase())) return false;
    return sem ? txt.includes("NÃO CONTÉM") : !txt.includes("NÃO CONTÉM");
  });

const montarRestricoes = (base: string[], semGluten: boolean, semLactose: boolean) => {
  const outras = base.filter((item) => {
    const txt = item.toUpperCase();
    return !txt.includes("GLÚTEN") && !txt.includes("LACTOSE");
  });
  return [
    ...outras,
    semGluten ? "NÃO CONTÉM GLÚTEN" : "CONTÉM GLÚTEN",
    semLactose ? "NÃO CONTÉM LACTOSE" : "CONTÉM LACTOSE",
  ];
};

const camposNutri = [
  ["kcal", "Valor energético", "kcal"],
  ["carb", "Carboidratos", "g"],
  ["prot", "Proteínas", "g"],
  ["acucares_totais", "Açúcares totais", "g"],
  ["acucares_adicionados", "Açúcares adicionados", "g"],
  ["gorduras_totais", "Gorduras totais", "g"],
  ["gorduras_saturadas", "Gorduras saturadas", "g"],
  ["gorduras_trans", "Gorduras trans", "g"],
  ["fibra", "Fibra alimentar", "g"],
  ["sodio", "Sódio", "mg"],
] as const;

const input =
  "w-full rounded-md border border-[#cbd8ce] bg-white px-2 py-1.5 text-xs outline-none focus:border-[#087443]";

export function CardapioCompleto({
  produtos,
  receitas,
  receitaItens,
  montagemItens,
  preparacoes,
  preparacaoItens,
  ingredientes,
  embalagens,
  onOpenRecipe,
}: Props) {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroSubgrupo, setFiltroSubgrupo] = useState("Todos");
  const [filtroProteina, setFiltroProteina] = useState("Todas");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const filtrosIniciais = {
    codigo: "",
    saborDescricao: "",
    ingrediente: "",
    tamanho: "Todos",
    gluten: "Todos",
    lactose: "Todos",
    codigoBarras: "",
    observacao: "",
    tamanhoAnalise: "300",
    kcalMin: "",
    kcalMax: "",
    carbMin: "",
    carbMax: "",
    protMin: "",
    protMax: "",
    precoMin: "",
    precoMax: "",
    custoMin: "",
    custoMax: "",
    lucroMin: "",
    lucroMax: "",
    margemMin: "",
    margemMax: "",
  };
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const setFiltro = (campo: string, valor: string) =>
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  const [ocultos, setOcultos] = useState<Record<string, boolean>>({});
  const [fotoProduto, setFotoProduto] = useState<any | null>(null);
  const [nutriProduto, setNutriProduto] = useState<any | null>(null);
  const [nutriTamanho, setNutriTamanho] = useState<TamanhoCardapio>(300);
  const [nutriDraft, setNutriDraft] = useState<Record<string, any>>({});
  const [semGlutenDraft, setSemGlutenDraft] = useState(false);
  const [semLactoseDraft, setSemLactoseDraft] = useState(false);
  const [salvandoNutri, setSalvandoNutri] = useState(false);

  const { data: etiquetas = [] } = useQuery({
    queryKey: ["coz-cardapio-etiquetas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cozinha_etiquetas")
        .select("id,produto_id,tamanho_g,codigo_barras,imagem_url,informacao_nutricional,ativo");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["site-settings-precos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("parametros_loja").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const precosMarmita = useMemo(
    () => normalizarPrecosMarmita((settings as any)?.parametros_loja?.precos_marmita),
    [settings],
  );

  const produtoPorId = useMemo(() => new Map(produtos.map((x: any) => [x.id, x])), [produtos]);
  const receitaPorProduto = useMemo(
    () => new Map(receitas.map((x: any) => [x.produto_id, x])),
    [receitas],
  );
  const ingredientePorId = useMemo(
    () => new Map(ingredientes.map((x: any) => [x.id, x])),
    [ingredientes],
  );
  const preparacaoPorId = useMemo(
    () => new Map(preparacoes.map((x: any) => [x.id, x])),
    [preparacoes],
  );

  const agrupar = (lista: any[], chave: string) => {
    const mapa = new Map<string, any[]>();
    lista.forEach((item) => mapa.set(item[chave], [...(mapa.get(item[chave]) || []), item]));
    return mapa;
  };

  const itensReceita = useMemo(() => agrupar(receitaItens, "receita_id"), [receitaItens]);
  const itensMontagem = useMemo(() => agrupar(montagemItens, "receita_id"), [montagemItens]);
  const itensPreparacao = useMemo(
    () => agrupar(preparacaoItens, "preparacao_id"),
    [preparacaoItens],
  );
  const etiquetasPorProduto = useMemo(() => agrupar(etiquetas as any[], "produto_id"), [etiquetas]);

  const subgrupos = useMemo(
    () =>
      Array.from(new Set(produtos.map((p: any) => String(p.subgrupo || "").trim()).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      ),
    [produtos],
  );
  const proteinas = useMemo(
    () =>
      Array.from(new Set(produtos.map((p: any) => String(p.proteina || "").trim()).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      ),
    [produtos],
  );

  const idsIngredientesPreparacao = (prepId: string, visitados = new Set<string>()): Set<string> => {
    if (!prepId || visitados.has(prepId)) return new Set();
    const proximos = new Set(visitados);
    proximos.add(prepId);
    const ids = new Set<string>();
    (itensPreparacao.get(prepId) || []).forEach((item: any) => {
      if (item.ingrediente_id) ids.add(item.ingrediente_id);
      if (item.preparacao_componente_id) {
        idsIngredientesPreparacao(item.preparacao_componente_id, proximos).forEach((id) => ids.add(id));
      }
    });
    return ids;
  };

  const ingredientesTecnicosProduto = (produto: any) => {
    const receita = receitaPorProduto.get(produto.id);
    if (!receita) return [];
    const ids = new Set<string>();
    (itensReceita.get(receita.id) || []).forEach((linha: any) => {
      if (linha.ingrediente_id) ids.add(linha.ingrediente_id);
      if (linha.preparacao_id) {
        idsIngredientesPreparacao(linha.preparacao_id).forEach((id) => ids.add(id));
      }
    });
    (Array.isArray(receita.preparacoes) ? receita.preparacoes : []).forEach((ref: any) => {
      idsIngredientesPreparacao(ref?.id).forEach((id) => ids.add(id));
    });
    return Array.from(ids)
      .map((id) => ingredientePorId.get(id)?.nome)
      .filter(Boolean)
      .map(String)
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  };

  const textoIngredientesProduto = (produto: any) =>
    [produto.ingredientes, ...ingredientesTecnicosProduto(produto)]
      .filter(Boolean)
      .join(" · ");

  const produtosCardapio = useMemo(
    () => produtos.filter((p: any) => ["marmita", "sopa"].includes(p.tipo_produto || "marmita")),
    [produtos],
  );

  const linhasBase = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const codigo = filtros.codigo.trim().toLocaleLowerCase("pt-BR");
    const saborDescricao = filtros.saborDescricao.trim().toLocaleLowerCase("pt-BR");
    const ingrediente = filtros.ingrediente.trim().toLocaleLowerCase("pt-BR");
    const observacao = filtros.observacao.trim().toLocaleLowerCase("pt-BR");

    return produtosCardapio
      .filter((p: any) => filtroSubgrupo === "Todos" || p.subgrupo === filtroSubgrupo)
      .filter((p: any) => filtroProteina === "Todas" || p.proteina === filtroProteina)
      .filter((p: any) => filtros.tamanho === "Todos" || tamanhosProduto(p).includes(Number(filtros.tamanho)))
      .filter((p: any) => filtros.gluten === "Todos" || (filtros.gluten === "Sim" ? !!p.sem_gluten : !p.sem_gluten))
      .filter((p: any) => filtros.lactose === "Todos" || (filtros.lactose === "Sim" ? !!p.sem_lactose : !p.sem_lactose))
      .filter((p: any) => !codigo || codigoProduto(p).toLocaleLowerCase("pt-BR").includes(codigo))
      .filter((p: any) => {
        if (!saborDescricao) return true;
        return [nomeProduto(p), p.descricao]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(saborDescricao);
      })
      .filter((p: any) => !ingrediente || textoIngredientesProduto(p).toLocaleLowerCase("pt-BR").includes(ingrediente))
      .filter((p: any) => !observacao || String(p.observacao_cardapio || "").toLocaleLowerCase("pt-BR").includes(observacao))
      .filter((p: any) => {
        if (!termo) return true;
        return [
          codigoProduto(p),
          nomeProduto(p),
          p.descricao,
          p.subgrupo,
          p.proteina,
          textoIngredientesProduto(p),
          p.observacao_cardapio,
        ]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(termo);
      })
      .sort((a: any, b: any) => codigoProduto(a).localeCompare(codigoProduto(b), "pt-BR"));
  }, [
    produtosCardapio,
    busca,
    filtroSubgrupo,
    filtroProteina,
    filtros.codigo,
    filtros.saborDescricao,
    filtros.ingrediente,
    filtros.tamanho,
    filtros.gluten,
    filtros.lactose,
    filtros.observacao,
    receitaPorProduto,
    itensReceita,
    itensPreparacao,
    ingredientePorId,
  ]);

  const custoIngrediente = (ingrediente: any) =>
    ingrediente?.unidade_medida === "un" || ingrediente?.unidade_medida === "L"
      ? n(ingrediente?.custo_por_unidade)
      : n(ingrediente?.custo_por_kg) / 1000;

  const unidadeItemPreparacao = (item: any): "g" | "un" | "L" => {
    if (item?.preparacao_componente_id) return "g";
    const ingrediente = ingredientePorId.get(item?.ingrediente_id);
    if (ingrediente?.unidade_medida === "L") return "L";
    if (ingrediente?.unidade_medida === "un") return "un";
    const texto = String(item?.quantidade_texto || "").trim();
    if (/\blitro(s)?\b|\bL\b/i.test(texto)) return "L";
    if (/\bkg\b|\bgr\b|grama|\bg\b|ml/i.test(texto)) return "g";
    if (texto && /^\s*[\d.,]+/.test(texto)) return "un";
    return "g";
  };

  const custoPreparacaoPorGrama = (preparacao: any, visitados = new Set<string>()): number => {
    if (!preparacao || !(n(preparacao.rendimento_final_g) > 0) || visitados.has(preparacao.id)) return 0;
    const proximos = new Set(visitados);
    proximos.add(preparacao.id);
    const itens = itensPreparacao.get(preparacao.id) || [];
    const custoTotal = itens.reduce((soma: number, item: any) => {
      if (!(n(item.quantidade) > 0)) return soma;
      if (item.preparacao_componente_id) {
        const filho = preparacaoPorId.get(item.preparacao_componente_id);
        return soma + n(item.quantidade) * custoPreparacaoPorGrama(filho, proximos);
      }
      const ing = ingredientePorId.get(item.ingrediente_id);
      if (!ing) return soma;
      const unidade = unidadeItemPreparacao(item);
      const unitario =
        unidade === "un" || unidade === "L"
          ? n(ing.custo_por_unidade)
          : n(ing.custo_por_kg) / 1000;
      return soma + n(item.quantidade) * unitario;
    }, 0);
    return custoTotal / n(preparacao.rendimento_final_g);
  };

  const quantidadeCorreta = (gramas: number, linha: any) => {
    const fator = n(linha?.fator_producao || 1);
    if (linha?.operacao_producao === "acrescentar") return gramas * (1 + fator);
    if (linha?.operacao_producao === "dividir") return gramas / Math.max(0.000001, fator);
    return gramas;
  };

  const custoEmbalagem = (produto: any, tamanho: TamanhoCardapio) => {
    const etiqueta = embalagens.find((x: any) => x.categoria === "etiqueta" && x.ativo !== false);
    const categoria =
      produto?.tipo_produto === "sopa"
        ? "sopa"
        : produto?.tipo_produto === "complemento"
          ? "marmita_200"
          : "marmita_" + tamanho;
    const embalagem = embalagens.find((x: any) => x.categoria === categoria && x.ativo !== false);
    return n(etiqueta?.custo_unitario) + n(embalagem?.custo_unitario);
  };

  const custoProduto = (produto: any, tamanho: TamanhoCardapio) => {
    if (!tamanhosProduto(produto).includes(tamanho)) return 0;
    const receita = receitaPorProduto.get(produto.id);
    if (!receita) return n(produto.preco_custo);
    const linhasReceita = itensReceita.get(receita.id) || [];
    const montagem = itensMontagem.get(receita.id) || [];
    const campo = "gramas_" + tamanho;
    const prepsVinculadas = (Array.isArray(receita.preparacoes) ? receita.preparacoes : [])
      .map((ref: any) => preparacaoPorId.get(ref?.id))
      .filter(Boolean);
    const estruturadas = prepsVinculadas.filter((prep: any) => {
      const itemMontagem = montagem.find((m: any) => nomesCozinhaCorrespondem(m.nome, prep.nome));
      const itens = itensPreparacao.get(prep.id) || [];
      return itemMontagem && n(prep.rendimento_final_g) > 0 && itens.some((x: any) => n(x.quantidade) > 0);
    });
    const idsCobertos = new Set<string>();
    estruturadas.forEach((prep: any) => {
      idsIngredientesPreparacao(prep.id).forEach((id) => idsCobertos.add(id));
    });

    let custo = 0;

    estruturadas.forEach((prep: any) => {
      const componente = montagem.find((m: any) => nomesCozinhaCorrespondem(m.nome, prep.nome));
      custo += n(componente?.[campo]) * custoPreparacaoPorGrama(prep);
    });

    linhasReceita.forEach((linha: any) => {
      if (linha.ingrediente_id) {
        if (idsCobertos.has(linha.ingrediente_id)) return;
        const ing = ingredientePorId.get(linha.ingrediente_id);
        if (!ing) return;
        const componente = montagem.find(
          (m: any) =>
            nomesCozinhaCorrespondem(m.nome, ing.nome) &&
            !prepsVinculadas.some((prep: any) => nomesCozinhaCorrespondem(prep.nome, m.nome)),
        );
        const liquido = componente
          ? n(componente[campo])
          : quantidadeCorreta(n(linha[campo]), linha);
        const bruto = quantidadeBrutaPorRendimento(liquido, ing);
        custo += bruto * custoIngrediente(ing);
        return;
      }
      if (linha.preparacao_id && !estruturadas.some((prep: any) => prep.id === linha.preparacao_id)) {
        const prep = preparacaoPorId.get(linha.preparacao_id);
        custo += n(linha[campo]) * custoPreparacaoPorGrama(prep);
      }
    });

    return custo + custoEmbalagem(produto, tamanho);
  };

  const precoProduto = (produto: any, tamanho: TamanhoCardapio, faixa: FaixaPreco) => {
    if (!tamanhosProduto(produto).includes(tamanho)) return 0;
    if (produto.tipo_produto === "marmita") {
      return n((precosMarmita as any)?.[tamanho + "g"]?.[faixa]);
    }
    if (faixa !== "unit") return 0;
    if (tamanho === 400) return n(produto.preco_400g || produto.preco);
    if (tamanho === 300) return n(produto.preco_300g || produto.preco);
    return n(produto.preco);
  };

  const codigoBarras = (produto: any, tamanho: TamanhoCardapio) =>
    String(
      (etiquetasPorProduto.get(produto.id) || []).find(
        (x: any) => n(x.tamanho_g) === tamanho && x.ativo !== false,
      )?.codigo_barras || "",
    );

  const tamanhoAnalise = Number(filtros.tamanhoAnalise || 300) as TamanhoCardapio;
  const haFiltroNumerico = [
    filtros.kcalMin, filtros.kcalMax, filtros.carbMin, filtros.carbMax,
    filtros.protMin, filtros.protMax, filtros.precoMin, filtros.precoMax,
    filtros.custoMin, filtros.custoMax, filtros.lucroMin, filtros.lucroMax,
    filtros.margemMin, filtros.margemMax,
  ].some((x) => String(x).trim() !== "");

  const dentroFaixa = (valor: number, minimo: unknown, maximo: unknown) => {
    const min = numeroFiltro(minimo);
    const max = numeroFiltro(maximo);
    if (min !== null && valor < min) return false;
    if (max !== null && valor > max) return false;
    return true;
  };

  const linhas = linhasBase.filter((produto: any) => {
    const termoBarcode = filtros.codigoBarras.trim().toLowerCase();
    if (termoBarcode) {
      const encontrou = tamanhos.some((t) => codigoBarras(produto, t).toLowerCase().includes(termoBarcode));
      if (!encontrou) return false;
    }

    if (!haFiltroNumerico) return true;
    if (!tamanhosProduto(produto).includes(tamanhoAnalise)) return false;

    const tabela = tabelaNutricional(produto, tamanhoAnalise);
    const kcal = n(tabela?.kcal);
    const carb = n(tabela?.carb);
    const prot = n(tabela?.prot);
    const preco = precoProduto(produto, tamanhoAnalise, "unit");
    const custo = custoProduto(produto, tamanhoAnalise);
    const lucro = preco > 0 && custo > 0 ? preco - custo : 0;
    const margem = preco > 0 && custo > 0 ? (lucro / preco) * 100 : 0;

    return (
      dentroFaixa(kcal, filtros.kcalMin, filtros.kcalMax) &&
      dentroFaixa(carb, filtros.carbMin, filtros.carbMax) &&
      dentroFaixa(prot, filtros.protMin, filtros.protMax) &&
      dentroFaixa(preco, filtros.precoMin, filtros.precoMax) &&
      dentroFaixa(custo, filtros.custoMin, filtros.custoMax) &&
      dentroFaixa(lucro, filtros.lucroMin, filtros.lucroMax) &&
      dentroFaixa(margem, filtros.margemMin, filtros.margemMax)
    );
  });

  const resumoPorTamanho = tamanhos.map((tamanho) => {
    const aptos = linhas.filter((p: any) => tamanhosProduto(p).includes(tamanho));
    const dados = aptos.map((produto: any) => {
      const tabela = tabelaNutricional(produto, tamanho);
      const custo = custoProduto(produto, tamanho);
      const unit = precoProduto(produto, tamanho, "unit");
      const p5 = precoProduto(produto, tamanho, "t5");
      const p10 = precoProduto(produto, tamanho, "t10");
      const p20 = precoProduto(produto, tamanho, "t20");
      const lucro = unit > 0 && custo > 0 ? unit - custo : 0;
      const margem = unit > 0 && custo > 0 ? (lucro / unit) * 100 : 0;
      return {
        kcal: n(tabela?.kcal),
        carb: n(tabela?.carb),
        prot: n(tabela?.prot),
        custo,
        unit,
        lucro,
        margem,
        lucro5: p5 > 0 && custo > 0 ? p5 - custo : 0,
        lucro10: p10 > 0 && custo > 0 ? p10 - custo : 0,
        lucro20: p20 > 0 && custo > 0 ? p20 - custo : 0,
        custoSobreVenda: unit > 0 && custo > 0 ? (custo / unit) * 100 : 0,
      };
    });
    return {
      tamanho,
      quantidade: aptos.length,
      kcal: mediaValida(dados.map((x) => x.kcal)),
      carb: mediaValida(dados.map((x) => x.carb)),
      prot: mediaValida(dados.map((x) => x.prot)),
      custo: mediaValida(dados.map((x) => x.custo)),
      unit: mediaValida(dados.map((x) => x.unit)),
      lucro: mediaValida(dados.map((x) => x.lucro)),
      margem: mediaValida(dados.map((x) => x.margem)),
      lucro5: mediaValida(dados.map((x) => x.lucro5)),
      lucro10: mediaValida(dados.map((x) => x.lucro10)),
      lucro20: mediaValida(dados.map((x) => x.lucro20)),
      custoSobreVenda: mediaValida(dados.map((x) => x.custoSobreVenda)),
    };
  });

  const resumoAnalise = resumoPorTamanho.find((x) => x.tamanho === tamanhoAnalise) || resumoPorTamanho[1];
  const totalSemGluten = linhas.filter((p: any) => !!p.sem_gluten).length;
  const totalSemLactose = linhas.filter((p: any) => !!p.sem_lactose).length;
  const filtrosAtivos =
    Number(!!busca.trim()) +
    Number(filtroSubgrupo !== "Todos") +
    Number(filtroProteina !== "Todas") +
    Object.entries(filtros).reduce((soma, [chave, valor]) => {
      const padrao = (filtrosIniciais as any)[chave];
      return soma + Number(String(valor) !== String(padrao));
    }, 0);

  const limparFiltros = () => {
    setBusca("");
    setFiltroSubgrupo("Todos");
    setFiltroProteina("Todas");
    setFiltros(filtrosIniciais);
  };

  const abrirNutricao = (produto: any, tamanhoInicial?: TamanhoCardapio) => {
    const disponiveis = tamanhosProduto(produto).filter((x) => tamanhos.includes(x as TamanhoCardapio)) as TamanhoCardapio[];
    const tamanho = tamanhoInicial || disponiveis[0] || 300;
    const tabela = tabelaNutricional(produto, tamanho);
    const restricoes = restricoesTamanho(produto, tamanho);
    setNutriProduto(produto);
    setNutriTamanho(tamanho);
    setNutriDraft({ ...tabela });
    setSemGlutenDraft(
      temRestricao(restricoes, "GLÚTEN", true) || (!temRestricao(restricoes, "GLÚTEN") && !!produto.sem_gluten),
    );
    setSemLactoseDraft(
      temRestricao(restricoes, "LACTOSE", true) || (!temRestricao(restricoes, "LACTOSE") && !!produto.sem_lactose),
    );
  };

  const trocarNutriTamanho = (tamanho: TamanhoCardapio) => {
    if (!nutriProduto) return;
    const tabela = tabelaNutricional(nutriProduto, tamanho);
    const restricoes = restricoesTamanho(nutriProduto, tamanho);
    setNutriTamanho(tamanho);
    setNutriDraft({ ...tabela });
    setSemGlutenDraft(
      temRestricao(restricoes, "GLÚTEN", true) || (!temRestricao(restricoes, "GLÚTEN") && !!nutriProduto.sem_gluten),
    );
    setSemLactoseDraft(
      temRestricao(restricoes, "LACTOSE", true) || (!temRestricao(restricoes, "LACTOSE") && !!nutriProduto.sem_lactose),
    );
  };

  const salvarMeta = async (produto: any, campo: "subgrupo" | "proteina" | "observacao_cardapio", valor: string) => {
    const payload = {
      p_produto_id: produto.id,
      p_subgrupo: campo === "subgrupo" ? valor : produto.subgrupo || "",
      p_proteina: campo === "proteina" ? valor : produto.proteina || "",
      p_observacao: campo === "observacao_cardapio" ? valor : produto.observacao_cardapio || "",
    };
    const { error } = await supabase.rpc("cozinha_atualizar_cardapio_produto", payload);
    if (error) return toast.error(error.message);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["coz-prod"] }),
      qc.invalidateQueries({ queryKey: ["admin-products"] }),
      qc.invalidateQueries({ queryKey: ["products"] }),
    ]);
    toast.success("Cardápio e cadastro do produto atualizados.");
  };

  const salvarNutricao = async () => {
    if (!nutriProduto) return;
    setSalvandoNutri(true);
    try {
      const base = restricoesTamanho(nutriProduto, nutriTamanho);
      const restricoes = montarRestricoes(base, semGlutenDraft, semLactoseDraft);
      const tabela = Object.fromEntries(
        Object.entries(nutriDraft).map(([chave, valor]) => {
          if (valor === "" || valor === null || valor === undefined) return [chave, valor];
          const numero = Number(String(valor).replace(",", "."));
          return [chave, Number.isFinite(numero) ? numero : valor];
        }),
      );
      const { error } = await supabase.rpc("cozinha_atualizar_nutricao_cardapio", {
        p_produto_id: nutriProduto.id,
        p_tamanho: nutriTamanho,
        p_tabela: tabela,
        p_restricoes: restricoes,
      });
      if (error) throw error;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["coz-prod"] }),
        qc.invalidateQueries({ queryKey: ["coz-cardapio-etiquetas"] }),
        qc.invalidateQueries({ queryKey: ["cozinha-etiquetas"] }),
        qc.invalidateQueries({ queryKey: ["admin-products"] }),
        qc.invalidateQueries({ queryKey: ["products"] }),
      ]);
      toast.success("Tabela nutricional sincronizada no produto e na etiqueta.");
      setNutriProduto(null);
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível salvar a tabela nutricional.");
    } finally {
      setSalvandoNutri(false);
    }
  };

  const alternarGrupo = (grupo: string) =>
    setOcultos((atual) => ({ ...atual, [grupo]: !atual[grupo] }));

  const CabecalhoGrupo = ({ id, label, colSpan }: { id: string; label: string; colSpan: number }) => (
    <th
      colSpan={colSpan}
      className="sticky top-0 z-20 border-b border-r border-[#315c49] bg-[#173a2d] px-2 py-2 text-center text-[10px] font-black uppercase tracking-wide text-white"
    >
      <button type="button" onClick={() => alternarGrupo(id)} className="inline-flex items-center gap-1">
        {ocultos[id] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        {label}
      </button>
    </th>
  );

  const fixed = (left: number, z = 12) => ({
    position: "sticky" as const,
    left,
    zIndex: z,
  });

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#087443]">Base única de consulta</p>
          <h2 className="text-3xl font-black">Cardápio Completo</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#62766b]">
            Visual estilo planilha, ligado ao cadastro real do produto, fichas técnicas, etiquetas, nutrição, preços e custos.
          </p>
        </div>
        <div className="rounded-xl border border-[#cfe1d3] bg-[#f5faf3] px-3 py-2 text-xs font-bold text-[#355445]">
          {linhas.length} de {produtosCardapio.length} prato(s) · {filtrosAtivos} filtro(s)
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-[#dbe7dd] bg-white p-3">
        <div className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_220px_200px_auto_auto]">
          <label className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-[#6b7e73]" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-[#cbd8ce] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#087443]"
              placeholder="Busca geral: código, prato, descrição, ingrediente..."
            />
          </label>
          <select className={input} value={filtroSubgrupo} onChange={(e) => setFiltroSubgrupo(e.target.value)}>
            <option>Todos</option>
            {subgrupos.map((x) => <option key={x}>{x}</option>)}
          </select>
          <select className={input} value={filtroProteina} onChange={(e) => setFiltroProteina(e.target.value)}>
            <option>Todas</option>
            {proteinas.map((x) => <option key={x}>{x}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setMostrarFiltros((v) => !v)}
            className={"inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold " + (mostrarFiltros || filtrosAtivos > 0 ? "border-[#087443] bg-[#edf5e6] text-[#087443]" : "border-[#cbd8ce] bg-white text-[#355445]")}
          >
            <SlidersHorizontal size={16} />
            Filtros avançados
          </button>
          <button
            type="button"
            onClick={limparFiltros}
            disabled={filtrosAtivos === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cbd8ce] px-3 py-2 text-sm font-bold text-[#62766b] disabled:opacity-40"
          >
            <RotateCcw size={15} /> Limpar
          </button>
        </div>

        {mostrarFiltros && (
          <div className="mt-3 border-t border-[#e2ebe3] pt-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#527164]">Filtros por coluna</p>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <input className={input} value={filtros.codigo} onChange={(e)=>setFiltro("codigo",e.target.value)} placeholder="CÓD: ex. TD10" />
              <input className={input} value={filtros.saborDescricao} onChange={(e)=>setFiltro("saborDescricao",e.target.value)} placeholder="Sabor / descrição" />
              <input className={input} value={filtros.ingrediente} onChange={(e)=>setFiltro("ingrediente",e.target.value)} placeholder="Ingrediente: ex. patinho" />
              <input className={input} value={filtros.codigoBarras} onChange={(e)=>setFiltro("codigoBarras",e.target.value)} placeholder="Código de barras" />
              <select className={input} value={filtros.tamanho} onChange={(e)=>setFiltro("tamanho",e.target.value)}>
                <option value="Todos">Todos os tamanhos</option>
                <option value="200">Tem 200g</option>
                <option value="300">Tem 300g</option>
                <option value="400">Tem 400g</option>
              </select>
              <select className={input} value={filtros.gluten} onChange={(e)=>setFiltro("gluten",e.target.value)}>
                <option value="Todos">Glúten: todos</option>
                <option value="Sim">Sem glúten</option>
                <option value="Não">Contém / não marcado sem glúten</option>
              </select>
              <select className={input} value={filtros.lactose} onChange={(e)=>setFiltro("lactose",e.target.value)}>
                <option value="Todos">Lactose: todos</option>
                <option value="Sim">Sem lactose</option>
                <option value="Não">Contém / não marcado sem lactose</option>
              </select>
              <input className={input} value={filtros.observacao} onChange={(e)=>setFiltro("observacao",e.target.value)} placeholder="Observação" />
            </div>

            <div className="mt-4 rounded-xl bg-[#f5faf3] p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#087443]">Filtros numéricos</p>
                  <p className="text-xs text-[#62766b]">Aplicados ao tamanho escolhido abaixo. As médias finais usam apenas os pratos que permanecerem após todos os filtros.</p>
                </div>
                <select className="rounded-lg border border-[#bcd8c5] bg-white px-3 py-2 text-sm font-bold text-[#087443]" value={filtros.tamanhoAnalise} onChange={(e)=>setFiltro("tamanhoAnalise",e.target.value)}>
                  <option value="200">Analisar 200g</option>
                  <option value="300">Analisar 300g</option>
                  <option value="400">Analisar 400g</option>
                </select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                {[
                  ["Kcal", "kcalMin", "kcalMax"],
                  ["Carb (g)", "carbMin", "carbMax"],
                  ["Proteína (g)", "protMin", "protMax"],
                  ["Preço (R$)", "precoMin", "precoMax"],
                  ["Custo (R$)", "custoMin", "custoMax"],
                  ["Lucro (R$)", "lucroMin", "lucroMax"],
                  ["Margem (%)", "margemMin", "margemMax"],
                ].map(([label,minKey,maxKey])=>(
                  <div key={label} className="rounded-lg border border-[#dbe7dd] bg-white p-2">
                    <p className="mb-1 text-[10px] font-black uppercase text-[#527164]">{label}</p>
                    <div className="grid grid-cols-2 gap-1">
                      <input className={input} inputMode="decimal" value={(filtros as any)[minKey]} onChange={(e)=>setFiltro(minKey,e.target.value)} placeholder="Mín." />
                      <input className={input} inputMode="decimal" value={(filtros as any)[maxKey]} onChange={(e)=>setFiltro(maxKey,e.target.value)} placeholder="Máx." />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        {[
          ["macros", "Macros"],
          ["precos", "Valores de venda"],
          ["custos", "Custos e lucro"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => alternarGrupo(id)}
            className="inline-flex items-center gap-1 rounded-full border border-[#b9d4c2] bg-white px-3 py-1.5 font-bold text-[#087443]"
          >
            {ocultos[id] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
            {label}
          </button>
        ))}
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-2xl border border-[#cbd8ce] bg-white shadow-sm">
        <table className="min-w-max border-collapse text-xs">
          <thead>
            <tr>
              <th rowSpan={3} style={fixed(0, 30)} className="sticky top-0 w-12 min-w-12 border-b border-r bg-[#173a2d] px-2 text-center font-black text-white">ITEM</th>
              <th rowSpan={3} style={fixed(48, 30)} className="sticky top-0 w-36 min-w-36 border-b border-r bg-[#173a2d] px-2 text-left font-black text-white">Subgrupo</th>
              <th rowSpan={3} style={fixed(192, 30)} className="sticky top-0 w-20 min-w-20 border-b border-r bg-[#173a2d] px-2 text-left font-black text-white">CÓD</th>
              <th rowSpan={3} style={fixed(272, 30)} className="sticky top-0 w-72 min-w-72 border-b border-r bg-[#173a2d] px-3 text-left font-black text-white">Sabor</th>
              <th rowSpan={3} className="sticky top-0 z-20 w-32 min-w-32 border-b border-r bg-[#173a2d] px-2 font-black text-white">Tamanhos</th>
              <th rowSpan={3} className="sticky top-0 z-20 w-24 min-w-24 border-b border-r bg-[#173a2d] px-2 font-black text-white">Foto</th>
              <th colSpan={2} className="sticky top-0 z-20 border-b border-r border-[#315c49] bg-[#173a2d] px-2 py-2 text-center text-[10px] font-black uppercase text-white">Alérgicos</th>
              {!ocultos.macros && <CabecalhoGrupo id="macros" label="Macros" colSpan={9} />}
              <th rowSpan={3} className="sticky top-0 z-20 w-32 min-w-32 border-b border-r bg-[#173a2d] px-2 font-black text-white">Tabela Nutricional</th>
              <th colSpan={2} className="sticky top-0 z-20 border-b border-r border-[#315c49] bg-[#173a2d] px-2 py-2 text-center text-[10px] font-black uppercase text-white">Ingredientes</th>
              <th colSpan={3} className="sticky top-0 z-20 border-b border-r border-[#315c49] bg-[#173a2d] px-2 py-2 text-center text-[10px] font-black uppercase text-white">Código de Barras</th>
              {!ocultos.precos && <CabecalhoGrupo id="precos" label="Valor de venda" colSpan={12} />}
              {!ocultos.custos && <CabecalhoGrupo id="custos" label="Custos" colSpan={6} />}
              <th rowSpan={3} className="sticky top-0 z-20 w-64 min-w-64 border-b bg-[#173a2d] px-2 font-black text-white">Observação</th>
            </tr>
            <tr>
              <th rowSpan={2} className="sticky top-[33px] z-20 min-w-24 border-b border-r bg-[#28513f] px-2 py-2 text-white">Sem Glúten</th>
              <th rowSpan={2} className="sticky top-[33px] z-20 min-w-24 border-b border-r bg-[#28513f] px-2 py-2 text-white">Sem Lactose</th>
              {!ocultos.macros && (
                <>
                  <th colSpan={3} className="sticky top-[33px] z-20 border-b border-r bg-[#28513f] px-2 py-2 text-white">Kcal</th>
                  <th colSpan={3} className="sticky top-[33px] z-20 border-b border-r bg-[#28513f] px-2 py-2 text-white">Carb</th>
                  <th colSpan={3} className="sticky top-[33px] z-20 border-b border-r bg-[#28513f] px-2 py-2 text-white">Prot</th>
                </>
              )}
              <th rowSpan={2} className="sticky top-[33px] z-20 min-w-36 border-b border-r bg-[#28513f] px-2 py-2 text-white">Proteína</th>
              <th rowSpan={2} className="sticky top-[33px] z-20 w-80 min-w-80 border-b border-r bg-[#28513f] px-2 py-2 text-white">Ingredientes do prato</th>
              {tamanhos.map((t) => <th key={"ean-" + t} rowSpan={2} className="sticky top-[33px] z-20 min-w-32 border-b border-r bg-[#28513f] px-2 py-2 text-white">{t}g</th>)}
              {!ocultos.precos && (
                <>
                  {["Unitário", "Combo 5+un", "Combo 10+un", "Combo 20+un"].map((x) => (
                    <th key={x} colSpan={3} className="sticky top-[33px] z-20 border-b border-r bg-[#28513f] px-2 py-2 text-white">{x}</th>
                  ))}
                </>
              )}
              {!ocultos.custos && (
                <>
                  <th colSpan={3} className="sticky top-[33px] z-20 border-b border-r bg-[#28513f] px-2 py-2 text-white">Custo</th>
                  <th colSpan={3} className="sticky top-[33px] z-20 border-b border-r bg-[#28513f] px-2 py-2 text-white">Lucro</th>
                </>
              )}
            </tr>
            <tr>
              {!ocultos.macros && [...Array(3)].flatMap((_, grupo) => tamanhos.map((t) => (
                <th key={"m-" + grupo + "-" + t} className="sticky top-[66px] z-20 min-w-20 border-b border-r bg-[#3b6854] px-2 py-1.5 text-white">{t}g</th>
              )))}
              {!ocultos.precos && [...Array(4)].flatMap((_, grupo) => tamanhos.map((t) => (
                <th key={"p-" + grupo + "-" + t} className="sticky top-[66px] z-20 min-w-24 border-b border-r bg-[#3b6854] px-2 py-1.5 text-white">{t}g</th>
              )))}
              {!ocultos.custos && [...Array(2)].flatMap((_, grupo) => tamanhos.map((t) => (
                <th key={"c-" + grupo + "-" + t} className="sticky top-[66px] z-20 min-w-24 border-b border-r bg-[#3b6854] px-2 py-1.5 text-white">{t}g</th>
              )))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((produto: any, indice) => {
              const tamanhosAtivos = tamanhosProduto(produto);
              const custos = Object.fromEntries(tamanhos.map((t) => [t, custoProduto(produto, t)]));
              return (
                <tr key={produto.id} className="group even:bg-[#fbfcfa] hover:bg-[#f1f7ef]">
                  <td style={fixed(0)} className="border-b border-r bg-inherit px-2 py-2 text-center font-black">{indice + 1}</td>
                  <td style={fixed(48)} className="border-b border-r bg-inherit px-2 py-2">
                    <input
                      className="w-32 bg-transparent font-bold outline-none focus:bg-white"
                      defaultValue={produto.subgrupo || ""}
                      onBlur={(e) => {
                        if (e.target.value !== (produto.subgrupo || "")) salvarMeta(produto, "subgrupo", e.target.value);
                      }}
                    />
                  </td>
                  <td style={fixed(192)} className="border-b border-r bg-inherit px-2 py-2 font-black text-[#087443]">{codigoProduto(produto)}</td>
                  <td style={fixed(272)} className="border-b border-r bg-inherit px-3 py-2 font-bold">{nomeProduto(produto)}</td>
                  <td className="border-b border-r px-2 py-2 text-center font-semibold">{tamanhosAtivos.map((x) => x + "g").join(" · ")}</td>
                  <td className="border-b border-r px-2 py-2 text-center">
                    <button type="button" onClick={() => setFotoProduto(produto)} className="inline-flex items-center gap-1 rounded-lg border border-[#b9d4c2] px-2 py-1 font-bold text-[#087443]">
                      <ImageIcon size={14} /> Ver fotos
                    </button>
                  </td>
                  <td className="border-b border-r px-2 py-2 text-center font-bold">{produto.sem_gluten ? "SIM" : "NÃO"}</td>
                  <td className="border-b border-r px-2 py-2 text-center font-bold">{produto.sem_lactose ? "SIM" : "NÃO"}</td>

                  {!ocultos.macros && (
                    <>
                      {(["kcal", "carb", "prot"] as const).flatMap((campo) =>
                        tamanhos.map((t) => {
                          const tabela = tabelaNutricional(produto, t);
                          return (
                            <td key={campo + "-" + t} className="border-b border-r px-2 py-2 text-center">
                              {tamanhosAtivos.includes(t) ? (tabela?.[campo] ?? "—") : "—"}
                            </td>
                          );
                        }),
                      )}
                    </>
                  )}

                  <td className="border-b border-r px-2 py-2 text-center">
                    <button type="button" onClick={() => abrirNutricao(produto)} className="inline-flex items-center gap-1 rounded-lg border border-[#b9d4c2] px-2 py-1 font-bold text-[#087443]">
                      <Table2 size={14} /> Abrir tabela
                    </button>
                  </td>
                  <td className="border-b border-r px-2 py-2">
                    <input
                      className="w-32 bg-transparent font-semibold outline-none focus:bg-white"
                      defaultValue={produto.proteina || ""}
                      onBlur={(e) => {
                        if (e.target.value !== (produto.proteina || "")) salvarMeta(produto, "proteina", e.target.value);
                      }}
                    />
                  </td>
                  <td className="border-b border-r px-2 py-2">
                    <div className="max-w-[310px] whitespace-normal leading-relaxed">{produto.ingredientes || ingredientesTecnicosProduto(produto).join(", ") || "—"}</div>
                    <button type="button" onClick={() => onOpenRecipe(produto)} className="mt-1 inline-flex items-center gap-1 font-bold text-[#087443]">
                      <Pencil size={12} /> Editar na ficha técnica
                    </button>
                  </td>
                  {tamanhos.map((t) => (
                    <td key={"bc-" + t} className="border-b border-r px-2 py-2 text-center font-mono">{tamanhosAtivos.includes(t) ? (codigoBarras(produto, t) || "") : ""}</td>
                  ))}

                  {!ocultos.precos && (
                    <>
                      {(["unit", "t5", "t10", "t20"] as FaixaPreco[]).flatMap((faixa) =>
                        tamanhos.map((t) => (
                          <td key={faixa + "-" + t} className="border-b border-r px-2 py-2 text-right font-semibold">
                            {tamanhosAtivos.includes(t) ? brl(precoProduto(produto, t, faixa)) : "—"}
                          </td>
                        )),
                      )}
                    </>
                  )}

                  {!ocultos.custos && (
                    <>
                      {tamanhos.map((t) => (
                        <td key={"cost-" + t} className="border-b border-r px-2 py-2 text-right font-semibold">
                          {tamanhosAtivos.includes(t) ? brl(n(custos[t])) : "—"}
                        </td>
                      ))}
                      {tamanhos.map((t) => {
                        const venda = precoProduto(produto, t, "unit");
                        const custo = n(custos[t]);
                        const lucro = venda > 0 && custo > 0 ? venda - custo : 0;
                        const margem = venda > 0 && custo > 0 ? (lucro / venda) * 100 : 0;
                        return (
                          <td key={"profit-" + t} className="border-b border-r px-2 py-2 text-right">
                            {tamanhosAtivos.includes(t) && lucro ? (
                              <>
                                <b className={lucro >= 0 ? "text-[#087443]" : "text-red-600"}>{brl(lucro)}</b>
                                <div className="text-[10px] text-[#62766b]">{margem.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</div>
                              </>
                            ) : "—"}
                          </td>
                        );
                      })}
                    </>
                  )}

                  <td className="border-b px-2 py-2">
                    <textarea
                      className="min-h-14 w-60 resize-y bg-transparent outline-none focus:bg-white"
                      defaultValue={produto.observacao_cardapio || ""}
                      placeholder="Observação..."
                      onBlur={(e) => {
                        if (e.target.value !== (produto.observacao_cardapio || "")) salvarMeta(produto, "observacao_cardapio", e.target.value);
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="mt-5 rounded-2xl border border-[#cbd8ce] bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#087443]">Resumo gerencial dos filtros atuais</p>
            <h3 className="mt-1 text-xl font-black">{linhas.length} prato(s) selecionado(s)</h3>
            <p className="mt-1 text-xs text-[#62766b]">
              Todas as médias abaixo são recalculadas automaticamente quando você filtra a tabela.
            </p>
          </div>
          <div className="text-right text-xs text-[#62766b]">
            <b className="text-[#355445]">{totalSemGluten}</b> sem glúten · <b className="text-[#355445]">{totalSemLactose}</b> sem lactose
          </div>
        </div>

        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {[
            ["Pratos", String(resumoAnalise?.quantidade || 0), `${tamanhoAnalise}g disponíveis`],
            ["Kcal média", resumoAnalise?.kcal ? resumoAnalise.kcal.toLocaleString("pt-BR",{maximumFractionDigits:1}) : "—", `${tamanhoAnalise}g`],
            ["Preço médio", brl(resumoAnalise?.unit || 0), "unitário"],
            ["Custo médio", brl(resumoAnalise?.custo || 0), `${tamanhoAnalise}g`],
            ["Lucro médio", brl(resumoAnalise?.lucro || 0), "unitário"],
            ["Margem média", percentual(resumoAnalise?.margem || 0), "sobre venda"],
            ["Custo / venda", percentual(resumoAnalise?.custoSobreVenda || 0), "média"],
          ].map(([label,valorCard,sub])=>(
            <div key={label} className="rounded-xl border border-[#dbe7dd] bg-[#f8fbf8] p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#62766b]">{label}</p>
              <p className="mt-1 text-lg font-black text-[#173a2d]">{valorCard}</p>
              <p className="text-[10px] text-[#7a8b81]">{sub}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#dbe7dd]">
          <table className="min-w-[1180px] w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#173a2d] text-white">
                <th className="border-r border-[#315c49] px-3 py-2 text-left">Tamanho</th>
                <th className="border-r border-[#315c49] px-3 py-2 text-right">Qtd. pratos</th>
                <th className="border-r border-[#315c49] px-3 py-2 text-right">Kcal média</th>
                <th className="border-r border-[#315c49] px-3 py-2 text-right">Carb médio</th>
                <th className="border-r border-[#315c49] px-3 py-2 text-right">Prot média</th>
                <th className="border-r border-[#315c49] px-3 py-2 text-right">Preço médio</th>
                <th className="border-r border-[#315c49] px-3 py-2 text-right">Custo médio</th>
                <th className="border-r border-[#315c49] px-3 py-2 text-right">Lucro médio</th>
                <th className="border-r border-[#315c49] px-3 py-2 text-right">Margem</th>
                <th className="border-r border-[#315c49] px-3 py-2 text-right">Lucro 5+</th>
                <th className="border-r border-[#315c49] px-3 py-2 text-right">Lucro 10+</th>
                <th className="px-3 py-2 text-right">Lucro 20+</th>
              </tr>
            </thead>
            <tbody>
              {resumoPorTamanho.map((r)=>(
                <tr key={r.tamanho} className="even:bg-[#f8fbf8]">
                  <td className="border-t border-r border-[#e2ebe3] px-3 py-2 font-black text-[#087443]">{r.tamanho}g</td>
                  <td className="border-t border-r border-[#e2ebe3] px-3 py-2 text-right font-bold">{r.quantidade}</td>
                  <td className="border-t border-r border-[#e2ebe3] px-3 py-2 text-right">{r.kcal ? r.kcal.toLocaleString("pt-BR",{maximumFractionDigits:1}) : "—"}</td>
                  <td className="border-t border-r border-[#e2ebe3] px-3 py-2 text-right">{r.carb ? `${r.carb.toLocaleString("pt-BR",{maximumFractionDigits:1})} g` : "—"}</td>
                  <td className="border-t border-r border-[#e2ebe3] px-3 py-2 text-right">{r.prot ? `${r.prot.toLocaleString("pt-BR",{maximumFractionDigits:1})} g` : "—"}</td>
                  <td className="border-t border-r border-[#e2ebe3] px-3 py-2 text-right">{brl(r.unit)}</td>
                  <td className="border-t border-r border-[#e2ebe3] px-3 py-2 text-right">{brl(r.custo)}</td>
                  <td className="border-t border-r border-[#e2ebe3] px-3 py-2 text-right font-bold text-[#087443]">{brl(r.lucro)}</td>
                  <td className="border-t border-r border-[#e2ebe3] px-3 py-2 text-right">{r.margem ? percentual(r.margem) : "—"}</td>
                  <td className="border-t border-r border-[#e2ebe3] px-3 py-2 text-right">{brl(r.lucro5)}</td>
                  <td className="border-t border-r border-[#e2ebe3] px-3 py-2 text-right">{brl(r.lucro10)}</td>
                  <td className="border-t border-[#e2ebe3] px-3 py-2 text-right">{brl(r.lucro20)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-[#7a8b81]">
          Médias ignoram campos sem valor cadastrado. Lucro = preço da faixa − custo calculado pela ficha técnica, ingredientes, rendimentos e embalagem.
        </p>
      </section>

      {fotoProduto && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-4">
          <div className="mx-auto my-8 max-w-5xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-[#087443]">{codigoProduto(fotoProduto)}</p>
                <h3 className="text-xl font-black">{nomeProduto(fotoProduto)}</h3>
              </div>
              <button onClick={() => setFotoProduto(null)}><X /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(() => {
                const labels = etiquetasPorProduto.get(fotoProduto.id) || [];
                const candidatas = [
                  [200, fotoProduto.imagem_200g || labels.find((x: any) => n(x.tamanho_g) === 200)?.imagem_url],
                  [300, fotoProduto.imagem_300g || labels.find((x: any) => n(x.tamanho_g) === 300)?.imagem_url],
                  [400, fotoProduto.imagem_400g || labels.find((x: any) => n(x.tamanho_g) === 400)?.imagem_url],
                ].filter((x: any) => !!x[1]);
                const extras = [
                  fotoProduto.imagem_url,
                  ...(Array.isArray(fotoProduto.imagens) ? fotoProduto.imagens : []),
                ].filter(Boolean);
                const vistos = new Set(candidatas.map((x: any) => x[1]));
                extras.forEach((url: string) => {
                  if (!vistos.has(url)) {
                    candidatas.push(["Galeria", url] as any);
                    vistos.add(url);
                  }
                });
                return candidatas.length ? candidatas.map((item: any, i: number) => (
                  <figure key={String(item[0]) + i} className="overflow-hidden rounded-xl border border-[#dbe7dd] bg-[#f7f6f0]">
                    <img src={item[1]} alt="" className="aspect-[4/3] w-full object-cover" />
                    <figcaption className="p-2 text-center text-sm font-bold">{typeof item[0] === "number" ? item[0] + " g" : item[0]}</figcaption>
                  </figure>
                )) : <p className="col-span-full py-10 text-center text-sm text-[#62766b]">Nenhuma imagem cadastrada para este produto.</p>;
              })()}
            </div>
          </div>
        </div>
      )}

      {nutriProduto && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-4">
          <div className="mx-auto my-6 max-w-5xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-[#087443]">Tabela nutricional</p>
                <h3 className="text-xl font-black">{codigoProduto(nutriProduto)} — {nomeProduto(nutriProduto)}</h3>
                <p className="mt-1 text-xs text-[#62766b]">Ao salvar, produto e etiqueta do mesmo tamanho são sincronizados.</p>
              </div>
              <button onClick={() => setNutriProduto(null)}><X /></button>
            </div>

            <div className="mb-4 flex gap-2">
              {tamanhos
                .filter((t) => tamanhosProduto(nutriProduto).includes(t))
                .map((t) => (
                  <button
                    key={t}
                    onClick={() => trocarNutriTamanho(t)}
                    className={"rounded-lg px-4 py-2 text-sm font-bold " + (nutriTamanho === t ? "bg-[#087443] text-white" : "bg-[#edf5e6] text-[#355445]")}
                  >
                    {t} g
                  </button>
                ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-[#dbe7dd]">
              <div className="grid grid-cols-[minmax(210px,1fr)_150px_150px] bg-[#173a2d] px-3 py-2 text-xs font-black uppercase text-white">
                <span>Nutriente</span>
                <span>Porção {nutriTamanho}g</span>
                <span>A cada 100g</span>
              </div>
              {camposNutri.map(([chave, label, unidade]) => (
                <div key={chave} className="grid grid-cols-[minmax(210px,1fr)_150px_150px] items-center border-t border-[#dbe7dd] px-3 py-2 text-sm">
                  <b>{label} <span className="text-xs font-normal text-[#62766b]">({unidade})</span></b>
                  <input
                    className={input}
                    value={nutriDraft[chave] ?? ""}
                    onChange={(e) => setNutriDraft((atual) => ({ ...atual, [chave]: e.target.value }))}
                  />
                  <input
                    className={input}
                    value={nutriDraft[chave + "_100g"] ?? ""}
                    onChange={(e) => setNutriDraft((atual) => ({ ...atual, [chave + "_100g"]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 rounded-xl bg-[#f5faf3] p-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={semGlutenDraft} onChange={(e) => setSemGlutenDraft(e.target.checked)} />
                Sem Glúten
              </label>
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={semLactoseDraft} onChange={(e) => setSemLactoseDraft(e.target.checked)} />
                Sem Lactose
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setNutriProduto(null)} className="rounded-xl border border-[#b9d4c2] px-4 py-2 text-sm font-bold">Cancelar</button>
              <button disabled={salvandoNutri} onClick={salvarNutricao} className="rounded-xl bg-[#087443] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {salvandoNutri ? "Salvando..." : "Salvar e sincronizar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
