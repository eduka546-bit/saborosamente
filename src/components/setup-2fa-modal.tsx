import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import {
  gerarSecretTOTP,
  validarCodigoTOTP,
  gerarCodigosBackup,
  ativar2FA,
} from "@/lib/auth-2fa";
import { cn } from "@/lib/utils";

interface Setup2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

export function Setup2FAModal({ isOpen, onClose, userId, onSuccess }: Setup2FAModalProps) {
  const [step, setStep] = useState<"intro" | "qrcode" | "backup" | "confirmar">("intro");
  const [secret, setSecret] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [codigoVerificacao, setCodigoVerificacao] = useState<string>("");
  const [copiou, setCopiou] = useState(false);
  const [loading, setLoading] = useState(false);

  async function iniciarSetup() {
    setLoading(true);
    try {
      const resultado = await gerarSecretTOTP(userId);
      setSecret(resultado.secret);
      setQrCodeUrl(resultado.qrCodeUrl);
      setBackupCodes(gerarCodigosBackup());
      setStep("qrcode");
    } catch (erro) {
      console.error(erro);
      toast.error("Erro ao gerar secret TOTP");
    } finally {
      setLoading(false);
    }
  }

  async function confirmarCodigoVerificacao() {
    if (!codigoVerificacao || codigoVerificacao.length !== 6) {
      toast.error("Código deve ter 6 dígitos");
      return;
    }

    setLoading(true);
    try {
      const valido = await validarCodigoTOTP(secret, codigoVerificacao);
      if (!valido) {
        toast.error("Código inválido. Tente novamente.");
        setLoading(false);
        return;
      }

      // Ativa 2FA no banco
      await ativar2FA(userId, secret, backupCodes);
      toast.success("✅ 2FA ativado com sucesso!");
      setStep("intro");
      setSecret("");
      setQrCodeUrl("");
      setBackupCodes([]);
      setCodigoVerificacao("");
      onSuccess?.();
      onClose();
    } catch (erro) {
      console.error(erro);
      toast.error("Erro ao ativar 2FA");
    } finally {
      setLoading(false);
    }
  }

  function copiarParaClipboard(texto: string) {
    navigator.clipboard.writeText(texto);
    setCopiou(true);
    setTimeout(() => setCopiou(false), 2000);
  }

  function baixarCodigoBackup() {
    const conteudo = `Códigos de Backup - Saborosamente
Guarde estes códigos em um local seguro!
Se perder acesso ao seu autenticador, use estes códigos para recuperar acesso.

${backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Gerado em: ${new Date().toLocaleString("pt-BR")}`;

    const blob = new Blob([conteudo], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-codes-2fa.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>🔐 Ativar Autenticação em Dois Fatores</DialogTitle>
          <DialogDescription>
            Proteja sua conta admin com 2FA (TOTP/Autenticador)
          </DialogDescription>
        </DialogHeader>

        {step === "intro" && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                A autenticação em dois fatores (2FA) adiciona uma camada extra de segurança à sua conta.
                Você precisará de um app autenticador como Google Authenticator, Authy ou Microsoft Authenticator.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="text-2xl">📱</div>
                <div>
                  <p className="font-semibold">Passo 1: Instale um app autenticador</p>
                  <p className="text-muted-foreground">Baixe Google Authenticator, Authy ou similar</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">📷</div>
                <div>
                  <p className="font-semibold">Passo 2: Escaneie o QR Code</p>
                  <p className="text-muted-foreground">Você verá um QR code para escanear com o app</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <p className="font-semibold">Passo 3: Confirme com 6 dígitos</p>
                  <p className="text-muted-foreground">Digite o código de 6 dígitos que aparecer no app</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={iniciarSetup} disabled={loading} className="flex-1">
                {loading ? "Gerando..." : "Começar"}
              </Button>
            </div>
          </div>
        )}

        {step === "qrcode" && qrCodeUrl && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-border flex justify-center">
              {/* Aqui vai renderizar a imagem do QR code */}
              <div className="text-center text-sm text-muted-foreground">
                [QR Code Image]
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">
                Ou entre manualmente (se não conseguir escanear):
              </label>
              <div className="flex gap-2">
                <code className="flex-1 p-3 bg-muted rounded text-sm break-all font-mono">
                  {secret}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copiarParaClipboard(secret)}
                >
                  {copiou ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Digite o código de 6 dígitos que aparecer no seu app autenticador
              </AlertDescription>
            </Alert>

            <div>
              <label className="text-sm font-semibold block mb-2">
                Código de verificação (6 dígitos):
              </label>
              <Input
                placeholder="000000"
                maxLength={6}
                value={codigoVerificacao}
                onChange={(e) => setCodigoVerificacao(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep("intro")} variant="outline" className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={confirmarCodigoVerificacao}
                disabled={loading || codigoVerificacao.length !== 6}
                className="flex-1"
              >
                {loading ? "Verificando..." : "Verificar"}
              </Button>
            </div>
          </div>
        )}

        {step === "backup" && (
          <div className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700">
                ⚠️ Guarde estes códigos em um local seguro! Se perder seu telefone/app, precisará deles para recuperar acesso.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
              {backupCodes.map((codigo, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Badge variant="outline" className="shrink-0">
                    {i + 1}
                  </Badge>
                  <code className="flex-1">{codigo}</code>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={baixarCodigoBackup} variant="outline" className="flex-1">
                <Download size={16} className="mr-2" /> Baixar
              </Button>
              <Button
                onClick={() => copiarParaClipboard(backupCodes.join("\n"))}
                variant="outline"
                className="flex-1"
              >
                <Copy size={16} className="mr-2" /> Copiar
              </Button>
            </div>

            <Button onClick={() => setStep("intro")} className="w-full">
              ✅ Entendi, 2FA está ativado!
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
