import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Edit3, Save, X, GripVertical, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/categorias")({
  component: AdminCategoriasPage,
});

function SortableRow({ cat, editingId, editForm, setEditForm, setEditingId, onUpdate, onDelete, onToggleVisible }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <tr ref={setNodeRef} style={style} className={cn("hover:bg-gray-50 transition-colors", !cat.visivel_no_filtro && "opacity-50")}>
      {/* Handle de drag */}
      <td className="px-4 py-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-300 hover:text-gray-500 flex items-center justify-center"
        >
          <GripVertical size={18} />
        </div>
      </td>

      {editingId === cat.id ? (
        <>
          <td className="px-3 py-2">
            <Input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} className="h-8 text-xs" />
          </td>
          <td className="px-3 py-2">
            <Input value={editForm.descricao} onChange={e => setEditForm({ ...editForm, descricao: e.target.value })} className="h-8 text-xs" placeholder="Descrição opcional" />
          </td>
          <td className="px-6 py-4 text-gray-400">{cat.produtos?.[0]?.count ?? 0}</td>
          <td className="px-4 py-4"></td>
          <td className="px-3 py-2 text-right">
            <div className="flex gap-1 justify-end">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600"
                onClick={() => onUpdate(cat.id, editForm)}>
                <Save size={14} />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400"
                onClick={() => setEditingId(null)}>
                <X size={14} />
              </Button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td className="px-6 py-4 font-bold text-gray-900">{cat.nome}</td>
          <td className="px-6 py-4 text-gray-500 text-sm">{cat.descricao ?? "—"}</td>
          <td className="px-6 py-4 text-[#5850ec] font-bold">{cat.produtos?.[0]?.count ?? 0}</td>

          {/* Toggle visível no filtro */}
          <td className="px-4 py-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={cat.visivel_no_filtro !== false}
                onCheckedChange={(v) => onToggleVisible(cat.id, v)}
              />
              <span className="text-xs text-gray-400">
                {cat.visivel_no_filtro !== false
                  ? <span className="flex items-center gap-1 text-green-600"><Eye size={12} /> Visível</span>
                  : <span className="flex items-center gap-1 text-gray-400"><EyeOff size={12} /> Oculto</span>
                }
              </span>
            </div>
          </td>

          <td className="px-6 py-4 text-right">
            <div className="flex gap-1 justify-end">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-[#5850ec]"
                onClick={() => {
                  setEditingId(cat.id);
                  setEditForm({ nome: cat.nome, descricao: cat.descricao ?? "" });
                }}>
                <Edit3 size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500"
                onClick={() => { if (confirm("Excluir categoria?")) onDelete(cat.id); }}>
                <Trash2 size={14} />
              </Button>
            </div>
          </td>
        </>
      )}
    </tr>
  );
}

function AdminCategoriasPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "" });
  const [editForm, setEditForm] = useState({ nome: "", descricao: "" });
  const [localCategories, setLocalCategories] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { isLoading } = useQuery({
    queryKey: ["admin-categories-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("*, produtos(count)")
        .order("ordem_filtro", { ascending: true })
        .order("ordem", { ascending: true });
      if (error) throw error;
      setLocalCategories(data ?? []);
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: any) => {
      const { error } = await supabase.from("categorias").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["public-categories"] });
      toast.success("Atualizado!");
      setEditingId(null);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const addMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("categorias").insert({
        ...values,
        ordem: localCategories.length,
        ordem_filtro: localCategories.length,
        visivel_no_filtro: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["public-categories"] });
      toast.success("Categoria criada!");
      setIsAdding(false);
      setForm({ nome: "", descricao: "" });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categorias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["public-categories"] });
      toast.success("Categoria removida.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const handleToggleVisible = async (id: string, visible: boolean) => {
    setLocalCategories(prev =>
      prev.map(c => c.id === id ? { ...c, visivel_no_filtro: visible } : c)
    );
    const { error } = await supabase.from("categorias").update({ visivel_no_filtro: visible }).eq("id", id);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["public-categories"] });
      toast.success(visible ? "Categoria visível no filtro!" : "Categoria oculta do filtro.");
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localCategories.findIndex(c => c.id === active.id);
    const newIndex = localCategories.findIndex(c => c.id === over.id);
    const reordered = arrayMove(localCategories, oldIndex, newIndex);

    setLocalCategories(reordered);

    // Salva a nova ordem no banco
    try {
      for (let i = 0; i < reordered.length; i++) {
        await supabase.from("categorias")
          .update({ ordem_filtro: i })
          .eq("id", reordered[i].id);
      }
      queryClient.invalidateQueries({ queryKey: ["public-categories"] });
      toast.success("Ordem salva!");
    } catch (e: any) {
      toast.error("Erro ao salvar ordem: " + e.message);
      queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Categorias</h1>
          <p className="text-gray-500 text-sm mt-1">
            Arraste para reordenar. Use o toggle para mostrar/ocultar no filtro do catálogo.
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-[#5850ec] text-white flex items-center gap-2">
          <Plus size={16} /> Nova Categoria
        </Button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-xs text-amber-700 flex items-center gap-2">
        <GripVertical size={14} className="shrink-0" />
        Arraste as linhas pela alça para reordenar as categorias no filtro lateral do catálogo.
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-4 py-4 w-8"></th>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Produtos</th>
                <th className="px-4 py-4">Visível no filtro</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={localCategories.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody className="divide-y">
                  {localCategories.map((cat: any) => (
                    <SortableRow
                      key={cat.id}
                      cat={cat}
                      editingId={editingId}
                      editForm={editForm}
                      setEditForm={setEditForm}
                      setEditingId={setEditingId}
                      onUpdate={(id: string, values: any) => updateMutation.mutate({ id, values })}
                      onDelete={(id: string) => deleteMutation.mutate(id)}
                      onToggleVisible={handleToggleVisible}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-6 text-[#5850ec]">Nova Categoria</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Nome *</label>
                <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Marmitas" required />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Descrição</label>
                <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Refeições completas" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">Cancelar</Button>
                <Button
                  onClick={() => addMutation.mutate(form)}
                  className="flex-1 bg-[#5850ec] text-white"
                  disabled={!form.nome || addMutation.isPending}
                >
                  {addMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null} Criar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
