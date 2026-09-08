import { Users, Wallet, Scissors, Code2, Church, User, BookOpen, type LucideIcon } from "lucide-react";

export type AreaKey =
  | "familia"
  | "financas"
  | "barbearia"
  | "desenvolvimento"
  | "igreja_ministerio"
  | "pessoal"
  | "conhecimento";

export const AREAS: { key: AreaKey; name: string; color: string; icon: LucideIcon }[] = [
  { key: "familia", name: "Família", color: "#0ea5e9", icon: Users },
  { key: "financas", name: "Finanças", color: "#10b981", icon: Wallet },
  { key: "barbearia", name: "Barbearia", color: "#f59e0b", icon: Scissors },
  { key: "desenvolvimento", name: "Desenvolvimento", color: "#6366f1", icon: Code2 },
  { key: "igreja_ministerio", name: "Igreja & Ministério", color: "#8b5cf6", icon: Church },
  { key: "pessoal", name: "Pessoal", color: "#ec4899", icon: User },
  { key: "conhecimento", name: "Conhecimento", color: "#14b8a6", icon: BookOpen },
];
