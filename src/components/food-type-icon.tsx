import {
  BadgeDollarSign,
  Beef,
  Drumstick,
  Dumbbell,
  Feather,
  Fish,
  Flame,
  Gauge,
  Ham,
  MilkOff,
  Soup,
  Star,
  UtensilsCrossed,
  Vegan,
  WheatOff,
} from "lucide-react";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function FoodTypeIcon({
  label,
  size = 14,
  className = "",
}: {
  label: string;
  size?: number;
  className?: string;
}) {
  const key = normalize(label);

  const common = { size, strokeWidth: 1.9, className };

  if (key.includes("mais escolhidas")) return <Star {...common} />;
  if (key.includes("ate 300 kcal")) return <Gauge {...common} />;
  if (key.includes("alta proteina")) return <Dumbbell {...common} />;
  if (key.includes("mais leves")) return <Feather {...common} />;
  if (key.includes("mais caloricas")) return <Flame {...common} />;
  if (key.includes("mais proteicas")) return <Dumbbell {...common} />;
  if (key.includes("menor preco")) return <BadgeDollarSign {...common} />;
  if (key.includes("frango")) return <Drumstick {...common} />;
  if (key.includes("carne bovina") || key === "bovina" || key.includes("boi")) return <Beef {...common} />;
  if (key.includes("peixe")) return <Fish {...common} />;
  if (key.includes("suina") || key.includes("porco")) return <Ham {...common} />;
  if (key.includes("vegetar")) return <Vegan {...common} />;
  if (key.includes("misto")) return <UtensilsCrossed {...common} />;
  if (key.includes("sopa") || key.includes("caldo")) return <Soup {...common} />;
  if (key.includes("sem gluten")) return <WheatOff {...common} />;
  if (key.includes("sem lactose")) return <MilkOff {...common} />;
  if (key.includes("sodio") || key.includes("carboidrato")) return <Gauge {...common} />;

  return null;
}
