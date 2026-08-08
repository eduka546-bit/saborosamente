export type PaymentOption = { name?: string; label?: string; logo?: string; icon?: string; enabled?: boolean };

export const defaultPaymentMethods: PaymentOption[] = [
  { label: "PIX", icon: "https://logospng.org/download/pix/logo-pix-icone-512.png", enabled: true },
  { label: "Cartão", icon: "https://cdn-icons-png.flaticon.com/512/6963/6963703.png", enabled: true },
  { label: "Alimentação", icon: "https://cdn-icons-png.flaticon.com/512/2737/2737034.png", enabled: true },
  { label: "Mercado Pago", icon: "https://logospng.org/download/mercado-pago/logo-mercado-pago-icone-1024.png", enabled: true },
  { label: "Dinheiro", icon: "https://cdn-icons-png.flaticon.com/512/2489/2489756.png", enabled: true },
];

export const defaultCardFlags: PaymentOption[] = [
  { name: "Visa", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg", enabled: true },
  { name: "Mastercard", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg", enabled: true },
  { name: "Hiper", logo: "https://logodownload.org/wp-content/uploads/2015/05/hiper-logo.png", enabled: true },
  { name: "Elo", logo: "https://upload.wikimedia.org/wikipedia/commons/0/03/Logo_Elo_cortado.png", enabled: true },
  { name: "Hipercard", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Hipercard_logo.svg", enabled: true },
  { name: "Diners Club", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Diners_Club_Logo3.svg", enabled: true },
  { name: "American Express", logo: "https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg", enabled: true },
];

export const defaultMealFlags: PaymentOption[] = [
  { name: "VR", logo: "https://vrsolucao.com.br/wp-content/uploads/2021/05/logo-vr.png", enabled: true },
  { name: "Ticket", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Ticket_Logotipo.svg/1200px-Ticket_Logotipo.svg.png", enabled: true },
  { name: "Alelo", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Alelo_logo.svg", enabled: true },
  { name: "Pluxee", logo: "https://logodownload.org/wp-content/uploads/2023/11/pluxee-logo.png", enabled: true },
  { name: "Sodexo", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Sodexo_logo.svg/1200px-Sodexo_logo.svg.png", enabled: true },
  { name: "Caju", logo: "https://logodownload.org/wp-content/uploads/2022/09/caju-logo.png", enabled: true },
  { name: "Flash", logo: "https://logodownload.org/wp-content/uploads/2022/09/flash-logo.png", enabled: true },
];

export function enabledOrDefault(value: unknown, fallback: PaymentOption[]): PaymentOption[] {
  if (Array.isArray(value) && value.length) {
    return (value as PaymentOption[]).filter((item) => item?.enabled !== false);
  }
  return fallback;
}
