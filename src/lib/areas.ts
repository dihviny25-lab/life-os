export type AreaKey =
  | "familia"
  | "financas"
  | "barbearia"
  | "desenvolvimento"
  | "igreja_ministerio"
  | "pessoal"
  | "conhecimento";

export const AREAS: { key: AreaKey; name: string }[] = [
  { key: "familia", name: "Família" },
  { key: "financas", name: "Finanças" },
  { key: "barbearia", name: "Barbearia" },
  { key: "desenvolvimento", name: "Desenvolvimento" },
  { key: "igreja_ministerio", name: "Igreja & Ministério" },
  { key: "pessoal", name: "Pessoal" },
  { key: "conhecimento", name: "Conhecimento" },
];
