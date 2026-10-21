import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, CheckCircle2, FileUp, Loader2, Package, Printer, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Sabor = {
  id: string;
  nome: string;
  codigo_integracao: string | null;
  imagem_url: string | null;
  imagem_200g: string | null;
  tipo_produto: string | null;
};
type Modelo = { produto_id: string; arquivo_path: string; nome_arquivo: string | null; updated_at: string };
type Peso = 200 | 300 | 400;
type Quantidades = Record<Peso, number>;
const PESOS: Peso[] = [200, 300, 400];
const formatoDataLocal = () => {
  const agora = new Date();
  return [agora.getFullYear(), String(agora.getMonth() + 1).padStart(2, "0"), String(agora.getDate()).padStart(2, "0")].join("-");
};
const estilosCampo = "w-full rounded-xl border border-[#c9d9ce] bg-white px-3 py-2.5 text-base text-[#18392b] focus:border-[#087443] focus:outline-none";

export function EtiquetasPDFManager() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const entradaPDF = useRef<HTMLInputElement>(null);
  const [authorized, setAuthorized] = useState(false);
  const [busca, setBusca] = useState("");
  const [paraUpload, setParaUpload] = useState<Sabor | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<Sabor | null>(null);
  const [fabricacao, setFabricacao] = useState(formatoDataLocal);
  const [quantidades, setQuantidades] = useState<Quantidades>({ 200: 0, 300: 0, 400: 0 });
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!ativo) return;
      if (!session?.user) return navigate({ to: "/cozinha-login" as any, replace: true });
      const { data, error } = await supabase.from("user_roles")
        .select("role").eq("user_id", session.user.id).in("role", ["admin", "cozinha"]);
      if (!ativo) return;
      if (error || !data?.length) return navigate({ to: "/cozinha-login" as any, replace: true });
      setAuthorized(true);
    })();
    return () => { ativo = false; };
  }, [navigate]);

  const { data: sabores = [], isLoading: carregandoSabores } = useQuery({
    queryKey: ["cozinha-etiquetas-pdf-sabores"],
    enabled: authorized,
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos")
        .select("id,nome,codigo_integracao,imagem_url,imagem_200g,tipo_produto")
        .eq("ativo", true).in("tipo_produto", ["marmita", "sopa"]).order("nome");
      if (error) throw error;
      return (data || []) as Sabor[];
    },
  });
  const { data: modelos = [], isLoading: carregandoModelos } = useQuery({
    queryKey: ["cozinha-etiquetas-pdf-modelos"],
    enabled: authorized,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("cozinha_etiqueta_pdf_modelos")
        .select("produto_id,arquivo_path,nome_arquivo,updated_at");
      if (error) throw error;
      return (data || []) as Modelo[];
    },
  });
  const modelosPorProduto = useMemo(() => new Map(modelos.map((m) => [m.produto_id, m])), [modelos]);
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return sabores.filter((s) => !termo || (s.nome + " " + (s.codigo_integracao || "")).toLocaleLowerCase("pt-BR").includes(termo));
  }, [busca, sabores]);
  const totais = PESOS.reduce((soma, peso) => soma + (quantidades[peso] || 0), 0);
  const folhasA3 = Math.ceil(totais / 6);

  const abrirImpressao = (sabor: Sabor) => {
    setSelecionado(sabor);
    setFabricacao(formatoDataLocal());
    setQuantidades({ 200: 0, 300: 0, 400: 0 });
  };

  const selecionarPDF = (sabor: Sabor) => {
    setParaUpload(sabor);
    if (entradaPDF.current) {
      entradaPDF.current.value = "";
      entradaPDF.current.click();
    }
  };

  const enviarPDF = async (arquivo?: File) => {
    const sabor = paraUpload;
    setParaUpload(null);
    if (!sabor || !arquivo) return;
    if (!arquivo.name.toLowerCase().endsWith(".pdf")) return toast.error("Selecione um arquivo PDF.");
    if (arquivo.size > 25 * 1024 * 1024) return toast.error("O PDF deve ter até 25 MB.");
    const antigo = modelosPorProduto.get(sabor.id);
    const caminho = "modelos/" + sabor.id + "/" + Date.now() + "-" + crypto.randomUUID() + ".pdf";
    setEnviando(sabor.id);
    try {
      const { error: uploadError } = await supabase.storage.from("etiquetas-pdf")
        .upload(caminho, arquivo, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw uploadError;
      const { error: saveError } = await (supabase as any)
        .from("cozinha_etiqueta_pdf_modelos")
        .upsert({
          produto_id: sabor.id,
          arquivo_path: caminho,
          nome_arquivo: arquivo.name,
          updated_at: new Date().toISOString(),
        }, { onConflict: "produto_id" });
      if (saveError) {
        await supabase.storage.from("etiquetas-pdf").remove([caminho]);
        throw saveError;
      }
      if (antigo?.arquivo_path && antigo.arquivo_path !== caminho) {
        await supabase.storage.from("etiquetas-pdf").remove([antigo.arquivo_path]);
      }
      await qc.invalidateQueries({ queryKey: ["cozinha-etiquetas-pdf-modelos"] });
      toast.success("PDF original salvo para " + sabor.nome + ".");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar o PDF.");
    } finally {
      setEnviando(null);
    }
  };

  const abrirOriginal = async (sabor: Sabor) => {
    const modelo = modelosPorProduto.get(sabor.id);
    if (!modelo) return;
    const aba = window.open("", "_blank");
    try {
      const { data, error } = await supabase.storage.from("etiquetas-pdf")
        .createSignedUrl(modelo.arquivo_path, 180);
      if (error || !data?.signedUrl) throw error || new Error("PDF indisponível.");
      if (aba) aba.location.href = data.signedUrl;
      else window.location.href = data.signedUrl;
    } catch (e) {
      aba?.close();
      toast.error(e instanceof Error ? e.message : "Não foi possível abrir o PDF.");
    }
  };

  const imprimir = async () => {
    if (!selecionado || gerando) return;
    if (!fabricacao) return toast.error("Selecione a data de fabricação.");
    if (!totais) return toast.error("Informe ao menos uma etiqueta.");
    if (totais > 600) return toast.error("O limite por impressão é 600 etiquetas.");
    if (!modelosPorProduto.has(selecionado.id)) return toast.error("Cadastre primeiro o PDF original desse sabor.");
    const aba = window.open("", "_blank");
    if (aba) {
      aba.document.title = "Preparando etiquetas A3…";
      aba.document.body.textContent = "Preparando o PDF de impressão. Aguarde…";
    }
    setGerando(true);
    try {
      const { data, error } = await supabase.functions.invoke("cozinha-imprimir-etiquetas-pdf", {
        body: {
          produto_id: selecionado.id,
          data_fabricacao: fabricacao,
          quantidades: { "200": quantidades[200], "300": quantidades[300], "400": quantidades[400] },
        },
      });
      if (error) throw error;
      if (!(data instanceof Blob) || !data.size) throw new Error("O serviço não retornou um PDF válido.");
      const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      if (aba && !aba.closed) {
        aba.location.replace(url);
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = "etiquetas-" + fabricacao + ".pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 120000);
      toast.success(String(totais) + " etiquetas organizadas em " + String(folhasA3) + " folha(s) A3.");
      setSelecionado(null);
    } catch (e) {
      aba?.close();
      toast.error(e instanceof Error ? e.message : "Não foi possível gerar o PDF.");
    } finally {
      setGerando(false);
    }
  };

  if (!authorized) {
    return <div className="grid min-h-screen place-items-center bg-[#f7f6f0] text-[#315943]">Verificando acesso…</div>;
  }

  return <main className="min-h-screen min-w-0 bg-[#f7f6f0] px-3 py-5 text-[#173a2d] sm:px-5 md:px-8">
    <input
      ref={entradaPDF}
      type="file"
      accept=".pdf,application/pdf"
      className="hidden"
      onChange={(e) => { void enviarPDF(e.target.files?.[0]); }}
    />
    <div className="mx-auto max-w-7xl">
      <a href="/cozinha" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#087443]">
        <ArrowLeft size={17} /> Voltar à cozinha
      </a>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#087443]">Cozinha · Impressão A3</p>
          <h1 className="text-2xl font-black sm:text-3xl">Etiquetas por sabor</h1>
          <p className="mt-1 text-sm text-[#62766b]">Um sabor por card. Cadastre seu PDF original e escolha as quantidades na impressão.</p>
        </div>
        <div className="rounded-xl border border-[#cce0ce] bg-white px-4 py-2 text-xs font-bold text-[#087443]">
          6 etiquetas por folha A3 · 297 × 420 mm
        </div>
      </div>
      <label className="mb-5 flex max-w-xl items-center gap-2 rounded-xl border border-[#cbd8ce] bg-white px-3 py-1">
        <Search size={19} className="shrink-0 text-[#608675]" />
        <input className="w-full bg-transparent py-2.5 text-sm outline-none" placeholder="Buscar sabor ou código TD…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </label>
      {carregandoSabores || carregandoModelos ? (
        <p className="py-8 text-sm text-[#62766b]">Carregando sabores e PDFs…</p>
      ) : filtrados.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm">Nenhum sabor encontrado.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((sabor) => {
            const modelo = modelosPorProduto.get(sabor.id);
            return <article key={sabor.id} className="flex min-w-0 flex-col rounded-2xl border border-[#dce7de] bg-white p-4 shadow-sm">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f0f5eb]">
                  {sabor.imagem_200g || sabor.imagem_url ? (
                    <img src={sabor.imagem_200g || sabor.imagem_url || ""} alt="" className="size-full object-cover" />
                  ) : <Package size={23} className="text-[#789886]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 text-sm font-black leading-snug">{sabor.nome}</h2>
                  <span className={"mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold " + (modelo ? "bg-[#e6f3e5] text-[#087443]" : "bg-[#f5f0e5] text-[#806121]")}>
                    {modelo ? <CheckCircle2 size={13} /> : <FileUp size={13} />}
                    {modelo ? "PDF cadastrado" : "Aguardando PDF"}
                  </span>
                </div>
              </div>
              <div className="mt-auto pt-4">
                {modelo && <p className="mb-2 truncate text-xs text-[#708276]" title={modelo.nome_arquivo || ""}>{modelo.nome_arquivo || "Modelo de etiquetas A3"}</p>}
                <div className="flex flex-wrap gap-2">
                  <button disabled={enviando === sabor.id} onClick={() => selecionarPDF(sabor)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#c3d5c7] px-3 text-xs font-bold hover:bg-[#f4f8f3] disabled:opacity-50">
                    {enviando === sabor.id ? <Loader2 size={15} className="animate-spin" /> : <FileUp size={15} />}
                    {modelo ? "Trocar PDF" : "Enviar PDF"}
                  </button>
                  {modelo && <>
                    <button onClick={() => { void abrirOriginal(sabor); }} className="min-h-10 rounded-xl border border-[#c3d5c7] px-3 text-xs font-bold hover:bg-[#f4f8f3]">Ver</button>
                    <button onClick={() => abrirImpressao(sabor)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#087443] px-3 text-xs font-bold text-white hover:bg-[#065a36]">
                      <Printer size={15} /> Imprimir
                    </button>
                  </>}
                </div>
              </div>
            </article>;
          })}
        </div>
      )}
    </div>

    {selecionado && <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget && !gerando) setSelecionado(null); }}>
      <section role="dialog" aria-modal="true" aria-label="Imprimir etiquetas do sabor" className="my-auto w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#087443]">Imprimir etiquetas A3</p>
            <h2 className="mt-1 text-lg font-black leading-snug">{selecionado.nome}</h2>
          </div>
          <button disabled={gerando} onClick={() => setSelecionado(null)} aria-label="Fechar" className="rounded-lg p-1.5 hover:bg-[#f1f5f0]"><X size={21}/></button>
        </div>
        <label className="mt-6 block text-sm font-bold">
          <span className="mb-2 flex items-center gap-2"><CalendarDays size={17}/> Data de fabricação</span>
          <input type="date" value={fabricacao} onChange={(e) => setFabricacao(e.target.value)} className={estilosCampo} />
        </label>
        <div className="mt-6">
          <p className="mb-2 text-sm font-bold">Quantidade de etiquetas por tamanho</p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {PESOS.map((peso) => <label key={peso} className="rounded-xl border border-[#dfebe1] bg-[#f8fbf7] p-2.5 text-center sm:p-3">
              <span className="mb-2 block text-sm font-black">{peso} g</span>
              <input
                aria-label={"Quantidade " + peso + " gramas"}
                type="number"
                min={0}
                max={600}
                step={1}
                inputMode="numeric"
                value={quantidades[peso] || ""}
                placeholder="0"
                onChange={(e) => {
                  const numero = Math.floor(Number(e.target.value) || 0);
                  setQuantidades((anterior) => ({ ...anterior, [peso]: Math.max(0, Math.min(600, numero)) }));
                }}
                className={estilosCampo + " text-center font-bold"}
              />
            </label>)}
          </div>
        </div>
        <div className="mt-5 rounded-xl bg-[#ecf6ea] p-4">
          <div className="flex justify-between gap-2 text-sm"><span>Total de etiquetas</span><strong>{totais}</strong></div>
          <div className="mt-1 flex justify-between gap-2 text-sm"><span>Folhas A3 necessárias</span><strong>{folhasA3}</strong></div>
          <p className="mt-2 text-xs text-[#607667]">O sistema combina os tamanhos na mesma folha quando possível (6 etiquetas por página). Apenas a data de fabricação será atualizada no PDF.</p>
        </div>
        <p className="mt-3 text-xs text-[#66786c]">Na janela de impressão, selecione A3, escala 100% e sem ajustar à página.</p>
        <div className="mt-5 flex gap-2">
          <button disabled={gerando} onClick={() => setSelecionado(null)} className="min-h-11 flex-1 rounded-xl border border-[#d2dfd4] font-bold">Cancelar</button>
          <button disabled={gerando || totais < 1 || totais > 600 || !fabricacao} onClick={() => { void imprimir(); }} className="inline-flex min-h-11 flex-[1.5] items-center justify-center gap-2 rounded-xl bg-[#087443] px-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {gerando ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
            {gerando ? "Preparando PDF…" : "Gerar e imprimir"}
          </button>
        </div>
      </section>
    </div>}
  </main>;
}
