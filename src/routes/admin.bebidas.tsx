/**
 * Admin Bebidas — cadastro simplificado pra produtos que só aparecem no PDV.
 * Campos: nome, foto, valor, EAN. Salva com visivel_online=false.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import { Loader2, Plus, Trash2, Edit3, Save, X, Wine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bebidas")({
  component: AdminBebidasPage,
  ssr: false,
});

function AdminBebidasPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", preco: "", codigo_integracao: "", imagem_url: "", estoque: "" });
  const [editForm, setEditForm] = useState({ nome: "", preco: "", codigo_integracao: "", imagem_url: "", estoque: "" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const { data: bebidas = [], isLoading } = useQuery({
    queryKey: ["admin-bebidas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, preco, codigo_integracao, imagem_url, visivel_online, estoque_200g")
        .eq("visivel_online", false)
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  async function uploadImagem(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `bebidas/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("produtos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error("Erro no upload: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("produtos").getPublicUrl(path);
    return data.publicUrl;
  }

  const addMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("produtos").insert({
        nome: values.nome,
        preco: Number(values.preco.replace(",", ".")) || 0,
        codigo_integracao: values.codigo_integracao || null,
        imagem_url: values.imagem_url || null,
        visivel_online: false,
        ativo: true,
        tipo_produto: "bebida",
        controle_estoque: true,
        estoque_200g: Number(values.estoque) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bebidas"] });
      queryClient.invalidateQueries({ queryKey: ["pdv-products"] });
      toast.success("Bebida adicionada!");
      setIsAdding(false);
      setForm({ nome: "", preco: "", codigo_integracao: "", imagem_url: "" });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: any) => {
      const { error } = await supabase
        .from("produtos")
        .update({
          nome: values.nome,
          preco: Number(values.preco.replace(",", ".")) || 0,
          codigo_integracao: values.codigo_integracao || null,
          imagem_url: values.imagem_url || null,
          estoque_200g: Number(values.estoque) || 0,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bebidas"] });
      queryClient.invalidateQueries({ queryKey: ["pdv-products"] });
      toast.success("Atualizado!");
      setEditingId(null);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("produtos").update({ ativo: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bebidas"] });
      queryClient.invalidateQueries({ queryKey: ["pdv-products"] });
      toast.success("Bebida removida.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  async function handleFileUpload(file: File, target: "add" | "edit") {
    setUploading(true);
    const url = await uploadImagem(file);
    setUploading(false);
    if (url) {
      if (target === "add") setForm((f) => ({ ...f, imagem_url: url }));
      else setEditForm((f) => ({ ...f, imagem_url: url }));
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Wine size={22} className="text-[#5850ec]" />
          <div>
            <h1 className="text-2xl font-bold text-[#5850ec]">Bebidas (PDV)</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Produtos que aparecem somente no PDV da loja física.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-[#5850ec] text-white"
        >
          <Plus size={16} className="mr-1" /> Adicionar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="space-y-3">
          {bebidas.length === 0 && !isAdding && (
            <div className="text-center py-12 text-gray-400 border border-dashed rounded-xl">
              Nenhuma bebida cadastrada. Clique em "Adicionar".
            </div>
          )}

          {bebidas.map((b: any) => (
            <div key={b.id} className="flex items-center gap-3 bg-white rounded-xl border p-3">
              {editingId === b.id ? (
                <div className="flex-1 space-y-2">
                  <Input
                    value={editForm.nome}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    placeholder="Nome"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={editForm.preco}
                      onChange={(e) => setEditForm({ ...editForm, preco: e.target.value })}
                      placeholder="Preço (ex: 5,90)"
                    />
                    <Input
                      value={editForm.codigo_integracao}
                      onChange={(e) => setEditForm({ ...editForm, codigo_integracao: e.target.value })}
                      placeholder="EAN"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {editForm.imagem_url && (
                      <img src={editForm.imagem_url} className="h-10 w-10 rounded object-cover" alt="" />
                    )}
                    <input
                      ref={editFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "edit")}
                    />
                    <Button size="sm" variant="outline" onClick={() => editFileRef.current?.click()} disabled={uploading}>
                      {uploading ? "..." : "Foto"}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-[#5850ec] text-white"
                      onClick={() => updateMutation.mutate({ id: b.id, values: editForm })}
                    >
                      <Save size={13} className="mr-1" /> Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      <X size={13} />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {b.imagem_url && (
                    <img src={b.imagem_url} className="h-12 w-12 rounded-lg object-cover border" alt="" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{b.nome}</p>
                    <p className="text-xs text-gray-400">
                      R$ {Number(b.preco).toFixed(2).replace(".", ",")}
                      {b.codigo_integracao ? ` • EAN: ${b.codigo_integracao}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-[#5850ec]"
                      onClick={() => {
                        setEditingId(b.id);
                        setEditForm({
                          nome: b.nome,
                          preco: Number(b.preco).toFixed(2).replace(".", ","),
                          codigo_integracao: b.codigo_integracao ?? "",
                          imagem_url: b.imagem_url ?? "",
                        });
                      }}
                    >
                      <Edit3 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={() => {
                        if (confirm("Remover esta bebida?")) deleteMutation.mutate(b.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de adicionar */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#5850ec]">Nova Bebida</h2>
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Nome da bebida"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={form.preco}
                onChange={(e) => setForm({ ...form, preco: e.target.value })}
                placeholder="Preço (ex: 5,90)"
              />
              <Input
                value={form.codigo_integracao}
                onChange={(e) => setForm({ ...form, codigo_integracao: e.target.value })}
                placeholder="Código EAN"
              />
            </div>
            <div className="flex items-center gap-3">
              {form.imagem_url && (
                <img src={form.imagem_url} className="h-14 w-14 rounded-lg object-cover" alt="" />
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "add")}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "Enviando..." : "Adicionar foto"}
              </Button>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={() => addMutation.mutate(form)}
                disabled={!form.nome || !form.preco || addMutation.isPending}
                className="flex-1 bg-[#5850ec] text-white"
              >
                {addMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
