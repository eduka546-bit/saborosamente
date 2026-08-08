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
  AlertCircle,
  MapPin,
  Truck,
  Calendar,
  Users,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { importExistingCustomers } from "@/lib/customers.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/admin/config/site")({
  component: AdminSiteConfig,
});

function AdminSiteConfig() {
  const queryClient = useQueryClient();
  const importFn = useServerFn(importExistingCustomers);
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const [isImporting, setIsImporting] = useState(false);
  const heroRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLInputElement>(null);
  const promoRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const { data: settings, isLoading, error: queryError } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      console.log("Fetching site settings...");
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching site settings:", error);
        throw error;
      }
      
      if (!data) {
        console.log("No site settings found, seeding default...");
        const defaultSettings = {
          announcement_text: "FRETE GRÁTIS ACIMA DE R$ 120,00",
          announcement_bg_color: "#086e45",
          announcement_text_color: "#ffffff",
          nav_bg_color: "#ffffff",
          nav_text_color: "#086e45",
          hero_image_url: "",
          profile_image_url: "",
          hero_features: [
            { label: "6 MESES DE", value: "VALIDADE" },
            { label: "SEM ADIÇÃO DE", value: "CONSERVANTES" },
            { label: "BAIXO TEOR DE", value: "SÓDIO" }
          ],
          promo_banners: [
            { image_url: "", alt: "Banner 1", link: "" },
            { image_url: "", alt: "Banner 2", link: "" },
            { image_url: "", alt: "Banner 3", link: "" }
          ]
        };
        
        const { data: newData, error: insertError } = await supabase
          .from("site_settings")
          .insert(defaultSettings)
          .select()
          .single();
          
        if (insertError) {
          console.error("Error seeding site settings:", insertError);
          throw insertError;
        }
        return newData;
      }
      
      return data;
    },
    retry: 1
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

  if (isLoading || (!formData && !queryError)) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#5850ec]" size={40} />
        <p className="text-muted-foreground animate-pulse">Carregando configurações...</p>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 p-4 text-center">
        <AlertCircle className="text-red-500" size={40} />
        <h2 className="text-xl font-bold">Erro ao carregar configurações</h2>
        <p className="text-muted-foreground max-w-md">
          Não foi possível conectar ao banco de dados para carregar as configurações do site.
        </p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["site-settings"] })}>
          Tentar Novamente
        </Button>
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

  const promoBanners: any[] = Array.isArray(formData.promo_banners) && formData.promo_banners.length === 3
    ? formData.promo_banners
    : [
        { image_url: "", alt: "Banner 1", link: "" },
        { image_url: "", alt: "Banner 2", link: "" },
        { image_url: "", alt: "Banner 3", link: "" },
      ];

  const handlePromoChange = (index: number, field: string, value: string) => {
    const next = promoBanners.map((b, i) => (i === index ? { ...b, [field]: value } : b));
    setFormData({ ...formData, promo_banners: next });
  };

  const handlePromoUpload = async (file: File, index: number) => {
    const key = `promo_${index}`;
    try {
      setIsUploading(prev => ({ ...prev, [key]: true }));
      const fileExt = file.name.split('.').pop();
      const fileName = `site_promo_${index}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName);
      handlePromoChange(index, "image_url", publicUrl);
      toast.success("Imagem enviada!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setIsUploading(prev => ({ ...prev, [key]: false }));
    }
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
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 lg:w-[800px]">
          <TabsTrigger value="header">Topo / Anúncio</TabsTrigger>
          <TabsTrigger value="hero">Capa e Banners</TabsTrigger>
          <TabsTrigger value="info">Info Banners (Home)</TabsTrigger>
          <TabsTrigger value="promos">Carrossel (3 Banners)</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
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

        <TabsContent value="info" className="mt-6 space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Layout className="text-[#5850ec]" size={20} /> Banners de Informação (Carrossel)
            </h3>
            <p className="text-sm text-muted-foreground">Estes são os banners que aparecem logo abaixo do topo na página inicial.</p>
            
            <div className="grid gap-6">
              <div className="p-4 border rounded-xl space-y-3 bg-gray-50">
                <div className="flex items-center gap-2 text-[#086e45] font-bold">
                  <MapPin size={18} /> Taxa de Entrega
                </div>
                <div className="space-y-2">
                  <Label>Texto de Destaque</Label>
                  <Input value="A partir de R$ 8,90" disabled className="bg-white" />
                  <p className="text-[10px] text-muted-foreground italic">* Editável via Banco de Dados no momento</p>
                </div>
              </div>

              <div className="p-4 border rounded-xl space-y-3 bg-gray-50">
                <div className="flex items-center gap-2 text-[#086e45] font-bold">
                  <Truck size={18} /> Formas de Entrega
                </div>
                <div className="space-y-2">
                  <Label>Texto de Destaque</Label>
                  <Input value="Delivery ou Retirada" disabled className="bg-white" />
                </div>
              </div>

              <div className="p-4 border rounded-xl space-y-3 bg-gray-50">
                <div className="flex items-center gap-2 text-[#086e45] font-bold">
                  <Calendar size={18} /> Funcionamento
                </div>
                <div className="space-y-2">
                  <Label>Texto de Destaque</Label>
                  <Input value="Encomendas podem ser feitas em tempo integral!" disabled className="bg-white" />
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
              <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Dica:</strong> No momento, os textos destes banners são baseados nas políticas globais da loja. Você pode ver como eles aparecem na página inicial.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="promos" className="mt-6 space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ImageIcon className="text-[#5850ec]" size={20} /> Carrossel de 3 Banners (Home)
            </h3>
            <p className="text-sm text-muted-foreground">
              Troque as três imagens exibidas abaixo da capa. Proporção recomendada: 4:5 (ex.: 800x1000px).
            </p>

            <div className="grid gap-6 sm:grid-cols-3">
              {promoBanners.map((banner, index) => (
                <div key={index} className="space-y-3 p-3 border rounded-xl bg-gray-50">
                  <Label>Banner {index + 1}</Label>
                  <div className="relative aspect-[4/5] rounded-xl bg-white overflow-hidden border">
                    {banner.image_url ? (
                      <img src={banner.image_url} alt={banner.alt || ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sem imagem</div>
                    )}
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2 bg-white text-black hover:bg-gray-100"
                      onClick={() => promoRefs[index]?.current?.click()}
                      disabled={isUploading[`promo_${index}`]}
                    >
                      {isUploading[`promo_${index}`] ? <Loader2 className="animate-spin size-4" /> : <Upload size={14} className="mr-2" />}
                      Trocar
                    </Button>
                    <input
                      ref={promoRefs[index]}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={e => e.target.files?.[0] && handlePromoUpload(e.target.files[0], index)}
                    />
                  </div>
                  <Input
                    placeholder="Texto alternativo (acessibilidade)"
                    value={banner.alt || ""}
                    onChange={e => handlePromoChange(index, "alt", e.target.value)}
                  />
                  <Input
                    placeholder="Link ao clicar (opcional)"
                    value={banner.link || ""}
                    onChange={e => handlePromoChange(index, "link", e.target.value)}
                  />
                  {banner.image_url && (
                    <Button variant="ghost" size="sm" className="text-red-500 w-full" onClick={() => handlePromoChange(index, "image_url", "")}>
                      <Trash2 size={16} className="mr-2" /> Remover imagem
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

