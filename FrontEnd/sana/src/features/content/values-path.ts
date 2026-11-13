import {
  BadgeCheck,
  HandHeart,
  Handshake,
  Heart,
  HeartHandshake,
  Leaf,
  Lock,
  MessageCircleHeart,
  ShieldCheck,
  Smile,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICON_KEYWORDS: [string[], LucideIcon][] = [
  [["empati", "amor", "carino", "afecto", "ternura"], HeartHandshake],
  [["confidencial", "privacidad", "reserva", "secreto"], Lock],
  [["compromiso", "responsab", "constancia"], Handshake],
  [["respeto", "dignidad", "proteccion", "seguridad"], ShieldCheck],
  [["equipo", "colabora", "comunidad", "familia", "union"], Users],
  [["alegria", "juego", "felicidad", "ludic", "sonrisa"], Sun],
  [["honest", "transparen", "verdad", "etica", "integridad"], BadgeCheck],
  [["solidari", "servicio", "generosidad", "ayuda"], HandHeart],
  [["inclusi", "diversidad", "equidad", "igualdad"], Sprout],
  [["calidad", "excelencia", "profesional"], Star],
  [["escucha", "dialogo", "comunicacion"], MessageCircleHeart],
];

const FALLBACK_ICONS: LucideIcon[] = [Sparkles, Heart, Leaf, Smile, Star, Sprout];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

// Picks an icon from title keywords; falls back to a fixed icon per position.
export function pickValueIcon(title: string, index: number): LucideIcon {
  const normalized = normalize(title);
  const match = ICON_KEYWORDS.find(([keywords]) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  );

  return match ? match[1] : FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}
