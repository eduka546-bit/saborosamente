import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";

export const AUDIO_TIPOS_META = ["audio/mpeg", "audio/mp4", "audio/ogg", "audio/aac", "audio/amr", "audio/opus"];
const GRAVACAO_FORMATOS = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/ogg;codecs=opus"];

export function WhatsAppVoiceRecorder({ onRecorded, disabled, dark }: {
  onRecorded: (file: File) => void; disabled?: boolean; dark: boolean;
}) {
  const [gravando, setGravando] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const iniciarOuParar = async () => {
    if (recorder.current?.state === "recording") {
      recorder.current.stop();
      setGravando(false);
      return;
    }
    if (disabled || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Microfone indisponível. Você pode anexar um MP3, M4A ou OGG.");
      return;
    }
    const mime = GRAVACAO_FORMATOS.find((t) => MediaRecorder.isTypeSupported(t));
    if (!mime) {
      toast.error("Este navegador não grava em um formato aceito pela Meta. Anexe MP3, M4A ou OGG/Opus.");
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const r = new MediaRecorder(media, { mimeType: mime });
      recorder.current = r;
      chunks.current = [];
      r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      r.onstop = () => {
        try {
          const mp4 = mime.startsWith("audio/mp4");
          const type = mp4 ? "audio/mp4" : "audio/ogg";
          const blob = new Blob(chunks.current, { type });
          if (blob.size > 0) {
            onRecorded(new File([blob], "audio-" + Date.now() + (mp4 ? ".m4a" : ".ogg"), { type }));
          } else {
            toast.error("Não foi possível gravar o áudio.");
          }
        } finally {
          media.getTracks().forEach((track) => track.stop());
          recorder.current = null;
          stream.current = null;
          chunks.current = [];
          setGravando(false);
        }
      };
      r.onerror = () => {
        media.getTracks().forEach((track) => track.stop());
        toast.error("Erro no gravador de áudio.");
        setGravando(false);
      };
      r.start(250);
      setGravando(true);
    } catch {
      toast.error("Permissão de microfone negada ou indisponível.");
      setGravando(false);
    }
  };
  useEffect(() => () => {
    if (recorder.current?.state === "recording") {
      recorder.current.onstop = null;
      recorder.current.stop();
    }
    stream.current?.getTracks().forEach((track) => track.stop());
  }, []);
  return (
    <button type="button" onClick={() => void iniciarOuParar()} disabled={disabled}
      title={gravando ? "Parar e pré-visualizar o áudio" : "Gravar áudio"}
      aria-label={gravando ? "Parar gravação" : "Gravar áudio"}
      className={"rounded-full p-1 disabled:opacity-50 " + (gravando ? "animate-pulse text-red-500" : dark ? "text-[#8696a0]" : "text-[#667781]")}>
      {gravando ? <Square size={19} fill="currentColor"/> : <Mic size={19}/>}
    </button>
  );
}
