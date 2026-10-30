import { useMemo, useState } from "react";
import { ClipboardPaste, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { interpretarMensagemEstoqueCozinha, type ProdutoEstoqueCozinha } from "@/lib/cozinha-estoque-importacao";

type Props = {
  produtos: ProdutoEstoqueCozinha[];
  onAtualizado: () => void;
};

export function AtualizarEstoqueCozinha({ produtos, onAtualizado }: Props) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [modo, setModo] = useState<"substituir" | "somar">("substituir");
  const [confirmado, setConfirmado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const previa = useMemo(
    () => interpretarMensagemEstoqueCozinha(texto, produtos),
    [texto, produtos],
  );

  const salvar = async () => {
    if (salvando || !previa.itens.length || previa.erros.length || (modo === "substituir" && !confirmado)) return;
    setSalvando(true);
    try {
      const { data, error } = await supabase.rpc("importar_estoque_cozinha", {
        p_itens: previa.itens.map(({ produto_id, tamanho, quantidade }) => ({
          produto_id, tamanho, quantidade,
        })),
        p_modo: modo,
      } as any);
      if (error) throw error;
      toast.success("Estoque da cozinha atualizado: " + Number(data ?? previa.total) + " unidades importadas.");
      setTexto("");
      setConfirmado(false);
      setAberto(false);
      onAtualizado();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao atualizar estoque da cozinha.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="mb-5 rounded-2xl border border-[#b9d6c2] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-black text-[#173a2d]">
            <ClipboardPaste size={19} /> Atualizar estoque por mensagem
          </h3>
          <p className="mt-1 text-sm text-[#62766b]">
            Cole a relação de produtos com quantidades. Confira a prévia antes de salvar.
            Isso altera apenas as marmitas, sopas e complementos da cozinha — nunca o estoque da loja ou os ingredientes.
          </p>
        </div>
        <button type="button" onClick={() => setAberto(!aberto)}
          className="rounded-xl bg-[#087443] px-4 py-2 text-sm font-bold text-white hover:bg-[#066638]">
          {aberto ? "Fechar" : "Colar lista"}
        </button>
      </div>
      {aberto && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de atualização">
            <button type="button" aria-pressed={modo === "substituir"}
              onClick={() => { setModo("substituir"); setConfirmado(false); }}
              className={"rounded-lg border px-3 py-2 text-sm font-bold " +
                (modo === "substituir" ? "border-[#087443] bg-[#e0f2e7] text-[#075636]" : "border-[#dbe7dd] text-[#52695f]")}>
              Substituir tudo (zerar antes)
            </button>
            <button type="button" aria-pressed={modo === "somar"}
              onClick={() => { setModo("somar"); setConfirmado(false); }}
              className={"rounded-lg border px-3 py-2 text-sm font-bold " +
                (modo === "somar" ? "border-[#087443] bg-[#e0f2e7] text-[#075636]" : "border-[#dbe7dd] text-[#52695f]")}>
              Somar novas unidades
            </button>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Mensagem do estoque</span>
            <textarea rows={9} value={texto}
              onChange={(e) => { setTexto(e.target.value); setConfirmado(false); }}
              placeholder={"*Estoque Cozinha:*\n\nPanqueca de Carne 200g - 6\nTiras de Bife 150g - 10\nCreme Abóbora - 10"}
              className="w-full rounded-xl border border-[#cbd8ce] bg-white p-3 font-mono text-sm outline-none focus:border-[#087443]" />
          </label>
          {texto.trim() && (
            <div className="rounded-xl border border-[#dbe7dd] bg-[#f7faf7] p-3">
              <p className="text-sm font-black">
                Prévia: {previa.itens.length} lançamentos · {previa.total} unidades
              </p>
              {previa.erros.length > 0 && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                  <p className="font-bold">Corrija todas as linhas antes de salvar. Nenhuma será importada enquanto houver erros.</p>
                  <ul className="mt-1 list-disc pl-5">
                    {previa.erros.map((erro, i) => <li key={i}>{erro}</li>)}
                  </ul>
                </div>
              )}
              {previa.itens.length > 0 && (
                <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border bg-white">
                  {previa.itens.map((item, i) => (
                    <div key={item.produto_id + ":" + item.tamanho}
                      className="flex items-center justify-between gap-3 border-b px-3 py-2 text-xs last:border-0">
                      <span className="min-w-0 break-words">{i + 1}. {item.nome} · {item.tamanho}g</span>
                      <b className="shrink-0">{item.quantidade} un</b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {modo === "substituir" && (
            <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
              <input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)}
                className="mt-1 accent-[#087443]" />
              Confirmo que desejo zerar todos os saldos de refeições prontas da cozinha e substituí-los pela lista acima. A loja não será alterada.
            </label>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => { setAberto(false); setTexto(""); setConfirmado(false); }}
              className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold">
              <X size={16} /> Cancelar
            </button>
            <button type="button" onClick={salvar}
              disabled={salvando || !previa.itens.length || previa.erros.length > 0 || (modo === "substituir" && !confirmado)}
              className="flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
              <RefreshCw size={16} className={salvando ? "animate-spin" : ""} />
              {salvando ? "Atualizando..." : modo === "substituir" ? "Substituir estoque da cozinha" : "Registrar entrada na cozinha"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
