import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, Loader2, Search, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePrecosMarmita } from "@/lib/use-precos-marmita";
import { catalogImageFile, catalogMessage, catalogMoney, catalogSearch, catalogVariants, type CatalogOrderItem, type CatalogProduct, type CatalogVariant } from "@/lib/whatsapp-catalog";
import { Button } from "@/components/ui/button";

export function WhatsAppCatalog({ onClose, onShare, onOrder, canShare }: {
  onClose: () => void; onShare: (text: string, photo?: File) => boolean;
  onOrder: (item: CatalogOrderItem) => void; canShare: boolean;
}) {
  const tabela = usePrecosMarmita();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selection, setSelection] = useState<{ product: CatalogProduct; variant: CatalogVariant } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["whatsapp-public-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("produtos_publicos");
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as CatalogProduct[];
    }, staleTime: 30_000,
  });
  const categories = [...new Set(products.map((p) => p.categorias?.nome || p.categoria || p.tipo_produto || "Outros"))];
  const filtered = products.filter((p) => (!category || category === (p.categorias?.nome || p.categoria || p.tipo_produto || "Outros")) &&
    catalogSearch(p.nome).includes(catalogSearch(search.trim())));
  const share = async (withPhoto: boolean) => {
    if (!selection || loadingPhoto || !canShare) return;
    const text = catalogMessage(selection.product, selection.variant);
    try {
      setLoadingPhoto(true);
      const file = withPhoto ? await catalogImageFile(selection.variant.image) : undefined;
      if (mounted.current && onShare(text, file)) onClose();
    } catch { if (mounted.current) toast.error("Não foi possível preparar a foto. Tente novamente ou use Preparar sem foto."); }
    finally { if (mounted.current) setLoadingPhoto(false); }
  };
  return <div className="space-y-4 p-4 sm:p-6">
      <p className="text-sm text-gray-600">Produtos e valores do site. Escolha um tamanho para compartilhar ou incluir no pedido.</p>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[150px]"><Search className="absolute left-3 top-3 text-gray-400" size={16}/><input aria-label="Buscar produto" placeholder="Buscar por nome ou código" value={search} onChange={e => setSearch(e.target.value)} className="w-full h-10 rounded border pl-9 pr-2 text-sm"/></div>
        <select aria-label="Categoria" value={category} onChange={e => setCategory(e.target.value)} className="h-10 rounded border px-2 text-sm max-w-[45%]"><option value="">Todas as categorias</option>{categories.map(c => <option key={c}>{c}</option>)}</select>
      </div>
      <div className="max-h-[42dvh] overflow-y-auto space-y-2 pr-1">
        {isLoading && <p className="text-sm text-gray-500">Carregando catálogo...</p>}
        {isError && <button className="text-red-700 text-sm underline" onClick={() => refetch()}>Falha ao carregar. Tentar novamente.</button>}
        {!isLoading && !isError && !filtered.length && <p className="text-sm text-gray-500">Nenhum produto encontrado.</p>}
        {filtered.map(p => <div key={p.id} className="flex gap-3 rounded-lg border p-2">
          {p.imagem_url ? <img src={p.imagem_url} alt="" loading="lazy" className="h-16 w-16 rounded object-cover shrink-0"/> : <div className="h-16 w-16 rounded bg-gray-100 grid place-items-center shrink-0"><ImageIcon size={20}/></div>}
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold leading-snug">{p.nome}</p><div className="flex flex-wrap gap-1 mt-1.5">
            {catalogVariants(p, tabela).map(v => <button key={v.label} type="button" disabled={loadingPhoto} onClick={() => { setSelection({ product: p, variant: v }); setQuantity(1); }} className={`rounded border px-2 py-1 text-xs ${selection?.product.id === p.id && selection.variant.label === v.label ? "bg-green-700 text-white border-green-700" : "hover:bg-green-50"}`}>
              {v.label} · {catalogMoney(v.price)}{v.stock !== null && <span className="block opacity-80">{v.stock > 0 ? `${v.stock} em estoque` : "Sem estoque"}</span>}
            </button>)}
          </div></div>
        </div>)}
      </div>
      {selection && <div className="rounded-xl border border-green-200 bg-green-50 p-3 space-y-3">
        <div className="flex gap-2 items-start"><div className="flex-1 min-w-0"><p className="text-sm font-bold text-green-900">{selection.product.nome} · {selection.variant.label}</p><p className="text-xs">{catalogMoney(selection.variant.price)} · antes de eventuais descontos</p></div><button disabled={loadingPhoto} onClick={() => setSelection(null)} aria-label="Limpar seleção"><X size={16}/></button></div>
        <div className="flex gap-2 items-start">{selection.variant.image && <img src={selection.variant.image} alt="Foto do produto" className="w-20 h-20 rounded object-cover"/>}<p className="whitespace-pre-wrap break-all text-xs flex-1">{catalogMessage(selection.product, selection.variant)}</p></div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button size="sm" disabled={!canShare || !selection.variant.image || loadingPhoto} onClick={() => share(true)}>{loadingPhoto ? <Loader2 className="animate-spin mr-1" size={15}/> : <ImageIcon size={15} className="mr-1"/>} Preparar com foto</Button>
          <Button size="sm" variant="outline" disabled={!canShare || loadingPhoto} onClick={() => share(false)}>Preparar sem foto</Button>
          {selection.variant.orderable && <><input type="number" min={1} max={200} aria-label="Quantidade para o pedido" value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(200, Math.floor(Number(e.target.value) || 1))))} className="w-16 h-9 rounded border px-2 text-sm"/><Button size="sm" variant="outline" disabled={loadingPhoto} onClick={() => onOrder({productId: selection.product.id, weight: selection.variant.weight, unitPrice: selection.variant.price, quantity})}><ShoppingCart size={15} className="mr-1"/> Adicionar ao pedido</Button></>}
        </div>
        {!canShare && <p className="text-xs text-amber-800">Para compartilhar, assuma o atendimento e aguarde a janela de mensagens livres.</p>}
        {!selection.variant.orderable && <p className="text-xs text-gray-600">Combos prontos e configuráveis: envie o link ao cliente ou monte os itens no lançamento de pedido.</p>}
      </div>}
  </div>;
}
