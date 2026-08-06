import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Save, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Palette, 
  Layout, 
  Type, 
  Plus, 
  Trash2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/config/site")({
  component: AdminSiteConfig,
});

function AdminSiteConfig() {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const heroRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (newData: any) => {
      const { error } = await supabase
        .from("site_settings")
        .update(newData)
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    }
  });

  if (isLoading || !formData) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-[#5850ec]" size={40} />
      </div>
    );
  }

  const handleImageUpload = async (file: File, field: string) => {
    try {
      setIsUploading(prev => ({ ...prev, [field]: true }));
      const fileExt = file.name.split('.').pop();
      const fileName = `site_${field}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("product-images") // Usando o mesmo bucket já existente
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      setFormData({ ...formData, [field]: publicUrl });
      toast.success("Imagem enviada!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setIsUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleFeatureChange = (index: number, field: string, value: string) => {
    const newFeatures = [...formData.hero_features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFormData({ ...formData, hero_features: newFeatures });
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      hero_features: [...formData.hero_features, { label: "", value: "" }]
    });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.hero_features.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, hero_features: newFeatures });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#5850ec]">Configuração do Site</h1>
          <p className="text-muted-foreground">Personalize o topo e rodapé da página inicial.</p>
        </div>
        <Button 
          onClick={() => updateMutation.mutate(formData)}
          disabled={updateMutation.isPending}
          className="bg-[#5850ec] hover:bg-[#4338ca]"
        >
          {updateMutation.isPending ? <Loader2 className="mr-2 animate-spin size-4" /> : <Save className="mr-2 size-4" />}
          Salvar Alterações
        </Button>
      </div>

      <Tabs defaultValue="header" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="header">Topo / Anúncio</TabsTrigger>
          <TabsTrigger value="hero">Capa e Banners</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="mt-6 space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Type className="text-[#5850ec]" size={20} /> Barra de Anúncio (Topo)
            </h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Texto do Anúncio</Label>
                <Input 
                  value={formData.announcement_text} 
                  onChange={e => setFormData({ ...formData, announcement_text: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      className="w-12 h-10 p-1" 
                      value={formData.announcement_bg_color} 
                      onChange={e => setFormData({ ...formData, announcement_bg_color: e.target.value })}
                    />
                    <Input value={formData.announcement_bg_color} onChange={e => setFormData({ ...formData, announcement_bg_color: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor do Texto</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      className="w-12 h-10 p-1" 
                      value={formData.announcement_text_color} 
                      onChange={e => setFormData({ ...formData, announcement_text_color: e.target.value })}
                    />
                    <Input value={formData.announcement_text_color} onChange={e => setFormData({ ...formData, announcement_text_color: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Layout className="text-[#5850ec]" size={20} /> Menu de Navegação
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cor de Fundo Menu</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    className="w-12 h-10 p-1" 
                    value={formData.nav_bg_color} 
                    onChange={e => setFormData({ ...formData, nav_bg_color: e.target.value })}
                  />
                  <Input value={formData.nav_bg_color} onChange={e => setFormData({ ...formData, nav_bg_color: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor do Texto/Links</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    className="w-12 h-10 p-1" 
                    value={formData.nav_text_color} 
                    onChange={e => setFormData({ ...formData, nav_text_color: e.target.value })}
                  />
                  <Input value={formData.nav_text_color} onChange={e => setFormData({ ...formData, nav_text_color: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="hero" className="mt-6 space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ImageIcon className="text-[#5850ec]" size={20} /> Imagens da Capa
            </h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Imagem de Capa (Banner)</Label>
                <div className="relative aspect-video rounded-xl bg-gray-100 overflow-hidden border">
                  {formData.hero_image_url ? (
                    <img src={formData.hero_image_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Sem imagem</div>
                  )}
                  <Button 
                    size="sm" 
                    className="absolute bottom-2 right-2 bg-white text-black hover:bg-gray-100"
                    onClick={() => heroRef.current?.click()}
                    disabled={isUploading.hero_image_url}
                  >
                    {isUploading.hero_image_url ? <Loader2 className="animate-spin size-4" /> : <Upload size={4} className="mr-2" />}
                    Trocar Capa
                  </Button>
                  <input ref={heroRef} type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], "hero_image_url")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Foto de Perfil (Centralizada)</Label>
                <div className="relative aspect-square w-32 mx-auto rounded-full bg-gray-100 overflow-hidden border">
                  {formData.profile_image_url ? (
                    <img src={formData.profile_image_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">PFP</div>
                  )}
                  <Button 
                    size="icon" 
                    className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 bg-black/40 text-white rounded-full transition-opacity"
                    onClick={() => profileRef.current?.click()}
                    disabled={isUploading.profile_image_url}
                  >
                    <Upload size={20} />
                  </Button>
                  <input ref={profileRef} type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], "profile_image_url")} />
                </div>
                <p className="text-center text-[10px] text-muted-foreground">Aparecerá centralizada sobre a capa</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Palette className="text-[#5850ec]" size={20} /> Selos e Recursos (Ícones)
            </h3>
            <div className="space-y-3">
              {formData.hero_features.map((feature: any, index: number) => (
                <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-xl">
                  <div className="flex-1 grid gap-2">
                    <Input 
                      placeholder="Título (Ex: 6 MESES DE)" 
                      value={feature.label} 
                      onChange={e => handleFeatureChange(index, "label", e.target.value)}
                    />
                    <Input 
                      placeholder="Valor (Ex: VALIDADE)" 
                      value={feature.value} 
                      onChange={e => handleFeatureChange(index, "value", e.target.value)}
                    />
                  </div>
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => removeFeature(index)}>
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full border-dashed" onClick={addFeature}>
                <Plus size={18} className="mr-2" /> Adicionar Selo/Recurso
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
