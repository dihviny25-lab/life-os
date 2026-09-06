// Central — shared constants

export type DomainKey =
  | "familia"
  | "financas"
  | "barbearia"
  | "desenvolvimento"
  | "igreja_ministerio"
  | "pessoal"
  | "conhecimento";

export interface DomainMeta {
  key: DomainKey;
  name: string;
  short: string;
  description: string;
  icon: string;
  color: string;
  order: number;
}

export const DOMAINS: DomainMeta[] = [
  { key: "familia", name: "Família", short: "Família", description: "Agenda familiar, compromissos, filhos, viagens e decisões da casa.", icon: "Users", color: "#0ea5e9", order: 0 },
  { key: "financas", name: "Finanças", short: "Finanças", description: "Entradas, contas, dívidas, assinaturas, orçamento e fluxo de caixa.", icon: "Wallet", color: "#10b981", order: 1 },
  { key: "barbearia", name: "Barbearia", short: "Barbearia", description: "Clientes, agenda profissional, metas, conteúdo e posicionamento.", icon: "Scissors", color: "#f59e0b", order: 2 },
  { key: "desenvolvimento", name: "Desenvolvimento", short: "Desenvolvimento", description: "Projetos de software, PRs, deploys, clientes e decisões técnicas.", icon: "Code2", color: "#6366f1", order: 3 },
  { key: "igreja_ministerio", name: "Igreja & Ministério", short: "Igreja & Ministério", description: "Pregações, estudos, ministérios, eventos e responsabilidades da igreja.", icon: "Church", color: "#8b5cf6", order: 4 },
  { key: "pessoal", name: "Pessoal", short: "Pessoal", description: "Rotina, hábitos, objetivos pessoais e organização individual.", icon: "User", color: "#ec4899", order: 5 },
  { key: "conhecimento", name: "Conhecimento", short: "Conhecimento", description: "Notas, estudos, ideias, referências e aprendizado.", icon: "BookOpen", color: "#14b8a6", order: 6 },
];

export const DOMAIN_MAP: Record<string, DomainMeta> = Object.fromEntries(DOMAINS.map((d) => [d.key, d]));

export type ItemType = "task" | "note" | "journal" | "habit" | "event" | "finance" | "contact" | "idea" | "goal" | "document" | "bookmark" | "milestone" | "routine" | "symptom" | "medication" | "affirmation" | "vision";
export interface ItemTypeMeta { type: ItemType; name: string; icon: string; color: string; hasDate?: boolean; completable?: boolean; }
export const ITEM_TYPES: ItemTypeMeta[] = [
  { type: "task", name: "Tarefa", icon: "CheckSquare", color: "#f59e0b", hasDate: true, completable: true },
  { type: "note", name: "Nota", icon: "StickyNote", color: "#eab308" },
  { type: "journal", name: "Diário", icon: "BookHeart", color: "#a78bfa", hasDate: true },
  { type: "habit", name: "Hábito", icon: "Repeat", color: "#10b981" },
  { type: "event", name: "Evento", icon: "Calendar", color: "#06b6d4", hasDate: true },
  { type: "finance", name: "Financeiro", icon: "Wallet", color: "#10b981", hasDate: true },
  { type: "contact", name: "Contato", icon: "User", color: "#06b6d4" },
  { type: "idea", name: "Ideia", icon: "Lightbulb", color: "#ec4899" },
  { type: "goal", name: "Objetivo", icon: "Target", color: "#f43f5e", hasDate: true },
  { type: "document", name: "Documento", icon: "FileText", color: "#71717a" },
  { type: "bookmark", name: "Referência", icon: "Bookmark", color: "#3b82f6" },
  { type: "milestone", name: "Marco", icon: "Flag", color: "#f59e0b", hasDate: true, completable: true },
  { type: "routine", name: "Rotina", icon: "ListChecks", color: "#eab308" },
  { type: "symptom", name: "Sintoma", icon: "Thermometer", color: "#f43f5e", hasDate: true },
  { type: "medication", name: "Medicação", icon: "Pill", color: "#f43f5e", hasDate: true },
  { type: "affirmation", name: "Afirmação", icon: "Heart", color: "#a78bfa" },
  { type: "vision", name: "Visão", icon: "Eye", color: "#a78bfa" },
];
export const ITEM_TYPE_MAP: Record<string, ItemTypeMeta> = Object.fromEntries(ITEM_TYPES.map((t) => [t.type, t]));
export type ItemStatus = "inbox" | "active" | "done" | "archived" | "snoozed";
export const STATUS_META: Record<ItemStatus, { name: string; color: string }> = { inbox: { name: "Inbox", color: "#71717a" }, active: { name: "Ativo", color: "#10b981" }, done: { name: "Concluído", color: "#3b82f6" }, archived: { name: "Arquivado", color: "#71717a" }, snoozed: { name: "Adiado", color: "#f59e0b" } };
export const PRIORITY_META = [{ value: 0, name: "Nenhuma", color: "#71717a" }, { value: 1, name: "Baixa", color: "#3b82f6" }, { value: 2, name: "Média", color: "#eab308" }, { value: 3, name: "Alta", color: "#f59e0b" }, { value: 4, name: "Urgente", color: "#f43f5e" }];
export const ENERGY_META = [{ value: 0, name: "—", color: "#71717a" }, { value: 1, name: "Baixa", color: "#3b82f6" }, { value: 2, name: "Média", color: "#eab308" }, { value: 3, name: "Alta", color: "#f43f5e" }];
export const REVIEW_PROMPTS = {
  daily: { wins: "O que deu certo hoje?", challenges: "O que não saiu como planejado?", learnings: "O que você aprendeu?", gratitude: "Pelo que você é grato?", priorities: "Qual é a principal prioridade de amanhã?" },
  weekly: { wins: "Quais foram as vitórias da semana?", challenges: "O que drenou sua energia ou bloqueou o progresso?", learnings: "O que você aprendeu esta semana?", gratitude: "Por quem ou pelo que você é grato?", priorities: "Quais são as três prioridades da próxima semana?" },
};
