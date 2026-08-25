import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Save,
  Printer,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { conectarQZ, qzDisponivel, imprimirTCP, gerarConteudoComanda } from "@/lib/qz-print";

export const Route = createFileRoute("/admin/config/impressao")({
  component: AdminConfigImpressaoPage,
});

const DEFAULT = {
  impressao_automatica: false,
  impressora_ip: "",
  impressora_porta: "9100",
  imprimir_ao_confirmar: true,
  imprimir_ao_entregar: false,
  copias: "1",
  tamanho_papel: "80mm",
};

function AdminConfigImpressaoPage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<any>(DEFAULT);
  const [qzStatus, setQzStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [testing, setTesting] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ["config-impressao"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("config_impressao")
        .maybeSingle();
      if (data?.config_impressao) setConfig({ ...DEFAULT, ...(data.config_impressao as any) });
      return data;
    },
  });

  // Verifica status do QZ Tray ao montar e ao mudar config
  useEffect(() => {
    setQzStatus("checking");
    qzDisponivel().then((ok) => setQzStatus(ok ? "connected" : "disconnected"));
  }, []);

  const checkQz = async () => {
    setQzStatus("checking");
    const ok = await qzDisponivel();
    setQzStatus(ok ? "connected" : "disconnected");
    if (ok) toast.success("QZ Tray conectado!");
    else toast.error("QZ Tray não encontrado. Verifique se está rodando.");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .update({ config_impressao: config } as any)
        .neq("id", "");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-impressao"] });
      toast.success("Configurações salvas!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const handleTestar = async () => {
    if (!config.impressora_ip) {
      toast.error("Informe o IP da impressora");
      return;
    }
    setTesting(true);
    try {
      const pedidoTeste = {
        id: "00000000-0000-0000-0000-000000000001",
        nome_cliente: "TESTE DE IMPRESSÃO",
        telefone_cliente: "(47) 99999-9999",
        created_at: new Date().toISOString(),
        status: "preparando",
        metodo_entrega: "entrega",
        metodo_pagamento: "PIX",
        endereco_rua: "Rua Exemplo",
        endereco_numero: "123",
        endereco_bairro: "Centro",
        endereco_cidade: "São Bento do Sul",
        valor_total: 45.9,
        taxa_entrega: 8.0,
        desconto_aplicado: 0,
        itens: [
          {
            nome: "Frango Grelhado com Legumes",
            quantidade: 2,
            preco_unitario: 18.95,
            observacao: "Sem cebola",
          },
          { nome: "Sopa de Caldo Verde", quantidade: 1, preco_unitario: 8.0, observacao: null },
        ],
      };

      const ok = await imprimirTCP(
        pedidoTeste,
        config.impressora_ip,
        Number(config.impressora_porta ?? 9100),
        Number(config.copias ?? 1),
        config.tamanho_papel ?? "80mm",
      );

      if (ok) toast.success("Comanda de teste enviada para a impressora!");
      else toast.error("QZ Tray não disponível. Verifique se está rodando e tente novamente.");
    } catch (e: any) {
      toast.error("Erro ao testar: " + e.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Impressão Automática</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure a impressão automática de tickets de pedido.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status do QZ Tray */}
          <div
            className={`rounded-xl border p-4 flex items-center justify-between ${
              qzStatus === "connected"
                ? "bg-green-50 border-green-200"
                : qzStatus === "disconnected"
                  ? "bg-red-50 border-red-200"
                  : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {qzStatus === "checking" && (
                <Loader2 size={18} className="animate-spin text-gray-400" />
              )}
              {qzStatus === "connected" && <CheckCircle2 size={18} className="text-green-600" />}
              {qzStatus === "disconnected" && <XCircle size={18} className="text-red-500" />}
              <div>
                <p
                  className={`text-sm font-bold ${
                    qzStatus === "connected"
                      ? "text-green-700"
                      : qzStatus === "disconnected"
                        ? "text-red-700"
                        : "text-gray-600"
                  }`}
                >
                  {qzStatus === "checking"
                    ? "Verificando QZ Tray..."
                    : qzStatus === "connected"
                      ? "QZ Tray conectado ✓"
                      : "QZ Tray não encontrado"}
                </p>
                <p className="text-xs text-gray-500">
                  {qzStatus === "connected"
                    ? "Impressão direta ativada — sem diálogo"
                    : "Instale e inicie o QZ Tray para impressão automática"}
                </p>
              </div>
            </div>
            <button
              onClick={checkQz}
              className="p-1.5 rounded-lg hover:bg-black/5 text-gray-400 hover:text-gray-600"
              title="Verificar novamente"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Instruções de instalação se desconectado */}
          {qzStatus === "disconnected" && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
              <p className="text-sm font-bold text-blue-700">Como configurar o QZ Tray:</p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>
                  Você já baixou — ótimo! Agora <strong>instale e execute o QZ Tray</strong>
                </li>
                <li>Depois que abrir, aparece um ícone na barra de tarefas (bandeja do sistema)</li>
                <li>
                  Volte aqui e clique em <strong>"Verificar novamente"</strong> (↻)
                </li>
                <li>Configure o IP e a porta da sua impressora abaixo</li>
                <li>
                  Clique em <strong>"Testar impressão"</strong> para confirmar
                </li>
              </ol>
              <a
                href="https://qz.io/download"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
              >
                <ExternalLink size={12} /> Download QZ Tray (gratuito)
              </a>
            </div>
          )}

          {/* Configurações */}
          <div className="bg-white rounded-xl border p-6 space-y-5">
            <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-[#5850ec]" />
                <div>
                  <p className="font-semibold text-gray-800">Impressão Automática</p>
                  <p className="text-xs text-gray-500">Imprimir ao receber novo pedido</p>
                </div>
              </div>
              <Switch
                checked={config.impressao_automatica}
                onCheckedChange={(v) => setConfig({ ...config, impressao_automatica: v })}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  IP da Impressora
                </label>
                <Input
                  value={config.impressora_ip}
                  onChange={(e) => setConfig({ ...config, impressora_ip: e.target.value })}
                  placeholder="Ex: 192.168.1.100"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Para descobrir: ligue a impressora e segure o botão de alimentação até imprimir
                  uma folha de teste com o IP.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Porta TCP
                </label>
                <Input
                  value={config.impressora_porta}
                  onChange={(e) => setConfig({ ...config, impressora_porta: e.target.value })}
                  placeholder="9100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                    Cópias
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={config.copias}
                    onChange={(e) => setConfig({ ...config, copias: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                    Largura do Papel
                  </label>
                  <select
                    value={config.tamanho_papel}
                    onChange={(e) => setConfig({ ...config, tamanho_papel: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="58mm">58mm (32 colunas)</option>
                    <option value="80mm">80mm (42 colunas)</option>
                  </select>
                </div>
              </div>

              {[
                { key: "imprimir_ao_confirmar", label: "Imprimir ao receber novo pedido" },
                { key: "imprimir_ao_entregar", label: "Imprimir ao marcar como entregue" },
              ].map((t) => (
                <div
                  key={t.key}
                  className="flex items-center justify-between p-3 border rounded-xl"
                >
                  <p className="text-sm font-medium text-gray-700">{t.label}</p>
                  <Switch
                    checked={!!config[t.key]}
                    onCheckedChange={(v) => setConfig({ ...config, [t.key]: v })}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleTestar}
                disabled={testing || !config.impressora_ip || qzStatus !== "connected"}
                className="flex-1 gap-2"
                title={qzStatus !== "connected" ? "QZ Tray precisa estar conectado" : ""}
              >
                {testing ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
                Testar impressão
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="flex-1 bg-[#5850ec] text-white gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
