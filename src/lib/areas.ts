export type AreaKey =
  | "familia"
  | "financas"
  | "barbearia"
  | "desenvolvimento"
  | "igreja_ministerio"
  | "pessoal"
  | "conhecimento";

export const AREAS: { key: AreaKey; name: string; color: string }[] = [
  { key: "familia", name: "Família", color: "#0ea5e9" },
  { key: "financas", name: "Finanças", color: "#10b981" },
  { key: "barbearia", name: "Barbearia", color: "#f59e0b" },
  { key: "desenvolvimento", name: "Desenvolvimento", color: "#6366f1" },
  { key: "igreja_ministerio", name: "Igreja & Ministério", color: "#8b5cf6" },
  { key: "pessoal", name: "Pessoal", color: "#ec4899" },
  { key: "conhecimento", name: "Conhecimento", color: "#14b8a6" },
];
