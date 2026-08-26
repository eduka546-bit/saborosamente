import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { $ as MessageCircle, A as ShoppingBag, At as Copy, H as Plus, I as Save, Kt as ChevronDown, S as Tag, St as Eye, Wt as ChevronRight, Xt as ChartNoAxesColumn, _ as Trash2, ct as LoaderCircle, ht as GitBranch, i as X, in as ArrowRight, jt as Clock, mt as GripVertical, n as ZoomIn, r as Zap, t as ZoomOut, tt as Maximize2 } from "../_libs/lucide-react.mjs";
import { a as closestCenter, h as CSS, i as PointerSensor, m as useSensors, p as useSensor, t as DndContext } from "../_libs/@dnd-kit/core+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
import { a as verticalListSortingStrategy, i as useSortable, n as arrayMove, t as SortableContext } from "../_libs/dnd-kit__sortable.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/automacoes-CyD87Xea.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TIPOS_INSERCAO = [
	[
		"mensagem",
		"Mensagem",
		MessageCircle
	],
	[
		"menu",
		"Menu",
		GitBranch
	],
	[
		"condicao",
		"Condição",
		GitBranch
	],
	[
		"aguardar",
		"Aguardar",
		Clock
	],
	[
		"tag",
		"Tag",
		Tag
	],
	[
		"transferir",
		"Atendente",
		ArrowRight
	],
	[
		"encerrar",
		"Encerrar",
		X
	]
];
var NO_ICONS = {
	mensagem: MessageCircle,
	menu: GitBranch,
	condicao: GitBranch,
	aguardar: Clock,
	tag: Tag,
	transferir: ArrowRight,
	encerrar: X
};
var NO_CORES = {
	mensagem: "bg-blue-50 border-blue-200 text-blue-700",
	menu: "bg-indigo-50 border-indigo-200 text-indigo-700",
	condicao: "bg-yellow-50 border-yellow-200 text-yellow-700",
	aguardar: "bg-gray-50 border-gray-200 text-gray-700",
	tag: "bg-pink-50 border-pink-200 text-pink-700",
	transferir: "bg-orange-50 border-orange-200 text-orange-700",
	encerrar: "bg-red-50 border-red-200 text-red-700"
};
function NoDraggable({ no, onToggleExpand, isExpanded, onChange, onRemove }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: no.id });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? .5 : 1
	};
	const IconComponent = NO_ICONS[no.tipo] || MessageCircle;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: setNodeRef,
		style,
		className: `rounded-lg border-2 px-4 py-3 min-w-[200px] transition-all hover:shadow-md ${NO_CORES[no.tipo] || "bg-gray-50 border-gray-200"} ${isDragging ? "shadow-lg ring-2 ring-[#5850ec]" : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 mb-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					...attributes,
					...listeners,
					className: "cursor-grab active:cursor-grabbing p-1 hover:bg-black/5 rounded flex-shrink-0",
					title: "Arrastar para reordenar",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, {
						size: 14,
						className: "opacity-50"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconComponent, {
					size: 16,
					className: "flex-shrink-0"
				}),
				onChange ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: no.titulo,
					onChange: (event) => onChange({
						...no,
						titulo: event.target.value
					}),
					className: "min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-bold text-sm flex-1 truncate",
					children: no.titulo
				}),
				onRemove && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onRemove,
					className: "rounded p-1 text-red-400 hover:bg-red-100 hover:text-red-600",
					title: "Remover etapa",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
				}),
				(no.tipo === "condicao" || no.tipo === "mensagem" && no.config.texto) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onToggleExpand(no.id),
					className: "cursor-pointer flex-shrink-0",
					children: isExpanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 14 })
				})
			]
		}), isExpanded && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-xs mt-2 pt-2 border-t opacity-75",
			children: [
				no.tipo === "mensagem" && (onChange ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: no.config.texto ?? "",
					onChange: (event) => onChange({
						...no,
						config: {
							...no.config,
							texto: event.target.value
						}
					}),
					placeholder: "Mensagem enviada ao cliente",
					rows: 3,
					className: "w-full rounded border bg-white/70 p-2 text-xs outline-none"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "line-clamp-2",
					children: no.config.texto || "(mensagem vazia)"
				})),
				no.tipo === "aguardar" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					no.config.valor || 1,
					" ",
					no.config.unidade || "horas"
				] }),
				no.tipo === "tag" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Tag: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: no.config.tag || "(vazia)" })] }),
				no.tipo === "condicao" && (onChange ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: no.config.campo ?? "mensagem",
						onChange: (event) => onChange({
							...no,
							config: {
								...no.config,
								campo: event.target.value
							}
						}),
						className: "w-full rounded border bg-white/70 p-1 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "mensagem",
								children: "Mensagem contém"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "tag",
								children: "Cliente tem tag"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "cidade",
								children: "Cidade do cliente"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: no.config.valor ?? "",
						onChange: (event) => onChange({
							...no,
							config: {
								...no.config,
								valor: event.target.value
							}
						}),
						placeholder: "Valor da condição",
						className: "w-full rounded border bg-white/70 p-1 text-xs outline-none"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"Se ",
					no.config.campo,
					" = ",
					no.config.valor
				] })),
				no.tipo === "menu" && (onChange ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: (no.config.opcoes ?? []).join("\n"),
					onChange: (event) => onChange({
						...no,
						config: {
							...no.config,
							opcoes: event.target.value.split("\n").filter(Boolean)
						}
					}),
					placeholder: "Uma opção por linha",
					rows: 3,
					className: "w-full rounded border bg-white/70 p-2 text-xs outline-none"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [no.config.opcoes?.length || 0, " opções"] }))
			]
		})]
	});
}
function FlowDiagram({ nos, onUpdate, onInsert, gatilhoTipo = "keyword", gatilhoValor = {}, onGatilhoChange, editavel = false }) {
	const [expandido, setExpandido] = (0, import_react.useState)(new Set(nos.slice(0, 1).map((n) => n.id)));
	const [zoom, setZoom] = (0, import_react.useState)(1);
	const [pan, setPan] = (0, import_react.useState)({
		x: 0,
		y: 0
	});
	const [arrastandoCanvas, setArrastandoCanvas] = (0, import_react.useState)(false);
	const [inserindoEntre, setInserindoEntre] = (0, import_react.useState)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const panInicio = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
	const handleDragEnd = (event) => {
		if (!onUpdate) return;
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = nos.findIndex((n) => n.id === active.id);
		const newIndex = nos.findIndex((n) => n.id === over.id);
		if (oldIndex !== -1 && newIndex !== -1) onUpdate(arrayMove(nos, oldIndex, newIndex));
	};
	const alterarZoom = (delta) => {
		setZoom((prev) => Math.min(1.6, Math.max(.55, Number((prev + delta).toFixed(2)))));
	};
	const iniciarPan = (event) => {
		if (event.target.closest("button")) return;
		setArrastandoCanvas(true);
		panInicio.current = {
			x: event.clientX - pan.x,
			y: event.clientY - pan.y
		};
		event.currentTarget.setPointerCapture(event.pointerId);
	};
	const moverPan = (event) => {
		if (!arrastandoCanvas) return;
		setPan({
			x: event.clientX - panInicio.current.x,
			y: event.clientY - panInicio.current.y
		});
	};
	const pararPan = () => setArrastandoCanvas(false);
	const indicePorId = new Map(nos.map((no, indice) => [no.id, indice]));
	const conexoes = nos.flatMap((no, indice) => {
		return [
			no.proximo_id,
			no.proximo_sim_id,
			no.proximo_nao_id
		].filter(Boolean).map((destino, ramo) => ({
			de: indice,
			para: indicePorId.get(destino),
			ramo: no.tipo === "condicao" ? ramo === 0 ? "sim" : "nao" : ""
		})).filter((conexao) => conexao.para !== void 0);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2 border-b bg-white/80 px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-bold text-gray-700",
					children: "Área de trabalho do fluxo"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] text-gray-400",
					children: "Arraste o espaço para navegar e organize os nós abaixo"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => alterarZoom(-.1),
							className: "rounded-lg p-2 text-gray-500 hover:bg-gray-100",
							title: "Diminuir zoom",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomOut, { size: 16 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "w-12 text-center text-xs font-semibold text-gray-500",
							children: [Math.round(zoom * 100), "%"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => alterarZoom(.1),
							className: "rounded-lg p-2 text-gray-500 hover:bg-gray-100",
							title: "Aumentar zoom",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomIn, { size: 16 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setZoom(1);
								setPan({
									x: 0,
									y: 0
								});
							},
							className: "rounded-lg p-2 text-gray-500 hover:bg-gray-100",
							title: "Centralizar fluxo",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { size: 16 })
						})
					]
				})]
			}),
			onGatilhoChange && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-b bg-white p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-[520px] rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-2 flex items-center gap-2 text-xs font-bold text-emerald-700",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { size: 14 }), " Gatilho inicial"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: gatilhoTipo,
							onChange: (event) => onGatilhoChange(event.target.value, gatilhoValor),
							className: "mb-2 w-full rounded-lg border bg-white px-2 py-1.5 text-xs outline-none",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "keyword",
									children: "Palavra-chave"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "primeira_msg",
									children: "1ª mensagem"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "pedido_criado",
									children: "Pedido criado"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "status_pedido",
									children: "Status do pedido"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "sem_resposta",
									children: "Sem resposta"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "tag",
									children: "Tag adicionada"
								})
							]
						}),
						gatilhoTipo === "keyword" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: (gatilhoValor.palavras ?? []).join("\n"),
							onChange: (event) => onGatilhoChange(gatilhoTipo, {
								...gatilhoValor,
								palavras: event.target.value.split("\n").filter(Boolean)
							}),
							placeholder: "Palavras-chave, uma por linha",
							rows: 3,
							className: "w-full rounded-lg border bg-white px-2 py-1.5 text-xs outline-none"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto h-8 w-0.5 bg-slate-300" })]
			}),
			nos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center justify-center py-12 text-gray-400",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitBranch, {
					size: 32,
					className: "mb-2 opacity-30"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm",
					children: "Nenhum nó no fluxo"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-[520px] overflow-hidden",
				children: [onInsert && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "z-10 hidden w-44 shrink-0 border-r bg-white/90 p-3 md:block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-[10px] font-bold uppercase tracking-wide text-gray-500",
						children: "Ações"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-1",
						children: TIPOS_INSERCAO.map(([tipo, label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => onInsert(nos.length, tipo),
							className: "flex w-full items-center gap-2 rounded-lg border border-gray-100 px-2 py-2 text-left text-[11px] font-semibold text-gray-600 hover:border-[#5850ec] hover:bg-indigo-50 hover:text-[#5850ec]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 14 }), label]
						}, tipo))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: canvasRef,
					className: `relative min-w-0 flex-1 overflow-hidden ${arrastandoCanvas ? "cursor-grabbing" : "cursor-grab"}`,
					onPointerDown: iniciarPan,
					onPointerMove: moverPan,
					onPointerUp: pararPan,
					onPointerCancel: pararPan,
					onWheel: (event) => {
						event.preventDefault();
						alterarZoom(event.deltaY > 0 ? -.05 : .05);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 opacity-40 [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute left-1/2 top-8 w-[300px] -translate-x-1/2 origin-top",
						style: { transform: `translateX(calc(-50% + ${pan.x / zoom}px)) translateY(${pan.y / zoom}px) scale(${zoom})` },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
							className: "pointer-events-none absolute left-0 top-0 h-full w-full overflow-visible",
							style: { height: Math.max(160, nos.length * 120) },
							children: conexoes.map((conexao, indice) => {
								const inicioY = conexao.de * 120 + 76;
								const fimY = (conexao.para ?? 0) * 120 + 4;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
									x1: "150",
									y1: inicioY,
									x2: "150",
									y2: fimY,
									stroke: "#94a3b8",
									strokeWidth: "2",
									strokeDasharray: conexao.ramo ? "5 4" : void 0
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
									x: "158",
									y: (inicioY + fimY) / 2,
									fill: "#64748b",
									fontSize: "10",
									children: conexao.ramo
								})] }, `${conexao.de}-${conexao.para}-${indice}`);
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DndContext, {
							sensors,
							collisionDetection: closestCenter,
							onDragEnd: handleDragEnd,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortableContext, {
								items: nos.map((n) => n.id),
								strategy: verticalListSortingStrategy,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "relative flex flex-col items-center",
									children: nos.map((no, indice) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col items-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoDraggable, {
											no,
											onChange: (alterado) => onUpdate?.(nos.map((item) => item.id === alterado.id ? alterado : item)),
											onRemove: () => onUpdate?.(nos.filter((item) => item.id !== no.id)),
											onToggleExpand: (id) => setExpandido((prev) => {
												const novo = new Set(prev);
												if (novo.has(id)) novo.delete(id);
												else novo.add(id);
												return novo;
											}),
											isExpanded: expandido.has(no.id)
										}), indice < nos.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative flex h-12 items-center justify-center",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute h-12 w-0.5 bg-slate-300" }),
												onInsert && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => setInserindoEntre(inserindoEntre === indice ? null : indice),
													className: "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-lg font-semibold text-slate-500 shadow-sm hover:border-[#5850ec] hover:text-[#5850ec]",
													title: "Adicionar etapa",
													children: "+"
												}),
												inserindoEntre === indice && onInsert && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "absolute left-1/2 top-10 z-20 grid w-48 -translate-x-1/2 grid-cols-2 gap-1 rounded-xl border bg-white p-2 shadow-xl",
													children: TIPOS_INSERCAO.map(([tipo, label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														onClick: () => {
															onInsert(indice + 1, tipo);
															setInserindoEntre(null);
														},
														className: "flex items-center gap-1 rounded-lg p-2 text-left text-[10px] font-semibold text-gray-600 hover:bg-indigo-50 hover:text-[#5850ec]",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 13 }), label]
													}, tipo))
												})
											]
										})]
									}, no.id))
								})
							})
						})]
					})]
				})]
			}),
			onInsert && nos.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-t bg-white/70 p-3 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onInsert(0, "mensagem"),
					className: "rounded-lg border border-dashed border-[#5850ec] px-4 py-2 text-xs font-bold text-[#5850ec] hover:bg-indigo-50",
					children: "+ Adicionar primeira etapa"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-t px-3 py-2 text-xs text-gray-500",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center",
					children: "🎯 Arraste os nós pela alça para reordenar · Use o zoom para revisar o fluxo completo"
				})
			}),
			onInsert && nos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-2 border-t bg-white p-3 md:hidden",
				children: TIPOS_INSERCAO.map(([tipo, label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onInsert(nos.length, tipo),
					className: "flex items-center justify-center gap-1 rounded-lg border border-dashed p-2 text-[10px] font-semibold text-gray-600 hover:border-[#5850ec] hover:text-[#5850ec]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 13 }),
						"Adicionar ",
						label
					]
				}, tipo))
			})
		]
	});
}
var GATILHO_CONFIG = {
	keyword: {
		label: "Palavra-chave",
		icon: MessageCircle,
		cor: "bg-blue-100 text-blue-700",
		descricao: "Quando o cliente enviar uma palavra/frase específica"
	},
	primeira_msg: {
		label: "1ª Mensagem",
		icon: Zap,
		cor: "bg-green-100 text-green-700",
		descricao: "Quando um novo contato enviar a primeira mensagem"
	},
	pedido_criado: {
		label: "Pedido criado",
		icon: ShoppingBag,
		cor: "bg-purple-100 text-purple-700",
		descricao: "Quando um pedido for registrado (site ou WhatsApp)"
	},
	status_pedido: {
		label: "Status do pedido",
		icon: ShoppingBag,
		cor: "bg-orange-100 text-orange-700",
		descricao: "Quando o status do pedido mudar"
	},
	sem_resposta: {
		label: "Sem resposta",
		icon: Clock,
		cor: "bg-yellow-100 text-yellow-700",
		descricao: "Quando o cliente não responder em X horas"
	},
	tag: {
		label: "Tag adicionada",
		icon: Tag,
		cor: "bg-pink-100 text-pink-700",
		descricao: "Quando uma tag específica for adicionada ao contato"
	}
};
var NO_CONFIG = {
	mensagem: {
		label: "Enviar mensagem",
		icon: MessageCircle,
		cor: "bg-blue-50 border-blue-200 text-blue-700"
	},
	menu: {
		label: "Enviar menu",
		icon: GitBranch,
		cor: "bg-indigo-50 border-indigo-200 text-indigo-700"
	},
	condicao: {
		label: "Condição",
		icon: GitBranch,
		cor: "bg-yellow-50 border-yellow-200 text-yellow-700"
	},
	aguardar: {
		label: "Aguardar",
		icon: Clock,
		cor: "bg-gray-50 border-gray-200 text-gray-700"
	},
	tag: {
		label: "Adicionar tag",
		icon: Tag,
		cor: "bg-pink-50 border-pink-200 text-pink-700"
	},
	transferir: {
		label: "Transferir atendente",
		icon: ArrowRight,
		cor: "bg-orange-50 border-orange-200 text-orange-700"
	},
	encerrar: {
		label: "Encerrar fluxo",
		icon: X,
		cor: "bg-red-50 border-red-200 text-red-700"
	}
};
function EditorAutomacao({ automacao, onSave, onClose }) {
	const [form, setForm] = (0, import_react.useState)({
		nome: "",
		descricao: "",
		ativo: true,
		gatilho_tipo: "keyword",
		gatilho_valor: {},
		nos: [],
		...automacao
	});
	const [saving, setSaving] = (0, import_react.useState)(false);
	const addNo = (tipo, indice) => {
		const novo = {
			id: `no_${Date.now()}`,
			tipo,
			titulo: NO_CONFIG[tipo].label,
			config: {}
		};
		setForm((f) => {
			const nos = [...f.nos ?? []];
			const posicao = indice === void 0 ? nos.length : indice;
			const anterior = nos[posicao - 1];
			const proximo = nos[posicao];
			if (anterior && anterior.tipo !== "condicao") anterior.proximo_id = novo.id;
			novo.proximo_id = proximo?.id;
			if (indice === void 0) nos.push(novo);
			else nos.splice(posicao, 0, novo);
			return {
				...f,
				nos
			};
		});
	};
	const handleSave = async () => {
		if (!form.nome?.trim()) {
			toast.error("Informe um nome");
			return;
		}
		if (!form.nos?.length) {
			toast.error("Adicione pelo menos um nó");
			return;
		}
		setSaving(true);
		try {
			await onSave(form);
		} finally {
			setSaving(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex h-screen w-screen overflow-hidden bg-black/60",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-full w-full flex-col bg-white shadow-2xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-bold text-[#5850ec]",
					children: automacao.id ? "Editar automação" : "Nova automação"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "p-2 rounded-xl hover:bg-gray-100 text-gray-400",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 20 })
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-y-auto p-6 space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-bold uppercase text-gray-400",
							children: "Nome da automação"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: form.nome ?? "",
							onChange: (e) => setForm((f) => ({
								...f,
								nome: e.target.value
							})),
							placeholder: "Ex: Boas-vindas novos contatos",
							className: "mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-bold uppercase text-gray-400",
							children: "Descrição (opcional)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: form.descricao ?? "",
							onChange: (e) => setForm((f) => ({
								...f,
								descricao: e.target.value
							})),
							placeholder: "Para que serve esta automação?",
							className: "mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30"
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "font-bold text-gray-800 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitBranch, {
								size: 16,
								className: "text-[#5850ec]"
							}), " Pré-visualização do fluxo"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "max-h-96 overflow-y-auto border rounded-xl bg-white",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlowDiagram, {
								nos: form.nos ?? [],
								onUpdate: (novoNos) => setForm((f) => ({
									...f,
									nos: novoNos
								})),
								onInsert: (indice, tipo) => addNo(tipo, indice),
								gatilhoTipo: form.gatilho_tipo,
								gatilhoValor: form.gatilho_valor,
								onGatilhoChange: (tipo, valor) => setForm((f) => ({
									...f,
									gatilho_tipo: tipo,
									gatilho_valor: valor
								})),
								editavel: true
							})
						})]
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: handleSave,
						disabled: saving,
						className: "w-full flex items-center justify-center gap-2 py-3 bg-[#5850ec] text-white rounded-xl font-bold hover:bg-[#4338ca] transition-all disabled:opacity-50",
						children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							size: 16,
							className: "animate-spin"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 16 }), "Salvar automação"]
					})
				]
			})]
		})
	});
}
function AutomacoesPage() {
	const queryClient = useQueryClient();
	const [editando, setEditando] = (0, import_react.useState)(null);
	const { data: automacoes = [], isLoading } = useQuery({
		queryKey: ["automacoes"],
		queryFn: async () => {
			const { data, error } = await supabase.from("automacoes").select("*").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const saveMutation = useMutation({
		mutationFn: async (form) => {
			if (form.id) {
				const { error } = await supabase.from("automacoes").update({
					...form,
					updated_at: (/* @__PURE__ */ new Date()).toISOString()
				}).eq("id", form.id);
				if (error) throw error;
			} else {
				const { error } = await supabase.from("automacoes").insert({ ...form });
				if (error) throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["automacoes"] });
			setEditando(null);
			toast.success("Automação salva!");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const toggleMutation = useMutation({
		mutationFn: async ({ id, ativo }) => {
			const { error } = await supabase.from("automacoes").update({ ativo }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automacoes"] })
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("automacoes").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["automacoes"] });
			toast.success("Automação removida.");
		}
	});
	const ativasCount = automacoes.filter((a) => a.ativo).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1400px] mx-auto min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "text-2xl font-bold text-[#5850ec] flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { size: 22 }), " Automações WhatsApp"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: [
						ativasCount,
						" ativa",
						ativasCount !== 1 ? "s" : "",
						" · ",
						automacoes.length,
						" no total"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setEditando({}),
					className: "flex items-center gap-2 px-4 py-2.5 bg-[#5850ec] text-white rounded-xl text-sm font-bold hover:bg-[#4338ca] transition-all",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " Nova automação"]
				})]
			}),
			automacoes.length === 0 && !isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-[#5850ec]/5 border border-[#5850ec]/20 rounded-2xl p-6 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-bold text-[#5850ec] mb-2",
					children: "Como funcionam as automações?"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid sm:grid-cols-3 gap-4 text-sm text-gray-600",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-2xl",
								children: "⚡"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Gatilho" }), " — define quando a automação dispara (palavra-chave, novo contato, pedido criado...)"] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-2xl",
								children: "🔀"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Fluxo" }), " — sequência de ações: enviar mensagem, aguardar, condicionar, transferir..."] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-2xl",
								children: "📊"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Resultado" }), " — acompanhe quantas vezes cada automação foi executada"] })]
						})
					]
				})]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#5850ec]",
					size: 28
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
				children: automacoes.map((aut) => {
					const gatilho = GATILHO_CONFIG[aut.gatilho_tipo];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${!aut.ativo ? "opacity-60" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `h-1.5 ${aut.ativo ? "bg-[#5850ec]" : "bg-gray-200"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-5 space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-bold text-gray-900 truncate",
											children: aut.nome
										}), aut.descricao && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-gray-400 truncate",
											children: aut.descricao
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: aut.ativo,
										onCheckedChange: (v) => toggleMutation.mutate({
											id: aut.id,
											ativo: v
										}),
										className: "data-[state=checked]:bg-[#5850ec] shrink-0"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${gatilho.cor}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(gatilho.icon, { size: 12 }),
										gatilho.label,
										aut.gatilho_tipo === "keyword" && aut.gatilho_valor?.palavras?.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "opacity-70",
											children: [
												"· ",
												aut.gatilho_valor.palavras.slice(0, 2).join(", "),
												aut.gatilho_valor.palavras.length > 2 ? "..." : ""
											]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1 flex-wrap",
									children: [(aut.nos ?? []).slice(0, 4).map((no, i) => {
										const noCfg = NO_CONFIG[no.tipo];
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1",
											children: [i > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
												size: 10,
												className: "text-gray-300"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `text-[10px] font-semibold px-1.5 py-0.5 rounded border ${noCfg?.cor ?? "bg-gray-50 border-gray-200 text-gray-600"}`,
												children: noCfg?.label ?? no.tipo
											})]
										}, i);
									}), (aut.nos ?? []).length > 4 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[10px] text-gray-400",
										children: [
											"+",
											aut.nos.length - 4,
											" nós"
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between pt-1 border-t",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1 text-[11px] text-gray-400",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartNoAxesColumn, { size: 12 }),
											aut.execucoes_total ?? 0,
											" execuções"
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => setEditando(aut),
												className: "p-1.5 rounded-lg text-gray-400 hover:text-[#5850ec] hover:bg-[#5850ec]/10 transition-all",
												title: "Editar",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 14 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => setEditando({
													...aut,
													id: void 0,
													nome: aut.nome + " (cópia)"
												}),
												className: "p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all",
												title: "Duplicar",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { size: 14 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => confirm(`Remover "${aut.nome}"?`) && deleteMutation.mutate(aut.id),
												className: "p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all",
												title: "Remover",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
											})
										]
									})]
								})
							]
						})]
					}, aut.id);
				})
			}),
			editando !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorAutomacao, {
				automacao: editando,
				onSave: saveMutation.mutateAsync,
				onClose: () => setEditando(null)
			})
		]
	});
}
//#endregion
export { AutomacoesPage as component };
