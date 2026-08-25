import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { H as Plus, Ht as CircleAlert, I as Save, J as Palette, Qt as Calendar, _ as Trash2, ct as LoaderCircle, d as Upload, dt as Image, f as Type, p as Truck, q as PanelsTopLeft, rt as MapPin } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { t as importExistingCustomers } from "./customers.functions-BnXszKzm.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-CCJRliUM.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.config.site-B5y-ePNU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminSiteConfig() {
	const queryClient = useQueryClient();
	useServerFn(importExistingCustomers);
	const [isUploading, setIsUploading] = (0, import_react.useState)({});
	const [isImporting, setIsImporting] = (0, import_react.useState)(false);
	const heroRef = (0, import_react.useRef)(null);
	const profileRef = (0, import_react.useRef)(null);
	const promoRefs = [
		(0, import_react.useRef)(null),
		(0, import_react.useRef)(null),
		(0, import_react.useRef)(null)
	];
	const { data: settings, isLoading, error: queryError } = useQuery({
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
				const { data: newData, error: insertError } = await supabase.from("site_settings").insert({
					announcement_text: "FRETE GRÁTIS ACIMA DE R$ 120,00",
					announcement_bg_color: "#086e45",
					announcement_text_color: "#ffffff",
					nav_bg_color: "#ffffff",
					nav_text_color: "#086e45",
					hero_image_url: "",
					profile_image_url: "",
					hero_features: [
						{
							label: "6 MESES DE",
							value: "VALIDADE"
						},
						{
							label: "SEM ADIÇÃO DE",
							value: "CONSERVANTES"
						},
						{
							label: "BAIXO TEOR DE",
							value: "SÓDIO"
						}
					],
					promo_banners: [
						{
							image_url: "",
							alt: "Banner 1",
							link: ""
						},
						{
							image_url: "",
							alt: "Banner 2",
							link: ""
						},
						{
							image_url: "",
							alt: "Banner 3",
							link: ""
						}
					]
				}).select().single();
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
	const [formData, setFormData] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (settings) setFormData(settings);
	}, [settings]);
	const updateMutation = useMutation({
		mutationFn: async (newData) => {
			const { error } = await supabase.from("site_settings").update(newData).eq("id", settings.id);
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
	if (isLoading || !formData && !queryError) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-[400px] flex-col items-center justify-center gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
			className: "animate-spin text-[#5850ec]",
			size: 40
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted-foreground animate-pulse",
			children: "Carregando configurações..."
		})]
	});
	if (queryError) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-[400px] flex-col items-center justify-center gap-4 p-4 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
				className: "text-red-500",
				size: 40
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl font-bold",
				children: "Erro ao carregar configurações"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted-foreground max-w-md",
				children: "Não foi possível conectar ao banco de dados para carregar as configurações do site."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => queryClient.invalidateQueries({ queryKey: ["site-settings"] }),
				children: "Tentar Novamente"
			})
		]
	});
	const handleImageUpload = async (file, field) => {
		try {
			setIsUploading((prev) => ({
				...prev,
				[field]: true
			}));
			const fileExt = file.name.split(".").pop();
			const fileName = `site_${field}_${Date.now()}.${fileExt}`;
			const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file);
			if (uploadError) throw uploadError;
			const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName);
			setFormData({
				...formData,
				[field]: publicUrl
			});
			toast.success("Imagem enviada!");
		} catch (error) {
			toast.error("Erro no upload: " + error.message);
		} finally {
			setIsUploading((prev) => ({
				...prev,
				[field]: false
			}));
		}
	};
	const handleFeatureChange = (index, field, value) => {
		const newFeatures = [...formData.hero_features];
		newFeatures[index] = {
			...newFeatures[index],
			[field]: value
		};
		setFormData({
			...formData,
			hero_features: newFeatures
		});
	};
	const addFeature = () => {
		setFormData({
			...formData,
			hero_features: [...formData.hero_features, {
				label: "",
				value: ""
			}]
		});
	};
	const removeFeature = (index) => {
		const newFeatures = formData.hero_features.filter((_, i) => i !== index);
		setFormData({
			...formData,
			hero_features: newFeatures
		});
	};
	const promoBanners = Array.isArray(formData.promo_banners) && formData.promo_banners.length === 3 ? formData.promo_banners : [
		{
			image_url: "",
			alt: "Banner 1",
			link: ""
		},
		{
			image_url: "",
			alt: "Banner 2",
			link: ""
		},
		{
			image_url: "",
			alt: "Banner 3",
			link: ""
		}
	];
	const handlePromoChange = (index, field, value) => {
		const next = promoBanners.map((b, i) => i === index ? {
			...b,
			[field]: value
		} : b);
		setFormData({
			...formData,
			promo_banners: next
		});
	};
	const handlePromoUpload = async (file, index) => {
		const key = `promo_${index}`;
		try {
			setIsUploading((prev) => ({
				...prev,
				[key]: true
			}));
			const fileExt = file.name.split(".").pop();
			const fileName = `site_promo_${index}_${Date.now()}.${fileExt}`;
			const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file);
			if (uploadError) throw uploadError;
			const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName);
			handlePromoChange(index, "image_url", publicUrl);
			toast.success("Imagem enviada!");
		} catch (error) {
			toast.error("Erro no upload: " + error.message);
		} finally {
			setIsUploading((prev) => ({
				...prev,
				[key]: false
			}));
		}
	};
	const handlePaymentItemUpload = async (file, type, index) => {
		const key = `payment_${type}_${index}`;
		try {
			setIsUploading((prev) => ({
				...prev,
				[key]: true
			}));
			const fileExt = file.name.split(".").pop();
			const fileName = `payment_${type}_${index}_${Date.now()}.${fileExt}`;
			const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file);
			if (uploadError) throw uploadError;
			const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName);
			if (type === "method") {
				const newMethods = [...formData.payment_methods];
				newMethods[index] = {
					...newMethods[index],
					icon: publicUrl
				};
				setFormData({
					...formData,
					payment_methods: newMethods
				});
			} else if (type === "card") {
				const newFlags = [...formData.card_flags];
				newFlags[index] = {
					...newFlags[index],
					logo: publicUrl
				};
				setFormData({
					...formData,
					card_flags: newFlags
				});
			} else if (type === "meal") {
				const newFlags = [...formData.meal_flags];
				newFlags[index] = {
					...newFlags[index],
					logo: publicUrl
				};
				setFormData({
					...formData,
					meal_flags: newFlags
				});
			}
			toast.success("Logo atualizada!");
		} catch (error) {
			toast.error("Erro no upload: " + error.message);
		} finally {
			setIsUploading((prev) => ({
				...prev,
				[key]: false
			}));
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl px-4 py-8 space-y-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-bold text-[#5850ec]",
				children: "Configuração do Site"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted-foreground",
				children: "Personalize o topo e rodapé da página inicial."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => updateMutation.mutate(formData),
				disabled: updateMutation.isPending,
				className: "bg-[#5850ec] hover:bg-[#4338ca]",
				children: [updateMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 animate-spin size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "mr-2 size-4" }), "Salvar Alterações"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "header",
			className: "w-full",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
					className: "flex flex-wrap gap-1 h-auto p-1 bg-muted/50 rounded-lg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "header",
							className: "text-xs whitespace-nowrap",
							children: "Topo / Anúncio"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "hero",
							className: "text-xs whitespace-nowrap",
							children: "Capa e Banners"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "info",
							className: "text-xs whitespace-nowrap",
							children: "Info Banners"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "promos",
							className: "text-xs whitespace-nowrap",
							children: "Carrossel"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "payments",
							className: "text-xs whitespace-nowrap",
							children: "Pagamentos"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "popup",
							className: "text-xs whitespace-nowrap",
							children: "Popup"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "footer",
							className: "text-xs whitespace-nowrap",
							children: "Footer"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "header",
					className: "mt-6 space-y-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white p-6 rounded-2xl border shadow-sm space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "text-lg font-bold flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, {
								className: "text-[#5850ec]",
								size: 20
							}), " Barra de Anúncio (Topo)"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Texto do Anúncio" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: formData.announcement_text,
									onChange: (e) => setFormData({
										...formData,
										announcement_text: e.target.value
									})
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Cor de Fundo" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "color",
											className: "w-12 h-10 p-1",
											value: formData.announcement_bg_color,
											onChange: (e) => setFormData({
												...formData,
												announcement_bg_color: e.target.value
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: formData.announcement_bg_color,
											onChange: (e) => setFormData({
												...formData,
												announcement_bg_color: e.target.value
											})
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Cor do Texto" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "color",
											className: "w-12 h-10 p-1",
											value: formData.announcement_text_color,
											onChange: (e) => setFormData({
												...formData,
												announcement_text_color: e.target.value
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: formData.announcement_text_color,
											onChange: (e) => setFormData({
												...formData,
												announcement_text_color: e.target.value
											})
										})]
									})]
								})]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white p-6 rounded-2xl border shadow-sm space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "text-lg font-bold flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelsTopLeft, {
								className: "text-[#5850ec]",
								size: 20
							}), " Menu de Navegação"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Cor de Fundo Menu" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "color",
										className: "w-12 h-10 p-1",
										value: formData.nav_bg_color,
										onChange: (e) => setFormData({
											...formData,
											nav_bg_color: e.target.value
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: formData.nav_bg_color,
										onChange: (e) => setFormData({
											...formData,
											nav_bg_color: e.target.value
										})
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Cor do Texto/Links" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "color",
										className: "w-12 h-10 p-1",
										value: formData.nav_text_color,
										onChange: (e) => setFormData({
											...formData,
											nav_text_color: e.target.value
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: formData.nav_text_color,
										onChange: (e) => setFormData({
											...formData,
											nav_text_color: e.target.value
										})
									})]
								})]
							})]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "hero",
					className: "mt-6 space-y-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white p-6 rounded-2xl border shadow-sm space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "text-lg font-bold flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {
								className: "text-[#5850ec]",
								size: 20
							}), " Imagens da Capa"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid sm:grid-cols-2 gap-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Imagem de Capa (Banner)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative aspect-video rounded-xl bg-gray-100 overflow-hidden border",
									children: [
										formData.hero_image_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: formData.hero_image_url,
											className: "w-full h-full object-cover"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-full h-full flex items-center justify-center text-gray-400",
											children: "Sem imagem"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											className: "absolute bottom-2 right-2 bg-white text-black hover:bg-gray-100",
											onClick: () => heroRef.current?.click(),
											disabled: isUploading.hero_image_url,
											children: [isUploading.hero_image_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
												size: 4,
												className: "mr-2"
											}), "Trocar Capa"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											ref: heroRef,
											type: "file",
											className: "hidden",
											accept: "image/*",
											onChange: (e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "hero_image_url")
										})
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Foto de Perfil (Centralizada)" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative aspect-square w-32 mx-auto rounded-full bg-gray-100 overflow-hidden border",
										children: [
											formData.profile_image_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: formData.profile_image_url,
												className: "w-full h-full object-cover"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-full h-full flex items-center justify-center text-gray-400",
												children: "PFP"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												size: "icon",
												className: "absolute inset-0 w-full h-full opacity-0 hover:opacity-100 bg-black/40 text-white rounded-full transition-opacity",
												onClick: () => profileRef.current?.click(),
												disabled: isUploading.profile_image_url,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 20 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												ref: profileRef,
												type: "file",
												className: "hidden",
												accept: "image/*",
												onChange: (e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "profile_image_url")
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-center text-[10px] text-muted-foreground",
										children: "Aparecerá centralizada sobre a capa"
									})
								]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white p-6 rounded-2xl border shadow-sm space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "text-lg font-bold flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, {
								className: "text-[#5850ec]",
								size: 20
							}), " Selos e Recursos (Ícones)"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [formData.hero_features.map((feature, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-3 items-start bg-gray-50 p-3 rounded-xl",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 grid gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "Título (Ex: 6 MESES DE)",
										value: feature.label,
										onChange: (e) => handleFeatureChange(index, "label", e.target.value)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "Valor (Ex: VALIDADE)",
										value: feature.value,
										onChange: (e) => handleFeatureChange(index, "value", e.target.value)
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "icon",
									variant: "ghost",
									className: "text-red-500",
									onClick: () => removeFeature(index),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 18 })
								})]
							}, index)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								className: "w-full border-dashed",
								onClick: addFeature,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
									size: 18,
									className: "mr-2"
								}), " Adicionar Selo/Recurso"]
							})]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "info",
					className: "mt-6 space-y-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white p-6 rounded-2xl border shadow-sm space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "text-lg font-bold flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelsTopLeft, {
									className: "text-[#5850ec]",
									size: 20
								}), " Banners de Informação (Carrossel)"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "Estes são os banners que aparecem logo abaixo do topo na página inicial."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-4 border rounded-xl space-y-3 bg-gray-50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-[#086e45] font-bold",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 18 }), " Taxa de Entrega"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Texto de Destaque" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: "A partir de R$ 8,90",
													disabled: true,
													className: "bg-white"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] text-muted-foreground italic",
													children: "* Editável via Banco de Dados no momento"
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-4 border rounded-xl space-y-3 bg-gray-50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-[#086e45] font-bold",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Truck, { size: 18 }), " Formas de Entrega"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Texto de Destaque" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: "Delivery ou Retirada",
												disabled: true,
												className: "bg-white"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-4 border rounded-xl space-y-3 bg-gray-50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-[#086e45] font-bold",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { size: 18 }), " Funcionamento"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Texto de Destaque" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: "Encomendas podem ser feitas em tempo integral!",
												disabled: true,
												className: "bg-white"
											})]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
									className: "text-amber-500 shrink-0 mt-0.5",
									size: 18
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-amber-700 leading-relaxed",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Dica:" }), " No momento, os textos destes banners são baseados nas políticas globais da loja. Você pode ver como eles aparecem na página inicial."]
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "promos",
					className: "mt-6 space-y-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white p-6 rounded-2xl border shadow-sm space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "text-lg font-bold flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {
									className: "text-[#5850ec]",
									size: 20
								}), " Carrossel de 3 Banners (Home)"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "Troque as três imagens exibidas abaixo da capa. Proporção recomendada: 4:5 (ex.: 800x1000px)."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-6 sm:grid-cols-3",
								children: promoBanners.map((banner, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3 p-3 border rounded-xl bg-gray-50",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, { children: ["Banner ", index + 1] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative aspect-[4/5] rounded-xl bg-white overflow-hidden border",
											children: [
												banner.image_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: banner.image_url,
													alt: banner.alt || "",
													className: "w-full h-full object-cover"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "w-full h-full flex items-center justify-center text-gray-400 text-xs",
													children: "Sem imagem"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													size: "sm",
													className: "absolute bottom-2 right-2 bg-white text-black hover:bg-gray-100",
													onClick: () => promoRefs[index]?.current?.click(),
													disabled: isUploading[`promo_${index}`],
													children: [isUploading[`promo_${index}`] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
														size: 14,
														className: "mr-2"
													}), "Trocar"]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													ref: promoRefs[index],
													type: "file",
													className: "hidden",
													accept: "image/*",
													onChange: (e) => e.target.files?.[0] && handlePromoUpload(e.target.files[0], index)
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "Texto alternativo (acessibilidade)",
											value: banner.alt || "",
											onChange: (e) => handlePromoChange(index, "alt", e.target.value)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "Link ao clicar (opcional)",
											value: banner.link || "",
											onChange: (e) => handlePromoChange(index, "link", e.target.value)
										}),
										banner.image_url && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "ghost",
											size: "sm",
											className: "text-red-500 w-full",
											onClick: () => handlePromoChange(index, "image_url", ""),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
												size: 16,
												className: "mr-2"
											}), " Remover imagem"]
										})
									]
								}, index))
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "payments",
					className: "mt-6 space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white p-6 rounded-2xl border shadow-sm space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "text-lg font-bold flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelsTopLeft, {
									className: "text-[#5850ec]",
									size: 20
								}), " Cupom de Carrinho Abandonado"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground mt-1",
								children: "Percentual de desconto exibido no modal quando o visitante tenta fechar o site com itens no carrinho."
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-4 max-w-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Desconto do exit intent (%)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										min: "1",
										max: "50",
										value: formData.exit_intent_discount ?? 5,
										onChange: (e) => setFormData({
											...formData,
											exit_intent_discount: Number(e.target.value)
										}),
										className: "w-32"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-sm text-muted-foreground mt-5",
									children: [
										"Ex: ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [formData.exit_intent_discount ?? 5, "%"] }),
										" → cupom gerado automaticamente para reter o cliente"
									]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white p-6 rounded-2xl border shadow-sm space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-lg font-bold flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, {
										className: "text-[#5850ec]",
										size: 20
									}), " Métodos de Pagamento"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground mt-1",
									children: "Adicione, edite, reordene e habilite/desabilite o que aparece para o cliente."
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => {
										const novo = {
											id: `m-${Date.now()}`,
											label: "Novo método",
											hint: "",
											icon: "",
											enabled: true
										};
										setFormData({
											...formData,
											payment_methods: [...formData.payment_methods ?? [], novo]
										});
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
										size: 14,
										className: "mr-1"
									}), " Adicionar"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-3",
								children: (formData.payment_methods ?? []).map((method, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 p-3 border rounded-xl bg-gray-50",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative group shrink-0",
											children: [method.icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: method.icon,
												className: "size-9 object-contain rounded",
												alt: ""
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "size-9 rounded bg-gray-200 flex items-center justify-center text-gray-400",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { size: 16 })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded transition-opacity",
												children: [isUploading[`payment_method_${index}`] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
													size: 12,
													className: "animate-spin"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 12 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "file",
													className: "hidden",
													accept: "image/*",
													onChange: (e) => e.target.files?.[0] && handlePaymentItemUpload(e.target.files[0], "method", index)
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 grid grid-cols-2 gap-2 min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "Nome (ex: PIX)",
												value: method.label ?? "",
												onChange: (e) => {
													const next = [...formData.payment_methods];
													next[index] = {
														...method,
														label: e.target.value
													};
													setFormData({
														...formData,
														payment_methods: next
													});
												}
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "Subtítulo (ex: Na entrega)",
												value: method.hint ?? "",
												onChange: (e) => {
													const next = [...formData.payment_methods];
													next[index] = {
														...method,
														hint: e.target.value
													};
													setFormData({
														...formData,
														payment_methods: next
													});
												}
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: method.enabled ?? true,
											onCheckedChange: (checked) => {
												const next = [...formData.payment_methods];
												next[index] = {
													...method,
													enabled: checked
												};
												setFormData({
													...formData,
													payment_methods: next
												});
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "icon",
											className: "text-red-400 hover:text-red-600 shrink-0",
											onClick: () => {
												const next = formData.payment_methods.filter((_, i) => i !== index);
												setFormData({
													...formData,
													payment_methods: next
												});
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 15 })
										})
									]
								}, method.id ?? index))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white p-6 rounded-2xl border shadow-sm space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2",
									children: "💳 Bandeiras de Cartão"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => {
										const nova = {
											name: "Nova bandeira",
											logo: "",
											enabled: true
										};
										setFormData({
											...formData,
											card_flags: [...formData.card_flags ?? [], nova]
										});
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
										size: 14,
										className: "mr-1"
									}), " Adicionar"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-2 md:grid-cols-4 gap-3",
								children: (formData.card_flags ?? []).map((flag, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-center gap-2 p-3 border rounded-xl bg-gray-50 relative",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "absolute top-1.5 right-1.5 text-red-400 hover:text-red-600 transition-colors",
											onClick: () => {
												const next = formData.card_flags.filter((_, i) => i !== index);
												setFormData({
													...formData,
													card_flags: next
												});
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 13 })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative group w-full flex justify-center py-2",
											children: [flag.logo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: flag.logo,
												className: "h-6 object-contain",
												alt: ""
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-6 w-16 bg-gray-200 rounded flex items-center justify-center text-gray-400",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { size: 12 })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded transition-opacity",
												children: [isUploading[`payment_card_${index}`] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
													size: 12,
													className: "animate-spin"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 12 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "file",
													className: "hidden",
													accept: "image/*",
													onChange: (e) => e.target.files?.[0] && handlePaymentItemUpload(e.target.files[0], "card", index)
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "text-center text-xs h-7 px-2",
											value: flag.name ?? "",
											onChange: (e) => {
												const next = [...formData.card_flags];
												next[index] = {
													...flag,
													name: e.target.value
												};
												setFormData({
													...formData,
													card_flags: next
												});
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											className: "scale-75",
											checked: flag.enabled ?? true,
											onCheckedChange: (checked) => {
												const next = [...formData.card_flags];
												next[index] = {
													...flag,
													enabled: checked
												};
												setFormData({
													...formData,
													card_flags: next
												});
											}
										})
									]
								}, flag.name + index))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white p-6 rounded-2xl border shadow-sm space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2",
									children: "🍴 Cartões Alimentação / Refeição"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => {
										const nova = {
											name: "Novo cartão",
											logo: "",
											enabled: true
										};
										setFormData({
											...formData,
											meal_flags: [...formData.meal_flags ?? [], nova]
										});
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
										size: 14,
										className: "mr-1"
									}), " Adicionar"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-2 md:grid-cols-4 gap-3",
								children: (formData.meal_flags ?? []).map((flag, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-center gap-2 p-3 border rounded-xl bg-gray-50 relative",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "absolute top-1.5 right-1.5 text-red-400 hover:text-red-600 transition-colors",
											onClick: () => {
												const next = formData.meal_flags.filter((_, i) => i !== index);
												setFormData({
													...formData,
													meal_flags: next
												});
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 13 })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative group w-full flex justify-center py-2",
											children: [flag.logo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: flag.logo,
												className: "h-6 object-contain",
												alt: ""
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-6 w-16 bg-gray-200 rounded flex items-center justify-center text-gray-400",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { size: 12 })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded transition-opacity",
												children: [isUploading[`payment_meal_${index}`] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
													size: 12,
													className: "animate-spin"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 12 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "file",
													className: "hidden",
													accept: "image/*",
													onChange: (e) => e.target.files?.[0] && handlePaymentItemUpload(e.target.files[0], "meal", index)
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "text-center text-xs h-7 px-2",
											value: flag.name ?? "",
											onChange: (e) => {
												const next = [...formData.meal_flags];
												next[index] = {
													...flag,
													name: e.target.value
												};
												setFormData({
													...formData,
													meal_flags: next
												});
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											className: "scale-75",
											checked: flag.enabled ?? true,
											onCheckedChange: (checked) => {
												const next = [...formData.meal_flags];
												next[index] = {
													...flag,
													enabled: checked
												};
												setFormData({
													...formData,
													meal_flags: next
												});
											}
										})
									]
								}, flag.name + index))
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "footer",
					className: "mt-6 space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white p-6 rounded-2xl border shadow-sm space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-lg font-bold flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {
										className: "text-[#5850ec]",
										size: 20
									}), " Logo do Footer"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground",
									children: "Esta imagem aparece no canto esquerdo do footer. Use um PNG com fundo transparente para melhor resultado."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-6",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative group w-40 h-24 rounded-xl bg-[#086e45] flex items-center justify-center overflow-hidden border",
										children: [formData.footer_logo_url || formData.profile_image_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: formData.footer_logo_url || formData.profile_image_url,
											className: "w-full h-full object-contain p-2",
											alt: "Logo footer"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-white/40 text-xs",
											children: "Sem logo"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-xl",
											children: [isUploading["footer_logo"] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
												size: 20,
												className: "animate-spin"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 20 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "file",
												className: "hidden",
												accept: "image/*",
												onChange: async (e) => {
													const file = e.target.files?.[0];
													if (!file) return;
													setIsUploading((prev) => ({
														...prev,
														footer_logo: true
													}));
													try {
														const ext = file.name.split(".").pop();
														const fileName = `footer_logo_${Date.now()}.${ext}`;
														const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file);
														if (uploadError) throw uploadError;
														const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName);
														setFormData({
															...formData,
															footer_logo_url: publicUrl
														});
														toast.success("Logo atualizada!");
													} catch (err) {
														toast.error("Erro no upload: " + err.message);
													} finally {
														setIsUploading((prev) => ({
															...prev,
															footer_logo: false
														}));
													}
												}
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-xs text-muted-foreground space-y-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Passe o mouse sobre a imagem para trocar." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-amber-600",
												children: "Dica: use PNG com fundo transparente."
											}),
											(formData.footer_logo_url || formData.profile_image_url) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "ghost",
												size: "sm",
												className: "text-red-500 px-0",
												onClick: () => setFormData({
													...formData,
													footer_logo_url: ""
												}),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
													size: 13,
													className: "mr-1"
												}), " Remover"]
											})
										]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white p-6 rounded-2xl border shadow-sm space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "text-lg font-bold flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelsTopLeft, {
									className: "text-[#5850ec]",
									size: 20
								}), " Contato e Redes Sociais"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "WhatsApp (com DDI, ex: 5547991507757)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: formData.footer_whatsapp ?? "5547991507757",
										onChange: (e) => setFormData({
											...formData,
											footer_whatsapp: e.target.value
										}),
										placeholder: "5547991507757"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Instagram (sem @)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: formData.footer_instagram ?? "saborosamente.sbs",
										onChange: (e) => setFormData({
											...formData,
											footer_instagram: e.target.value
										}),
										placeholder: "saborosamente.sbs"
									})]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white p-6 rounded-2xl border shadow-sm space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "text-lg font-bold flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
									className: "text-[#5850ec]",
									size: 20
								}), " Endereço"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Linha 1 (rua e número)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: formData.footer_address_line1 ?? "Rua Augusto Wunderwald, 7",
											onChange: (e) => setFormData({
												...formData,
												footer_address_line1: e.target.value
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Linha 2 (bairro, cidade)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: formData.footer_address_line2 ?? "Progresso — São Bento do Sul/SC",
											onChange: (e) => setFormData({
												...formData,
												footer_address_line2: e.target.value
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "CEP" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: formData.footer_address_cep ?? "CEP 89281-060",
											onChange: (e) => setFormData({
												...formData,
												footer_address_cep: e.target.value
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Link do Google Maps" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: formData.footer_maps_url ?? "",
												onChange: (e) => setFormData({
													...formData,
													footer_maps_url: e.target.value
												}),
												placeholder: "https://maps.app.goo.gl/..."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Cole o link de compartilhamento do Google Maps."
											})
										]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white p-6 rounded-2xl border shadow-sm space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-lg font-bold flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, {
										className: "text-[#5850ec]",
										size: 20
									}), " Texto do Footer"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Descrição abaixo da logo" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: formData.footer_description ?? "Comida de verdade, congelada no ponto certo e entregue na sua porta.",
										onChange: (e) => setFormData({
											...formData,
											footer_description: e.target.value
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Crédito (desenvolvedor)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: formData.footer_credit ?? "@emf.digital",
										onChange: (e) => setFormData({
											...formData,
											footer_credit: e.target.value
										})
									})]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "popup",
					className: "mt-6 space-y-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white p-6 rounded-2xl border shadow-sm space-y-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-lg font-bold flex items-center gap-2",
									children: "🎯 Popup de Boas-vindas"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground mt-1",
									children: "Modal exibido quando o cliente abre o site pela primeira vez."
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: !!formData.popup_boas_vindas?.ativo,
									onCheckedChange: (v) => setFormData({
										...formData,
										popup_boas_vindas: {
											...formData.popup_boas_vindas ?? {},
											ativo: v
										}
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Imagem do popup" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-4",
									children: [formData.popup_boas_vindas?.imagem_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: formData.popup_boas_vindas.imagem_url,
										alt: "Preview popup",
										className: "h-20 w-32 object-cover rounded-xl border"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50 transition-colors text-sm",
										children: [
											isUploading["popup_imagem"] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
												size: 14,
												className: "animate-spin"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 14 }),
											"Enviar imagem",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "file",
												className: "hidden",
												accept: "image/*",
												onChange: async (e) => {
													const file = e.target.files?.[0];
													if (!file) return;
													setIsUploading((prev) => ({
														...prev,
														popup_imagem: true
													}));
													try {
														const ext = file.name.split(".").pop();
														const path = `popup_${Date.now()}.${ext}`;
														const { error } = await supabase.storage.from("product-images").upload(path, file);
														if (error) throw error;
														const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
														setFormData({
															...formData,
															popup_boas_vindas: {
																...formData.popup_boas_vindas ?? {},
																imagem_url: publicUrl
															}
														});
														toast.success("Imagem enviada!");
													} catch (err) {
														toast.error("Erro: " + err.message);
													} finally {
														setIsUploading((prev) => ({
															...prev,
															popup_imagem: false
														}));
													}
												}
											})
										]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Título (fundo verde)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: formData.popup_boas_vindas?.titulo ?? "",
										onChange: (e) => setFormData({
											...formData,
											popup_boas_vindas: {
												...formData.popup_boas_vindas ?? {},
												titulo: e.target.value
											}
										}),
										placeholder: "Somos um Atacado de Marmitas..."
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Subtítulo" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: formData.popup_boas_vindas?.texto ?? "",
										onChange: (e) => setFormData({
											...formData,
											popup_boas_vindas: {
												...formData.popup_boas_vindas ?? {},
												texto: e.target.value
											}
										}),
										placeholder: "Porque comprar de uma só marca..."
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Itens da lista (um por linha)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									rows: 5,
									value: (formData.popup_boas_vindas?.itens ?? []).join("\n"),
									onChange: (e) => setFormData({
										...formData,
										popup_boas_vindas: {
											...formData.popup_boas_vindas ?? {},
											itens: e.target.value.split("\n")
										}
									}),
									placeholder: `Selecionamos +60 opções de 3 marcas diferentes\nEmbalagens seguras, livres de BPA\nSão entregas congeladas com 6 meses de validade`,
									className: "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30 resize-none"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Texto antes do cupom" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: formData.popup_boas_vindas?.cupom_texto ?? "",
											onChange: (e) => setFormData({
												...formData,
												popup_boas_vindas: {
													...formData.popup_boas_vindas ?? {},
													cupom_texto: e.target.value
												}
											}),
											placeholder: "Primeira compra? Use o cupom:"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Código do cupom" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: formData.popup_boas_vindas?.cupom_codigo ?? "",
											onChange: (e) => setFormData({
												...formData,
												popup_boas_vindas: {
													...formData.popup_boas_vindas ?? {},
													cupom_codigo: e.target.value.toUpperCase()
												}
											}),
											placeholder: "PRIMEIRACOMPRA",
											className: "font-mono font-bold tracking-widest"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Desconto exibido" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: formData.popup_boas_vindas?.cupom_desconto ?? "",
											onChange: (e) => setFormData({
												...formData,
												popup_boas_vindas: {
													...formData.popup_boas_vindas ?? {},
													cupom_desconto: e.target.value
												}
											}),
											placeholder: "5% de desconto"
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Número WhatsApp (com DDI)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: formData.popup_boas_vindas?.whatsapp ?? "",
										onChange: (e) => setFormData({
											...formData,
											popup_boas_vindas: {
												...formData.popup_boas_vindas ?? {},
												whatsapp: e.target.value
											}
										}),
										placeholder: "5547999999999"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Texto do WhatsApp" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: formData.popup_boas_vindas?.whatsapp_texto ?? "",
										onChange: (e) => setFormData({
											...formData,
											popup_boas_vindas: {
												...formData.popup_boas_vindas ?? {},
												whatsapp_texto: e.target.value
											}
										}),
										placeholder: "Marmitas personalizadas? WhatsApp:"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Texto do botão" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: formData.popup_boas_vindas?.botao_texto ?? "",
											onChange: (e) => setFormData({
												...formData,
												popup_boas_vindas: {
													...formData.popup_boas_vindas ?? {},
													botao_texto: e.target.value
												}
											}),
											placeholder: "Ver cardápio"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Link do botão" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: formData.popup_boas_vindas?.botao_link ?? "",
											onChange: (e) => setFormData({
												...formData,
												popup_boas_vindas: {
													...formData.popup_boas_vindas ?? {},
													botao_link: e.target.value
												}
											}),
											placeholder: "#cardapio"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Delay de abertura (segundos)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											min: "0",
											max: "30",
											value: formData.popup_boas_vindas?.delay_segundos ?? 1,
											onChange: (e) => setFormData({
												...formData,
												popup_boas_vindas: {
													...formData.popup_boas_vindas ?? {},
													delay_segundos: Number(e.target.value)
												}
											})
										})]
									})
								]
							})
						]
					})
				})
			]
		})]
	});
}
//#endregion
export { AdminSiteConfig as component };
