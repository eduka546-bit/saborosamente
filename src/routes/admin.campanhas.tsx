import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  Image as ImageIcon,
  Send,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Edit,
  Trash2,
  Clock,
  Users,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/campanhas")({
  component: AdminCampaignPage,
  ssr: false,
});

// Tarifa de lista da Meta para template de Marketing entregue a destinatários
// no Brasil. A cobrança efetiva continua sendo a apurada pela Meta.
const TARIFA_MARKETING_BR = 0.3217;

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AdminCampaignPage() {
  const [tabAtivo, setTabAtivo] = useState<"criar" | "contatos" | "historico" | "templates">("criar");
  const [nomesCampanha, setNomesCampanha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [midiaTipo, setMidiaTipo] = useState<"imagem" | "video" | "nenhuma">("nenhuma");
  const [enviando, setEnviando] = useState(false);
  const [mostrarListaCompleta, setMostrarListaCompleta] = useState(false);
  const [contatosEditaveis, setContatosEditaveis] = useState<string[]>([]);
  const [campanhaDetalhes, setCampanhaDetalhes] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const templateImageInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

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

  // Query para listas de contatos
  const {
    data: listas = [],
    isLoading: carregandoListas,
    refetch: refetchListas,
  } = useQuery({
    queryKey: ["listas-contatos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("listas_contatos")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("Listas carregadas:", data); // Debug
      return data || [];
    },
    staleTime: 5000, // Reduzir para sempre carregar fresco
    refetchOnWindowFocus: true, // Refetch quando voltar à janela
    refetchOnMount: true, // Refetch ao montar
  });

  // Estado para gerenciar listas
  const [novaListaNome, setNovaListaNome] = useState("");
  const [novaListaDescricao, setNovaListaDescricao] = useState("");
  const [listaEditando, setListaEditando] = useState<any>(null);
  const [contatosLista, setContatosLista] = useState<any[]>([]);
  const listaInputRef = useRef<HTMLInputElement>(null);
  const [listaCarregada, setListaCarregada] = useState<string | null>(null);

  // Estado para templates
  const [templateSelecionado, setTemplateSelecionado] = useState<any>(null);
  const [templateVariaveis, setTemplateVariaveis] = useState<string[]>([]);
  const [usarTemplate, setUsarTemplate] = useState(false);
  const [novoTemplate, setNovoTemplate] = useState({
    name: "",
    category: "MARKETING",
    header: "",
    headerType: "NONE",
    body: "",
    footer: "",
    variableExamples: [] as string[],
  });
  const [imagemModelo, setImagemModelo] = useState<File | null>(null);

  // Query para buscar templates aprovados da Meta
  const {
    data: templates = [],
    isLoading: carregandoTemplates,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("whatsapp-templates");
      if (error) throw error;
      return data?.templates || [];
    },
    staleTime: 5 * 60_000,
    enabled: false, // Só busca quando o usuário quiser
  });

  const criarTemplateMutation = useMutation({
    mutationFn: async () => {
      let sampleImageUrl: string | undefined;
      if (novoTemplate.headerType === "IMAGE") {
        if (!imagemModelo) throw new Error("Escolha uma imagem de exemplo para o cabeçalho.");
        if (!imagemModelo.type.match(/^image\/(jpeg|png)$/) || imagemModelo.size > 5 * 1024 * 1024) {
          throw new Error("Use uma imagem JPG ou PNG de até 5 MB.");
        }
        const extension = imagemModelo.type === "image/png" ? "png" : "jpg";
        const path = `template-sample-${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("campanhas").upload(path, imagemModelo, { upsert: false, contentType: imagemModelo.type });
        if (uploadError) throw uploadError;
        sampleImageUrl = supabase.storage.from("campanhas").getPublicUrl(path).data.publicUrl;
      }
      const { data, error } = await supabase.functions.invoke("whatsapp-templates", {
        method: "POST",
        body: { action: "create", template: { ...novoTemplate, language: "pt_BR", sampleImageUrl } },
      });
      if (error) {
        const response = error.context instanceof Response ? await error.context.json().catch(() => null) : null;
        throw new Error(response?.error || error.message || "Não foi possível enviar o template.");
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: async () => {
      toast.success("Template enviado para aprovação da Meta.");
      setNovoTemplate({ name: "", category: "MARKETING", header: "", headerType: "NONE", body: "", footer: "", variableExamples: [] });
      setImagemModelo(null);
      await refetchTemplates();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Query para envios da campanha selecionada (tempo real)
  const { data: enviosCampanha = [], refetch: refetchEnvios } = useQuery({
    queryKey: ["envios-campanha", campanhaDetalhes],
    queryFn: async () => {
      if (!campanhaDetalhes) return [];
      const { data } = await supabase
        .from("campanhas_whatsapp_envios")
        .select("*")
        .eq("campanha_id", campanhaDetalhes)
        .order("created_at");
      return data || [];
    },
    enabled: !!campanhaDetalhes,
    refetchInterval: campanhaDetalhes ? 3000 : false, // Atualiza a cada 3s
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máximo 5MB)");
      return;
    }

    setImagemFile(file);
    setMidiaTipo("imagem");
    setVideoFile(null);
    setVideoPreview(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagemPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Por favor, selecione um vídeo válido");
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      toast.error("Vídeo muito grande (máximo 16MB)");
      return;
    }

    setVideoFile(file);
    setMidiaTipo("video");
    setImagemFile(null);
    setImagemPreview(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setVideoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImportarCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const linhas = csv.split("\n").filter((l) => l.trim());

        // Remove header se houver
        let contatos = linhas;
        if (
          linhas.length > 0 &&
          (linhas[0].toLowerCase().includes("telefone") ||
            linhas[0].toLowerCase().includes("phone"))
        ) {
          contatos = linhas.slice(1);
        }

        // Parse telefones (remove tudo que não é número)
        const telefonesParsed = contatos
          .map((l) => {
            const match = l.match(/\d+/g);
            return match ? match.join("") : "";
          })
          .filter((t) => t.length >= 10 && t.length <= 15);

        if (telefonesParsed.length === 0) {
          toast.error("Nenhum telefone válido encontrado no CSV");
          return;
        }

        // Adicionar aos contatos existentes (evitar duplicatas)
        const contatosAtualizado = Array.from(new Set([...contatosEditaveis, ...telefonesParsed]));
        setContatosEditaveis(contatosAtualizado);
        toast.success(`✓ Importados ${telefonesParsed.length} contatos`);
      } catch (err) {
        toast.error("Erro ao processar CSV");
      }
    };
    reader.readAsText(file);
  };

  // Funções para gerenciar listas
  const criarNovaLista = async () => {
    if (!novaListaNome.trim()) {
      toast.error("Digite o nome da lista");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("listas_contatos")
        .insert([
          {
            nome: novaListaNome,
            descricao: novaListaDescricao,
            quantidade_contatos: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setNovaListaNome("");
      setNovaListaDescricao("");
      toast.success("Lista criada com sucesso!");
      refetchListas();
    } catch (err) {
      toast.error("Erro ao criar lista");
    }
  };

  const carregarContatosLista = async (listaId: string) => {
    try {
      const { data } = await supabase
        .from("contatos_lista")
        .select("*")
        .eq("lista_id", listaId)
        .order("created_at");

      setContatosLista(data || []);
      setListaEditando(listaId);
    } catch (err) {
      toast.error("Erro ao carregar contatos");
    }
  };

  const adicionarContatoALista = async (listaId: string, telefone: string, nome?: string) => {
    if (!telefone.trim()) {
      toast.error("Digite um telefone");
      return;
    }

    try {
      const { error } = await supabase.from("contatos_lista").insert([
        {
          lista_id: listaId,
          telefone: telefone.replace(/\D/g, ""),
          nome: nome || null,
        },
      ]);

      if (error) throw error;

      // Recarregar e atualizar quantidade
      await carregarContatosLista(listaId);

      // Atualizar quantidade na lista
      const { count } = await supabase
        .from("contatos_lista")
        .select("*", { count: "exact", head: true })
        .eq("lista_id", listaId);

      if (count !== null) {
        await supabase
          .from("listas_contatos")
          .update({ quantidade_contatos: count })
          .eq("id", listaId);

        refetchListas();
      }

      toast.success("Contato adicionado!");
    } catch (err) {
      toast.error("Erro ao adicionar contato");
    }
  };

  const removerContatoDaLista = async (contatoId: string, listaId: string) => {
    try {
      const { error } = await supabase.from("contatos_lista").delete().eq("id", contatoId);

      if (error) throw error;

      await carregarContatosLista(listaId);

      // Atualizar quantidade
      const { count } = await supabase
        .from("contatos_lista")
        .select("*", { count: "exact", head: true })
        .eq("lista_id", listaId);

      if (count !== null) {
        await supabase
          .from("listas_contatos")
          .update({ quantidade_contatos: count })
          .eq("id", listaId);

        refetchListas();
      }

      toast.success("Contato removido!");
    } catch (err) {
      toast.error("Erro ao remover contato");
    }
  };

  const editarContatoDaLista = async (
    contatoId: string,
    novoTelefone: string,
    novoNome: string,
  ) => {
    try {
      const { error } = await supabase
        .from("contatos_lista")
        .update({
          telefone: novoTelefone.replace(/\D/g, ""),
          nome: novoNome || null,
        })
        .eq("id", contatoId);

      if (error) throw error;

      await carregarContatosLista(listaEditando!);
      toast.success("Contato atualizado!");
    } catch (err) {
      toast.error("Erro ao atualizar contato");
    }
  };

  const deletarLista = async (listaId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar esta lista?")) return;

    try {
      const { error } = await supabase.from("listas_contatos").delete().eq("id", listaId);

      if (error) throw error;

      setListaEditando(null);
      setContatosLista([]);
      toast.success("Lista deletada!");
      refetchListas();
    } catch (err) {
      toast.error("Erro ao deletar lista");
    }
  };

  const sendMutation = useMutation({
    mutationFn: async ({
      contatosSelecionados,
      mensagem: msg,
      imagem,
      video,
      tipo_midia,
    }: {
      contatosSelecionados: string[];
      mensagem: string;
      imagem: File | null;
      video: File | null;
      tipo_midia: "imagem" | "video" | "nenhuma";
    }) => {
      if (contatosSelecionados.length === 0) {
        throw new Error("Selecione pelo menos um contato");
      }

      if (!msg.trim()) {
        throw new Error("Digite uma mensagem");
      }

      if (!usarTemplate || !templateSelecionado) {
        throw new Error(
          "Selecione um template aprovado da Meta para enviar a contatos que ainda não falaram com você",
        );
      }

      if (templateVariaveis.some((variavel) => !variavel.trim())) {
        throw new Error("Preencha todas as variáveis do template antes de enviar");
      }

      if (templateSelecionado.headerFormat === "IMAGE" && !imagemFile) {
        throw new Error("Este template exige uma imagem no cabeçalho. Selecione-a em Upload de Mídia.");
      }

      let imagemUrl = null;
      let videoUrl = null;

      // Upload de imagem
      if (imagem) {
        const nomearquivo = `campanha-img-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const { error: uploadError, data } = await supabase.storage
          .from("campanhas")
          .upload(nomearquivo, imagem);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("campanhas").getPublicUrl(nomearquivo);
        imagemUrl = publicUrl;
      }

      // Upload de vídeo
      if (video) {
        const nomearquivo = `campanha-vid-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;
        const { error: uploadError, data } = await supabase.storage
          .from("campanhas")
          .upload(nomearquivo, video);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("campanhas").getPublicUrl(nomearquivo);
        videoUrl = publicUrl;
      }

      const { data: campanha, error: saveError } = await supabase
        .from("campanhas_whatsapp")
        .insert([
          {
            nome: nomesCampanha || `Campanha ${new Date().toLocaleDateString("pt-BR")}`,
            mensagem: msg,
            imagem_url: imagemUrl,
            video_url: videoUrl,
            midia_tipo: tipo_midia,
            status: "enviando",
            contatos_total: contatosSelecionados.length,
            contatos_enviados: 0,
            contatos_falhados: 0,
          },
        ])
        .select()
        .single();

      if (saveError) throw saveError;

      const { error: fnError } = await supabase.functions.invoke("whatsapp-campanha-enviar", {
        body: {
          campanha_id: campanha.id,
          contatos: contatosSelecionados,
          mensagem: msg,
          imagem_url: imagemUrl,
          video_url: videoUrl,
          midia_tipo: tipo_midia,
          template:
            usarTemplate && templateSelecionado
              ? {
                  name: templateSelecionado.name,
                  language: templateSelecionado.language,
                  variaveis: templateVariaveis,
                  headerFormat: templateSelecionado.headerFormat,
                }
              : null,
        },
      });

      if (fnError) throw fnError;

      return campanha;
    },
    onSuccess: (campanha) => {
      toast.success(`✓ Campanha iniciada! Enviando para ${campanha.contatos_total} contatos...`);
      setMensagem("");
      setNomesCampanha("");
      setImagemFile(null);
      setImagemPreview(null);
      setVideoFile(null);
      setVideoPreview(null);
      setMidiaTipo("nenhuma");
      setTemplateSelecionado(null);
      setTemplateVariaveis([]);
      setUsarTemplate(false);
      queryClient.invalidateQueries({ queryKey: ["campanhas-historico"] });
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
        video: videoFile,
        tipo_midia: midiaTipo,
      });
    } finally {
      setEnviando(false);
    }
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
          onClick={() => setTabAtivo("contatos")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${
            tabAtivo === "contatos"
              ? "border-[#5850ec] text-[#5850ec]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="inline mr-2" size={18} />
          Contatos
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
        <button
          onClick={() => {
            setTabAtivo("templates");
            refetchTemplates();
          }}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${
            tabAtivo === "templates"
              ? "border-[#5850ec] text-[#5850ec]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <CheckCircle2 className="inline mr-2" size={18} />
          Templates Meta
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

            {/* Upload de Imagem ou Vídeo */}
            <div className="bg-white rounded-xl border p-6">
              <label className="block text-sm font-bold text-gray-700 mb-4">Upload de Mídia</label>

              {/* Tabs para Imagem/Vídeo */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setMidiaTipo("imagem");
                    setVideoFile(null);
                    setVideoPreview(null);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                    midiaTipo === "imagem"
                      ? "bg-[#5850ec] text-white border-[#5850ec]"
                      : "border-gray-200 text-gray-600 hover:border-[#5850ec]"
                  }`}
                >
                  📷 Imagem
                </button>
                <button
                  onClick={() => {
                    setMidiaTipo("video");
                    setImagemFile(null);
                    setImagemPreview(null);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                    midiaTipo === "video"
                      ? "bg-[#5850ec] text-white border-[#5850ec]"
                      : "border-gray-200 text-gray-600 hover:border-[#5850ec]"
                  }`}
                >
                  🎥 Vídeo
                </button>
                <button
                  onClick={() => {
                    setMidiaTipo("nenhuma");
                    setImagemFile(null);
                    setImagemPreview(null);
                    setVideoFile(null);
                    setVideoPreview(null);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                    midiaTipo === "nenhuma"
                      ? "bg-[#5850ec] text-white border-[#5850ec]"
                      : "border-gray-200 text-gray-600 hover:border-[#5850ec]"
                  }`}
                >
                  📝 Só Texto
                </button>
              </div>

              {/* Upload Imagem */}
              {midiaTipo === "imagem" && (
                <div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#5850ec] hover:bg-[#5850ec]/5 transition-all"
                  >
                    {imagemPreview ? (
                      <div className="space-y-3">
                        <ImageIcon className="mx-auto text-green-500" size={40} />
                        <p className="text-sm font-bold text-gray-700">Imagem selecionada!</p>
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
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
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
              )}

              {/* Upload Vídeo */}
              {midiaTipo === "video" && (
                <div>
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#5850ec] hover:bg-[#5850ec]/5 transition-all"
                  >
                    {videoPreview ? (
                      <div className="space-y-3">
                        <ImageIcon className="mx-auto text-green-500" size={40} />
                        <p className="text-sm font-bold text-gray-700">Vídeo selecionado!</p>
                        <p className="text-xs text-gray-500">{videoFile?.name}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVideoPreview(null);
                            setVideoFile(null);
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
                          <p className="text-xs text-gray-500 mt-1">MP4 até 16MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Mensagem */}
            <div className="bg-white rounded-xl border p-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Mensagem</label>
              <Textarea
                placeholder="Digite a mensagem que será enviada..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="rounded-lg border-gray-200 min-h-[150px] resize-none"
              />
              <div className="mt-2 text-xs text-gray-500">{mensagem.length} caracteres</div>
            </div>

            {/* Templates WhatsApp */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700">Template WhatsApp</label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Use templates para alcançar clientes que nunca conversaram com você
                  </p>
                </div>
                <button
                  onClick={() => {
                    setUsarTemplate(!usarTemplate);
                    if (!usarTemplate && templates.length === 0) refetchTemplates();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    usarTemplate
                      ? "bg-[#5850ec] text-white border-[#5850ec]"
                      : "border-gray-200 text-gray-600 hover:border-[#5850ec]"
                  }`}
                >
                  {usarTemplate ? "✓ Ativado" : "Usar Template"}
                </button>
              </div>

              {usarTemplate && (
                <div className="space-y-4">
                  {/* Botão buscar templates */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => refetchTemplates()}
                      disabled={carregandoTemplates}
                      className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                    >
                      {carregandoTemplates ? "Buscando..." : "🔄 Buscar Templates"}
                    </button>
                    <span className="text-xs text-gray-500 self-center">
                      {templates.filter((t: any) => t.status === "APPROVED").length > 0
                        ? `${templates.filter((t: any) => t.status === "APPROVED").length} templates aprovados`
                        : "Nenhum template aprovado encontrado"}
                    </span>
                  </div>

                  {/* Dropdown de templates */}
                  {templates.length > 0 && (
                    <select
                      value={templateSelecionado?.name || ""}
                      onChange={(e) => {
                        const t = templates.find((t: any) => t.name === e.target.value);
                        setTemplateSelecionado(t || null);
                        setTemplateVariaveis(t ? Array(t.numVars).fill("") : []);
                        if (t) setMensagem(t.body);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium"
                    >
                      <option value="">Selecione um template...</option>
                      {templates
                        .filter((t: any) => t.status === "APPROVED")
                        .map((t: any) => (
                          <option key={t.name} value={t.name}>
                            {t.name} ({t.language}) — {t.status}
                          </option>
                        ))}
                    </select>
                  )}

                  {/* Preview e variáveis do template */}
                  {templateSelecionado && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {templateSelecionado.header && (
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          Header: {templateSelecionado.header}
                        </p>
                      )}
                      <div className="bg-white rounded-lg p-3 border text-sm text-gray-800 whitespace-pre-wrap">
                        {templateSelecionado.body}
                      </div>
                      {templateSelecionado.footer && (
                        <p className="text-xs text-gray-400">{templateSelecionado.footer}</p>
                      )}

                      {/* Campos para variáveis */}
                      {templateSelecionado.numVars > 0 && (
                        <div className="space-y-2 pt-2 border-t">
                          <p className="text-xs font-bold text-gray-600">
                            Preencha as variáveis ({templateSelecionado.numVars} no total):
                          </p>
                          {Array.from({ length: templateSelecionado.numVars }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#5850ec] w-8">{`{{${i + 1}}}`}</span>
                              <Input
                                placeholder={
                                  templateSelecionado.varExamples?.[i] || `Valor ${i + 1}`
                                }
                                value={templateVariaveis[i] || ""}
                                onChange={(e) => {
                                  const novo = [...templateVariaveis];
                                  novo[i] = e.target.value;
                                  setTemplateVariaveis(novo);
                                }}
                                className="text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!templateSelecionado && templates.length > 0 && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">
                      ⚠️ Selecione um template para enviar para clientes sem histórico de conversa
                    </p>
                  )}
                </div>
              )}

              {!usarTemplate && (
                <p className="text-xs text-gray-400">
                  Sem template: só envia para clientes que conversaram nas últimas 24h
                </p>
              )}
            </div>

            {/* Seleção de Lista Salva */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-bold text-gray-700">
                  Ou carregar uma Lista Salva
                </label>
                <button
                  onClick={() => refetchListas()}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  title="Atualizar listas"
                >
                  🔄 Atualizar
                </button>
              </div>

              {carregandoListas ? (
                <div className="text-center text-gray-500 text-sm py-3">Carregando listas...</div>
              ) : listas.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-3">Nenhuma lista criada</div>
              ) : (
                <>
                  <select
                    value={listaCarregada || ""}
                    onChange={async (e) => {
                      if (!e.target.value) {
                        setListaCarregada(null);
                        setContatosEditaveis([]);
                        return;
                      }

                      setListaCarregada(e.target.value);
                      const { data } = await supabase
                        .from("contatos_lista")
                        .select("telefone")
                        .eq("lista_id", e.target.value);

                      if (data && data.length > 0) {
                        const telefones = data.map((c: any) => c.telefone).filter(Boolean);
                        setContatosEditaveis(telefones);
                        toast.success(`✓ ${telefones.length} contatos carregados!`);
                      } else {
                        setContatosEditaveis([]);
                        toast.error("Nenhum contato encontrado nessa lista");
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium"
                  >
                    <option value="">Selecione uma lista...</option>
                    {listas.map((lista: any) => (
                      <option key={lista.id} value={lista.id}>
                        {lista.nome} ({lista.quantidade_contatos} contatos)
                      </option>
                    ))}
                  </select>
                  {listaCarregada && (
                    <button
                      onClick={() => {
                        setListaCarregada(null);
                        setContatosEditaveis([]);
                      }}
                      className="mt-2 text-xs text-gray-500 hover:text-red-600"
                    >
                      ✕ Limpar seleção
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Info Box - Lista Carregada */}
            {listaCarregada && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-blue-700 mb-1">✓ LISTA CARREGADA</p>
                    <p className="text-lg font-bold text-blue-900">
                      {listas.find((l: any) => l.id === listaCarregada)?.nome}
                    </p>
                    <p className="text-sm text-blue-700 mt-2">
                      {listas.find((l: any) => l.id === listaCarregada)?.quantidade_contatos ||
                        contatosEditaveis.length}{" "}
                      contatos prontos para enviar
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setListaCarregada(null);
                      setContatosEditaveis([]);
                    }}
                    className="px-3 py-1 text-xs font-bold text-blue-700 border border-blue-300 rounded hover:bg-blue-100"
                  >
                    Trocar Lista
                  </button>
                </div>
              </div>
            )}

            {/* Seleção de Clientes - Apenas se nenhuma lista carregada */}
            {/* Lista Completa de Clientes - Expansível */}
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => setMostrarListaCompleta(!mostrarListaCompleta)}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 font-bold text-sm text-gray-700 transition-all flex items-center justify-between"
              >
                <span>📋 Ver/Editar Lista Completa ({contatosEditaveis.length})</span>
                <span
                  className={`transform transition-transform ${mostrarListaCompleta ? "rotate-180" : ""}`}
                >
                  ▼
                </span>
              </button>

              {mostrarListaCompleta && (
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {contatosEditaveis.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum contato selecionado
                    </p>
                  ) : (
                    <>
                      {contatosEditaveis.map((tel, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200 hover:border-gray-300"
                        >
                          <span className="text-xs font-bold text-gray-500 w-6">{idx + 1}.</span>
                          <input
                            type="text"
                            value={tel}
                            onChange={(e) => {
                              const novo = [...contatosEditaveis];
                              novo[idx] = e.target.value;
                              setContatosEditaveis(novo);
                            }}
                            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#5850ec]"
                            placeholder="Telefone com DDD"
                          />
                          <button
                            onClick={() => {
                              setContatosEditaveis(contatosEditaveis.filter((_, i) => i !== idx));
                            }}
                            className="px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {/* Botão para adicionar novo */}
                      <button
                        onClick={() => setContatosEditaveis([...contatosEditaveis, ""])}
                        className="w-full mt-3 px-3 py-2 text-xs font-bold text-[#5850ec] border border-dashed border-[#5850ec] rounded-lg hover:bg-[#5850ec]/5 transition-colors"
                      >
                        + Adicionar Contato
                      </button>

                      {/* Copiar/Colar/Importar CSV */}
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        <p className="text-xs font-bold text-gray-600 mb-2">Importar/Exportar:</p>

                        {/* Botão Importar CSV */}
                        <button
                          onClick={() => csvInputRef.current?.click()}
                          className="w-full px-3 py-1.5 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                        >
                          📥 Importar CSV
                        </button>
                        <input
                          ref={csvInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleImportarCSV}
                          className="hidden"
                        />

                        {/* TextArea Copiar/Colar */}
                        <textarea
                          value={contatosEditaveis.join("\n")}
                          onChange={(e) =>
                            setContatosEditaveis(
                              e.target.value
                                .split("\n")
                                .map((t) => t.trim())
                                .filter(Boolean),
                            )
                          }
                          placeholder="Cole um telefone por linha..."
                          className="w-full px-2 py-2 text-xs border border-gray-200 rounded font-mono focus:outline-none focus:ring-1 focus:ring-[#5850ec]"
                          rows={4}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(contatosEditaveis.join("\n"));
                            toast.success("Copiado para clipboard!");
                          }}
                          className="mt-2 w-full px-3 py-1.5 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                        >
                          📋 Copiar Lista
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Botão de Enviar */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={() => handleEnviar(contatosEditaveis.filter((t) => t.trim()))}
                disabled={
                  enviando ||
                  contatosEditaveis.filter((t) => t.trim()).length === 0 ||
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
                    Enviar para {contatosEditaveis.filter((t) => t.trim()).length} cliente(s)
                  </>
                )}
              </Button>
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

                  {/* Vídeo */}
                  {videoPreview && (
                    <div className="rounded-xl overflow-hidden mb-2 max-w-[80%]">
                      <video
                        src={videoPreview}
                        className="w-full h-auto max-h-24 object-cover bg-black"
                        controls
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={14} />
                  <span>{contatosEditaveis.filter((t) => t.trim()).length} clientes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Templates Meta */}
      {tabAtivo === "templates" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="bg-white rounded-xl border p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="font-bold text-gray-900">Templates cadastrados na Meta</h2>
                <p className="text-sm text-gray-500 mt-1">A aprovação costuma levar alguns minutos. Só templates aprovados podem iniciar conversas.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchTemplates()} disabled={carregandoTemplates}>
                {carregandoTemplates ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
            {carregandoTemplates ? (
              <p className="text-sm text-gray-500 py-8 text-center">Consultando a Meta...</p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">Nenhum template encontrado ainda.</p>
            ) : (
              <div className="space-y-3">
                {templates.map((template: any) => (
                  <article key={`${template.name}-${template.language}`} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-sm text-gray-900">{template.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{template.category} · {template.language}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        template.status === "APPROVED" ? "bg-green-100 text-green-700" :
                        template.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      }`}>{template.status}</span>
                    </div>
                    {template.header && <p className="text-xs font-semibold text-gray-600 mt-3">{template.header}</p>}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{template.body}</p>
                    {template.footer && <p className="text-xs text-gray-400 mt-2">{template.footer}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-xl border p-6 h-fit">
            <h2 className="font-bold text-gray-900">Novo template</h2>
            <p className="text-sm text-gray-500 mt-1 mb-5">Crie a versão de texto para enviar à aprovação da Meta.</p>
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); criarTemplateMutation.mutate(); }}>
              <div>
                <label className="text-xs font-bold text-gray-700">Nome técnico</label>
                <Input value={novoTemplate.name} onChange={(e) => setNovoTemplate((draft) => ({ ...draft, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") }))} placeholder="oferta_semana_setembro" className="mt-1" required />
                <p className="text-xs text-gray-400 mt-1">Apenas minúsculas, números e _.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Categoria</label>
                <select value={novoTemplate.category} onChange={(e) => setNovoTemplate((draft) => ({ ...draft, category: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utilidade</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Cabeçalho</label>
                <select value={novoTemplate.headerType} onChange={(e) => setNovoTemplate((draft) => ({ ...draft, headerType: e.target.value, header: e.target.value === "TEXT" ? draft.header : "" }))} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="NONE">Sem cabeçalho</option>
                  <option value="TEXT">Texto</option>
                  <option value="IMAGE">Imagem</option>
                </select>
              </div>
              {novoTemplate.headerType === "TEXT" && (
                <div>
                  <label className="text-xs font-bold text-gray-700">Texto do cabeçalho</label>
                  <Input value={novoTemplate.header} onChange={(e) => setNovoTemplate((draft) => ({ ...draft, header: e.target.value }))} maxLength={60} className="mt-1" required />
                </div>
              )}
              {novoTemplate.headerType === "IMAGE" && (
                <div>
                  <label className="text-xs font-bold text-gray-700">Imagem de exemplo</label>
                  <input ref={templateImageInputRef} type="file" accept="image/jpeg,image/png" onChange={(e) => setImagemModelo(e.target.files?.[0] || null)} className="hidden" />
                  <button type="button" onClick={() => templateImageInputRef.current?.click()} className="w-full mt-1 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-600 hover:border-[#5850ec]">
                    {imagemModelo ? `✓ ${imagemModelo.name}` : "Selecionar imagem JPG ou PNG (até 5 MB)"}
                  </button>
                  <p className="text-xs text-gray-400 mt-1">A Meta usa esta imagem apenas como amostra na aprovação. Na campanha, você escolhe a imagem que será enviada.</p>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-700">Mensagem</label>
                <Textarea value={novoTemplate.body} onChange={(e) => {
                  const body = e.target.value;
                  const variables = [...body.matchAll(/\{\{(\d+)\}\}/g)];
                  setNovoTemplate((draft) => ({ ...draft, body, variableExamples: variables.map((_, index) => draft.variableExamples[index] || "") }));
                }} placeholder="Oi {{1}}! Temos novidades no cardápio desta semana." className="mt-1 min-h-32" required />
                <p className="text-xs text-gray-400 mt-1">Use {"{{1}}"}, {"{{2}}"} em sequência para valores que serão preenchidos na campanha.</p>
              </div>
              {novoTemplate.variableExamples.map((value, index) => (
                <div key={index}>
                  <label className="text-xs font-bold text-gray-700">Exemplo para {`{{${index + 1}}}`}</label>
                  <Input value={value} onChange={(e) => setNovoTemplate((draft) => { const variableExamples = [...draft.variableExamples]; variableExamples[index] = e.target.value; return { ...draft, variableExamples }; })} placeholder={`Ex.: ${index === 0 ? "Ana" : "Cupom10"}`} className="mt-1" required />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-gray-700">Rodapé (opcional)</label>
                <Input value={novoTemplate.footer} onChange={(e) => setNovoTemplate((draft) => ({ ...draft, footer: e.target.value }))} maxLength={60} className="mt-1" />
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3">Envie marketing somente para contatos que aceitaram receber mensagens. O status final é definido pela Meta.</p>
              <Button type="submit" className="w-full bg-[#5850ec] hover:bg-[#4740c9]" disabled={criarTemplateMutation.isPending}>
                {criarTemplateMutation.isPending ? "Enviando para a Meta..." : "Enviar para aprovação da Meta"}
              </Button>
            </form>
          </section>
        </div>
      )}

      {/* TAB: Contatos */}
      {tabAtivo === "contatos" && (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Lista de Listas */}
          <div className="bg-white rounded-xl border p-6 h-fit sticky top-6">
            <h3 className="font-bold text-gray-800 mb-4">Minhas Listas</h3>

            {/* Criar Nova Lista */}
            <div className="mb-4 pb-4 border-b">
              <Input
                placeholder="Nome da lista..."
                value={novaListaNome}
                onChange={(e) => setNovaListaNome(e.target.value)}
                className="mb-2"
              />
              <Input
                placeholder="Descrição..."
                value={novaListaDescricao}
                onChange={(e) => setNovaListaDescricao(e.target.value)}
                className="mb-2"
              />
              <Button
                onClick={criarNovaLista}
                className="w-full bg-[#5850ec] hover:bg-[#5850ec]/90"
              >
                + Nova Lista
              </Button>
            </div>

            {/* Listas Existentes */}
            {carregandoListas ? (
              <div className="text-center text-gray-500 text-sm">Carregando...</div>
            ) : listas.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">Nenhuma lista criada</div>
            ) : (
              <div className="space-y-2">
                {listas.map((lista: any) => (
                  <button
                    key={lista.id}
                    onClick={() => carregarContatosLista(lista.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all border ${
                      listaEditando === lista.id
                        ? "bg-[#5850ec] text-white border-[#5850ec]"
                        : "border-gray-200 hover:border-[#5850ec] hover:bg-gray-50"
                    }`}
                  >
                    <p className="font-bold text-sm">{lista.nome}</p>
                    <p className="text-xs opacity-70">{lista.quantidade_contatos} contatos</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Gerenciar Contatos da Lista */}
          <div>
            {listaEditando ? (
              <div className="bg-white rounded-xl border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">
                    {listas.find((l: any) => l.id === listaEditando)?.nome}
                  </h3>
                  <button
                    onClick={() => {
                      deletarLista(listaEditando);
                    }}
                    className="px-3 py-1 text-xs font-bold text-red-600 border border-red-200 rounded hover:bg-red-50"
                  >
                    Deletar Lista
                  </button>
                </div>

                {/* Adicionar Contato */}
                <div className="mb-6 pb-6 border-b space-y-2">
                  <label className="block text-sm font-bold text-gray-600">
                    Adicionar Contato:
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Telefone (11987654321)"
                      className="flex-1"
                      id="novoTelefone"
                    />
                    <Input placeholder="Nome (opcional)" className="flex-1" id="novoNome" />
                    <Button
                      onClick={() => {
                        const tel = (document.getElementById("novoTelefone") as HTMLInputElement)
                          ?.value;
                        const nome = (document.getElementById("novoNome") as HTMLInputElement)
                          ?.value;
                        if (tel) {
                          adicionarContatoALista(listaEditando, tel, nome);
                          (document.getElementById("novoTelefone") as HTMLInputElement).value = "";
                          (document.getElementById("novoNome") as HTMLInputElement).value = "";
                        }
                      }}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      Adicionar
                    </Button>
                  </div>

                  {/* Importar CSV */}
                  <Button
                    onClick={() => listaInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                  >
                    📥 Importar CSV
                  </Button>
                  <input
                    ref={listaInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const csv = event.target?.result as string;
                          const linhas = csv.split("\n").filter((l) => l.trim());

                          let contatos = linhas;
                          if (
                            linhas.length > 0 &&
                            (linhas[0].toLowerCase().includes("telefone") ||
                              linhas[0].toLowerCase().includes("phone"))
                          ) {
                            contatos = linhas.slice(1);
                          }

                          const telefonesParsed = contatos
                            .map((l) => {
                              const match = l.match(/\d+/g);
                              return match ? match.join("") : "";
                            })
                            .filter((t) => t.length >= 10 && t.length <= 15);

                          if (telefonesParsed.length === 0) {
                            toast.error("Nenhum telefone encontrado");
                            return;
                          }

                          let importados = 0;
                          telefonesParsed.forEach(async (tel) => {
                            await adicionarContatoALista(listaEditando, tel).then(() => {
                              importados++;
                            });
                          });

                          toast.success(`${importados} contatos adicionados!`);
                        } catch (err) {
                          toast.error("Erro ao processar CSV");
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                </div>

                {/* Lista de Contatos */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-3">
                    Contatos ({contatosLista.length})
                  </h4>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {contatosLista.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-8">
                        Nenhum contato nesta lista
                      </p>
                    ) : (
                      contatosLista.map((contato: any, idx: number) => (
                        <div
                          key={contato.id}
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <span className="text-xs font-bold text-gray-500 w-6">{idx + 1}</span>
                          <input
                            type="text"
                            defaultValue={contato.telefone}
                            onChange={(e) => {
                              const updated = contatosLista.map((c) =>
                                c.id === contato.id ? { ...c, telefone: e.target.value } : c,
                              );
                              setContatosLista(updated);
                            }}
                            placeholder="Telefone"
                            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#5850ec]"
                          />
                          <input
                            type="text"
                            defaultValue={contato.nome || ""}
                            onChange={(e) => {
                              const updated = contatosLista.map((c) =>
                                c.id === contato.id ? { ...c, nome: e.target.value } : c,
                              );
                              setContatosLista(updated);
                            }}
                            placeholder="Nome"
                            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#5850ec]"
                          />
                          <button
                            onClick={() => {
                              const tel = (
                                document.querySelectorAll('input[placeholder="Telefone"]')[
                                  idx
                                ] as HTMLInputElement
                              )?.value;
                              const nome = (
                                document.querySelectorAll('input[placeholder="Nome"]')[
                                  idx
                                ] as HTMLInputElement
                              )?.value;
                              if (tel) {
                                editarContatoDaLista(contato.id, tel, nome);
                              }
                            }}
                            className="px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => removerContatoDaLista(contato.id, listaEditando)}
                            className="px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Usar Esta Lista em Campanha */}
                  {contatosLista.length > 0 && (
                    <Button
                      onClick={() => {
                        const telefones = contatosLista.map((c) => c.telefone);
                        setContatosEditaveis(telefones);
                        setTabAtivo("criar");
                        toast.success(`${telefones.length} contatos carregados!`);
                      }}
                      className="w-full mt-4 bg-green-600 hover:bg-green-700"
                    >
                      Usar Esta Lista em Campanha
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-12 text-center">
                <Users className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">Selecione uma lista para gerenciar contatos</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Histórico */}
      {tabAtivo === "historico" && (
        <div className="space-y-4">
          {carregandoCampanhas ? (
            <div className="text-center py-12 text-gray-500">Carregando histórico...</div>
          ) : campanhas.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Clock className="mx-auto text-gray-300 mb-4" size={40} />
              <p className="text-gray-500">Nenhuma campanha enviada ainda</p>
            </div>
          ) : (
            <>
              {/* Painel de detalhes em tempo real */}
              {campanhaDetalhes && (
                <div className="bg-white rounded-xl border p-6 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Envios em Tempo Real</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {enviosCampanha.filter((e: any) => e.status === "enviado").length}/
                        {enviosCampanha.length} enviados
                      </span>
                      <button
                        onClick={() => setCampanhaDetalhes(null)}
                        className="text-xs px-2 py-1 text-gray-500 hover:text-red-600 border rounded"
                      >
                        ✕ Fechar
                      </button>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width:
                          enviosCampanha.length > 0
                            ? `${(enviosCampanha.filter((e: any) => e.status === "enviado").length / enviosCampanha.length) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>

                  <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                    <div className="flex items-center gap-2 font-semibold">
                      <CircleDollarSign size={16} />
                      Estimativa Meta: {formatarMoeda(enviosCampanha.filter((e: any) => e.status === "enviado").length * TARIFA_MARKETING_BR)}
                    </div>
                    <p className="mt-1 text-xs text-emerald-700">
                      Template Marketing no Brasil: {formatarMoeda(TARIFA_MARKETING_BR)} por mensagem entregue. A fatura da Meta é o valor final.
                    </p>
                  </div>

                  {/* Lista de envios */}
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {enviosCampanha.map((envio: any, idx: number) => (
                      <div
                        key={envio.id || idx}
                        className={`flex items-center justify-between px-3 py-2 rounded text-sm ${
                          envio.status === "enviado"
                            ? "bg-green-50"
                            : envio.status === "falhou"
                              ? "bg-red-50"
                              : envio.status === "pendente"
                                ? "bg-yellow-50"
                                : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-600">{envio.telefone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {envio.status === "enviado" && (
                            <span className="text-xs font-bold text-green-700">✓ Enviado</span>
                          )}
                          {envio.status === "falhou" && (
                            <span
                              className="text-xs font-bold text-red-600"
                              title={envio.erro_mensagem}
                            >
                              ✗ {envio.erro_mensagem?.slice(0, 30) || "Falhou"}
                            </span>
                          )}
                          {envio.status === "pendente" && (
                            <span className="text-xs font-bold text-yellow-600">⏳ Pendente</span>
                          )}
                          {envio.enviado_em && (
                            <span className="text-xs text-gray-400">
                              {new Date(envio.enviado_em).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de campanhas */}
              {campanhas.map((campanha: any) => (
                <div
                  key={campanha.id}
                  className="bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-md transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{campanha.nome}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{campanha.mensagem}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        📅{" "}
                        {new Date(campanha.created_at).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                      <span>📨 {campanha.contatos_total} contatos</span>
                      <span>✓ {campanha.contatos_enviados} enviados</span>
                      <span className="font-medium text-emerald-700" title="Estimativa para templates de Marketing enviados ao Brasil. A Meta cobra somente as mensagens entregues.">
                        💰 Estimativa: {formatarMoeda((campanha.contatos_enviados || 0) * TARIFA_MARKETING_BR)}
                      </span>
                      {campanha.contatos_falhados > 0 && (
                        <span className="text-red-600">
                          ✗ {campanha.contatos_falhados} falhados
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={() =>
                        setCampanhaDetalhes(campanhaDetalhes === campanha.id ? null : campanha.id)
                      }
                      className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
                        campanhaDetalhes === campanha.id
                          ? "bg-[#5850ec] text-white border-[#5850ec]"
                          : "border-gray-200 text-gray-600 hover:border-[#5850ec]"
                      }`}
                    >
                      <Eye size={12} className="inline mr-1" />
                      {campanhaDetalhes === campanha.id ? "Fechar" : "Ver"}
                    </button>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        campanha.status === "enviada"
                          ? "bg-green-100 text-green-700"
                          : campanha.status === "enviando"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {campanha.status === "enviada" && <CheckCircle2 size={14} />}
                      {campanha.status === "enviando" && (
                        <Clock size={14} className="animate-spin" />
                      )}
                      {campanha.status === "erro" && <AlertCircle size={14} />}
                      {campanha.status.charAt(0).toUpperCase() + campanha.status.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
