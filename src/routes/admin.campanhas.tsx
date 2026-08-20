import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload, Image as ImageIcon, Send, Zap, CheckCircle2, AlertCircle,
  X, Eye, Edit, Trash2, Clock, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/campanhas")({
  component: AdminCampaignPage,
  ssr: false,
});

function AdminCampaignPage() {
  const [tabAtivo, setTabAtivo] = useState<"criar" | "historico">("criar");
  const [nomesCampanha, setNomesCampanha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "bairro" | "gasto" | "ativo">("todos");
  const [filtroBairro, setFiltroBairro] = useState<string>("");
  const [filtroGastoMin, setFiltroGastoMin] = useState<number>(0);
  const [filtroGastoMax, setFiltroGastoMax] = useState<number>(99999);
  const [clientesSelecionadosManual, setClientesSelecionadosManual] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Query para buscar clientes com dados completos
  const { data: clientes = [], isLoading: carregandoClientes } = useQuery({
    queryKey: ["clientes-para-campanha"],
    queryFn: async () => {
      // Buscar perfis
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome, telefone, email, bairro, created_at")
        .order("nome");

      // Buscar pedidos para calcular gasto total
      const { data: orders } = await supabase
        .from("pedidos")
        .select("user_id, valor_total")
        .eq("status", "entregue");

      // Mapear gastos por cliente
      const gastosPorCliente: Record<string, number> = {};
      (orders || []).forEach((order: any) => {
        if (order.user_id) {
          gastosPorCliente[order.user_id] =
            (gastosPorCliente[order.user_id] || 0) + (order.valor_total || 0);
        }
      });

      // Enriquecer perfis com dados
      return (profiles || []).map((p: any) => ({
        ...p,
        valorGasto: gastosPorCliente[p.id] || 0,
        ativo: true,
      }));
    },
    staleTime: 5 * 60_000,
  });

  // Filtrar clientes baseado nos critérios
  const clientesFiltrados = clientes.filter((c: any) => {
    // Filtro de telefone (obrigatório)
    if (!c.telefone) return false;

    // Filtros adicionais
    if (filtroTipo === "bairro" && filtroBairro) {
      return c.bairro?.toLowerCase().includes(filtroBairro.toLowerCase());
    }

    if (filtroTipo === "gasto") {
      return c.valorGasto >= filtroGastoMin && c.valorGasto <= filtroGastoMax;
    }

    if (filtroTipo === "ativo") {
      // Clientes que compraram nos últimos 30 dias
      const diasSemCompra = Math.floor(
        (new Date().getTime() - new Date(c.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return diasSemCompra <= 30;
    }

    return true; // "todos"
  });

  // Bairros únicos para dropdown
  const bairrosUnicos = Array.from(
    new Set(clientes.map((c: any) => c.bairro).filter(Boolean))
  ).sort() as string[];

  // Contatos selecionados (considerando seleção manual)
  const contatosSelecionados = clientesSelecionadosManual.size > 0
    ? Array.from(clientesSelecionadosManual)
    : clientesFiltrados.map((c: any) => c.telefone).filter(Boolean);

  // Query para histórico de campanhas
  const { data: campanhas = [], isLoading: carregandoCampanhas } = useQuery({
    queryKey: ["campanhas-historico"],
    queryFn: async () => {
      const { data } = await supabase
        .from("campanhas_whatsapp")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
    staleTime: 30_000,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máximo 5MB)");
      return;
    }

    setImagemFile(file);

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagemPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const sendMutation = useMutation({
    mutationFn: async ({
      contatosSelecionados,
      mensagem: msg,
      imagem,
    }: {
      contatosSelecionados: string[];
      mensagem: string;
      imagem: File | null;
    }) => {
      if (contatosSelecionados.length === 0) {
        throw new Error("Selecione pelo menos um contato");
      }

      if (!msg.trim()) {
        throw new Error("Digite uma mensagem");
      }

      // Upload da imagem se existir
      let imagemUrl = null;
      if (imagem) {
        const nomearquivo = `campanha-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const { error: uploadError, data } = await supabase.storage
          .from("campanhas")
          .upload(nomearquivo, imagem);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("campanhas").getPublicUrl(nomearquivo);
        imagemUrl = publicUrl;
      }

      // Salvar campanha no banco
      const { data: campanha, error: saveError } = await supabase
        .from("campanhas_whatsapp")
        .insert([
          {
            nome: nomesCampanha || `Campanha ${new Date().toLocaleDateString("pt-BR")}`,
            mensagem: msg,
            imagem_url: imagemUrl,
            status: "enviando",
            contatos_total: contatosSelecionados.length,
            contatos_enviados: 0,
            contatos_falhados: 0,
          },
        ])
        .select()
        .single();

      if (saveError) throw saveError;

      // Chamar função para enviar mensagens
      const { error: fnError } = await supabase.functions.invoke(
        "whatsapp-campanha-enviar",
        {
          body: {
            campanha_id: campanha.id,
            contatos: contatosSelecionados,
            mensagem: msg,
            imagem_url: imagemUrl,
          },
        }
      );

      if (fnError) throw fnError;

      return campanha;
    },
    onSuccess: (campanha) => {
      toast.success(
        `✓ Campanha iniciada! Enviando para ${campanha.contatos_total} contatos...`
      );
      // Reset form
      setMensagem("");
      setNomesCampanha("");
      setImagemFile(null);
      setImagemPreview(null);
      // Refresh histórico
      queryClient.invalidateQueries({ queryKey: ["campanhas-historico"] });
      // Volta pro histórico
      setTabAtivo("historico");
    },
    onError: (error: any) => {
      toast.error("Erro ao enviar campanha: " + (error.message || "Tente novamente"));
    },
  });

  const handleEnviar = async (telefones: string[]) => {
    setEnviando(true);
    try {
      await sendMutation.mutateAsync({
        contatosSelecionados: telefones,
        mensagem,
        imagem: imagemFile,
      });
    } finally {
      setEnviando(false);
    }
  };

  const toggleClienteSelecionado = (telefone: string) => {
    const novo = new Set(clientesSelecionadosManual);
    if (novo.has(telefone)) {
      novo.delete(telefone);
    } else {
      novo.add(telefone);
    }
    setClientesSelecionadosManual(novo);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#5850ec]">Campanhas WhatsApp</h1>
        <p className="text-gray-500 text-sm mt-1">
          Envie mensagens em massa com arte para seus clientes
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setTabAtivo("criar")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${
            tabAtivo === "criar"
              ? "border-[#5850ec] text-[#5850ec]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Zap className="inline mr-2" size={18} />
          Criar Campanha
        </button>
        <button
          onClick={() => setTabAtivo("historico")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${
            tabAtivo === "historico"
              ? "border-[#5850ec] text-[#5850ec]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Clock className="inline mr-2" size={18} />
          Histórico
        </button>
      </div>

      {/* TAB: Criar Campanha */}
      {tabAtivo === "criar" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Formulário */}
          <div className="space-y-6">
            {/* Nome da Campanha */}
            <div className="bg-white rounded-xl border p-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nome da Campanha (opcional)
              </label>
              <Input
                placeholder="Ex: Oferta da Semana, Black Friday, etc"
                value={nomesCampanha}
                onChange={(e) => setNomesCampanha(e.target.value)}
                className="rounded-lg border-gray-200"
              />
            </div>

            {/* Upload de Imagem */}
            <div className="bg-white rounded-xl border p-6">
              <label className="block text-sm font-bold text-gray-700 mb-4">
                Upload de Imagem
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#5850ec] hover:bg-[#5850ec]/5 transition-all"
              >
                {imagemPreview ? (
                  <div className="space-y-3">
                    <ImageIcon className="mx-auto text-green-500" size={40} />
                    <p className="text-sm font-bold text-gray-700">
                      Imagem selecionada!
                    </p>
                    <p className="text-xs text-gray-500">{imagemFile?.name}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagemPreview(null);
                        setImagemFile(null);
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="mx-auto text-gray-400" size={40} />
                    <div>
                      <p className="text-sm font-bold text-gray-700">
                        Clique para upload ou arraste
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG até 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Mensagem */}
            <div className="bg-white rounded-xl border p-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Mensagem
              </label>
              <Textarea
                placeholder="Digite a mensagem que será enviada..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="rounded-lg border-gray-200 min-h-[150px] resize-none"
              />
              <div className="mt-2 text-xs text-gray-500">
                {mensagem.length} caracteres
              </div>
            </div>

            {/* Seleção de Clientes */}
            <div className="bg-white rounded-xl border p-6">
              <label className="block text-sm font-bold text-gray-700 mb-4">
                Filtrar Clientes ({contatosSelecionados.length})
              </label>

              {/* Tabs de Filtro */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {[
                  { id: "todos", label: "Todos" },
                  { id: "bairro", label: "Por Bairro" },
                  { id: "gasto", label: "Por Gasto" },
                  { id: "ativo", label: "Ativos 30d" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setFiltroTipo(tab.id as any);
                      setClientesSelecionadosManual(new Set()); // Reset seleção manual
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                      filtroTipo === tab.id
                        ? "bg-[#5850ec] text-white border-[#5850ec]"
                        : "border-gray-200 text-gray-600 hover:border-[#5850ec]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Opções de Filtro */}
              {filtroTipo === "bairro" && (
                <div className="mb-4">
                  <select
                    value={filtroBairro}
                    onChange={(e) => setFiltroBairro(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium"
                  >
                    <option value="">Selecione um bairro...</option>
                    {bairrosUnicos.map((bairro) => (
                      <option key={bairro} value={bairro}>
                        {bairro}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {filtroTipo === "gasto" && (
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">
                      Gasto Mínimo (R$)
                    </label>
                    <input
                      type="number"
                      value={filtroGastoMin}
                      onChange={(e) => setFiltroGastoMin(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">
                      Gasto Máximo (R$)
                    </label>
                    <input
                      type="number"
                      value={filtroGastoMax}
                      onChange={(e) => setFiltroGastoMax(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Prévia dos Clientes */}
              {carregandoClientes ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Carregando clientes...
                </div>
              ) : clientesFiltrados.length > 0 ? (
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {clientesFiltrados.slice(0, 10).map((cliente: any) => (
                    <label
                      key={cliente.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          clientesSelecionadosManual.size === 0 ||
                          clientesSelecionadosManual.has(cliente.telefone)
                        }
                        onChange={() => {
                          // Quando clica em um checkbox, ativa seleção manual
                          if (clientesSelecionadosManual.size === 0) {
                            // Se era "todos", copia todos os selecionados
                            const todosSelecionados = new Set(
                              clientesFiltrados.map((c: any) => c.telefone)
                            );
                            // Remove o atual clicado
                            todosSelecionados.delete(cliente.telefone);
                            setClientesSelecionadosManual(todosSelecionados);
                          } else {
                            toggleClienteSelecionado(cliente.telefone);
                          }
                        }}
                        className="h-4 w-4 rounded cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {cliente.nome}
                        </p>
                        <p className="text-xs text-gray-500">
                          {cliente.bairro} • R${cliente.valorGasto.toFixed(2)}
                        </p>
                      </div>
                    </label>
                  ))}
                  {clientesFiltrados.length > 10 && (
                    <div className="text-xs text-gray-500 text-center py-2 border-t">
                      +{clientesFiltrados.length - 10} clientes não exibidos
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Nenhum cliente encontrado com esses filtros
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={() => handleEnviar(contatosSelecionados)}
                  disabled={
                    enviando ||
                    contatosSelecionados.length === 0 ||
                    !mensagem.trim()
                  }
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2"
                >
                  {enviando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Enviar para {contatosSelecionados.length} cliente(s)
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  {clientesSelecionadosManual.size === 0
                    ? `Enviará para todos os ${contatosSelecionados.length} clientes do filtro`
                    : `Seleção manual: ${contatosSelecionados.length} cliente(s)`}
                </p>
              </div>
            </div>
          </div>

          {/* Preview Lateral */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-6 sticky top-6">
              <h3 className="font-bold text-gray-800 mb-4">Pré-visualização</h3>

              {/* Celular */}
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-3 border-8 border-gray-900 aspect-video flex flex-col">
                <div className="bg-gray-900 rounded-t-2xl px-4 py-2 flex justify-between items-center text-white text-xs">
                  <span>Saborosamente</span>
                  <span>9:41</span>
                </div>

                <div className="flex-1 bg-gradient-to-b from-gray-100 to-white rounded-b-2xl p-3 overflow-hidden flex flex-col">
                  {/* Mensagem */}
                  <div className="bg-[#5850ec] text-white rounded-xl rounded-tr-none p-2 text-xs mb-2 break-words max-w-[80%]">
                    {mensagem || "Sua mensagem aparecerá aqui..."}
                  </div>

                  {/* Imagem */}
                  {imagemPreview && (
                    <div className="rounded-xl overflow-hidden mb-2 max-w-[80%]">
                      <img
                        src={imagemPreview}
                        alt="Preview"
                        className="w-full h-auto max-h-24 object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={14} />
                  <span>
                    {contatosSelecionados.length} clientes selecionados
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Histórico */}
      {tabAtivo === "historico" && (
        <div className="space-y-4">
          {carregandoCampanhas ? (
            <div className="text-center py-12 text-gray-500">
              Carregando histórico...
            </div>
          ) : campanhas.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Clock className="mx-auto text-gray-300 mb-4" size={40} />
              <p className="text-gray-500">Nenhuma campanha enviada ainda</p>
            </div>
          ) : (
            campanhas.map((campanha: any) => (
              <div
                key={campanha.id}
                className="bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{campanha.nome}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {campanha.mensagem}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>
                      📅{" "}
                      {new Date(campanha.created_at).toLocaleDateString(
                        "pt-BR",
                        { dateStyle: "short", timeStyle: "short" }
                      )}
                    </span>
                    <span>
                      📨 {campanha.contatos_total} contatos
                    </span>
                    <span>
                      ✓ {campanha.contatos_enviados} enviados
                    </span>
                    {campanha.contatos_falhados > 0 && (
                      <span className="text-red-600">
                        ✗ {campanha.contatos_falhados} falhados
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                      campanha.status === "enviada"
                        ? "bg-green-100 text-green-700"
                        : campanha.status === "enviando"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {campanha.status === "enviada" && (
                      <CheckCircle2 size={14} />
                    )}
                    {campanha.status === "enviando" && (
                      <Clock size={14} className="animate-spin" />
                    )}
                    {campanha.status === "erro" && <AlertCircle size={14} />}
                    {campanha.status.charAt(0).toUpperCase() +
                      campanha.status.slice(1)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
