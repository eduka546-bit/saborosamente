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
  History,
  CreditCard,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { importExistingCustomers } from "@/lib/customers.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/admin/config/site")({
  component: AdminSiteConfig,
  ssr: false,
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

  const {
    data: settings,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      console.log("Fetching site settings...");
      const { data, error } = await supabase.from("site_settings").select("*").maybeSingle();

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
            { label: "BAIXO TEOR DE", value: "SÓDIO" },
          ],
          promo_banners: [
            { image_url: "", alt: "Banner 1", link: "" },
            { image_url: "", alt: "Banner 2", link: "" },
            { image_url: "", alt: "Banner 3", link: "" },
          ],
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
    retry: 1,
  });

  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (newData: any) => {
      const { error } = await supabase.from("site_settings").update(newData).eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
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
      setIsUploading((prev) => ({ ...prev, [field]: true }));
      const fileExt = file.name.split(".").pop();
      const fileName = `site_${field}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images") // Usando o mesmo bucket já existente
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(fileName);

      setFormData({ ...formData, [field]: publicUrl });
      toast.success("Imagem enviada!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setIsUploading((prev) => ({ ...prev, [field]: false }));
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
      hero_features: [...formData.hero_features, { label: "", value: "" }],
    });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.hero_features.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, hero_features: newFeatures });
  };

  const promoBanners: any[] =
    Array.isArray(formData.promo_banners) && formData.promo_banners.length === 3
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
      setIsUploading((prev) => ({ ...prev, [key]: true }));
      const fileExt = file.name.split(".").pop();
      const fileName = `site_promo_${index}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(fileName);
      handlePromoChange(index, "image_url", publicUrl);
      toast.success("Imagem enviada!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setIsUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handlePaymentItemUpload = async (
    file: File,
    type: "method" | "card" | "meal",
    index: number,
  ) => {
    const key = `payment_${type}_${index}`;
    try {
      setIsUploading((prev) => ({ ...prev, [key]: true }));
      const fileExt = file.name.split(".").pop();
      const fileName = `payment_${type}_${index}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(fileName);

      if (type === "method") {
        const newMethods = [...formData.payment_methods];
        newMethods[index] = { ...newMethods[index], icon: publicUrl };
        setFormData({ ...formData, payment_methods: newMethods });
      } else if (type === "card") {
        const newFlags = [...formData.card_flags];
        newFlags[index] = { ...newFlags[index], logo: publicUrl };
        setFormData({ ...formData, card_flags: newFlags });
      } else if (type === "meal") {
        const newFlags = [...formData.meal_flags];
        newFlags[index] = { ...newFlags[index], logo: publicUrl };
        setFormData({ ...formData, meal_flags: newFlags });
      }

      toast.success("Logo atualizada!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setIsUploading((prev) => ({ ...prev, [key]: false }));
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
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 animate-spin size-4" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <Tabs defaultValue="header" className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50 rounded-lg">
          <TabsTrigger value="header" className="text-xs whitespace-nowrap">
            Topo / Anúncio
          </TabsTrigger>
          <TabsTrigger value="hero" className="text-xs whitespace-nowrap">
            Capa e Banners
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs whitespace-nowrap">
            Info Banners
          </TabsTrigger>
          <TabsTrigger value="promos" className="text-xs whitespace-nowrap">
            Carrossel
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs whitespace-nowrap">
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="popup" className="text-xs whitespace-nowrap">
            Popup
          </TabsTrigger>
          <TabsTrigger value="footer" className="text-xs whitespace-nowrap">
            Footer
          </TabsTrigger>
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
                  onChange={(e) => setFormData({ ...formData, announcement_text: e.target.value })}
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
                      onChange={(e) =>
                        setFormData({ ...formData, announcement_bg_color: e.target.value })
                      }
                    />
                    <Input
                      value={formData.announcement_bg_color}
                      onChange={(e) =>
                        setFormData({ ...formData, announcement_bg_color: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor do Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="w-12 h-10 p-1"
                      value={formData.announcement_text_color}
                      onChange={(e) =>
                        setFormData({ ...formData, announcement_text_color: e.target.value })
                      }
                    />
                    <Input
                      value={formData.announcement_text_color}
                      onChange={(e) =>
                        setFormData({ ...formData, announcement_text_color: e.target.value })
                      }
                    />
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
                    onChange={(e) => setFormData({ ...formData, nav_bg_color: e.target.value })}
                  />
                  <Input
                    value={formData.nav_bg_color}
                    onChange={(e) => setFormData({ ...formData, nav_bg_color: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor do Texto/Links</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-12 h-10 p-1"
                    value={formData.nav_text_color}
                    onChange={(e) => setFormData({ ...formData, nav_text_color: e.target.value })}
                  />
                  <Input
                    value={formData.nav_text_color}
                    onChange={(e) => setFormData({ ...formData, nav_text_color: e.target.value })}
                  />
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
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sem imagem
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="absolute bottom-2 right-2 bg-white text-black hover:bg-gray-100"
                    onClick={() => heroRef.current?.click()}
                    disabled={isUploading.hero_image_url}
                  >
                    {isUploading.hero_image_url ? (
                      <Loader2 className="animate-spin size-4" />
                    ) : (
                      <Upload size={4} className="mr-2" />
                    )}
                    Trocar Capa
                  </Button>
                  <input
                    ref={heroRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files?.[0] && handleImageUpload(e.target.files[0], "hero_image_url")
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Foto de Perfil (Centralizada)</Label>
                <div className="relative aspect-square w-32 mx-auto rounded-full bg-gray-100 overflow-hidden border">
                  {formData.profile_image_url ? (
                    <img src={formData.profile_image_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      PFP
                    </div>
                  )}
                  <Button
                    size="icon"
                    className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 bg-black/40 text-white rounded-full transition-opacity"
                    onClick={() => profileRef.current?.click()}
                    disabled={isUploading.profile_image_url}
                  >
                    <Upload size={20} />
                  </Button>
                  <input
                    ref={profileRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      handleImageUpload(e.target.files[0], "profile_image_url")
                    }
                  />
                </div>
                <p className="text-center text-[10px] text-muted-foreground">
                  Aparecerá centralizada sobre a capa
                </p>
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
                      onChange={(e) => handleFeatureChange(index, "label", e.target.value)}
                    />
                    <Input
                      placeholder="Valor (Ex: VALIDADE)"
                      value={feature.value}
                      onChange={(e) => handleFeatureChange(index, "value", e.target.value)}
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-500"
                    onClick={() => removeFeature(index)}
                  >
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
            <p className="text-sm text-muted-foreground">
              Estes são os banners que aparecem logo abaixo do topo na página inicial.
            </p>

            <div className="grid gap-6">
              <div className="p-4 border rounded-xl space-y-3 bg-gray-50">
                <div className="flex items-center gap-2 text-[#086e45] font-bold">
                  <MapPin size={18} /> Taxa de Entrega
                </div>
                <div className="space-y-2">
                  <Label>Texto de Destaque</Label>
                  <Input value="A partir de R$ 8,90" disabled className="bg-white" />
                  <p className="text-[10px] text-muted-foreground italic">
                    * Editável via Banco de Dados no momento
                  </p>
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
                  <Input
                    value="Encomendas podem ser feitas em tempo integral!"
                    disabled
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
              <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Dica:</strong> No momento, os textos destes banners são baseados nas
                políticas globais da loja. Você pode ver como eles aparecem na página inicial.
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
              Troque as três imagens exibidas abaixo da capa. Proporção recomendada: 4:5 (ex.:
              800x1000px).
            </p>

            <div className="grid gap-6 sm:grid-cols-3">
              {promoBanners.map((banner, index) => (
                <div key={index} className="space-y-3 p-3 border rounded-xl bg-gray-50">
                  <Label>Banner {index + 1}</Label>
                  <div className="relative aspect-[4/5] rounded-xl bg-white overflow-hidden border">
                    {banner.image_url ? (
                      <img
                        src={banner.image_url}
                        alt={banner.alt || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        Sem imagem
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2 bg-white text-black hover:bg-gray-100"
                      onClick={() => promoRefs[index]?.current?.click()}
                      disabled={isUploading[`promo_${index}`]}
                    >
                      {isUploading[`promo_${index}`] ? (
                        <Loader2 className="animate-spin size-4" />
                      ) : (
                        <Upload size={14} className="mr-2" />
                      )}
                      Trocar
                    </Button>
                    <input
                      ref={promoRefs[index]}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] && handlePromoUpload(e.target.files[0], index)
                      }
                    />
                  </div>
                  <Input
                    placeholder="Texto alternativo (acessibilidade)"
                    value={banner.alt || ""}
                    onChange={(e) => handlePromoChange(index, "alt", e.target.value)}
                  />
                  <Input
                    placeholder="Link ao clicar (opcional)"
                    value={banner.link || ""}
                    onChange={(e) => handlePromoChange(index, "link", e.target.value)}
                  />
                  {banner.image_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 w-full"
                      onClick={() => handlePromoChange(index, "image_url", "")}
                    >
                      <Trash2 size={16} className="mr-2" /> Remover imagem
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="payments" className="mt-6 space-y-6">
          {/* ── Carrinho Abandonado / Exit Intent ───────────────────────── */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Layout className="text-[#5850ec]" size={20} /> Cupom de Carrinho Abandonado
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Percentual de desconto exibido no modal quando o visitante tenta fechar o site com
                itens no carrinho.
              </p>
            </div>
            <div className="flex items-center gap-4 max-w-xs">
              <div className="flex-1 space-y-1">
                <Label>Desconto do exit intent (%)</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.exit_intent_discount ?? 5}
                  onChange={(e) =>
                    setFormData({ ...formData, exit_intent_discount: Number(e.target.value) })
                  }
                  className="w-32"
                />
              </div>
              <div className="text-sm text-muted-foreground mt-5">
                Ex: <strong>{formData.exit_intent_discount ?? 5}%</strong> → cupom gerado
                automaticamente para reter o cliente
              </div>
            </div>
          </div>

          {/* ── Métodos de Pagamento ─────────────────────────────────────── */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Palette className="text-[#5850ec]" size={20} /> Métodos de Pagamento
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Adicione, edite, reordene e habilite/desabilite o que aparece para o cliente.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const novo = {
                    id: `m-${Date.now()}`,
                    label: "Novo método",
                    hint: "",
                    icon: "",
                    enabled: true,
                  };
                  setFormData({
                    ...formData,
                    payment_methods: [...(formData.payment_methods ?? []), novo],
                  });
                }}
              >
                <Plus size={14} className="mr-1" /> Adicionar
              </Button>
            </div>

            <div className="space-y-3">
              {(formData.payment_methods ?? []).map((method: any, index: number) => (
                <div
                  key={method.id ?? index}
                  className="flex items-center gap-3 p-3 border rounded-xl bg-gray-50"
                >
                  {/* logo com upload ao hover */}
                  <div className="relative group shrink-0">
                    {method.icon ? (
                      <img src={method.icon} className="size-9 object-contain rounded" alt="" />
                    ) : (
                      <div className="size-9 rounded bg-gray-200 flex items-center justify-center text-gray-400">
                        <ImageIcon size={16} />
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded transition-opacity">
                      {isUploading[`payment_method_${index}`] ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Upload size={12} />
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handlePaymentItemUpload(e.target.files[0], "method", index)
                        }
                      />
                    </label>
                  </div>

                  {/* campos editáveis */}
                  <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
                    <Input
                      placeholder="Nome (ex: PIX)"
                      value={method.label ?? ""}
                      onChange={(e) => {
                        const next = [...formData.payment_methods];
                        next[index] = { ...method, label: e.target.value };
                        setFormData({ ...formData, payment_methods: next });
                      }}
                    />
                    <Input
                      placeholder="Subtítulo (ex: Na entrega)"
                      value={method.hint ?? ""}
                      onChange={(e) => {
                        const next = [...formData.payment_methods];
                        next[index] = { ...method, hint: e.target.value };
                        setFormData({ ...formData, payment_methods: next });
                      }}
                    />
                  </div>

                  {/* ativar/desativar */}
                  <Switch
                    checked={method.enabled ?? true}
                    onCheckedChange={(checked: boolean) => {
                      const next = [...formData.payment_methods];
                      next[index] = { ...method, enabled: checked };
                      setFormData({ ...formData, payment_methods: next });
                    }}
                  />

                  {/* excluir */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-600 shrink-0"
                    onClick={() => {
                      const next = formData.payment_methods.filter(
                        (_: any, i: number) => i !== index,
                      );
                      setFormData({ ...formData, payment_methods: next });
                    }}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bandeiras de Cartão ──────────────────────────────────────── */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                💳 Bandeiras de Cartão
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nova = { name: "Nova bandeira", logo: "", enabled: true };
                  setFormData({ ...formData, card_flags: [...(formData.card_flags ?? []), nova] });
                }}
              >
                <Plus size={14} className="mr-1" /> Adicionar
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(formData.card_flags ?? []).map((flag: any, index: number) => (
                <div
                  key={flag.name + index}
                  className="flex flex-col items-center gap-2 p-3 border rounded-xl bg-gray-50 relative"
                >
                  {/* botão excluir */}
                  <button
                    type="button"
                    className="absolute top-1.5 right-1.5 text-red-400 hover:text-red-600 transition-colors"
                    onClick={() => {
                      const next = formData.card_flags.filter((_: any, i: number) => i !== index);
                      setFormData({ ...formData, card_flags: next });
                    }}
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* logo com upload */}
                  <div className="relative group w-full flex justify-center py-2">
                    {flag.logo ? (
                      <img src={flag.logo} className="h-6 object-contain" alt="" />
                    ) : (
                      <div className="h-6 w-16 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                        <ImageIcon size={12} />
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded transition-opacity">
                      {isUploading[`payment_card_${index}`] ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Upload size={12} />
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handlePaymentItemUpload(e.target.files[0], "card", index)
                        }
                      />
                    </label>
                  </div>

                  {/* nome editável */}
                  <Input
                    className="text-center text-xs h-7 px-2"
                    value={flag.name ?? ""}
                    onChange={(e) => {
                      const next = [...formData.card_flags];
                      next[index] = { ...flag, name: e.target.value };
                      setFormData({ ...formData, card_flags: next });
                    }}
                  />

                  <Switch
                    className="scale-75"
                    checked={flag.enabled ?? true}
                    onCheckedChange={(checked: boolean) => {
                      const next = [...formData.card_flags];
                      next[index] = { ...flag, enabled: checked };
                      setFormData({ ...formData, card_flags: next });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Cartões Alimentação ──────────────────────────────────────── */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                🍴 Cartões Alimentação / Refeição
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nova = { name: "Novo cartão", logo: "", enabled: true };
                  setFormData({ ...formData, meal_flags: [...(formData.meal_flags ?? []), nova] });
                }}
              >
                <Plus size={14} className="mr-1" /> Adicionar
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(formData.meal_flags ?? []).map((flag: any, index: number) => (
                <div
                  key={flag.name + index}
                  className="flex flex-col items-center gap-2 p-3 border rounded-xl bg-gray-50 relative"
                >
                  {/* botão excluir */}
                  <button
                    type="button"
                    className="absolute top-1.5 right-1.5 text-red-400 hover:text-red-600 transition-colors"
                    onClick={() => {
                      const next = formData.meal_flags.filter((_: any, i: number) => i !== index);
                      setFormData({ ...formData, meal_flags: next });
                    }}
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* logo com upload */}
                  <div className="relative group w-full flex justify-center py-2">
                    {flag.logo ? (
                      <img src={flag.logo} className="h-6 object-contain" alt="" />
                    ) : (
                      <div className="h-6 w-16 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                        <ImageIcon size={12} />
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded transition-opacity">
                      {isUploading[`payment_meal_${index}`] ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Upload size={12} />
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handlePaymentItemUpload(e.target.files[0], "meal", index)
                        }
                      />
                    </label>
                  </div>

                  {/* nome editável */}
                  <Input
                    className="text-center text-xs h-7 px-2"
                    value={flag.name ?? ""}
                    onChange={(e) => {
                      const next = [...formData.meal_flags];
                      next[index] = { ...flag, name: e.target.value };
                      setFormData({ ...formData, meal_flags: next });
                    }}
                  />

                  <Switch
                    className="scale-75"
                    checked={flag.enabled ?? true}
                    onCheckedChange={(checked: boolean) => {
                      const next = [...formData.meal_flags];
                      next[index] = { ...flag, enabled: checked };
                      setFormData({ ...formData, meal_flags: next });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <TabsContent value="footer" className="mt-6 space-y-6">
          {/* Logo do footer */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ImageIcon className="text-[#5850ec]" size={20} /> Logo do Footer
            </h3>
            <p className="text-sm text-muted-foreground">
              Esta imagem aparece no canto esquerdo do footer. Use um PNG com fundo transparente
              para melhor resultado.
            </p>
            <div className="flex items-center gap-6">
              <div className="relative group w-40 h-24 rounded-xl bg-[#086e45] flex items-center justify-center overflow-hidden border">
                {formData.footer_logo_url || formData.profile_image_url ? (
                  <img
                    src={formData.footer_logo_url || formData.profile_image_url}
                    className="w-full h-full object-contain p-2"
                    alt="Logo footer"
                  />
                ) : (
                  <span className="text-white/40 text-xs">Sem logo</span>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-xl">
                  {isUploading["footer_logo"] ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Upload size={20} />
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploading((prev) => ({ ...prev, footer_logo: true }));
                      try {
                        const ext = file.name.split(".").pop();
                        const fileName = `footer_logo_${Date.now()}.${ext}`;
                        const { error: uploadError } = await supabase.storage
                          .from("product-images")
                          .upload(fileName, file);
                        if (uploadError) throw uploadError;
                        const {
                          data: { publicUrl },
                        } = supabase.storage.from("product-images").getPublicUrl(fileName);
                        setFormData({ ...formData, footer_logo_url: publicUrl });
                        toast.success("Logo atualizada!");
                      } catch (err: any) {
                        toast.error("Erro no upload: " + err.message);
                      } finally {
                        setIsUploading((prev) => ({ ...prev, footer_logo: false }));
                      }
                    }}
                  />
                </label>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Passe o mouse sobre a imagem para trocar.</p>
                <p className="text-amber-600">Dica: use PNG com fundo transparente.</p>
                {(formData.footer_logo_url || formData.profile_image_url) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 px-0"
                    onClick={() => setFormData({ ...formData, footer_logo_url: "" })}
                  >
                    <Trash2 size={13} className="mr-1" /> Remover
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Layout className="text-[#5850ec]" size={20} /> Contato e Redes Sociais
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>WhatsApp (com DDI, ex: 5547991607757)</Label>
                <Input
                  value={formData.footer_whatsapp ?? "5547991607757"}
                  onChange={(e) => setFormData({ ...formData, footer_whatsapp: e.target.value })}
                  placeholder="5547991607757"
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram (sem @)</Label>
                <Input
                  value={formData.footer_instagram ?? "saborosamente.sbs"}
                  onChange={(e) => setFormData({ ...formData, footer_instagram: e.target.value })}
                  placeholder="saborosamente.sbs"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <MapPin className="text-[#5850ec]" size={20} /> Endereço
            </h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Linha 1 (rua e número)</Label>
                <Input
                  value={formData.footer_address_line1 ?? "Rua Augusto Wunderwald, 7"}
                  onChange={(e) =>
                    setFormData({ ...formData, footer_address_line1: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Linha 2 (bairro, cidade)</Label>
                <Input
                  value={formData.footer_address_line2 ?? "Progresso — São Bento do Sul/SC"}
                  onChange={(e) =>
                    setFormData({ ...formData, footer_address_line2: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={formData.footer_address_cep ?? "CEP 89281-060"}
                  onChange={(e) => setFormData({ ...formData, footer_address_cep: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Link do Google Maps</Label>
                <Input
                  value={formData.footer_maps_url ?? ""}
                  onChange={(e) => setFormData({ ...formData, footer_maps_url: e.target.value })}
                  placeholder="https://maps.app.goo.gl/..."
                />
                <p className="text-xs text-muted-foreground">
                  Cole o link de compartilhamento do Google Maps.
                </p>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Type className="text-[#5850ec]" size={20} /> Texto do Footer
            </h3>
            <div className="space-y-2">
              <Label>Descrição abaixo da logo</Label>
              <Input
                value={
                  formData.footer_description ??
                  "Comida de verdade, congelada no ponto certo e entregue na sua porta."
                }
                onChange={(e) => setFormData({ ...formData, footer_description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Crédito (desenvolvedor)</Label>
              <Input
                value={formData.footer_credit ?? "@emf.digital"}
                onChange={(e) => setFormData({ ...formData, footer_credit: e.target.value })}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Ratings de Produtos ── */}
        {/* ── Popup de boas-vindas ── */}
        <TabsContent value="popup" className="mt-6 space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  🎯 Popup de Boas-vindas
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Modal exibido quando o cliente abre o site pela primeira vez.
                </p>
              </div>
              <Switch
                checked={!!(formData.popup_boas_vindas as any)?.ativo}
                onCheckedChange={(v) =>
                  setFormData({
                    ...formData,
                    popup_boas_vindas: { ...((formData.popup_boas_vindas as any) ?? {}), ativo: v },
                  } as any)
                }
              />
            </div>

            {/* Imagem */}
            <div className="space-y-2">
              <Label>Imagem do popup</Label>
              <div className="flex items-center gap-4">
                {(formData.popup_boas_vindas as any)?.imagem_url && (
                  <img
                    src={(formData.popup_boas_vindas as any).imagem_url}
                    alt="Preview popup"
                    className="h-20 w-32 object-cover rounded-xl border"
                  />
                )}
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50 transition-colors text-sm">
                  {isUploading["popup_imagem"] ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  Enviar imagem
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploading((prev) => ({ ...prev, popup_imagem: true }));
                      try {
                        const ext = file.name.split(".").pop();
                        const path = `popup_${Date.now()}.${ext}`;
                        const { error } = await supabase.storage
                          .from("product-images")
                          .upload(path, file);
                        if (error) throw error;
                        const {
                          data: { publicUrl },
                        } = supabase.storage.from("product-images").getPublicUrl(path);
                        setFormData({
                          ...formData,
                          popup_boas_vindas: {
                            ...((formData.popup_boas_vindas as any) ?? {}),
                            imagem_url: publicUrl,
                          },
                        } as any);
                        toast.success("Imagem enviada!");
                      } catch (err: any) {
                        toast.error("Erro: " + err.message);
                      } finally {
                        setIsUploading((prev) => ({ ...prev, popup_imagem: false }));
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Título e texto */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Título (fundo verde)</Label>
                <Input
                  value={(formData.popup_boas_vindas as any)?.titulo ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      popup_boas_vindas: {
                        ...((formData.popup_boas_vindas as any) ?? {}),
                        titulo: e.target.value,
                      },
                    } as any)
                  }
                  placeholder="Somos um Atacado de Marmitas..."
                />
              </div>
              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Input
                  value={(formData.popup_boas_vindas as any)?.texto ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      popup_boas_vindas: {
                        ...((formData.popup_boas_vindas as any) ?? {}),
                        texto: e.target.value,
                      },
                    } as any)
                  }
                  placeholder="Porque comprar de uma só marca..."
                />
              </div>
            </div>

            {/* Itens da lista */}
            <div className="space-y-2">
              <Label>Itens da lista (um por linha)</Label>
              <textarea
                rows={5}
                value={((formData.popup_boas_vindas as any)?.itens ?? []).join("\n")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    popup_boas_vindas: {
                      ...((formData.popup_boas_vindas as any) ?? {}),
                      itens: e.target.value.split("\n"),
                    },
                  } as any)
                }
                placeholder={`Selecionamos +60 opções de 3 marcas diferentes\nEmbalagens seguras, livres de BPA\nSão entregas congeladas com 6 meses de validade`}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30 resize-none"
              />
            </div>

            {/* Cupom */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Texto antes do cupom</Label>
                <Input
                  value={(formData.popup_boas_vindas as any)?.cupom_texto ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      popup_boas_vindas: {
                        ...((formData.popup_boas_vindas as any) ?? {}),
                        cupom_texto: e.target.value,
                      },
                    } as any)
                  }
                  placeholder="Primeira compra? Use o cupom:"
                />
              </div>
              <div className="space-y-2">
                <Label>Código do cupom</Label>
                <Input
                  value={(formData.popup_boas_vindas as any)?.cupom_codigo ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      popup_boas_vindas: {
                        ...((formData.popup_boas_vindas as any) ?? {}),
                        cupom_codigo: e.target.value.toUpperCase(),
                      },
                    } as any)
                  }
                  placeholder="PRIMEIRACOMPRA"
                  className="font-mono font-bold tracking-widest"
                />
              </div>
              <div className="space-y-2">
                <Label>Desconto exibido</Label>
                <Input
                  value={(formData.popup_boas_vindas as any)?.cupom_desconto ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      popup_boas_vindas: {
                        ...((formData.popup_boas_vindas as any) ?? {}),
                        cupom_desconto: e.target.value,
                      },
                    } as any)
                  }
                  placeholder="5% de desconto"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Número WhatsApp (com DDI)</Label>
                <Input
                  value={(formData.popup_boas_vindas as any)?.whatsapp ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      popup_boas_vindas: {
                        ...((formData.popup_boas_vindas as any) ?? {}),
                        whatsapp: e.target.value,
                      },
                    } as any)
                  }
                  placeholder="5547999999999"
                />
              </div>
              <div className="space-y-2">
                <Label>Texto do WhatsApp</Label>
                <Input
                  value={(formData.popup_boas_vindas as any)?.whatsapp_texto ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      popup_boas_vindas: {
                        ...((formData.popup_boas_vindas as any) ?? {}),
                        whatsapp_texto: e.target.value,
                      },
                    } as any)
                  }
                  placeholder="Marmitas personalizadas? WhatsApp:"
                />
              </div>
            </div>

            {/* Botão e delay */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Texto do botão</Label>
                <Input
                  value={(formData.popup_boas_vindas as any)?.botao_texto ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      popup_boas_vindas: {
                        ...((formData.popup_boas_vindas as any) ?? {}),
                        botao_texto: e.target.value,
                      },
                    } as any)
                  }
                  placeholder="Ver cardápio"
                />
              </div>
              <div className="space-y-2">
                <Label>Link do botão</Label>
                <Input
                  value={(formData.popup_boas_vindas as any)?.botao_link ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      popup_boas_vindas: {
                        ...((formData.popup_boas_vindas as any) ?? {}),
                        botao_link: e.target.value,
                      },
                    } as any)
                  }
                  placeholder="#cardapio"
                />
              </div>
              <div className="space-y-2">
                <Label>Delay de abertura (segundos)</Label>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  value={(formData.popup_boas_vindas as any)?.delay_segundos ?? 1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      popup_boas_vindas: {
                        ...((formData.popup_boas_vindas as any) ?? {}),
                        delay_segundos: Number(e.target.value),
                      },
                    } as any)
                  }
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Componente para editar ratings de produtos
// ──────────────────────────────────────────────────────────────────
function ProductRatingsTab({ settings, formData, setFormData }: any) {
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await supabase.from("produtos").select("*").order("nome");
        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error("Error loading products:", err);
        toast.error("Erro ao carregar produtos");
      } finally {
        setIsLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  const handleRatingChange = async (productId: string | number, newRating: number) => {
    try {
      // Atualiza o rating no banco de dados
      const { error } = await supabase
        .from("produtos")
        .update({ rating: newRating })
        .eq("id", productId);

      if (error) throw error;

      // Atualiza a lista local
      setProducts(products.map((p) => (p.id === productId ? { ...p, rating: newRating } : p)));

      // Atualiza o cache
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success("Avaliação atualizada!");
    } catch (err: any) {
      toast.error("Erro ao atualizar avaliação: " + err.message);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoadingProducts) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#5850ec]" size={40} />
        <p className="text-muted-foreground animate-pulse">Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Star className="text-sun fill-sun" size={20} /> Avaliações de Produtos
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customize a avaliação (rating) de cada produto. Isso aparece no card e em detalhes.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Pesquisar produto</Label>
        <Input
          placeholder="Digite o nome do produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid gap-4 max-h-[600px] overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 border rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{product.nome}</h4>
                <p className="text-xs text-muted-foreground">{product.categoria}</p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {/* Display current rating */}
                <div className="flex items-center gap-1">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3.5 transition-colors ${
                          i < Math.floor(product.rating || 5.0)
                            ? "fill-sun text-sun"
                            : i < Math.ceil(product.rating || 5.0) &&
                                (product.rating || 5.0) % 1 !== 0
                              ? "fill-sun/50 text-sun"
                              : "text-border"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-foreground w-8 text-right">
                    {(product.rating ?? 5.0).toFixed(1)}
                  </span>
                </div>

                {/* Rating selector */}
                <select
                  value={product.rating ?? 5.0}
                  onChange={(e) => handleRatingChange(product.id, parseFloat(e.target.value))}
                  className="rounded px-2 py-1 text-xs border border-border bg-white text-foreground hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5850ec]/30"
                >
                  <option value="3.5">3.5</option>
                  <option value="3.8">3.8</option>
                  <option value="4.0">4.0</option>
                  <option value="4.2">4.2</option>
                  <option value="4.5">4.5</option>
                  <option value="4.7">4.7</option>
                  <option value="4.8">4.8</option>
                  <option value="4.9">4.9</option>
                  <option value="5.0">5.0</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
        <strong>Dica:</strong> As avaliações são exibidas imediatamente no site. Alterações aparecem
        em tempo real nos cards de produtos.
      </div>
    </div>
  );
}
