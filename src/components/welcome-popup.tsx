import { useState, useEffect } from "react";
import { X, MessageCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "saborosamente.welcome_popup_dismissed";

interface WelcomePopupProps {
  config: {
    ativo: boolean;
    imagem_url?: string;
    titulo?: string;
    texto?: string;
    itens?: string[];
    cupom_codigo?: string;
    cupom_desconto?: string;
    cupom_texto?: string;
    whatsapp?: string;
    whatsapp_texto?: string;
    botao_texto?: string;
    botao_link?: string;
    delay_segundos?: number;
  };
}

export function WelcomePopup({ config }: WelcomePopupProps) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [naoMostrar, setNaoMostrar] = useState(false);

  useEffect(() => {
    if (!config?.ativo) return;

    // Verifica se já foi dispensado
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === "true") return;

    // Abre após o delay configurado
    const delay = (config.delay_segundos ?? 1) * 1000;
    const timer = setTimeout(() => {
      setOpen(true);
      setTimeout(() => setVisible(true), 30);
    }, delay);

    return () => clearTimeout(timer);
  }, [config]);

  const fechar = () => {
    setVisible(false);
    setTimeout(() => {
      setOpen(false);
      if (naoMostrar) {
        localStorage.setItem(STORAGE_KEY, "true");
      }
    }, 300);
  };

  const handleBotao = (e: React.MouseEvent) => {
    if (config.botao_link?.startsWith("#")) {
      e.preventDefault();
      fechar();
      setTimeout(() => {
        const el = document.getElementById(config.botao_link!.replace("#", ""));
        el?.scrollIntoView({ behavior: "smooth" });
      }, 350);
    } else {
      fechar();
    }
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9998] flex items-center justify-center px-4 transition-all duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={fechar} />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl transition-all duration-300",
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4",
        )}
      >
        {/* Botão fechar */}
        <button
          onClick={fechar}
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          aria-label="Fechar"
        >
          <X size={16} className="text-gray-600" />
        </button>

        {/* Imagem (se tiver) */}
        {config.imagem_url && (
          <div className="w-full aspect-[4/3] overflow-hidden rounded-t-3xl bg-gray-100">
            <img
              src={config.imagem_url}
              alt="Popup de boas-vindas"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Título */}
          {config.titulo && (
            <div className="bg-[#086e45] text-white rounded-2xl px-4 py-3 text-center">
              <p className="font-black text-sm leading-tight">{config.titulo}</p>
              {config.texto && (
                <p className="text-white/80 text-[11px] mt-1 leading-relaxed">{config.texto}</p>
              )}
            </div>
          )}

          {/* Itens */}
          {config.itens && config.itens.length > 0 && (
            <ul className="space-y-2">
              {config.itens.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <div className="h-5 w-5 rounded-full bg-[#086e45]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="text-[#086e45]" />
                  </div>
                  <span className="leading-tight">{item}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Cupom */}
          {config.cupom_codigo && (
            <div className="bg-[#086e45]/5 border border-[#086e45]/20 rounded-2xl p-4 text-center space-y-2">
              {config.cupom_texto && <p className="text-xs text-gray-500">{config.cupom_texto}</p>}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(config.cupom_codigo!).catch(() => {});
                }}
                className="bg-[#086e45] text-white font-black tracking-widest text-sm px-6 py-2.5 rounded-xl hover:bg-[#065a38] transition-colors w-full"
              >
                {config.cupom_codigo}
              </button>
              {config.cupom_desconto && (
                <p className="text-xs text-[#086e45] font-semibold">
                  e ganhe {config.cupom_desconto}.
                </p>
              )}
            </div>
          )}

          {/* WhatsApp */}
          {config.whatsapp && (
            <a
              href={`https://wa.me/${config.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#086e45] transition-colors"
            >
              <MessageCircle size={16} className="text-green-500" />
              <span>
                {config.whatsapp_texto && (
                  <span className="font-medium">{config.whatsapp_texto} </span>
                )}
                <span className="font-bold">{config.whatsapp}</span>
              </span>
            </a>
          )}

          {/* Botão CTA */}
          {config.botao_texto && (
            <a
              href={config.botao_link ?? "#cardapio"}
              onClick={handleBotao}
              className="block w-full text-center bg-[#086e45] text-white font-bold py-3 rounded-2xl hover:bg-[#065a38] transition-colors text-sm"
            >
              {config.botao_texto}
            </a>
          )}

          {/* Não exibir mais */}
          <label className="flex items-center justify-center gap-2 text-[11px] text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
            <input
              type="checkbox"
              checked={naoMostrar}
              onChange={(e) => setNaoMostrar(e.target.checked)}
              className="rounded accent-[#086e45]"
            />
            Não exibir mais esta mensagem.
          </label>
        </div>
      </div>
    </div>
  );
}
