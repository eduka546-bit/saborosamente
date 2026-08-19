import { supabase } from "@/integrations/supabase/client";

/**
 * Gera um secret TOTP e QR code para o usuário
 * Usa biblioteca speakeasy (no cliente) e disponível no servidor
 */
export async function gerarSecretTOTP(userId: string) {
  // Importa dinamicamente a biblioteca no cliente
  const { createSecretKey, createQRCode } = await import("npm:speakeasy");

  const secret = createSecretKey({
    name: `Saborosamente Admin (${userId.slice(0, 8)})`,
    issuer: "Saborosamente",
    length: 32,
  });

  const qrCode = createQRCode(secret);

  return {
    secret: secret.base32, // Para guardar no banco
    qrCodeUrl: qrCode, // Para mostrar ao usuário
    manualEntry: secret.base32, // Para entrada manual em apps como Authy
  };
}

/**
 * Valida um código TOTP
 */
export async function validarCodigoTOTP(secret: string, codigo: string): Promise<boolean> {
  const { verifyToken } = await import("npm:speakeasy");

  const verificado = verifyToken({
    secret,
    encoding: "base32",
    token: codigo,
    window: 2, // Permite 2 janelas de tempo (±30s)
  });

  return verificado;
}

/**
 * Gera códigos de backup para recuperação
 */
export function gerarCodigosBackup(quantidade: number = 10): string[] {
  const codigos: string[] = [];
  for (let i = 0; i < quantidade; i++) {
    // Gera código com 8 caracteres aleatórios
    const codigo = Math.random().toString(36).substring(2, 10).toUpperCase();
    codigos.push(codigo);
  }
  return codigos;
}

/**
 * Ativa 2FA para um usuário
 */
export async function ativar2FA(userId: string, secret: string, backupCodes: string[]) {
  const { data, error } = await supabase
    .from("admin_totp_secrets")
    .upsert({
      user_id: userId,
      secret,
      backup_codes: backupCodes,
      enabled: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao ativar 2FA: ${error.message}`);
  }

  return data;
}

/**
 * Desativa 2FA para um usuário
 */
export async function desativar2FA(userId: string) {
  const { data, error } = await supabase
    .from("admin_totp_secrets")
    .update({ enabled: false })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao desativar 2FA: ${error.message}`);
  }

  return data;
}

/**
 * Obtém status de 2FA do usuário
 */
export async function obter2FAStatus(userId: string) {
  const { data, error } = await supabase
    .from("admin_totp_secrets")
    .select("id, enabled, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao obter 2FA status:", error);
    return { ativo: false, configurado: false };
  }

  return {
    ativo: data?.enabled ?? false,
    configurado: !!data?.id,
    criadoEm: data?.created_at,
  };
}

/**
 * Usa um código de backup (marca como consumido)
 */
export async function usarCodigoBackup(userId: string, codigo: string): Promise<boolean> {
  const { data: record, error: fetchError } = await supabase
    .from("admin_totp_secrets")
    .select("backup_codes")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError || !record) {
    console.error("Erro ao buscar backup codes:", fetchError);
    return false;
  }

  const backup_codes = record.backup_codes || [];
  if (!backup_codes.includes(codigo)) {
    return false; // Código não encontrado
  }

  // Remove o código usado
  const codigosAtualizados = backup_codes.filter((c: string) => c !== codigo);

  const { error: updateError } = await supabase
    .from("admin_totp_secrets")
    .update({ backup_codes: codigosAtualizados })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Erro ao atualizar backup codes:", updateError);
    return false;
  }

  return true;
}
