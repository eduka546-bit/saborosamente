import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/complementos")({
  component: AdminComplementosPage,
});

function AdminComplementosPage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [addingItemFor, setAddingItemFor] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({
    nome: "",
    obrigatorio: false,
    minimo: "0",
    maximo: "1",
  });
  const [itemForm, setItemForm] = useState({ nome: "", preco_adicional: "0" });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["complementos-grupos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complemento_grupos")
        .select("*, itens:complemento_itens(*)")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const addGroupMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("complemento_grupos").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complementos-grupos"] });
      toast.success("Grupo criado!");
      setIsAddingGroup(false);
      setGroupForm({ nome: "", obrigatorio: false, minimo: "0", maximo: "1" });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("complemento_grupos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complementos-grupos"] });
      toast.success("Grupo removido.");
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ grupo_id, values }: any) => {
      const { error } = await supabase.from("complemento_itens").insert({ ...values, grupo_id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complementos-grupos"] });
      toast.success("Item adicionado!");
      setAddingItemFor(null);
      setItemForm({ nome: "", preco_adicional: "0" });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("complemento_itens").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complementos-grupos"] });
      toast.success("Item removido.");
    },
  });

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Itens de Complementos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Grupos e itens de complementos para vincular aos produtos.
          </p>
        </div>
        <Button
          onClick={() => setIsAddingGroup(true)}
          className="bg-[#5850ec] text-white flex items-center gap-2"
        >
          <Plus size={16} /> Novo Grupo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed p-16 text-center text-gray-400">
          Nenhum grupo de complemento criado.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group: any) => (
            <div key={group.id} className="bg-white rounded-xl border overflow-hidden">
              <div
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === group.id ? null : group.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedId === group.id ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                  <p className="font-bold text-gray-900">{group.nome}</p>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {group.itens?.length ?? 0} itens
                  </span>
                  {group.obrigatorio && (
                    <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                      Obrigatório
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Excluir grupo?")) deleteGroupMutation.mutate(group.id);
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              {expandedId === group.id && (
                <div className="border-t bg-gray-50 px-6 py-4 space-y-2">
                  {group.itens?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border"
                    >
                      <span className="text-sm font-medium text-gray-900">{item.nome}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-green-600 font-bold">
                          + R$ {Number(item.preco_adicional ?? 0).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-300 hover:text-red-500"
                          onClick={() => deleteItemMutation.mutate(item.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {addingItemFor === group.id ? (
                    <div className="flex gap-2 items-center bg-white rounded-lg px-4 py-2 border">
                      <Input
                        placeholder="Nome do item"
                        value={itemForm.nome}
                        onChange={(e) => setItemForm({ ...itemForm, nome: e.target.value })}
                        className="h-7 text-xs flex-1"
                      />
                      <Input
                        placeholder="+ R$"
                        type="number"
                        step="0.01"
                        value={itemForm.preco_adicional}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, preco_adicional: e.target.value })
                        }
                        className="h-7 text-xs w-20"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-600"
                        onClick={() =>
                          addItemMutation.mutate({
                            grupo_id: group.id,
                            values: {
                              nome: itemForm.nome,
                              preco_adicional: Number(itemForm.preco_adicional),
                            },
                          })
                        }
                      >
                        <Save size={13} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-gray-400"
                        onClick={() => setAddingItemFor(null)}
                      >
                        <X size={13} />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingItemFor(group.id)}
                      className="flex items-center gap-2 text-xs font-bold text-[#5850ec] hover:text-[#5850ec]/80 transition-colors py-1"
                    >
                      <Plus size={13} /> Adicionar item
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isAddingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-6 text-[#5850ec]">Novo Grupo de Complemento</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Nome do Grupo *
                </label>
                <Input
                  value={groupForm.nome}
                  onChange={(e) => setGroupForm({ ...groupForm, nome: e.target.value })}
                  placeholder="Ex: Escolha a bebida"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                    Mínimo
                  </label>
                  <Input
                    type="number"
                    value={groupForm.minimo}
                    onChange={(e) => setGroupForm({ ...groupForm, minimo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                    Máximo
                  </label>
                  <Input
                    type="number"
                    value={groupForm.maximo}
                    onChange={(e) => setGroupForm({ ...groupForm, maximo: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={groupForm.obrigatorio}
                  onCheckedChange={(v) => setGroupForm({ ...groupForm, obrigatorio: v })}
                />
                <label className="text-sm font-medium text-gray-700">Obrigatório</label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddingGroup(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() =>
                    addGroupMutation.mutate({
                      nome: groupForm.nome,
                      obrigatorio: groupForm.obrigatorio,
                      minimo: Number(groupForm.minimo),
                      maximo: Number(groupForm.maximo),
                    })
                  }
                  className="flex-1 bg-[#5850ec] text-white"
                  disabled={!groupForm.nome || addGroupMutation.isPending}
                >
                  {addGroupMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : null}{" "}
                  Criar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
