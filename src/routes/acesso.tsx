import { createFileRoute, Link } from "@tanstack/react-router";
import { ChefHat, ShoppingBag, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/acesso")({ component: Acesso, ssr: false });

function Acesso() {
  const opcoes = [
    { to: "/", titulo: "Loja", texto: "Comprar marmitas, combos e acompanhar pedidos.", icone: ShoppingBag, cor: "bg-[#087443]" },
    { to: "/admin-login", titulo: "Administração", texto: "Pedidos, clientes, produtos e configurações.", icone: ShieldCheck, cor: "bg-[#173a2d]" },
    { to: "/cozinha-login", titulo: "Cozinha", texto: "Produção, fichas técnicas e estoque operacional.", icone: ChefHat, cor: "bg-[#b36825]" },
  ] as const;
  return <div className="min-h-screen bg-[#f7f6f0] px-5 py-10 text-[#173a2d]">
    <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col justify-center">
      <div className="mb-8 text-center"><div className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#087443] text-2xl font-black text-white">S</div><h1 className="mt-4 text-3xl font-black">SaborosaMente</h1><p className="mt-2 text-sm text-[#62766b]">Como você quer acessar?</p></div>
      <div className="grid gap-4">{opcoes.map(({ to, titulo, texto, icone: Icon, cor }) => <Link key={to} to={to as any} className="flex items-center gap-4 rounded-3xl border border-[#dbe7dd] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className={`grid size-12 shrink-0 place-items-center rounded-2xl text-white ${cor}`}><Icon size={23} /></div><div><h2 className="font-black">{titulo}</h2><p className="mt-1 text-sm text-[#62766b]">{texto}</p></div></Link>)}</div>
      <p className="mt-8 text-center text-xs text-[#73867b]">Selecione Loja para comprar. Administração e Cozinha solicitam login.</p>
    </div>
  </div>;
}
