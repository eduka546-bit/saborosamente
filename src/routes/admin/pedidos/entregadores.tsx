import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Check, ClipboardCopy, MessageCircle, Truck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  cobrancaNoMotorista, dataEntregaProgramada, diaDaSemana, enderecoCompleto,
  enderecoIncompleto, pedidoDaRota, proximaDataRota,
  textoResumoEntregador, type DiaRota, type PedidoRota,
} from "@/lib/entregadores-resumo";

export const Route = createFileRoute("/admin/pedidos/entregadores")({
  component: ResumoEntregadoresPage,
  ssr: false,
});

type Entregador = { id: string; nome: string; telefone: string | null; ativo: boolean | null };

function dataHojeSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (tipo: string) => parts.find((p) => p.type === tipo)?.value ?? "";
  return get("year") + "-" + get("month") + "-" + get("day");
}

function ResumoEntregadoresPage() {
  const [rota, setRota] = useState<DiaRota>("sexta");
  const [data, setData] = useState(() => proximaDataRota("sexta", dataHojeSaoPaulo()));
  const [cidadeFiltro, setCidadeFiltro] = useState("todas");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [entregadorId, setEntregadorId] = useState("");

  const { data: pedidos = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-pedidos-entregadores"],
    queryFn: async () => {
      const limite = new Date(Date.now() - 90 * 86400_000).toISOString();
      const { data, error } = await supabase
        .from("pedidos")
        .select("id,created_at,nome_cliente,cliente_nome,status,metodo_entrega,metodo_pagamento,tipo_cartao,valor_total,total,endereco_cidade,endereco_rua,endereco_numero,endereco_bairro,endereco_complemento,endereco_referencia,endereco_cep,endereco,horario_recebimento")
        .eq("metodo_entrega", "entrega")
        .gte("created_at", limite)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as PedidoRota[];
    },
    staleTime: 15_000,
    refetchInterval: 60_000,
  });

  const { data: entregadores = [] } = useQuery({
    queryKey: ["admin-entregadores-resumo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregadores").select("id,nome,telefone,ativo").eq("ativo", true).order("nome");
      if (error) throw error;
      return (data ?? []) as Entregador[];
    },
  });

  const diaValido = diaDaSemana(data) === (rota === "terca" ? 2 : 5);
  const daRota = useMemo(() =>
    diaValido ? pedidos.filter((p) => pedidoDaRota(p, rota, data)) : [],
    [pedidos, rota, data, diaValido],
  );
  const cidades = useMemo(() =>
    [...new Set(daRota.map((p) => String(p.endereco_cidade ?? "").trim()))]
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [daRota],
  );
  const visiveis = useMemo(() =>
    daRota.filter((p) => cidadeFiltro === "todas" ||
      String(p.endereco_cidade ?? "").toLowerCase() === cidadeFiltro.toLowerCase())
      .sort((a, b) => {
        const cidade = String(a.endereco_cidade ?? "").localeCompare(String(b.endereco_cidade ?? ""), "pt-BR");
        return cidade || String(a.nome_cliente ?? "").localeCompare(String(b.nome_cliente ?? ""), "pt-BR");
      }),
    [daRota, cidadeFiltro],
  );
  const validos = visiveis.filter((p) => !enderecoIncompleto(p));
  const selecionadosNaRota = useMemo(() => daRota.filter(
    (p) => selecionados.includes(p.id) && !enderecoIncompleto(p) &&
      (cidadeFiltro === "todas" ||
        String(p.endereco_cidade ?? "").toLowerCase() === cidadeFiltro.toLowerCase()),
  ), [daRota, selecionados, cidadeFiltro]);
  const texto = useMemo(() =>
    textoResumoEntregador(selecionadosNaRota, rota, data),
    [selecionadosNaRota, rota, data],
  );

  const mudarRota = (nova: DiaRota) => {
    setRota(nova);
    setData(proximaDataRota(nova, dataHojeSaoPaulo()));
    setCidadeFiltro("todas");
    setSelecionados([]);
  };
  const mudarData = (nova: string) => { setData(nova); setSelecionados([]); };
  const mudarCidade = (nova: string) => { setCidadeFiltro(nova); setSelecionados([]); };
  const alternar = (id: string) =>
    setSelecionados((atual) => atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]);
  const selecionarVisiveis = () => setSelecionados(validos.map((p) => p.id));

  const copiar = async () => {
    if (!selecionadosNaRota.length) return;
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Resumo copiado. Cole no WhatsApp do entregador!");
    } catch {
      toast.error("Não foi possível copiar automaticamente. Selecione e copie o texto da prévia.");
    }
  };

  const compartilhar = () => {
    const motorista = entregadores.find((x) => x.id === entregadorId);
    if (!motorista) { toast.error("Selecione um entregador cadastrado."); return; }
    const telefone = String(motorista.telefone ?? "").replace(/\D/g, "");
    if (telefone.length < 10) { toast.error("O entregador precisa ter um WhatsApp válido cadastrado."); return; }
    if (!selecionadosNaRota.length) { toast.error("Selecione pelo menos uma entrega."); return; }
    const numero = telefone.startsWith("55") ? telefone : "55" + telefone;
    const link = "https://wa.me/" + numero + "?text=" + encodeURIComponent(texto);
    // Abre a mensagem preenchida; o usuário confirma o envio no WhatsApp.
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="p-4 md:p-6 max-w-[1180px] mx-auto min-h-screen space-y-6">
      <div>
        <a href="/admin/pedidos" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-700 mb-3">
          <ArrowLeft size={16} /> Voltar para Pedidos
        </a>
        <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
          <Truck size={25} /> Resumo para entregadores
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Monte a lista de entregas e envie pelo WhatsApp, sem expor valores de pedidos pagos por PIX ou link.
        </p>
      </div>

      <section className="bg-white border rounded-2xl p-4 md:p-5 space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button type="button" variant={rota === "terca" ? "default" : "outline"}
            onClick={() => mudarRota("terca")} className={rota === "terca" ? "bg-green-800 hover:bg-green-900" : ""}>
            Terça · Corupá
          </Button>
          <Button type="button" variant={rota === "sexta" ? "default" : "outline"}
            onClick={() => mudarRota("sexta")} className={rota === "sexta" ? "bg-green-800 hover:bg-green-900" : ""}>
            Sexta · Outras cidades
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="data-rota" className="text-xs font-bold text-gray-600 block mb-1">Data da entrega</label>
            <Input id="data-rota" type="date" value={data} onChange={(e) => mudarData(e.target.value)} />
          </div>
          <div>
            <label htmlFor="cidade-rota" className="text-xs font-bold text-gray-600 block mb-1">Cidade do roteiro</label>
            <select id="cidade-rota" value={cidadeFiltro} onChange={(e) => mudarCidade(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm">
              <option value="todas">Todas as cidades desta rota</option>
              {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="entregador-rota" className="text-xs font-bold text-gray-600 block mb-1">Enviar para</label>
            <select id="entregador-rota" value={entregadorId} onChange={(e) => setEntregadorId(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm">
              <option value="">Selecionar entregador...</option>
              {entregadores.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
        </div>
        {!diaValido && (
          <div className="flex gap-2 items-center text-amber-800 bg-amber-50 p-3 rounded-lg text-sm">
            <AlertTriangle size={17} className="shrink-0" />
            A data precisa cair numa {rota === "terca" ? "terça-feira" : "sexta-feira"} para esta rota.
          </div>
        )}
        <p className="text-xs text-gray-500">
          Os pedidos do site com data programada aparecem somente na data certa. Pedidos manuais sem data exigem seleção.
          Nenhum pedido é enviado automaticamente.
        </p>
      </section>

      <section className="bg-white border rounded-2xl p-4 md:p-5">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-gray-900">Pedidos para selecionar</h2>
            <p className="text-xs text-gray-500 mt-1">
              {visiveis.length} possíveis entregas · {selecionadosNaRota.length} selecionadas
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void refetch()}>Atualizar</Button>
            <Button size="sm" variant="outline" onClick={() => setSelecionados([])}>Limpar</Button>
            <Button size="sm" onClick={selecionarVisiveis} disabled={!validos.length}
              className="bg-green-800 hover:bg-green-900">Selecionar todos</Button>
          </div>
        </div>
        {isLoading && <p className="text-sm text-gray-500 py-6">Carregando pedidos...</p>}
        {error && <p className="text-sm text-red-700 py-5">Falha ao carregar pedidos. Confira sua sessão administrativa.</p>}
        {!isLoading && !error && !visiveis.length && (
          <p className="text-sm text-gray-500 py-8 text-center">
            Nenhum pedido aberto encontrado para esta data e região. Pedidos cancelados, entregues e retiradas ficam de fora.
          </p>
        )}
        <div className="divide-y">
          {visiveis.map((p) => {
            const agendada = dataEntregaProgramada(p);
            const incompleto = enderecoIncompleto(p);
            const checked = selecionados.includes(p.id) && !incompleto;
            return (
              <label key={p.id} className={"flex gap-3 p-3 rounded-lg hover:bg-gray-50 " + (incompleto ? "opacity-70" : "cursor-pointer")}>
                <input type="checkbox" checked={checked} disabled={incompleto}
                  onChange={() => alternar(p.id)} className="mt-1 w-4 h-4 accent-green-700" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{p.nome_cliente || p.cliente_nome || "Cliente sem nome"}</span>
                    <span className="text-xs text-gray-500">· {p.endereco_cidade}</span>
                    {agendada ? <span className="text-[11px] text-green-700">Programado: {agendada.split("-").reverse().join("/")}</span> :
                      <span className="text-[11px] text-amber-700">Sem data programada</span>}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{enderecoCompleto(p) || "Endereço ausente"}</p>
                  {incompleto ? <p className="text-xs text-red-600 mt-1">Preencha o endereço no pedido antes de incluir no resumo.</p> :
                    cobrancaNoMotorista(p) && <p className="text-xs text-green-800 mt-1">Cobrar: {cobrancaNoMotorista(p)}</p>}
                </div>
                {checked && <Check className="text-green-700 shrink-0 mt-1" size={17} />}
              </label>
            );
          })}
        </div>
      </section>

      <section className="bg-white border rounded-2xl p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="font-bold text-gray-900">Prévia da mensagem</h2>
            <p className="text-xs text-gray-500 mt-1">Inclui apenas os pedidos que você marcou.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!selecionadosNaRota.length} onClick={copiar}>
              <ClipboardCopy size={16} className="mr-2" /> Copiar
            </Button>
            <Button disabled={!selecionadosNaRota.length || !entregadorId} onClick={compartilhar}
              className="bg-green-800 hover:bg-green-900">
              <MessageCircle size={16} className="mr-2" /> Abrir no WhatsApp
            </Button>
          </div>
        </div>
        <textarea readOnly aria-label="Prévia do resumo para o entregador"
          className="w-full min-h-[300px] rounded-lg border p-4 bg-gray-50 text-sm leading-relaxed font-mono"
          value={selecionadosNaRota.length ? texto : "Selecione os pedidos para montar o resumo."}
          onFocus={(e) => e.target.select()} />
        <p className="text-xs text-gray-500 flex items-center gap-2">
          <CalendarDays size={14} /> O WhatsApp abre com a mensagem pronta para revisão. O envio é confirmado por você, não pelo sistema.
        </p>
      </section>
    </div>
  );
}
