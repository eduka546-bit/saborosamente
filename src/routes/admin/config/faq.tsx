import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Loader2, Plus, Trash2, Edit3, Save, X, GripVertical, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/faq")({
  component: AdminFaqPage,
});

function AdminFaqPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ pergunta: "", resposta: "" });
  const [editForm, setEditForm] = useState({ pergunta: "", resposta: "" });
  const [contato, setContato] = useState({
    whatsapp: "",
    whatsappHumano: "",
    instagram: "",
    email: "",
  });
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [savingContato, setSavingContato] = useState(false);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["admin-faq"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faq").select("*").order("ordem");
      if (error) throw error;
      return data;
    },
  });

  useQuery({
    queryKey: ["site-settings-faq"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select(
          "id, contato_whatsapp, contato_whatsapp_humano, contato_instagram, contato_email, footer_whatsapp, footer_instagram",
        )
        .maybeSingle();
      if (data) {
        setSettingsId(data.id);
        setContato({
          whatsapp: data.contato_whatsapp || data.footer_whatsapp || "",
          whatsappHumano: (data as any).contato_whatsapp_humano || "",
          instagram: data.contato_instagram || data.footer_instagram || "",
          email: data.contato_email || "",
        });
      }
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase
        .from("faq")
        .insert({ ...values, ordem: faqs.length, ativo: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faq"] });
      toast.success("Pergunta adicionada!");
      setIsAdding(false);
      setForm({ pergunta: "", resposta: "" });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: any) => {
      const { error } = await supabase.from("faq").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faq"] });
      toast.success("Atualizado!");
      setEditingId(null);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faq").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faq"] });
      toast.success("Removido.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const saveContato = async () => {
    if (!settingsId) return;
    setSavingContato(true);
    const { error } = await supabase
      .from("site_settings")
      .update({
        contato_whatsapp: contato.whatsapp,
        contato_whatsapp_humano: contato.whatsappHumano,
        contato_instagram: contato.instagram,
        contato_email: contato.email,
        footer_whatsapp: contato.whatsapp,
        footer_instagram: contato.instagram,
      } as any)
      .eq("id", settingsId);
    setSavingContato(false);
    if (error) toast.error("Erro: " + error.message);
    else {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Links salvos!");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#5850ec] flex items-center gap-2">
          <HelpCircle size={22} /> Fale Conosco — Configurações
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie os links de contato e as perguntas frequentes.
        </p>
      </div>

      {/* Links de contato */}
      <div className="bg-white rounded-2xl border p-6 space-y-4">
        <h3 className="font-bold text-gray-800">Links de Contato</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-400">
              WhatsApp principal (bot, com DDI)
            </Label>
            <Input
              value={contato.whatsapp}
              onChange={(e) => setContato({ ...contato, whatsapp: e.target.value })}
              placeholder="5547991607757"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-400">
              WhatsApp atendente (transferência)
            </Label>
            <Input
              value={contato.whatsappHumano}
              onChange={(e) => setContato({ ...contato, whatsappHumano: e.target.value })}
              placeholder="5547991507757"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-400">Instagram (sem @)</Label>
            <Input
              value={contato.instagram}
              onChange={(e) => setContato({ ...contato, instagram: e.target.value })}
              placeholder="saborosamente.sbs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-400">E-mail (opcional)</Label>
            <Input
              value={contato.email}
              onChange={(e) => setContato({ ...contato, email: e.target.value })}
              placeholder="contato@exemplo.com"
            />
          </div>
        </div>
        <Button onClick={saveContato} disabled={savingContato} className="bg-[#5850ec] text-white">
          {savingContato ? <Loader2 size={16} className="animate-spin mr-2" /> : null} Salvar Links
        </Button>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Perguntas Frequentes (FAQ)</h3>
          <Button
            onClick={() => setIsAdding(true)}
            size="sm"
            className="bg-[#5850ec] text-white flex items-center gap-2"
          >
            <Plus size={14} /> Adicionar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#5850ec]" size={28} />
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm border border-dashed rounded-xl">
                Nenhuma pergunta cadastrada.
              </div>
            )}
            {faqs.map((faq: any) => (
              <div
                key={faq.id}
                className={`border rounded-xl p-4 space-y-2 ${!faq.ativo ? "opacity-50" : ""}`}
              >
                {editingId === faq.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editForm.pergunta}
                      onChange={(e) => setEditForm({ ...editForm, pergunta: e.target.value })}
                      placeholder="Pergunta"
                    />
                    <textarea
                      value={editForm.resposta}
                      onChange={(e) => setEditForm({ ...editForm, resposta: e.target.value })}
                      placeholder="Resposta"
                      className="w-full rounded-xl border px-3 py-2 text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-[#5850ec]/30"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-[#5850ec] text-white"
                        onClick={() => updateMutation.mutate({ id: faq.id, values: editForm })}
                      >
                        <Save size={13} className="mr-1" /> Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X size={13} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{faq.pergunta}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{faq.resposta}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={faq.ativo}
                        onCheckedChange={(v) =>
                          updateMutation.mutate({ id: faq.id, values: { ativo: v } })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-[#5850ec]"
                        onClick={() => {
                          setEditingId(faq.id);
                          setEditForm({ pergunta: faq.pergunta, resposta: faq.resposta });
                        }}
                      >
                        <Edit3 size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-red-500"
                        onClick={() => {
                          if (confirm("Excluir?")) deleteMutation.mutate(faq.id);
                        }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-5 text-[#5850ec]">Nova Pergunta</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Pergunta *
                </Label>
                <Input
                  value={form.pergunta}
                  onChange={(e) => setForm({ ...form, pergunta: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Resposta *
                </Label>
                <textarea
                  value={form.resposta}
                  onChange={(e) => setForm({ ...form, resposta: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2 text-sm resize-none h-28 outline-none focus:ring-2 focus:ring-[#5850ec]/30"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={() => addMutation.mutate(form)}
                  className="flex-1 bg-[#5850ec] text-white"
                  disabled={!form.pergunta || !form.resposta || addMutation.isPending}
                >
                  {addMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin mr-2" />
                  ) : null}{" "}
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
