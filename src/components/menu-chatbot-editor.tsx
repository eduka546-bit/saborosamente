import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, GripVertical, ListTree, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type MenuItem = {
  id: string;
  secao: string;
  secao_ordem: number;
  ordem: number;
  item_id: string;
  titulo: string;
  descricao: string | null;
  acao: string;
  resposta_chave: string | null;
  ativo: boolean;
};

const ACAO_LABEL: Record<string, string> = {
  resposta_fixa: "Resposta fixa",
  transfere_humano: "Transfere p/ atendente",
  envia_cardapio: "Envia cardápio",
  envia_site: "Envia link do site",
};

// Gera um identificador (slug) a partir do título: minúsculas, sem acento,
// só letras/números/underscore. Ex.: "Promoção do Dia" → "promocao_do_dia".
function slugify(texto: string): string {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export function MenuChatbotEditor() {
  const queryClient = useQueryClient();
  const [itens, setItens] = useState<MenuItem[]>([]);

  // Formulário de novo item
  const [showAdd, setShowAdd] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaSecao, setNovaSecao] = useState("Mais");
  const [novaAcao, setNovaAcao] = useState("resposta_fixa");

  const { isLoading } = useQuery({
    queryKey: ["chatbot-menu"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatbot_menu")
        .select(
          "id, secao, secao_ordem, ordem, item_id, titulo, descricao, acao, resposta_chave, ativo",
        )
        .order("secao_ordem")
        .order("ordem");
      if (error) throw error;
      setItens((data as MenuItem[]) ?? []);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: MenuItem) => {
      const { error } = await supabase
        .from("chatbot_menu")
        .update({
          titulo: item.titulo,
          descricao: item.descricao,
          ativo: item.ativo,
          ordem: item.ordem,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-menu"] });
      toast.success("Item do menu salvo! Já vale no WhatsApp.");
    },
    onError: (e: Error) => toast.error("Erro ao salvar: " + e.message),
  });

  // Cria um novo item de menu. Quando a ação é "resposta_fixa", cria também a
  // entrada vinculada em agente_respostas_fixas (mesma chave) — para o texto da
  // resposta ficar editável na aba "Respostas do Chatbot".
  const addMutation = useMutation({
    mutationFn: async () => {
      const titulo = novoTitulo.trim();
      if (!titulo) throw new Error("Informe o título do item.");

      // Gera uma chave única a partir do título (evita colisão com os existentes).
      const base = slugify(titulo) || "item";
      const usados = new Set(
        itens.flatMap((i) => [i.item_id, i.resposta_chave].filter(Boolean) as string[]),
      );
      let chave = base;
      let n = 2;
      while (usados.has(chave)) chave = `${base}_${n++}`;

      // Próxima ordem dentro da seção escolhida.
      const naSecao = itens.filter((i) => i.secao === novaSecao);
      const secaoOrdem = naSecao[0]?.secao_ordem ?? (itens.at(-1)?.secao_ordem ?? 0) + 1;
      const proximaOrdem = naSecao.reduce((m, i) => Math.max(m, i.ordem), 0) + 1;

      const usaResposta = novaAcao === "resposta_fixa";

      // 1) Se usa resposta fixa, cria a resposta primeiro (vínculo pela chave).
      if (usaResposta) {
        const { error: errResp } = await supabase.from("agente_respostas_fixas").insert({
          chave,
          titulo,
          conteudo: "✏️ Edite esta resposta na aba Respostas do Chatbot.",
          ativo: true,
          ordem: proximaOrdem,
        });
        if (errResp) throw errResp;
      }

      // 2) Cria o item de menu, apontando resposta_chave quando aplicável.
      const { error: errMenu } = await supabase.from("chatbot_menu").insert({
        secao: novaSecao,
        secao_ordem: secaoOrdem,
        ordem: proximaOrdem,
        item_id: chave,
        titulo,
        descricao: novaDescricao.trim() || null,
        acao: novaAcao,
        resposta_chave: usaResposta ? chave : null,
        ativo: true,
      });
      if (errMenu) {
        // rollback simples da resposta criada, para não deixar órfã.
        if (usaResposta) {
          await supabase.from("agente_respostas_fixas").delete().eq("chave", chave);
        }
        throw errMenu;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-menu"] });
      queryClient.invalidateQueries({ queryKey: ["agente-respostas-fixas"] });
      toast.success(
        novaAcao === "resposta_fixa"
          ? "Item criado! Edite o texto da resposta em Respostas do Chatbot."
          : "Item criado! Já vale no WhatsApp.",
      );
      setNovoTitulo("");
      setNovaDescricao("");
      setNovaAcao("resposta_fixa");
      setNovaSecao("Mais");
      setShowAdd(false);
    },
    onError: (e: Error) => toast.error("Erro ao criar: " + e.message),
  });

  const update = (idx: number, campo: keyof MenuItem, valor: string | boolean | number) => {
    const next = [...itens];
    next[idx] = { ...next[idx], [campo]: valor };
    setItens(next);
  };

  // Agrupa por seção preservando a ordem de secao_ordem.
  const secoes = Array.from(new Set(itens.map((i) => i.secao)));
  const ativosCount = itens.filter((i) => i.ativo).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-[#5850ec] flex items-center gap-2">
          <ListTree size={20} /> Menu do Chatbot
        </h2>
        <span
          className={`text-xs font-semibold ${ativosCount > 10 ? "text-red-600" : "text-gray-400"}`}
        >
          {ativosCount}/10 itens ativos
        </span>
      </div>
      <p className="text-gray-500 text-sm mb-4">
        Edite o menu que o assistente do WhatsApp mostra. Mudanças valem na hora, sem deploy. O
        WhatsApp aceita no máximo 10 itens ativos no total.
      </p>

      {/* Adicionar novo item */}
      <div className="mb-5">
        {!showAdd ? (
          <Button
            onClick={() => setShowAdd(true)}
            variant="outline"
            size="sm"
            className="border-[#5850ec]/40 text-[#5850ec]"
          >
            <Plus size={15} className="mr-1" /> Adicionar item
          </Button>
        ) : (
          <div className="rounded-xl border border-[#5850ec]/30 bg-[#5850ec]/5 p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#5850ec]">Novo item do menu</h3>
            <Input
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
              maxLength={24}
              placeholder="Título (máx 24 caracteres, ex: 🎁 Promoções)"
              className="font-semibold"
            />
            <Input
              value={novaDescricao}
              onChange={(e) => setNovaDescricao(e.target.value)}
              maxLength={72}
              placeholder="Descrição (aparece embaixo do título)"
              className="text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  Seção
                </label>
                <select
                  value={novaSecao}
                  onChange={(e) => setNovaSecao(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-gray-200 text-sm bg-white"
                >
                  {Array.from(new Set([...itens.map((i) => i.secao), "Pedidos", "Dúvidas", "Mais"])).map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  Ação
                </label>
                <select
                  value={novaAcao}
                  onChange={(e) => setNovaAcao(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-gray-200 text-sm bg-white"
                >
                  <option value="resposta_fixa">Resposta fixa (texto editável)</option>
                  <option value="envia_cardapio">Envia cardápio</option>
                  <option value="envia_site">Envia link do site</option>
                  <option value="transfere_humano">Transfere p/ atendente</option>
                </select>
              </div>
            </div>
            {novaAcao === "resposta_fixa" && (
              <p className="text-[11px] text-[#5850ec]">
                Uma resposta vinculada será criada em <strong>Respostas do Chatbot</strong> para
                você editar o texto.
              </p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending || !novoTitulo.trim()}
                size="sm"
                className="bg-[#5850ec] text-white"
              >
                {addMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : (
                  <Plus size={14} className="mr-1" />
                )}{" "}
                Criar item
              </Button>
              <Button
                onClick={() => setShowAdd(false)}
                variant="outline"
                size="sm"
                disabled={addMutation.isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {ativosCount > 10 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-700">
          Você tem mais de 10 itens ativos. O WhatsApp só mostra os 10 primeiros — desative alguns.
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 className="animate-spin mr-2" size={18} /> Carregando...
        </div>
      ) : (
        <div className="space-y-5">
          {secoes.map((secao) => (
            <div key={secao}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                {secao}
              </h3>
              <div className="space-y-2">
                {itens
                  .map((item, idx) => ({ item, idx }))
                  .filter(({ item }) => item.secao === secao)
                  .map(({ item, idx }) => (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-3 ${
                        item.ativo
                          ? "border-gray-200 bg-white"
                          : "border-gray-100 bg-gray-50 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <GripVertical size={14} className="text-gray-300 shrink-0" />
                        <Input
                          value={item.titulo}
                          onChange={(e) => update(idx, "titulo", e.target.value)}
                          className="font-semibold text-gray-800"
                          maxLength={24}
                          placeholder="Título (máx 24 caracteres)"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={item.ativo}
                            onCheckedChange={(v) => update(idx, "ativo", v)}
                          />
                        </div>
                      </div>
                      <Input
                        value={item.descricao ?? ""}
                        onChange={(e) => update(idx, "descricao", e.target.value)}
                        className="text-sm mb-2"
                        maxLength={72}
                        placeholder="Descrição (aparece embaixo do título)"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-400">
                          Ação: {ACAO_LABEL[item.acao] ?? item.acao}
                          {item.acao === "resposta_fixa" && item.resposta_chave
                            ? " — edite o texto em Respostas do Chatbot"
                            : ""}
                        </span>
                        <Button
                          onClick={() => saveMutation.mutate(item)}
                          disabled={saveMutation.isPending}
                          size="sm"
                          className="bg-[#5850ec] text-white"
                        >
                          {saveMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin mr-1" />
                          ) : (
                            <Save size={14} className="mr-1" />
                          )}{" "}
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
