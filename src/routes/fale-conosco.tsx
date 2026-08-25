import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  MessageCircle,
  Instagram,
  Mail,
  ChevronDown,
  ChevronUp,
  Phone,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fale-conosco")({
  head: () => ({
    meta: [
      { title: "Fale Conosco | Saborosamente" },
      { name: "description", content: "Tire suas dúvidas e entre em contato com a Saborosamente." },
    ],
  }),
  component: FaleConoscoPage,
});

function FaleConoscoPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").maybeSingle();
      return data;
    },
  });

  const { data: faqs = [] } = useQuery({
    queryKey: ["faq-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq")
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });

  const whatsapp =
    (settings as any)?.contato_whatsapp || (settings as any)?.footer_whatsapp || "5547991507757";
  const instagram =
    (settings as any)?.contato_instagram ||
    (settings as any)?.footer_instagram ||
    "saborosamente.sbs";
  const email = (settings as any)?.contato_email || "";

  const waUrl = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=Olá! Gostaria de tirar uma dúvida.`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-[#086e45]">Fale Conosco</h1>
        <p className="text-muted-foreground text-base max-w-xl mx-auto">
          Estamos aqui para ajudar. Confira as dúvidas frequentes ou entre em contato diretamente.
        </p>
      </div>

      {/* Botões de contato */}
      <div className="grid gap-4 sm:grid-cols-3">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-3 rounded-2xl bg-green-500 hover:bg-green-600 p-6 text-white transition-all hover:scale-[1.02] shadow-lg"
        >
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-bold text-sm">WhatsApp</p>
            <p className="text-xs text-white/80 mt-0.5">Resposta rápida</p>
          </div>
        </a>

        <a
          href={`https://instagram.com/${instagram.replace("@", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 p-6 text-white transition-all hover:scale-[1.02] shadow-lg"
        >
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-6"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-bold text-sm">Instagram</p>
            <p className="text-xs text-white/80 mt-0.5">@{instagram.replace("@", "")}</p>
          </div>
        </a>

        {email ? (
          <a
            href={`mailto:${email}`}
            className="flex flex-col items-center gap-3 rounded-2xl bg-[#086e45] hover:bg-[#065a38] p-6 text-white transition-all hover:scale-[1.02] shadow-lg"
          >
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Mail className="size-6" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">E-mail</p>
              <p className="text-xs text-white/80 mt-0.5 truncate max-w-[120px]">{email}</p>
            </div>
          </a>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-gray-100 p-6 text-gray-400">
            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
              <Phone className="size-6" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm text-gray-500">Horário</p>
              <p className="text-xs mt-0.5">Encomendas 24h</p>
            </div>
          </div>
        )}
      </div>

      {/* FAQ */}
      {faqs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle size={22} className="text-[#086e45]" />
            <h2 className="text-2xl font-bold text-[#086e45]">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq: any) => (
              <div
                key={faq.id}
                className="rounded-2xl border border-border bg-white shadow-soft overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span>{faq.pergunta}</span>
                  {openFaq === faq.id ? (
                    <ChevronUp size={18} className="text-[#086e45] shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === faq.id && (
                  <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {faq.resposta}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA final */}
      <div className="rounded-3xl bg-[#086e45] p-8 text-white text-center space-y-4">
        <p className="font-bold text-lg">Não encontrou o que procurava?</p>
        <p className="text-white/80 text-sm">
          Fale diretamente com a gente no WhatsApp. Respondemos rápido!
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-[#086e45] font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Falar no WhatsApp
        </a>
      </div>
    </div>
  );
}
