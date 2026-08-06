import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import { 
  Plus, Search, MoreVertical, GripVertical, Loader2, Utensils, 
  Filter, X, Save, Copy, Trash2, Edit3, Image as ImageIcon, 
  Calendar, Package, Star, Tag, Info, Check, Clock, Upload, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminProducts } from "@/lib/products.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

export const Route = createFileRoute("/admin/produtos")({
  component: AdminProductsPage,
});

function ProductEditModal({ isOpen, onClose, product, categories, onSave, onDelete }: any) {
  const [formData, setFormData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useMemo(() => {
    if (product) {
      setFormData({
        ...product,
        preco_formatado: product.preco?.toFixed(2).replace('.', ',') || "0,00",
        preco_promocional_formatado: product.preco_promocional?.toFixed(2).replace('.', ',') || ""
      });
    } else {
      // Default data for new product
      setFormData({
        nome: "",
        preco: 0,
        preco_formatado: "0,00",
        categoria_id: categories[0]?.id || "",
        status: 'ativo',
        imagem_url: "",
        descricao: "",
        informacao_nutricional: "",
        controle_estoque: false,
        estoque_atual: 0,
        estoque_minimo: 5
      });
    }
  }, [product, categories]);

  if (!product || !formData) return null;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, imagem_url: publicUrl });
      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao enviar imagem: " + (error.message || "Tente novamente"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    const { preco_formatado, preco_promocional_formatado, categorias, ...rest } = formData;
    const preco = parseFloat(preco_formatado.replace(',', '.'));
    const preco_promocional = preco_promocional_formatado ? parseFloat(preco_promocional_formatado.replace(',', '.')) : null;
    
    if (isNaN(preco)) {
      toast.error("Por favor, insira um preço válido");
      return;
    }

    onSave({ ...rest, preco, preco_promocional });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-xl">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">R$ {formData.preco?.toFixed(2).replace('.', ',') || "0,00"}</span>
          </div>
          <DialogTitle className="hidden">{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="detalhes" className="w-full">
          <TabsList className="w-full justify-start px-6 border-b rounded-none bg-transparent h-12 gap-6">
            <TabsTrigger value="detalhes" className="data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none">Detalhes</TabsTrigger>
            <TabsTrigger value="complementos" className="data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none">Complementos</TabsTrigger>
            <TabsTrigger value="disponibilidade" className="data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none">Disponibilidade</TabsTrigger>
            <TabsTrigger value="estoque" className="data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none text-gray-400">Estoque</TabsTrigger>
            <TabsTrigger value="destaque" className="data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none text-gray-400">Destaque</TabsTrigger>
            <TabsTrigger value="promocao" className="data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none text-gray-400">Promoção</TabsTrigger>
            <TabsTrigger value="integracao" className="data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none text-gray-400">Integração</TabsTrigger>
            <TabsTrigger value="contabilidade" className="data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none text-gray-400">Contabilidade</TabsTrigger>
          </TabsList>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <TabsContent value="detalhes" className="m-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
                <div className="space-y-4">
                  <div className="aspect-square rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden group">
                    {formData.imagem_url ? (
                      <img src={formData.imagem_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-gray-300" size={48} />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="text-xs font-bold uppercase"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                        Trocar Imagem Principal
                      </Button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center uppercase font-bold tracking-widest">Resolução recomendada: 800x800px</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Nome *</label>
                      <Input 
                        value={formData.nome} 
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="h-10 border-gray-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Valor *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                        <Input 
                          value={formData.preco_formatado} 
                          onChange={(e) => setFormData({ ...formData, preco_formatado: e.target.value })}
                          className="h-10 pl-9 border-gray-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Categoria</label>
                      <select 
                        className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5850ec]/20"
                        value={formData.categoria_id}
                        onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                      >
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>{cat.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Tabs defaultValue="descricao" className="w-full">
                    <TabsList className="bg-transparent h-auto p-0 gap-4 border-b rounded-none mb-4">
                      <TabsTrigger value="descricao" className="data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 pb-2 text-xs font-semibold uppercase tracking-wider transition-none">Descrição</TabsTrigger>
                      <TabsTrigger value="nutricional" className="data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 pb-2 text-xs font-semibold uppercase tracking-wider transition-none">Tabela Nutricional</TabsTrigger>
                    </TabsList>
                    <TabsContent value="descricao">
                      <textarea 
                        className="w-full min-h-[150px] p-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5850ec]/20 resize-none"
                        value={formData.descricao || ""}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        placeholder="Descreva o produto..."
                      />
                    </TabsContent>
                    <TabsContent value="nutricional">
                      <textarea 
                        className="w-full min-h-[150px] p-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5850ec]/20 resize-none"
                        value={formData.informacao_nutricional || ""}
                        onChange={(e) => setFormData({ ...formData, informacao_nutricional: e.target.value })}
                        placeholder="Informações nutricionais..."
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="complementos" className="m-0 py-12 flex flex-col items-center justify-center space-y-4">
              <p className="text-gray-500 text-sm">Este produto não tem Complementos</p>
              <Button className="bg-[#5850ec] hover:bg-[#5850ec]/90 text-xs font-bold uppercase tracking-wider h-10 px-6 rounded-full">Criar Novo Complemento</Button>
            </TabsContent>

            <TabsContent value="disponibilidade" className="m-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block">Status</label>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                      <button 
                        onClick={() => setFormData({ ...formData, status: 'pausado' })}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${formData.status === 'pausado' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >Pausado</button>
                      <button 
                        onClick={() => setFormData({ ...formData, status: 'ativo' })}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${formData.status === 'ativo' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >Ativo</button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block">Exibir no cardápio</label>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                      <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md text-gray-400">Não</button>
                      <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-green-500 text-white shadow-sm">Sim</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 max-w-[200px]">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Qtd. máxima por pedido</label>
                      <Input className="h-10 border-gray-200" placeholder="" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Qtd. mínima por pedido</label>
                      <Input className="h-10 border-gray-200" placeholder="" />
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 p-0 h-auto text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                    onClick={() => {
                      if (confirm("Tem certeza que deseja excluir este produto?")) {
                        if (product?.id) {
                          onDelete(product.id);
                        }
                        onClose();
                      }
                    }}
                  >
                    <Trash2 size={16} />
                    Excluir Produto
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Disponibilidade por dia</label>
                      <Button variant="ghost" className="h-8 bg-[#5850ec] text-white hover:bg-[#5850ec]/90 text-[10px] font-bold uppercase tracking-wider px-3 rounded-full">Horários</Button>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="flex items-center gap-2">
                          <Checkbox checked id={`day-${day}`} className="h-4 w-4 rounded border-gray-300 text-[#5850ec] focus:ring-[#5850ec]" />
                          <label htmlFor={`day-${day}`} className="text-xs font-medium text-gray-700">{day}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block">Disponibilidade por unidade</label>
                    <div className="flex items-center gap-2">
                      <Checkbox checked id="unidade-main" className="h-4 w-4 rounded border-gray-300 text-[#5850ec] focus:ring-[#5850ec]" />
                      <label htmlFor="unidade-main" className="text-xs font-medium text-gray-700">SaborosaMente Atacado de Refeições e Sopas Congeladas</label>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block">Link de compartilhamento:</label>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-gray-400 truncate flex-1">
                        {product?.id ? `https://prefirodelivery.com/saborosamente/produto/${product.id}` : 'Disponível após salvar'}
                      </p>
                      <Button variant="outline" className="h-8 bg-[#5850ec] text-white hover:bg-[#5850ec]/90 text-[10px] font-bold uppercase tracking-wider px-4 rounded-full border-none">Copiar Link</Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="destaque" className="m-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-xl">
                    <div className="space-y-0.5">
                      <label className="text-sm font-semibold text-gray-700">Destaque na Home</label>
                      <p className="text-xs text-gray-500">Exibir este produto na seção "Mais Pedidos"</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-xl">
                    <div className="space-y-0.5">
                      <label className="text-sm font-semibold text-gray-700">Novidade</label>
                      <p className="text-xs text-gray-500">Sinalizar como novo item no cardápio</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Star size={20} />
                    <span className="text-sm font-bold uppercase tracking-wider">Sugestões de Venda</span>
                  </div>
                  <p className="text-xs text-purple-800/70">Este produto será sugerido no carrinho quando o cliente estiver finalizando o pedido.</p>
                  <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-100 text-xs font-bold uppercase py-6">Configurar Gatilhos</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="estoque" className="m-0 space-y-6">
              <div className="bg-blue-50/50 p-4 rounded-lg flex items-start gap-3">
                <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-blue-900">Gerenciamento de Estoque</p>
                  <p className="text-xs text-blue-700">Ative o controle de estoque para este produto. Quando o saldo chegar a zero, o produto será pausado automaticamente.</p>
                </div>
              </div>

              <div className="space-y-6 max-w-md">
                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <div className="space-y-0.5">
                    <label className="text-sm font-semibold text-gray-700">Ativar Controle de Estoque</label>
                    <p className="text-xs text-gray-500">Deduzir do saldo a cada venda</p>
                  </div>
                  <Switch 
                    checked={formData.controle_estoque} 
                    onCheckedChange={(checked) => setFormData({ ...formData, controle_estoque: checked })}
                  />
                </div>

                {formData.controle_estoque && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Quantidade em Estoque</label>
                      <Input 
                        type="number"
                        value={formData.estoque_atual || 0}
                        onChange={(e) => setFormData({ ...formData, estoque_atual: parseInt(e.target.value) })}
                        className="h-10 border-gray-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Aviso de Estoque Baixo</label>
                      <Input 
                        type="number"
                        value={formData.estoque_minimo || 5}
                        onChange={(e) => setFormData({ ...formData, estoque_minimo: parseInt(e.target.value) })}
                        className="h-10 border-gray-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="promocao" className="m-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Valor Promocional (Opcional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                      <Input 
                        placeholder="0,00"
                        value={formData.preco_promocional_formatado || ""}
                        onChange={(e) => setFormData({ ...formData, preco_promocional_formatado: e.target.value })}
                        className="h-10 pl-9 border-gray-200"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">Se preenchido, este valor substituirá o valor original com uma tag de oferta.</p>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-semibold text-gray-700">Frete Grátis</label>
                        <p className="text-xs text-gray-500">Aplicar frete grátis apenas para este produto</p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-semibold text-gray-700">Bloquear Cupom</label>
                        <p className="text-xs text-gray-500">Não permitir uso de cupons neste item</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-orange-600">
                    <Tag size={20} />
                    <span className="text-sm font-bold uppercase tracking-wider">Agendar Promoção</span>
                  </div>
                  <p className="text-xs text-orange-800/70">Defina um período específico para que esta promoção fique ativa automaticamente no site.</p>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-orange-800/50">Data de Início</label>
                      <Input type="date" className="h-9 border-orange-200 bg-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-orange-800/50">Data de Término</label>
                      <Input type="date" className="h-9 border-orange-200 bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="integracao" className="m-0 space-y-6">
              <div className="max-w-md space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Código PDV / Integração</label>
                  <Input placeholder="Ex: IFD-123" className="h-10 border-gray-200" />
                  <p className="text-[10px] text-gray-400">Código usado para sincronizar com sistemas externos como iFood, 99Food ou ERP.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contabilidade" className="m-0 space-y-6">
              <div className="max-w-md space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Preço de Custo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                    <Input placeholder="0,00" className="h-10 pl-9 border-gray-200" />
                  </div>
                  <p className="text-[10px] text-gray-400">Este valor não é exibido para o cliente. Usado apenas para relatórios de lucratividade.</p>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50/50 flex flex-row items-center justify-between sm:justify-between gap-4">
          <Button variant="outline" onClick={onClose} className="rounded-full px-6 h-10 text-xs font-bold uppercase tracking-wider text-gray-500 border-none bg-gray-200/50 hover:bg-gray-200">Cancelar</Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSave} className="rounded-full px-6 h-10 text-xs font-bold uppercase tracking-wider border-[#5850ec] text-[#5850ec] hover:bg-[#5850ec] hover:text-white transition-all flex items-center gap-2">
              <Check size={16} /> Salvar {product ? 'e Fechar' : 'e Criar'}
            </Button>
            <Button onClick={handleSave} className="rounded-full px-8 h-10 text-xs font-bold uppercase tracking-wider bg-[#5850ec] hover:bg-[#5850ec]/90 text-white shadow-lg flex items-center gap-2">
              <Check size={16} /> {product ? 'Salvar Alterações' : 'Adicionar Produto'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function SortableProductRow({ product, onUpdateStatus, onDelete, onUpdatePrice, onEdit }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="group flex items-center px-6 py-4 hover:bg-gray-50/50 transition-colors bg-white border-b border-gray-50 last:border-b-0"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab text-gray-300 hover:text-gray-400 transition-colors p-1"
        >
          <GripVertical size={20} />
        </div>
        <div className="h-12 w-12 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
          <img 
            src={product.imagem_url} 
            alt={product.nome} 
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 
            className="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:text-[#5850ec] transition-colors"
            onClick={() => onEdit(product)}
          >
            {product.nome}
          </h3>
          {product.peso && (
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
              {product.peso}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white shadow-inner focus-within:ring-1 focus-within:ring-primary/20">
          <span className="text-xs font-medium text-gray-400">R$</span>
          <input 
            type="text" 
            defaultValue={product.preco.toFixed(2).replace('.', ',')}
            onBlur={(e) => onUpdatePrice(product.id, e.target.value)}
            className="w-16 text-sm font-bold text-gray-700 outline-none text-right bg-transparent"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => onUpdateStatus(product.id, 'pausado')}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-md ${
              product.status === 'pausado' 
                ? 'bg-red-500 text-white shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Pausado
          </button>
          <button 
            onClick={() => onUpdateStatus(product.id, 'ativo')}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-md ${
              product.status === 'ativo' 
                ? 'bg-green-500 text-white shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Ativo
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-primary rounded-full">
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem 
              className="text-xs font-medium uppercase tracking-wider"
              onClick={() => onEdit(product)}
            >
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-medium uppercase tracking-wider">
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-xs font-medium uppercase tracking-wider text-red-600 focus:text-red-600"
              onClick={() => onDelete(product.id)}
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => getAdminProducts(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categorias").select("*").order("ordem");
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from("produtos")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-products"] });
      const previousProducts = queryClient.getQueryData(["admin-products"]);
      queryClient.setQueryData(["admin-products"], (old: any) => 
        old?.map((p: any) => p.id === id ? { ...p, status } : p)
      );
      return { previousProducts };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(["admin-products"], context.previousProducts);
      }
      toast.error("Erro ao atualizar status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Status atualizado!");
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("produtos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto excluído!");
    },
  });

  const updatePrice = useMutation({
    mutationFn: async ({ id, preco }: { id: string, preco: number }) => {
      const { error } = await supabase
        .from("produtos")
        .update({ preco })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Preço atualizado!");
    },
  });

  const saveProduct = useMutation({
    mutationFn: async (updatedData: any) => {
      const { id, ...data } = updatedData;
      if (id) {
        const { error } = await supabase
          .from("produtos")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("produtos")
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(editingProduct ? "Produto atualizado!" : "Produto criado!");
      setIsEditModalOpen(false);
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar produto: " + error.message);
    }
  });

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const activeItem = products.find((p: any) => p.id === active.id);
      const overItem = products.find((p: any) => p.id === over.id);

      if (activeItem && overItem && activeItem.categoria_id === overItem.categoria_id) {
        const catProducts = products
          .filter((p: any) => p.categoria_id === activeItem.categoria_id)
          .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));

        const oldIndex = catProducts.findIndex((p: any) => p.id === active.id);
        const newIndex = catProducts.findIndex((p: any) => p.id === over.id);

        const newOrder = arrayMove(catProducts, oldIndex, newIndex);

        // Update local state for immediate feedback
        queryClient.setQueryData(["admin-products"], (old: any) => {
          const otherCats = old.filter((p: any) => p.categoria_id !== activeItem.categoria_id);
          const updatedCatProducts = newOrder.map((p, idx) => ({ ...p, ordem: idx }));
          return [...otherCats, ...updatedCatProducts];
        });

        // Persist to DB
        try {
          const updates = newOrder.map((p, idx) => ({
            id: p.id,
            ordem: idx
          }));

          for (const update of updates) {
            await supabase
              .from("produtos")
              .update({ ordem: update.ordem })
              .eq("id", update.id);
          }
          toast.success("Ordem atualizada!");
        } catch (error) {
          console.error("Erro ao salvar ordem:", error);
          toast.error("Erro ao salvar nova ordem");
          queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        }
      }
    }
  };

  const filteredProducts = useMemo(() => 
    products.filter((p: any) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.categorias?.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [products, searchTerm]
  );

  const groupedProducts = useMemo(() => 
    categories.map((cat: any) => ({
      category: cat,
      products: filteredProducts
        .filter((p: any) => p.categoria_id === cat.id)
        .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0))
    })),
    [categories, filteredProducts]
  );

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#5850ec]">Cardápio</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 flex items-center gap-2">
            <span className="text-lg">↻</span>
            ORDENAR CATEGORIAS
          </Button>
          <Button className="bg-[#5850ec] hover:bg-[#5850ec]/90 flex items-center gap-2 rounded-md px-4 h-10 text-xs font-bold uppercase tracking-wider text-white">
            <Plus size={18} />
            ADICIONAR CATEGORIA
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Buscar por nome ou categoria..." 
              className="pl-10 rounded-lg border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button variant="outline" className="flex items-center gap-2 flex-1 md:flex-initial rounded-lg border-gray-200">
              <Filter size={18} />
              Filtros
            </Button>
            <div className="text-sm font-medium text-muted-foreground whitespace-nowrap bg-gray-100 px-3 py-1.5 rounded-md">
              {filteredProducts.length} produtos
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <span className="text-muted-foreground font-medium">Carregando seu cardápio...</span>
        </div>
      ) : groupedProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-20 text-center">
          <Utensils className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-muted-foreground font-medium">Nenhum produto encontrado para sua busca.</p>
        </div>
      ) : (
        <div className="space-y-10 pb-20">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            {groupedProducts.map(({ category, products: catProducts }: any) => (
              <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 md:px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-sm font-semibold text-[#5850ec] uppercase tracking-wide">
                    {category.nome}
                  </h2>
                  <div className="flex items-center gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical size={16} className="text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-xs font-bold uppercase tracking-tighter">Editar Categoria</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs font-bold uppercase tracking-tighter text-red-600">Excluir Categoria</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-50">
                  <SortableContext 
                    items={catProducts.map((p: any) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {catProducts.map((product: any) => (
                      <SortableProductRow 
                        key={product.id} 
                        product={product} 
                        onUpdateStatus={(id: string, status: string) => updateStatus.mutate({ id, status })}
                        onEdit={handleEdit}
                        onUpdatePrice={(id: string, val: string) => {
                          const price = parseFloat(val.replace(',', '.'));
                          if (!isNaN(price)) updatePrice.mutate({ id, preco: price });
                        }}
                      />
                    ))}
                  </SortableContext>
                </div>

                <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      setEditingProduct(null);
                      setIsEditModalOpen(true);
                      // Pre-set category for new item
                      setTimeout(() => {
                        // This will be handled by useMemo in modal
                      }, 0);
                    }}
                    className="flex items-center gap-2 text-xs font-semibold text-[#0891b2] hover:text-[#0891b2]/80 transition-colors uppercase tracking-wider"
                  >
                    <Plus size={14} strokeWidth={3} />
                    Adicionar novo item
                  </button>
                </div>
              </div>
            ))}
          </DndContext>
        </div>
      )}
      <ProductEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        categories={categories}
        onSave={(data: any) => saveProduct.mutate(data)}
        onDelete={(id: string) => deleteProduct.mutate(id)}
      />
    </div>
  );
}
