import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { F as Search, H as Plus, Jt as Check, S as Tag, T as Star, Tt as EllipsisVertical, Y as Package, _ as Trash2, _t as Funnel, ct as LoaderCircle, d as Upload, dt as Image, i as X, mt as GripVertical, o as Utensils, ut as Info } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { a as closestCenter, h as CSS, i as PointerSensor, m as useSensors, p as useSensor, r as KeyboardSensor, t as DndContext } from "../_libs/@dnd-kit/core+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-CCJRliUM.mjs";
import { n as CheckboxIndicator, t as Checkbox$1 } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
import { a as DialogTitle, c as DropdownMenuItem, i as DialogHeader, n as DialogContent, o as DropdownMenu, r as DialogFooter, s as DropdownMenuContent, t as Dialog, u as DropdownMenuTrigger } from "./dropdown-menu-BcaY44CS.mjs";
import { t as getAdminProducts } from "./products.functions-CPJ8Fofb.mjs";
import { a as isValidImageFile, o as optimizeImage, t as formatFileSize } from "./image-optimizer-CaY-Ei4u.mjs";
import { a as verticalListSortingStrategy, i as useSortable, n as arrayMove, r as sortableKeyboardCoordinates, t as SortableContext } from "../_libs/dnd-kit__sortable.mjs";
import { t as restrictToVerticalAxis } from "../_libs/dnd-kit__modifiers.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.produtos-C4xQ3-63.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Checkbox = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
	ref,
	className: cn("grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
		className: cn("grid place-content-center text-current"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
	})
}));
Checkbox.displayName = Checkbox$1.displayName;
function ProductEditModal({ isOpen, onClose, product, categories, onSave, onDelete }) {
	const [formData, setFormData] = (0, import_react.useState)(null);
	const [isUploading, setIsUploading] = (0, import_react.useState)(false);
	const [isUploadingGallery, setIsUploadingGallery] = (0, import_react.useState)(false);
	const [isUploadingSize, setIsUploadingSize] = (0, import_react.useState)({});
	const fileInputRef = (0, import_react.useRef)(null);
	const galleryFileInputRef = (0, import_react.useRef)(null);
	(0, import_react.useMemo)(() => {
		if (product) setFormData({
			...product,
			preco_formatado: product.preco?.toFixed(2).replace(".", ",") || "0,00",
			preco_promocional_formatado: product.preco_promocional?.toFixed(2).replace(".", ",") || "",
			preco_custo_formatado: product.preco_custo?.toFixed(2).replace(".", ",") || "",
			preco_300g_formatado: product.preco_300g?.toFixed(2).replace(".", ",") || "",
			preco_400g_formatado: product.preco_400g?.toFixed(2).replace(".", ",") || "",
			status: (product.status || "ativo").toLowerCase()
		});
		else setFormData({
			nome: "",
			preco: 0,
			preco_formatado: "0,00",
			preco_300g: null,
			preco_300g_formatado: "",
			preco_400g: null,
			preco_400g_formatado: "",
			categoria_id: categories[0]?.id || "",
			status: "ativo",
			imagem_url: "",
			descricao: "",
			informacao_nutricional: "",
			tabela_nutricional: {
				kcal: "",
				carb: "",
				prot: ""
			},
			tabela_nutricional_300g: {
				kcal: "",
				carb: "",
				prot: ""
			},
			tabela_nutricional_400g: {
				kcal: "",
				carb: "",
				prot: ""
			},
			controle_estoque: false,
			estoque_atual: 0,
			estoque_minimo: 5,
			imagens: []
		});
	}, [product, categories]);
	if (!formData) return null;
	const handleImageUpload = async (event) => {
		let file = event.target.files?.[0];
		if (!file) return;
		try {
			setIsUploading(true);
			if (!isValidImageFile(file)) {
				toast.error("Arquivo deve ser uma imagem válida (JPEG, PNG, WebP, GIF)");
				return;
			}
			console.log(`📸 Imagem original: ${formatFileSize(file.size)}`);
			file = await optimizeImage(file, {
				maxWidth: 1200,
				maxHeight: 1200,
				quality: 80,
				format: "webp"
			});
			const fileExt = file.name.split(".").pop();
			const filePath = `${`${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`}`;
			const { data, error } = await supabase.storage.from("product-images").upload(filePath, file);
			if (error) throw error;
			const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(filePath);
			setFormData({
				...formData,
				imagem_url: publicUrl
			});
			toast.success(`Imagem otimizada e enviada com sucesso!`);
		} catch (error) {
			console.error("Erro no upload:", error);
			toast.error("Erro ao enviar imagem: " + (error.message || "Tente novamente"));
		} finally {
			setIsUploading(false);
		}
	};
	const handleGalleryImageUpload = async (event) => {
		let file = event.target.files?.[0];
		if (!file) return;
		try {
			setIsUploadingGallery(true);
			if (!isValidImageFile(file)) {
				toast.error("Arquivo deve ser uma imagem válida");
				return;
			}
			file = await optimizeImage(file, {
				maxWidth: 1200,
				maxHeight: 1200,
				quality: 80,
				format: "webp"
			});
			const fileExt = file.name.split(".").pop();
			const filePath = `gallery/${`${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`}`;
			const { data, error } = await supabase.storage.from("product-images").upload(filePath, file);
			if (error) throw error;
			const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(filePath);
			setFormData({
				...formData,
				imagens: [...formData.imagens || [], publicUrl]
			});
			toast.success("Imagem adicionada à galeria!");
		} catch (error) {
			console.error("Erro no upload da galeria:", error);
			toast.error("Erro ao enviar imagem: " + (error.message || "Tente novamente"));
		} finally {
			setIsUploadingGallery(false);
			if (galleryFileInputRef.current) galleryFileInputRef.current.value = "";
		}
	};
	const handleSizeImageUpload = async (event, sizeField) => {
		let file = event.target.files?.[0];
		if (!file) return;
		setIsUploadingSize((prev) => ({
			...prev,
			[sizeField]: true
		}));
		try {
			if (!isValidImageFile(file)) {
				toast.error("Arquivo deve ser uma imagem válida");
				return;
			}
			file = await optimizeImage(file, {
				maxWidth: 1200,
				maxHeight: 1200,
				quality: 80,
				format: "webp"
			});
			const fileExt = file.name.split(".").pop();
			const fileName = `size_${sizeField}_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
			const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file);
			if (uploadError) throw uploadError;
			const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName);
			setFormData({
				...formData,
				[sizeField]: publicUrl
			});
			toast.success("Imagem otimizada e enviada!");
		} catch (error) {
			toast.error("Erro ao enviar: " + (error.message || "Tente novamente"));
		} finally {
			setIsUploadingSize((prev) => ({
				...prev,
				[sizeField]: false
			}));
			event.target.value = "";
		}
	};
	const handleSave = () => {
		const { preco_formatado, preco_promocional_formatado, preco_custo_formatado, preco_300g_formatado, preco_400g_formatado, categorias, ...rest } = formData;
		if (!formData.nome || !formData.categoria_id) {
			toast.error("Nome e categoria são obrigatórios");
			return;
		}
		const preco = parseFloat(preco_formatado.replace(",", "."));
		const preco_promocional = preco_promocional_formatado ? parseFloat(preco_promocional_formatado.replace(",", ".")) : null;
		const preco_custo = preco_custo_formatado ? parseFloat(preco_custo_formatado.replace(",", ".")) : null;
		const preco_300g = preco_300g_formatado ? parseFloat(preco_300g_formatado.replace(",", ".")) : null;
		const preco_400g = preco_400g_formatado ? parseFloat(preco_400g_formatado.replace(",", ".")) : null;
		if (isNaN(preco)) {
			toast.error("Por favor, insira um preço válido");
			return;
		}
		const status = (formData.status || "ativo").toLowerCase();
		onSave({
			...rest,
			preco,
			preco_promocional,
			preco_custo,
			preco_300g,
			preco_400g,
			status
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: isOpen,
		onOpenChange: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-4xl p-0 overflow-hidden bg-white rounded-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
					className: "px-6 py-4 border-b flex flex-row items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm font-medium text-gray-500",
							children: ["R$ ", formData.preco?.toFixed(2).replace(".", ",") || "0,00"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "hidden",
						children: product ? "Editar Produto" : "Novo Produto"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					defaultValue: "detalhes",
					className: "w-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "w-full justify-start px-6 border-b rounded-none bg-transparent h-12 gap-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "detalhes",
								className: "data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none",
								children: "Detalhes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "complementos",
								className: "data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none",
								children: "Complementos"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "disponibilidade",
								className: "data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none",
								children: "Disponibilidade"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "estoque",
								className: "data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none text-gray-400",
								children: "Estoque"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "destaque",
								className: "data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none text-gray-400",
								children: "Destaque"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "promocao",
								className: "data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none text-gray-400",
								children: "Promoção"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "integracao",
								className: "data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none text-gray-400",
								children: "Integração"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "contabilidade",
								className: "data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 h-full text-xs font-semibold uppercase tracking-wider transition-none text-gray-400",
								children: "Contabilidade"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-6 max-h-[60vh] overflow-y-auto",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "detalhes",
								className: "m-0 space-y-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "aspect-square rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden group",
												children: [formData.imagem_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: formData.imagem_url,
													alt: "Preview",
													className: "w-full h-full object-cover"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {
													className: "text-gray-300",
													size: 48
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
														variant: "secondary",
														size: "sm",
														className: "text-xs font-bold uppercase",
														onClick: () => fileInputRef.current?.click(),
														disabled: isUploading,
														children: [isUploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
															className: "animate-spin mr-2",
															size: 14
														}) : null, "Trocar Imagem Principal"]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "file",
														ref: fileInputRef,
														className: "hidden",
														accept: "image/*",
														onChange: handleImageUpload
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-gray-400 text-center uppercase font-bold tracking-widest",
												children: "Resolução recomendada: 800x800px"
											}),
											(formData.preco_300g || formData.preco_400g) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2 mt-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
														className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1",
														children: [
															"Imagens por Tamanho",
															" ",
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-[8px] text-blue-400 normal-case",
																children: "(opcional)"
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[9px] text-gray-400",
														children: "Se não definida, usa a imagem principal para todos os tamanhos."
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "grid grid-cols-3 gap-2",
														children: [
															{
																field: "imagem_200g",
																label: "P (200g)"
															},
															{
																field: "imagem_300g",
																label: "M (300g)"
															},
															{
																field: "imagem_400g",
																label: "G (400g)"
															}
														].map(({ field, label }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-1",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-[9px] font-bold text-gray-500 text-center",
																children: label
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "relative aspect-square rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden group",
																children: [
																	formData[field] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
																		src: formData[field],
																		className: "w-full h-full object-cover",
																		alt: label
																	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																		className: "w-full h-full flex items-center justify-center text-gray-300",
																		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { size: 20 })
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
																		className: "absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity gap-1",
																		children: [isUploadingSize[field] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
																			size: 14,
																			className: "animate-spin"
																		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 14 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "text-[9px] font-bold",
																			children: "Trocar"
																		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																			type: "file",
																			className: "hidden",
																			accept: "image/*",
																			onChange: (e) => handleSizeImageUpload(e, field)
																		})]
																	}),
																	formData[field] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																		onClick: () => setFormData({
																			...formData,
																			[field]: ""
																		}),
																		className: "absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10",
																		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 10 })
																	})
																]
															})]
														}, field))
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2 mt-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
														className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
														children: "Outras Imagens (Galeria)"
													}),
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid grid-cols-4 gap-2",
														children: [
															formData.imagens?.map((img, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "relative aspect-square rounded-md overflow-hidden border border-gray-200 group",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
																	src: img,
																	className: "w-full h-full object-cover"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																	onClick: () => {
																		const newImgs = [...formData.imagens];
																		newImgs.splice(idx, 1);
																		setFormData({
																			...formData,
																			imagens: newImgs
																		});
																	},
																	className: "absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 10 })
																})]
															}, idx)),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																onClick: () => galleryFileInputRef.current?.click(),
																disabled: isUploadingGallery,
																className: "aspect-square rounded-md border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary transition-colors relative",
																children: isUploadingGallery ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
																	className: "animate-spin",
																	size: 20
																}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 20 })
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																type: "file",
																ref: galleryFileInputRef,
																className: "hidden",
																accept: "image/*",
																onChange: handleGalleryImageUpload
															})
														]
													})
												]
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-6",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "grid grid-cols-1 gap-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
														className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
														children: "Nome *"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: formData.nome,
														onChange: (e) => setFormData({
															...formData,
															nome: e.target.value
														}),
														className: "h-10 border-gray-200"
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 md:grid-cols-3 gap-6",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
															className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
															children: "Valor (200g) *"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "relative",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm",
																children: "R$"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																value: formData.preco_formatado,
																onChange: (e) => setFormData({
																	...formData,
																	preco_formatado: e.target.value
																}),
																className: "h-10 pl-9 border-gray-200"
															})]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
															className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
															children: "Valor (300g)"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "relative",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm",
																children: "R$"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																value: formData.preco_300g_formatado,
																onChange: (e) => setFormData({
																	...formData,
																	preco_300g_formatado: e.target.value
																}),
																className: "h-10 pl-9 border-gray-200"
															})]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
															className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
															children: "Valor (400g)"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "relative",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm",
																children: "R$"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																value: formData.preco_400g_formatado,
																onChange: (e) => setFormData({
																	...formData,
																	preco_400g_formatado: e.target.value
																}),
																className: "h-10 pl-9 border-gray-200"
															})]
														})]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "grid grid-cols-1 gap-6",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
														className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
														children: "Categoria"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
														className: "w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5850ec]/20",
														value: formData.categoria_id,
														onChange: (e) => setFormData({
															...formData,
															categoria_id: e.target.value
														}),
														children: categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: cat.id,
															children: cat.nome
														}, cat.id))
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
												defaultValue: "descricao",
												className: "w-full",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
														className: "bg-transparent h-auto p-0 gap-4 border-b rounded-none mb-4",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
																value: "descricao",
																className: "data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 pb-2 text-xs font-semibold uppercase tracking-wider transition-none",
																children: "Descrição / Ingredientes"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
																value: "nutricional",
																className: "data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 pb-2 text-xs font-semibold uppercase tracking-wider transition-none",
																children: "Tabela Nutricional"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
																value: "restricoes",
																className: "data-[state=active]:border-b-2 data-[state=active]:border-[#5850ec] data-[state=active]:text-[#5850ec] rounded-none bg-transparent px-0 pb-2 text-xs font-semibold uppercase tracking-wider transition-none",
																children: "Restrições"
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
														value: "descricao",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
															className: "w-full min-h-[150px] p-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5850ec]/20 resize-none",
															value: formData.descricao || "",
															onChange: (e) => setFormData({
																...formData,
																descricao: e.target.value
															}),
															placeholder: "Descreva o produto..."
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
														value: "nutricional",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-6",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "rounded-lg border border-gray-100 p-4 space-y-4",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
																		className: "text-[10px] font-bold uppercase text-primary tracking-wider",
																		children: "Tamanho Padrão (200g)"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "grid grid-cols-3 gap-4",
																		children: [
																			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																				className: "space-y-1.5",
																				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																					className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
																					children: "Kcal"
																				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																					value: formData.tabela_nutricional?.kcal || "",
																					onChange: (e) => setFormData({
																						...formData,
																						tabela_nutricional: {
																							...formData.tabela_nutricional,
																							kcal: e.target.value
																						}
																					}),
																					className: "h-8 border-gray-200 text-xs",
																					placeholder: "ex: 350"
																				})]
																			}),
																			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																				className: "space-y-1.5",
																				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																					className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
																					children: "Carboidratos (g)"
																				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																					value: formData.tabela_nutricional?.carb || "",
																					onChange: (e) => setFormData({
																						...formData,
																						tabela_nutricional: {
																							...formData.tabela_nutricional,
																							carb: e.target.value
																						}
																					}),
																					className: "h-8 border-gray-200 text-xs",
																					placeholder: "ex: 45"
																				})]
																			}),
																			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																				className: "space-y-1.5",
																				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																					className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
																					children: "Proteínas (g)"
																				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																					value: formData.tabela_nutricional?.prot || "",
																					onChange: (e) => setFormData({
																						...formData,
																						tabela_nutricional: {
																							...formData.tabela_nutricional,
																							prot: e.target.value
																						}
																					}),
																					className: "h-8 border-gray-200 text-xs",
																					placeholder: "ex: 25"
																				})]
																			})
																		]
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "rounded-lg border border-gray-100 p-4 space-y-4",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
																		className: "text-[10px] font-bold uppercase text-primary tracking-wider",
																		children: "Tamanho 300g"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "grid grid-cols-3 gap-4",
																		children: [
																			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																				className: "space-y-1.5",
																				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																					className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
																					children: "Kcal"
																				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																					value: formData.tabela_nutricional_300g?.kcal || "",
																					onChange: (e) => setFormData({
																						...formData,
																						tabela_nutricional_300g: {
																							...formData.tabela_nutricional_300g,
																							kcal: e.target.value
																						}
																					}),
																					className: "h-8 border-gray-200 text-xs"
																				})]
																			}),
																			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																				className: "space-y-1.5",
																				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																					className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
																					children: "Carb (g)"
																				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																					value: formData.tabela_nutricional_300g?.carb || "",
																					onChange: (e) => setFormData({
																						...formData,
																						tabela_nutricional_300g: {
																							...formData.tabela_nutricional_300g,
																							carb: e.target.value
																						}
																					}),
																					className: "h-8 border-gray-200 text-xs"
																				})]
																			}),
																			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																				className: "space-y-1.5",
																				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																					className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
																					children: "Prot (g)"
																				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																					value: formData.tabela_nutricional_300g?.prot || "",
																					onChange: (e) => setFormData({
																						...formData,
																						tabela_nutricional_300g: {
																							...formData.tabela_nutricional_300g,
																							prot: e.target.value
																						}
																					}),
																					className: "h-8 border-gray-200 text-xs"
																				})]
																			})
																		]
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "rounded-lg border border-gray-100 p-4 space-y-4",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
																		className: "text-[10px] font-bold uppercase text-primary tracking-wider",
																		children: "Tamanho 400g"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "grid grid-cols-3 gap-4",
																		children: [
																			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																				className: "space-y-1.5",
																				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																					className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
																					children: "Kcal"
																				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																					value: formData.tabela_nutricional_400g?.kcal || "",
																					onChange: (e) => setFormData({
																						...formData,
																						tabela_nutricional_400g: {
																							...formData.tabela_nutricional_400g,
																							kcal: e.target.value
																						}
																					}),
																					className: "h-8 border-gray-200 text-xs"
																				})]
																			}),
																			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																				className: "space-y-1.5",
																				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																					className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
																					children: "Carb (g)"
																				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																					value: formData.tabela_nutricional_400g?.carb || "",
																					onChange: (e) => setFormData({
																						...formData,
																						tabela_nutricional_400g: {
																							...formData.tabela_nutricional_400g,
																							carb: e.target.value
																						}
																					}),
																					className: "h-8 border-gray-200 text-xs"
																				})]
																			}),
																			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																				className: "space-y-1.5",
																				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																					className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
																					children: "Prot (g)"
																				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																					value: formData.tabela_nutricional_400g?.prot || "",
																					onChange: (e) => setFormData({
																						...formData,
																						tabela_nutricional_400g: {
																							...formData.tabela_nutricional_400g,
																							prot: e.target.value
																						}
																					}),
																					className: "h-8 border-gray-200 text-xs"
																				})]
																			})
																		]
																	})]
																})
															]
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
														value: "restricoes",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-4",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
																children: "Restrições (ex: Sem Glúten | Sem Lactose)"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																value: formData.informacao_nutricional || "",
																onChange: (e) => setFormData({
																	...formData,
																	informacao_nutricional: e.target.value
																}),
																className: "h-10 border-gray-200",
																placeholder: "ex: Sem Glúten | Sem Lactose"
															})]
														})
													})
												]
											})
										]
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "complementos",
								className: "m-0 space-y-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-sm font-bold uppercase text-gray-400 tracking-wider",
												children: "Grupos de Complementos"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												className: "bg-[#5850ec] hover:bg-[#5850ec]/90 text-[10px] font-bold uppercase tracking-wider h-8 px-4 rounded-full flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), "Vincular Grupo"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center space-y-3 bg-gray-50/30",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "size-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { size: 24 })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-semibold text-gray-600",
													children: "Nenhum complemento vinculado"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-gray-400 max-w-[280px] mt-1",
													children: "Adicione grupos de complementos (como \"Escolha sua bebida\" ou \"Adicionais\") para oferecer mais opções aos seus clientes."
												})] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "outline",
													className: "text-xs font-bold uppercase tracking-wider h-9 px-5 rounded-full mt-2",
													children: "Ver todos os complementos"
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-4 rounded-lg bg-blue-50 border border-blue-100 flex gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
												className: "text-blue-500 shrink-0",
												size: 18
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-blue-700 leading-relaxed",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Dica:" }),
													" Você pode gerenciar todos os seus complementos globalmente na seção",
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
														to: "/admin",
														className: "font-bold underline ml-1",
														children: [
															"Configurações ",
															" > ",
															" Complementos"
														]
													}),
													"."
												]
											})]
										})
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "disponibilidade",
								className: "m-0 space-y-8",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 md:grid-cols-2 gap-12",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-6",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider block",
													children: "Status"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => setFormData({
															...formData,
															status: "pausado"
														}),
														className: `px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${formData.status === "pausado" ? "bg-red-500 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`,
														children: "Pausado"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => setFormData({
															...formData,
															status: "ativo"
														}),
														className: `px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${formData.status === "ativo" ? "bg-green-500 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`,
														children: "Ativo"
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider block",
													children: "Exibir no cardápio"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														className: "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md text-gray-400",
														children: "Não"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														className: "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-green-500 text-white shadow-sm",
														children: "Sim"
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-1 gap-4 max-w-[200px]",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
														className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
														children: "Qtd. máxima por pedido"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														className: "h-10 border-gray-200",
														placeholder: ""
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
														className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
														children: "Qtd. mínima por pedido"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														className: "h-10 border-gray-200",
														placeholder: ""
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "ghost",
												className: "text-red-500 hover:text-red-600 hover:bg-red-50 p-0 h-auto text-xs font-bold uppercase tracking-wider flex items-center gap-2",
												onClick: () => {
													if (confirm("Tem certeza que deseja excluir este produto?")) {
														if (product?.id) onDelete(product.id);
														onClose();
													}
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 16 }), "Excluir Produto"]
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-6",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex items-center justify-between",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
														className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
														children: "Disponibilidade por dia"
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex flex-wrap gap-4",
													children: [
														"Seg",
														"Ter",
														"Qua",
														"Qui",
														"Sex",
														"Sáb",
														"Dom"
													].map((day, idx) => {
														const isChecked = (formData.dias_disponiveis ?? [
															true,
															true,
															true,
															true,
															true,
															true,
															true
														])[idx] !== false;
														return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
																id: `day-${day}`,
																checked: isChecked,
																onCheckedChange: (checked) => {
																	const next = [...formData.dias_disponiveis ?? [
																		true,
																		true,
																		true,
																		true,
																		true,
																		true,
																		true
																	]];
																	next[idx] = !!checked;
																	setFormData({
																		...formData,
																		dias_disponiveis: next
																	});
																},
																className: "h-4 w-4 rounded border-gray-300 text-[#5850ec] focus:ring-[#5850ec]"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																htmlFor: `day-${day}`,
																className: "text-xs font-medium text-gray-700 cursor-pointer",
																children: day
															})]
														}, day);
													})
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-4 pt-4 border-t",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider block",
													children: "Disponibilidade por unidade"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
														checked: true,
														id: "unidade-main",
														className: "h-4 w-4 rounded border-gray-300 text-[#5850ec] focus:ring-[#5850ec]"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
														htmlFor: "unidade-main",
														className: "text-xs font-medium text-gray-700",
														children: "SaborosaMente Atacado de Refeições e Sopas Congeladas"
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "pt-4 border-t flex flex-col gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider block",
													children: "Link de compartilhamento:"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[10px] text-gray-400 truncate flex-1",
														children: product?.id ? `https://prefirodelivery.com/saborosamente/produto/${product.id}` : "Disponível após salvar"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "outline",
														className: "h-8 bg-[#5850ec] text-white hover:bg-[#5850ec]/90 text-[10px] font-bold uppercase tracking-wider px-4 rounded-full border-none",
														children: "Copiar Link"
													})]
												})]
											})
										]
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "destaque",
								className: "m-0 space-y-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 md:grid-cols-2 gap-8",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between p-4 border rounded-xl",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-0.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													className: "text-sm font-semibold text-gray-700",
													children: "Destaque na Home"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-gray-500",
													children: "Exibir este produto na seção \"Mais Pedidos\""
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
												checked: !!formData.is_destaque,
												onCheckedChange: (checked) => setFormData({
													...formData,
													is_destaque: checked
												})
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between p-4 border rounded-xl",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-0.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													className: "text-sm font-semibold text-gray-700",
													children: "Novidade"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-gray-500",
													children: "Sinalizar como novo item no cardápio"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
												checked: !!formData.is_novidade,
												onCheckedChange: (checked) => setFormData({
													...formData,
													is_novidade: checked
												})
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-purple-50 p-6 rounded-2xl space-y-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 text-purple-600",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { size: 20 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm font-bold uppercase tracking-wider",
													children: "Sugestões de Venda"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-purple-800/70",
												children: "Este produto será sugerido no carrinho quando o cliente estiver finalizando o pedido."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												className: "w-full border-purple-200 text-purple-700 hover:bg-purple-100 text-xs font-bold uppercase py-6",
												children: "Configurar Gatilhos"
											})
										]
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "estoque",
								className: "m-0 space-y-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-blue-50/50 p-4 rounded-lg flex items-start gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
										className: "text-blue-500 shrink-0 mt-0.5",
										size: 18
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-semibold text-blue-900",
											children: "Gerenciamento de Estoque"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-blue-700",
											children: "Ative o controle de estoque para este produto. Quando o saldo chegar a zero, o produto será pausado automaticamente."
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-6 max-w-md",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between p-4 border rounded-xl",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-0.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-sm font-semibold text-gray-700",
												children: "Ativar Controle de Estoque"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-gray-500",
												children: "Deduzir do saldo a cada venda"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: formData.controle_estoque,
											onCheckedChange: (checked) => setFormData({
												...formData,
												controle_estoque: checked
											})
										})]
									}), formData.controle_estoque && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-4 animate-in fade-in slide-in-from-top-2 duration-300",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
												children: "Quantidade em Estoque"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												value: formData.estoque_atual || 0,
												onChange: (e) => setFormData({
													...formData,
													estoque_atual: parseInt(e.target.value)
												}),
												className: "h-10 border-gray-200"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
												children: "Aviso de Estoque Baixo"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												value: formData.estoque_minimo || 5,
												onChange: (e) => setFormData({
													...formData,
													estoque_minimo: parseInt(e.target.value)
												}),
												className: "h-10 border-gray-200"
											})]
										})]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "promocao",
								className: "m-0 space-y-8",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 md:grid-cols-2 gap-8",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
													children: "Valor Promocional (Opcional)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "relative",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm",
														children: "R$"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														placeholder: "0,00",
														value: formData.preco_promocional_formatado || "",
														onChange: (e) => setFormData({
															...formData,
															preco_promocional_formatado: e.target.value
														}),
														className: "h-10 pl-9 border-gray-200"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] text-gray-400",
													children: "Se preenchido, este valor substituirá o valor original com uma tag de oferta."
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-4 pt-4 border-t",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-0.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
														className: "text-sm font-semibold text-gray-700",
														children: "Frete Grátis"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-gray-500",
														children: "Aplicar frete grátis apenas para este produto"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
													checked: !!formData.frete_gratis,
													onCheckedChange: (checked) => setFormData({
														...formData,
														frete_gratis: checked
													})
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-0.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
														className: "text-sm font-semibold text-gray-700",
														children: "Bloquear Cupom"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-gray-500",
														children: "Não permitir uso de cupons neste item"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
													checked: !!formData.bloquear_cupom,
													onCheckedChange: (checked) => setFormData({
														...formData,
														bloquear_cupom: checked
													})
												})]
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-orange-50 p-6 rounded-2xl space-y-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 text-orange-600",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { size: 20 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm font-bold uppercase tracking-wider",
													children: "Agendar Promoção"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-orange-800/70",
												children: "Defina um período específico para que esta promoção fique ativa automaticamente no site."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-1 gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
														className: "text-[9px] font-bold uppercase text-orange-800/50",
														children: "Data de Início"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "date",
														className: "h-9 border-orange-200 bg-white"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
														className: "text-[9px] font-bold uppercase text-orange-800/50",
														children: "Data de Término"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "date",
														className: "h-9 border-orange-200 bg-white"
													})]
												})]
											})
										]
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "integracao",
								className: "m-0 space-y-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "max-w-md space-y-6",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
												children: "Código PDV / Integração"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "Ex: IFD-123",
												className: "h-10 border-gray-200",
												value: formData.codigo_integracao || "",
												onChange: (e) => setFormData({
													...formData,
													codigo_integracao: e.target.value
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-gray-400",
												children: "Código usado para sincronizar com sistemas externos como iFood, 99Food ou ERP."
											})
										]
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "contabilidade",
								className: "m-0 space-y-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "max-w-md space-y-6",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-[10px] font-bold uppercase text-gray-400 tracking-wider",
												children: "Preço de Custo"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm",
													children: "R$"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													placeholder: "0,00",
													className: "h-10 pl-9 border-gray-200",
													value: formData.preco_custo_formatado || "",
													onChange: (e) => setFormData({
														...formData,
														preco_custo_formatado: e.target.value
													})
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-gray-400",
												children: "Este valor não é exibido para o cliente. Usado apenas para relatórios de lucratividade."
											})
										]
									})
								})
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "px-6 py-4 border-t bg-gray-50/50 flex flex-row items-center justify-between sm:justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: onClose,
						className: "rounded-full px-6 h-10 text-xs font-bold uppercase tracking-wider text-gray-500 border-none bg-gray-200/50 hover:bg-gray-200",
						children: "Cancelar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: handleSave,
							className: "rounded-full px-6 h-10 text-xs font-bold uppercase tracking-wider border-[#5850ec] text-[#5850ec] hover:bg-[#5850ec] hover:text-white transition-all flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 16 }),
								" Salvar ",
								product ? "e Fechar" : "e Criar"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: handleSave,
							className: "rounded-full px-8 h-10 text-xs font-bold uppercase tracking-wider bg-[#5850ec] hover:bg-[#5850ec]/90 text-white shadow-lg flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 16 }),
								" ",
								product ? "Salvar Alterações" : "Adicionar Produto"
							]
						})]
					})]
				})
			]
		})
	});
}
function OrdemRow({ produto, idx }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: produto.id });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: setNodeRef,
		style: {
			transform: CSS.Transform.toString(transform),
			transition,
			opacity: isDragging ? .5 : 1,
			zIndex: isDragging ? 10 : 0
		},
		className: "flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				...attributes,
				...listeners,
				className: "cursor-grab text-gray-300 hover:text-gray-500 p-1 shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { size: 18 })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-bold text-gray-300 w-6 text-right shrink-0",
				children: idx + 1
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-10 w-10 rounded-xl overflow-hidden bg-gray-100 shrink-0",
				children: produto.imagem_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: produto.imagem_url,
					alt: produto.nome,
					className: "h-full w-full object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full w-full flex items-center justify-center text-gray-300 text-xs",
					children: "📦"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold text-gray-900 truncate",
					children: produto.nome
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] text-gray-400",
					children: produto.categorias?.nome ?? "Sem categoria"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${produto.status === "ativo" || produto.status === "Ativo" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`,
				children: produto.status ?? "—"
			})
		]
	});
}
function SortableProductRow({ product, onUpdateStatus, onDelete, onUpdatePrice, onEdit, onDuplicate, isSelected, onSelectChange }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: setNodeRef,
		style: {
			transform: CSS.Transform.toString(transform),
			transition,
			zIndex: isDragging ? 1 : 0,
			opacity: isDragging ? .5 : 1
		},
		className: "group flex items-center px-6 py-4 hover:bg-gray-50/50 transition-colors bg-white border-b border-gray-50 last:border-b-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "checkbox",
				checked: isSelected,
				onChange: (e) => onSelectChange(product.id, e.target.checked),
				className: "h-5 w-5 rounded cursor-pointer mr-4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-4 flex-1 min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						...attributes,
						...listeners,
						className: "cursor-grab text-gray-300 hover:text-gray-400 transition-colors p-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { size: 20 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-12 w-12 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: product.imagem_url,
							alt: product.nome,
							className: "h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-semibold text-gray-900 truncate cursor-pointer hover:text-[#5850ec] transition-colors",
								onClick: () => onEdit(product),
								children: product.nome
							}),
							product.peso && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5",
								children: product.peso
							}),
							product.estoque !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[10px] text-gray-500 font-medium mt-0.5",
								children: [
									"Estoque:",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: product.estoque < 5 ? "text-red-600 font-bold" : "",
										children: product.estoque
									}),
									" ",
									"un."
								]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white shadow-inner focus-within:ring-1 focus-within:ring-primary/20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-medium text-gray-400",
							children: "R$"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							defaultValue: product.preco.toFixed(2).replace(".", ","),
							onBlur: (e) => onUpdatePrice(product.id, e.target.value),
							className: "w-16 text-sm font-bold text-gray-700 outline-none text-right bg-transparent"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onUpdateStatus(product.id, "pausado"),
							className: `px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-md ${(product.status || "").toLowerCase() === "pausado" ? "bg-red-500 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`,
							children: "Pausado"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onUpdateStatus(product.id, "ativo"),
							className: `px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-md ${(product.status || "").toLowerCase() === "ativo" ? "bg-green-500 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`,
							children: "Ativo"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							className: "h-9 w-9 text-gray-400 hover:text-primary rounded-full",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipsisVertical, { size: 18 })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
						align: "end",
						className: "w-40",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
								className: "text-xs font-medium uppercase tracking-wider",
								onClick: () => onEdit(product),
								children: "Editar"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
								className: "text-xs font-medium uppercase tracking-wider",
								onClick: () => onDuplicate(product),
								children: "Duplicar"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
								className: "text-xs font-medium uppercase tracking-wider text-red-600 focus:text-red-600",
								onClick: () => onDelete(product.id),
								children: "Excluir"
							})
						]
					})] })
				]
			})
		]
	});
}
function AdminProductsPage() {
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [selectedProducts, setSelectedProducts] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [showBulkActions, setShowBulkActions] = (0, import_react.useState)(false);
	const queryClient = useQueryClient();
	const [isEditModalOpen, setIsEditModalOpen] = (0, import_react.useState)(false);
	const [editingProduct, setEditingProduct] = (0, import_react.useState)(null);
	const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
	const { data: products = [], isLoading } = useQuery({
		queryKey: ["admin-products"],
		queryFn: () => getAdminProducts()
	});
	const { data: categories = [] } = useQuery({
		queryKey: ["admin-categories"],
		queryFn: async () => {
			const { data } = await supabase.from("categorias").select("*").order("ordem");
			return data || [];
		}
	});
	const updateStatus = useMutation({
		mutationFn: async ({ id, status }) => {
			const tryUpdate = async (val) => {
				console.log(`Tentando atualizar status para: ${val}`);
				return await supabase.from("produtos").update({ status: val }).eq("id", id).select();
			};
			const attempts = [
				status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
				status.toLowerCase(),
				status.toUpperCase()
			];
			let lastError = null;
			for (const val of attempts) {
				const { data, error } = await tryUpdate(val);
				if (!error && data && data.length > 0) {
					console.log(`Sucesso com valor: ${val}`);
					return data[0];
				}
				if (error && error.code !== "23514") throw error;
				lastError = error;
			}
			throw lastError || /* @__PURE__ */ new Error("Falha ao atualizar status após múltiplas tentativas.");
		},
		onMutate: async ({ id, status }) => {
			await queryClient.cancelQueries({ queryKey: ["admin-products"] });
			const previousProducts = queryClient.getQueryData(["admin-products"]);
			queryClient.setQueryData(["admin-products"], (old) => old?.map((p) => p.id === id ? {
				...p,
				status
			} : p));
			return { previousProducts };
		},
		onError: (err, variables, context) => {
			console.error("Falha na mutação de status:", err);
			if (context?.previousProducts) queryClient.setQueryData(["admin-products"], context.previousProducts);
			const errorMsg = err.message || "Tente novamente";
			const detail = err.details || (err.code ? `Erro: ${err.code}` : "");
			if (err.code === "23514") toast.error("Erro de restrição no banco. Por favor, execute o SQL de correção de status enviado no chat.");
			else toast.error(`Erro ao atualizar status: ${errorMsg} ${detail}`);
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["admin-products"] });
			toast.success(`Status "${data.status}" salvo com sucesso!`);
		}
	});
	const deleteProduct = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("produtos").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-products"] });
			toast.success("Produto excluído!");
		}
	});
	const updatePrice = useMutation({
		mutationFn: async ({ id, preco }) => {
			const { error } = await supabase.from("produtos").update({ preco }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-products"] });
			toast.success("Preço atualizado!");
		}
	});
	const bulkUpdateStatus = useMutation({
		mutationFn: async (status) => {
			const ids = Array.from(selectedProducts);
			for (const id of ids) await supabase.from("produtos").update({ status }).eq("id", id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-products"] });
			setSelectedProducts(/* @__PURE__ */ new Set());
			setShowBulkActions(false);
			toast.success(`${selectedProducts.size} produtos atualizados!`);
		},
		onError: (error) => {
			toast.error("Erro ao atualizar: " + error.message);
		}
	});
	const bulkUpdateStock = useMutation({
		mutationFn: async (estoque) => {
			const ids = Array.from(selectedProducts);
			for (const id of ids) await supabase.from("produtos").update({ estoque }).eq("id", id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-products"] });
			setSelectedProducts(/* @__PURE__ */ new Set());
			setShowBulkActions(false);
			toast.success(`Estoque de ${selectedProducts.size} produtos atualizado!`);
		},
		onError: (error) => {
			toast.error("Erro ao atualizar estoque: " + error.message);
		}
	});
	const saveProduct = useMutation({
		mutationFn: async (updatedData) => {
			const { id, ...data } = updatedData;
			if (id) {
				const { error } = await supabase.from("produtos").update(data).eq("id", id);
				if (error) throw error;
			} else {
				const { error } = await supabase.from("produtos").insert([data]);
				if (error) throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-products"] });
			toast.success(editingProduct ? "Produto atualizado!" : "Produto criado!");
			setIsEditModalOpen(false);
			setEditingProduct(null);
		},
		onError: (error) => {
			toast.error("Erro ao salvar produto: " + error.message);
		}
	});
	const handleEdit = (product) => {
		setEditingProduct(product);
		setIsEditModalOpen(true);
	};
	const duplicateProduct = useMutation({
		mutationFn: async (product) => {
			const { id, created_at, updated_at, categorias, ...rest } = product;
			const { error } = await supabase.from("produtos").insert([{
				...rest,
				nome: `${rest.nome} (Cópia)`,
				status: "pausado",
				ordem: (rest.ordem ?? 0) + 1
			}]);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-products"] });
			toast.success("Produto duplicado! Ele foi pausado por padrão.");
		},
		onError: (error) => toast.error("Erro ao duplicar: " + error.message)
	});
	const handleDragEnd = async (event) => {
		const { active, over } = event;
		if (!over) return;
		if (active.id !== over.id) {
			const activeItem = products.find((p) => p.id === active.id);
			const overItem = products.find((p) => p.id === over.id);
			if (activeItem && overItem && activeItem.categoria_id === overItem.categoria_id) {
				const catProducts = products.filter((p) => p.categoria_id === activeItem.categoria_id).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
				const newOrder = arrayMove(catProducts, catProducts.findIndex((p) => p.id === active.id), catProducts.findIndex((p) => p.id === over.id));
				queryClient.setQueryData(["admin-products"], (old) => {
					const otherCats = old.filter((p) => p.categoria_id !== activeItem.categoria_id);
					const updatedCatProducts = newOrder.map((p, idx) => ({
						...p,
						ordem: idx
					}));
					return [...otherCats, ...updatedCatProducts];
				});
				try {
					const updates = newOrder.map((p, idx) => ({
						id: p.id,
						ordem: idx
					}));
					for (const update of updates) await supabase.from("produtos").update({ ordem: update.ordem }).eq("id", update.id);
					toast.success("Ordem atualizada!");
				} catch (error) {
					console.error("Erro ao salvar ordem:", error);
					toast.error("Erro ao salvar nova ordem");
					queryClient.invalidateQueries({ queryKey: ["admin-products"] });
				}
			}
		}
	};
	const filteredProducts = (0, import_react.useMemo)(() => products.filter((p) => p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || (p.categorias?.nome || "").toLowerCase().includes(searchTerm.toLowerCase())), [products, searchTerm]);
	const groupedProducts = (0, import_react.useMemo)(() => categories.map((cat) => ({
		category: cat,
		products: filteredProducts.filter((p) => p.categoria_id === cat.id).sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
	})), [categories, filteredProducts]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen",
		children: [
			selectedProducts.size > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 bg-[#5850ec] text-white rounded-xl p-4 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: selectedProducts.size === filteredProducts.length,
						onChange: (e) => {
							if (e.target.checked) setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
							else setSelectedProducts(/* @__PURE__ */ new Set());
						},
						className: "h-5 w-5 rounded cursor-pointer"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-bold",
						children: [selectedProducts.size, " produto(s) selecionado(s)"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							onChange: (e) => {
								if (e.target.value) {
									bulkUpdateStatus.mutate(e.target.value);
									e.target.value = "";
								}
							},
							className: "px-3 py-1.5 rounded bg-white text-[#5850ec] text-xs font-bold",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Alterar status..."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "ativo",
									children: "Ativar"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "pausado",
									children: "Pausar"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "number",
							placeholder: "Novo estoque...",
							onKeyDown: (e) => {
								if (e.key === "Enter") {
									const val = e.target.value;
									if (val) {
										bulkUpdateStock.mutate(Number(val));
										e.target.value = "";
									}
								}
							},
							className: "px-3 py-1.5 rounded bg-white text-[#5850ec] text-xs font-bold w-32"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setSelectedProducts(/* @__PURE__ */ new Set()),
							className: "px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 text-xs font-bold",
							children: "Limpar"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-semibold text-[#5850ec]",
					children: "Cardápio"
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						size: "sm",
						className: "text-primary hover:text-primary/80 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-lg",
							children: "↻"
						}), "ORDENAR CATEGORIAS"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "bg-[#5850ec] hover:bg-[#5850ec]/90 flex items-center gap-2 rounded-md px-4 h-10 text-xs font-bold uppercase tracking-wider text-white",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 18 }), "ADICIONAR CATEGORIA"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				defaultValue: "produtos",
				className: "w-full",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "mb-6 bg-gray-100 rounded-xl p-1 w-fit",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
							value: "produtos",
							className: "rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold text-sm px-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Utensils, {
								size: 15,
								className: "mr-1.5"
							}), " Produtos"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
							value: "ordenacao",
							className: "rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold text-sm px-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, {
								size: 15,
								className: "mr-1.5"
							}), " Ordenação"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "produtos",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "bg-white rounded-xl shadow-sm border p-4 mb-8",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col md:flex-row gap-4 items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative flex-1 w-full",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
										className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
										size: 18
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "Buscar por nome ou categoria...",
										className: "pl-10 rounded-lg border-gray-200",
										value: searchTerm,
										onChange: (e) => setSearchTerm(e.target.value)
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-4 w-full md:w-auto",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										className: "flex items-center gap-2 flex-1 md:flex-initial rounded-lg border-gray-200",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { size: 18 }), "Filtros"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-sm font-medium text-muted-foreground whitespace-nowrap bg-gray-100 px-3 py-1.5 rounded-md",
										children: [filteredProducts.length, " produtos"]
									})]
								})]
							})
						}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-center justify-center py-24 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
								className: "animate-spin text-primary",
								size: 40
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground font-medium",
								children: "Carregando seu cardápio..."
							})]
						}) : groupedProducts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-2xl border border-dashed border-gray-300 p-20 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Utensils, {
								className: "mx-auto text-gray-300 mb-4",
								size: 48
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground font-medium",
								children: "Nenhum produto encontrado para sua busca."
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-10 pb-20",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DndContext, {
								sensors,
								collisionDetection: closestCenter,
								onDragEnd: handleDragEnd,
								modifiers: [restrictToVerticalAxis],
								children: groupedProducts.map(({ category, products: catProducts }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-gray-50 px-4 md:px-6 py-3 border-b border-gray-200 flex justify-between items-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-sm font-semibold text-[#5850ec] uppercase tracking-wide",
												children: category.nome
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex items-center gap-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
													asChild: true,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "ghost",
														size: "icon",
														className: "h-8 w-8 rounded-full",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipsisVertical, {
															size: 16,
															className: "text-gray-400"
														})
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
													align: "end",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
														className: "text-xs font-bold uppercase tracking-tighter",
														children: "Editar Categoria"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
														className: "text-xs font-bold uppercase tracking-tighter text-red-600",
														children: "Excluir Categoria"
													})]
												})] })
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "divide-y divide-gray-50",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortableContext, {
												items: catProducts.map((p) => p.id),
												strategy: verticalListSortingStrategy,
												children: catProducts.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortableProductRow, {
													product,
													onUpdateStatus: (id, status) => updateStatus.mutate({
														id,
														status
													}),
													onEdit: handleEdit,
													onDuplicate: (p) => duplicateProduct.mutate(p),
													onUpdatePrice: (id, val) => {
														const price = parseFloat(val.replace(",", "."));
														if (!isNaN(price)) updatePrice.mutate({
															id,
															preco: price
														});
													},
													isSelected: selectedProducts.has(product.id),
													onSelectChange: (id, checked) => {
														const newSelected = new Set(selectedProducts);
														if (checked) newSelected.add(id);
														else newSelected.delete(id);
														setSelectedProducts(newSelected);
													}
												}, product.id))
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "px-6 py-3 bg-gray-50/50 border-t border-gray-100",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => {
													setEditingProduct(null);
													setIsEditModalOpen(true);
												},
												className: "flex items-center gap-2 text-xs font-semibold text-[#0891b2] hover:text-[#0891b2]/80 transition-colors uppercase tracking-wider",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
													size: 14,
													strokeWidth: 3
												}), "Adicionar novo item"]
											})
										})
									]
								}, category.id))
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "ordenacao",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2.5 text-sm text-blue-700",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, {
									size: 16,
									className: "shrink-0 mt-0.5"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Arraste os produtos para reordenar dentro de cada categoria. A ordem aqui é exatamente a que aparece no site e no cardápio." })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DndContext, {
								sensors,
								collisionDetection: closestCenter,
								onDragEnd: handleDragEnd,
								modifiers: [restrictToVerticalAxis],
								children: groupedProducts.map(({ category, products: catProds }) => {
									if (!catProds.length) return null;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-white rounded-2xl border shadow-sm overflow-hidden",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "h-7 w-7 rounded-lg bg-[#5850ec]/10 flex items-center justify-center",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Utensils, {
															size: 14,
															className: "text-[#5850ec]"
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-gray-800 text-sm",
														children: category.nome
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-semibold",
														children: [
															catProds.length,
															" ",
															catProds.length === 1 ? "produto" : "produtos"
														]
													})
												]
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortableContext, {
											items: catProds.map((p) => p.id),
											strategy: verticalListSortingStrategy,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "divide-y",
												children: catProds.map((produto, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrdemRow, {
													produto,
													idx
												}, produto.id))
											})
										})]
									}, category.id);
								})
							})]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductEditModal, {
				isOpen: isEditModalOpen,
				onClose: () => {
					setIsEditModalOpen(false);
					setEditingProduct(null);
				},
				product: editingProduct,
				categories,
				onSave: (data) => saveProduct.mutate(data),
				onDelete: (id) => deleteProduct.mutate(id)
			})
		]
	});
}
//#endregion
export { AdminProductsPage as component };
