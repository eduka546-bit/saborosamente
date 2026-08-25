import { i as __toESM } from "../_runtime.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { Ot as Database, _ as Trash2, ct as LoaderCircle, pt as HardDrive, zt as CircleCheckBig } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/storage-cleanup-DeYce8hv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StorageCleanupPage() {
	const [loadingStorage, setLoadingStorage] = (0, import_react.useState)(false);
	const [loadingDatabase, setLoadingDatabase] = (0, import_react.useState)(false);
	const [storageStats, setStorageStats] = (0, import_react.useState)(null);
	const [databaseStats, setDatabaseStats] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const handleCleanup = async () => {
		if (!confirm("Tem certeza? Arquivos órfãos serão permanentemente deletados!")) return;
		setLoadingStorage(true);
		setError(null);
		setStorageStats(null);
		try {
			const response = await fetch(`https://lxcgbrovdmpjatywweiv.supabase.co/functions/v1/storage-cleanup`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Y2dicm92ZG1wamF0eXd3ZWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzU2MDksImV4cCI6MjEwMTAxMTYwOX0.IjYsxY8uFKWKiv7sdvejZ5KMqgdlZFV-efLtfbBPsWg"
				}
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "Erro na limpeza");
			setStorageStats(data.stats);
			toast.success(`✅ Storage limpo! ${data.stats.deleted_files} arquivos removidos, ${data.stats.space_freed_mb} MB liberados`);
		} catch (err) {
			const message = err.message || "Erro desconhecido";
			setError(message);
			toast.error("Erro: " + message);
		} finally {
			setLoadingStorage(false);
		}
	};
	const handleDatabaseCleanup = async () => {
		if (!confirm("Tem certeza? Dados órfãos do banco serão permanentemente deletados! (Pedidos > 1 ano, conversas > 6 meses, carrinhos > 90 dias)")) return;
		setLoadingDatabase(true);
		setError(null);
		setDatabaseStats(null);
		try {
			const response = await fetch(`https://lxcgbrovdmpjatywweiv.supabase.co/functions/v1/database-cleanup`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Y2dicm92ZG1wamF0eXd3ZWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzU2MDksImV4cCI6MjEwMTAxMTYwOX0.IjYsxY8uFKWKiv7sdvejZ5KMqgdlZFV-efLtfbBPsWg"
				}
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "Erro na limpeza");
			setDatabaseStats(data.stats);
			const total = data.summary?.total_records_deleted || 0;
			toast.success(`✅ Banco limpo! ${total} registros órfãos removidos, ~${data.summary?.estimated_space_freed_mb} MB liberados`);
		} catch (err) {
			const message = err.message || "Erro desconhecido";
			setError(message);
			toast.error("Erro: " + message);
		} finally {
			setLoadingDatabase(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-6 max-w-4xl mx-auto space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "text-3xl font-bold text-gray-900 flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, {
						size: 28,
						className: "text-orange-500"
					}), "Limpeza Completa"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-600 mt-1",
					children: "Remove arquivos órfãos e dados desnecessários do banco e storage"
				})]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-red-50 border border-red-200 rounded-lg p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-red-900 font-semibold",
					children: "❌ Erro:"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-red-700 text-sm mt-1",
					children: error
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-2 border-orange-200 rounded-lg p-6 bg-orange-50",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-2xl font-bold text-orange-900 flex items-center gap-2 mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, { size: 24 }), "Limpeza de Storage"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-orange-800 mb-4",
						children: "Remove arquivos órfãos não referenciados por produtos ou configurações"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleCleanup,
						disabled: loadingStorage,
						className: "w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-lg transition-all",
						children: loadingStorage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							size: 18,
							className: "animate-spin"
						}), "Limpando Storage..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 18 }), "Iniciar Limpeza de Storage"] })
					}),
					storageStats && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, {
								size: 20,
								className: "text-green-600 flex-shrink-0 mt-0.5"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-green-900",
								children: "Limpeza Concluída!"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-green-800",
								children: [
									storageStats.deleted_files,
									" arquivos removidos, ",
									storageStats.space_freed_mb,
									" MB liberados"
								]
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-white border border-orange-200 rounded-lg p-3 text-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-orange-600 font-bold",
									children: "Órfãos Encontrados"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-2xl font-bold text-orange-900",
									children: storageStats.orphaned_files
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-white border border-orange-200 rounded-lg p-3 text-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-orange-600 font-bold",
									children: "Deletados"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-2xl font-bold text-orange-900",
									children: storageStats.deleted_files
								})]
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-2 border-blue-200 rounded-lg p-6 bg-blue-50",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-2xl font-bold text-blue-900 flex items-center gap-2 mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, { size: 24 }), "Limpeza do Banco de Dados"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-blue-800 mb-4",
						children: "Remove dados antigos e órfãos (pedidos > 1 ano, conversas > 6 meses, carrinhos > 90 dias)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleDatabaseCleanup,
						disabled: loadingDatabase,
						className: "w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold rounded-lg transition-all",
						children: loadingDatabase ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							size: 18,
							className: "animate-spin"
						}), "Limpando Banco..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 18 }), "Iniciar Limpeza do Banco"] })
					}),
					databaseStats && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, {
								size: 20,
								className: "text-green-600 flex-shrink-0 mt-0.5"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-green-900",
								children: "Limpeza Concluída!"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-green-800",
								children: [databaseStats.reduce((s, r) => s + (r.records_deleted || 0), 0), " registros removidos"]
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2",
							children: databaseStats.map((stat, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-white border border-blue-200 rounded-lg p-3 flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-blue-900 font-semibold",
									children: stat.task
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-bold text-blue-600",
									children: [stat.records_deleted || 0, " registros"]
								})]
							}, idx))
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-semibold text-gray-900 mb-2",
					children: "ℹ️ Informações:"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "list-disc list-inside space-y-1 text-gray-700",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Storage:" }), " Remove imagens não referenciadas por produtos"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Banco:" }), " Remove dados muito antigos e conversas encerradas"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Cada limpeza é segura e reversível" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Recomenda-se fazer backup antes se quiser" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Pode levar alguns segundos dependendo do volume" })
					]
				})]
			})
		]
	});
}
//#endregion
export { StorageCleanupPage as component };
