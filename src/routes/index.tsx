import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Leaf, Snowflake, Truck, Clock, Loader2, MapPin, CreditCard, Calendar } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import heroImage from "@/assets/hero-marmitas.jpg";
import { ProductCard } from "@/components/product-card";
import { useQuery } from "@tanstack/react-query";
import { getPublicProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saborosamente | Marmitas Congeladas Feitas com Comida de Verdade" },
      {
        name: "description",
        content:
          "Marmitas congeladas artesanais, equilibradas e prontas em minutos. Monte seu combo e receba em casa com a Saborosamente.",
      },
      { property: "og:title", content: "Saborosamente | Marmitas Congeladas Artesanais" },
      {
        property: "og:description",
        content: "Monte seu combo de marmitas congeladas e receba em casa. Comida de verdade, sem conservantes.",
      },
    ],
  }),
  component: Index,
});

const infoCards = [
  {
    icon: MapPin,
    titulo: "Taxa de entrega",
    subtitulo: "A partir de R$ 8,90",
    cor: "text-[#086e45]"
  },
  {
    icon: Truck,
    titulo: "Formas de entrega",
    subtitulo: "Delivery ou Retirada",
    cor: "text-[#086e45]"
  },
  {
    icon: Calendar,
    titulo: "Funcionamento",
    subtitulo: "Encomendas podem ser feitas em tempo integral!",
    cor: "text-[#086e45]"
  }
];

const beneficios = [
  {
    icon: Leaf,
    titulo: "Comida de verdade",
    texto: "Ingredientes frescos, sem conservantes e sem excesso de sódio.",
  },
  {
    icon: Snowflake,
    titulo: "Congelamento rápido",
    texto: "Congelamos logo após o preparo para manter sabor e nutrientes.",
  },
  {
    icon: Clock,
    titulo: "Pronto em 6 minutos",
    texto: "Do freezer ao prato, sem sujeira e sem complicação.",
  },
  {
    icon: Truck,
    titulo: "Entrega refrigerada",
    texto: "Frete grátis nos pedidos acima de R$ 120.",
  },
];

function Index() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products-featured"],
    queryFn: () => getPublicProducts(),
  });

  const destaques = products.filter((p: any) => p.destaque).slice(0, 3);
  
  // Se não houver destaques marcados, pegar os primeiros 3
  const displayProducts = destaques.length > 0 ? destaques : products.slice(0, 3);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 -mt-10 sm:-mt-20 relative z-30 pb-12">
        <div className="grid lg:grid-cols-[1.2fr_3fr] gap-8 items-start">
          {/* Text Content - Left Side */}
          <div className="pt-16 sm:pt-24 text-left">
            <h1 className="text-xl sm:text-2xl font-black text-[#086e45] leading-tight uppercase tracking-tight">
              SaborosaMente - Atacado de Refeições e Sopas Congeladas
            </h1>
            <p className="mt-2 text-sm text-[#086e45] font-medium leading-relaxed opacity-90">
              Para o corpo e para a mente, SaborosaMente!
            </p>
          </div>

          {/* Info Card - Right Side */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-soft flex flex-col sm:flex-row items-stretch overflow-hidden">
            <div className="flex-1 flex flex-wrap">
              {infoCards.map((card, i) => (
                <div key={i} className="flex-1 min-w-[180px] p-6 sm:p-8 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-gray-50 last:border-r-0">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                    {card.titulo}
                    {card.titulo === "Funcionamento" && <span className="size-1.5 rounded-full bg-green-500" />}
                  </h4>
                  <p className={cn("text-[13px] sm:text-[14px] font-bold leading-tight", card.cor)}>
                    {card.subtitulo}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Search Bar matching the design */}
            <div className="px-8 flex items-center border-l border-gray-50 bg-gray-50/10">
               <div className="flex items-center gap-3 text-gray-400">
                 <span className="text-sm font-medium">Pesquisar...</span>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                   <circle cx="11" cy="11" r="8"></circle>
                   <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                 </svg>
               </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        {/* Benefícios Originais (Pequenos badges/caixas secundárias) */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {beneficios.map(({ icon: Icon, titulo, texto }) => (
            <div key={titulo} className="rounded-3xl border border-border bg-card p-6 shadow-soft hover:shadow-md transition-shadow">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#086e45]/10 text-[#086e45]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{titulo}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Mais pedidas da semana</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              As marmitas que saem primeiro do nosso freezer.
            </p>
          </div>
          <Link to="/catalogo" className="text-sm font-semibold text-primary hover:underline">
            Ver todas as marmitas →
          </Link>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-muted-foreground text-sm">Carregando sugestões...</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayProducts.map((product: any) => (
                <ProductCard 
                  key={product.id} 
                  product={{
                    ...product,
                    categoria: product.categorias?.nome || "Marmita",
                    imagem: product.imagem_url
                  }} 
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-[2.5rem] bg-gradient-brand px-8 py-14 text-center text-primary-foreground shadow-lift">
          <h2 className="text-3xl font-bold md:text-4xl">Sua semana resolvida em um pedido</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm opacity-90 md:text-base">
            Monte um combo com 10 marmitas e ganhe frete grátis. Sem assinatura, sem fidelidade.
          </p>
          <Link
            to="/catalogo"
            className="mt-8 inline-flex items-center rounded-full bg-sun px-8 py-3 text-sm font-bold text-sun-foreground transition-transform hover:scale-[1.03]"
          >
            Montar meu combo
          </Link>
        </div>
      </section>
    </>
  );
}