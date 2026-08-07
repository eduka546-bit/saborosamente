import frango from "@/assets/prod-frango.jpg";
import carne from "@/assets/prod-carne.jpg";
import salmao from "@/assets/prod-salmao.jpg";
import vegana from "@/assets/prod-vegana.jpg";
import strogonoff from "@/assets/prod-strogonoff.jpg";
import lasanha from "@/assets/prod-lasanha.jpg";

/**
 * Catálogo local (mock).
 * Quando o backend entrar, esta lista é substituída por uma consulta
 * à tabela `produtos` — o tipo `Product` já reflete o schema planejado.
 */
export type ProductCategory = "Fitness" | "Tradicional" | "Vegetariana" | "Low Carb";

export interface Product {
  id: string;
  nome: string;
  descricao: string;
  ingredientes: string[];
  preco: number;
  preco_300g?: number;
  preco_400g?: number;
  peso: string;
  categoria: ProductCategory;
  imagem: string;
  destaque?: boolean;
}

export const CATEGORIES: ProductCategory[] = [
  "Fitness",
  "Tradicional",
  "Vegetariana",
  "Low Carb",
];

export const products: Product[] = [
  {
    id: "frango-grelhado",
    nome: "Frango Grelhado com Purê de Batata-doce",
    descricao:
      "Filé de frango grelhado no ponto, purê cremoso de batata-doce e vagem no vapor.",
    ingredientes: ["Peito de frango", "Batata-doce", "Vagem", "Azeite", "Ervas finas"],
    preco: 24.9,
    peso: "450g",
    categoria: "Fitness",
    imagem: frango,
    destaque: true,
  },
  {
    id: "carne-feijao",
    nome: "Carne de Panela com Arroz e Feijão Preto",
    descricao: "Clássico brasileiro: carne macia cozida lentamente, arroz solto e feijão preto.",
    ingredientes: ["Acém", "Arroz", "Feijão preto", "Legumes salteados", "Temperos naturais"],
    preco: 26.9,
    peso: "500g",
    categoria: "Tradicional",
    imagem: carne,
    destaque: true,
  },
  {
    id: "salmao-quinoa",
    nome: "Salmão Assado com Quinoa",
    descricao: "Salmão assado com ervas, quinoa integral e abobrinha grelhada.",
    ingredientes: ["Salmão", "Quinoa", "Abobrinha", "Limão", "Alho"],
    preco: 34.9,
    peso: "420g",
    categoria: "Low Carb",
    imagem: salmao,
    destaque: true,
  },
  {
    id: "grao-de-bico",
    nome: "Curry de Grão-de-bico com Cuscuz",
    descricao: "Opção 100% vegetal: grão-de-bico ao curry suave com cuscuz marroquino.",
    ingredientes: ["Grão-de-bico", "Cuscuz marroquino", "Tomate", "Leite de coco", "Coentro"],
    preco: 22.9,
    peso: "450g",
    categoria: "Vegetariana",
    imagem: vegana,
  },
  {
    id: "strogonoff",
    nome: "Strogonoff de Frango com Arroz",
    descricao: "Strogonoff cremoso feito com creme de leite fresco e arroz branco soltinho.",
    ingredientes: ["Frango", "Creme de leite", "Champignon", "Arroz", "Cebolinha"],
    preco: 25.9,
    peso: "480g",
    categoria: "Tradicional",
    imagem: strogonoff,
  },
  {
    id: "lasanha",
    nome: "Lasanha à Bolonhesa com Salada",
    descricao: "Lasanha caseira ao molho bolonhesa acompanhada de salada fresca.",
    ingredientes: ["Massa fresca", "Molho bolonhesa", "Queijo", "Folhas verdes", "Cenoura"],
    preco: 28.9,
    peso: "500g",
    categoria: "Tradicional",
    imagem: lasanha,
  },
];

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}