//#region node_modules/.nitro/vite/services/ssr/assets/image-optimizer-BNEU_1ip.js
/**
* Valida se arquivo é imagem válida
*/
function isValidImageFile(file) {
	const validTypes = [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif"
	];
	const validExtensions = [
		".jpg",
		".jpeg",
		".png",
		".webp",
		".gif"
	];
	const isValidType = validTypes.includes(file.type);
	const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
	return isValidType && hasValidExtension;
}
/**
* Formata tamanho de arquivo para exibição
*/
function formatFileSize(bytes) {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = [
		"Bytes",
		"KB",
		"MB",
		"GB"
	];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}
/**
* Otimiza imagem (redimensiona, comprime)
*/
async function optimizeImage(file, maxWidth = 1024, quality = .8) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				let width = img.width;
				let height = img.height;
				if (width > maxWidth) {
					height = height * maxWidth / width;
					width = maxWidth;
				}
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(/* @__PURE__ */ new Error("Could not get canvas context"));
					return;
				}
				ctx.drawImage(img, 0, 0, width, height);
				canvas.toBlob((blob) => {
					if (blob) resolve(blob);
					else reject(/* @__PURE__ */ new Error("Could not optimize image"));
				}, "image/jpeg", quality);
			};
			img.onerror = () => reject(/* @__PURE__ */ new Error("Could not load image"));
			img.src = e.target?.result;
		};
		reader.onerror = () => reject(/* @__PURE__ */ new Error("Could not read file"));
		reader.readAsDataURL(file);
	});
}
/**
* Gera URL de imagem otimizada com suporte a resize e formato
* @param url - URL original da imagem
* @param width - Largura desejada (opcional)
* @param format - Formato desejado: webp, jpeg, png (padrão: webp)
*/
function getOptimizedImageUrl(url, width, format = "webp") {
	if (!url) return "";
	if (url.includes("?")) return url;
	if (url.includes("supabase.co")) {
		const params = new URLSearchParams();
		if (width) params.set("width", width.toString());
		params.set("format", format);
		return `${url}?${params.toString()}`;
	}
	return url;
}
/**
* Gera srcset responsivo para imagem
* @param url - URL da imagem
* @param sizes - Tamanhos para gerar (ex: [320, 640, 1280])
*/
function generateSrcSet(url, sizes = [
	320,
	640,
	1024,
	1280
]) {
	return sizes.map((size) => `${getOptimizedImageUrl(url, size, "webp")} ${size}w`).join(", ");
}
/**
* Gera sizes attribute para imagem responsiva
* Padrão: mobile first com breakpoints típicos
*/
function generateSizes(customSizes) {
	if (customSizes) return customSizes;
	return "(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 1280px) 80vw, 1024px";
}
//#endregion
export { isValidImageFile as a, getOptimizedImageUrl as i, generateSizes as n, optimizeImage as o, generateSrcSet as r, formatFileSize as t };
