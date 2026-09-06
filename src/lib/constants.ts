// Life OS — shared constants

export type DomainKey =
  | "mind_soul"
  | "time_action"
  | "health"
  | "wealth"
  | "network"
  | "growth"
  | "creativity"
  | "admin";

export interface DomainMeta {
  key: DomainKey;
  name: string;
  short: string;
  description: string;
  icon: string; // lucide icon name
  color: string; // hex
  order: number;
}

export const DOMAINS: DomainMeta[] = [
  {
    key: "mind_soul",
    name: "Mente & Alma",
    short: "Mente",
    description: "Valores centrais, visões, medos, afirmações, notas de terapia, meditação.",
    icon: "Compass",
    color: "#a78bfa",
    order: 0,
  },
  {
    key: "time_action",
    name: "Tempo & Ação",
    short: "Ação",
    description: "Tarefas, hábitos, rotinas, blocos de trabalho focado, listas de desejos.",
    icon: "Hourglass",
    color: "#f59e0b",
    order: 1,
  },
  {
    key: "health",
    name: "Saúde & Corpo",
    short: "Saúde",
    description: "Sono, condicionamento físico, nutrição, sintomas, medicamentos, consultas.",
    icon: "HeartPulse",
    color: "#f43f5e",
    order: 2,
  },
  {
    key: "wealth",
    name: "Riqueza & Carreira",
    short: "Riqueza",
    description: "Receitas, despesas, assinaturas, contas, metas de economia, carreira.",
    icon: "TrendingUp",
    color: "#10b981",
    order: 3,
  },
  {
    key: "network",
    name: "Rede",
    short: "Rede",
    description: "Contatos, datas importantes, registros de interação, follow-ups, presentes, pets.",
    icon: "Users",
    color: "#06b6d4",
    order: 4,
  },
  {
    key: "growth",
    name: "Crescimento",
    short: "Crescimento",
    description: "Lista de leitura, cursos, desenvolvimento de habilidades, artigos salvos, aprendizados.",
    icon: "BookOpen",
    color: "#3b82f6",
    order: 5,
  },
  {
    key: "creativity",
    name: "Criatividade & Alegria",
    short: "Alegria",
    description: "Cofre de ideias, projetos paralelos, registro de mídia, hobbies, viagens, eventos.",
    icon: "Palette",
    color: "#ec4899",
    order: 6,
  },
  {
    key: "admin",
    name: "Administração",
    short: "Admin",
    description: "Cofre de documentos, manutenção da casa, inventário, listas de compras, receitas culinárias.",
    icon: "Home",
    color: "#71717a",
    order: 7,
  },
];

export const DOMAIN_MAP: Record<string, DomainMeta> = Object.fromEntries(
  DOMAINS.map((d) => [d.key, d]),
);

export type ItemType =
  | "task"
  | "note"
  | "journal"
  | "habit"
  | "event"
  | "finance"
  | "contact"
  | "idea"
  | "goal"
  | "document"
  | "bookmark"
  | "milestone"
  | "routine"
  | "symptom"
  | "medication"
  | "affirmation"
  | "vision";

export interface ItemTypeMeta {
  type: ItemType;
  name: string;
  icon: string;
  color: string;
  hasDate?: boolean;
  completable?: boolean;
}

export const ITEM_TYPES: ItemTypeMeta[] = [
  { type: "task", name: "Tarefa", icon: "CheckSquare", color: "#f59e0b", hasDate: true, completable: true },
  { type: "note", name: "Nota", icon: "StickyNote", color: "#eab308" },
  { type: "journal", name: "Diário", icon: "BookHeart", color: "#a78bfa", hasDate: true },
  { type: "habit", name: "Hábito", icon: "Repeat", color: "#10b981" },
  { type: "event", name: "Evento", icon: "Calendar", color: "#06b6d4", hasDate: true },
  { type: "finance", name: "Financeiro", icon: "Wallet", color: "#10b981", hasDate: true },
  { type: "contact", name: "Contato", icon: "User", color: "#06b6d4" },
  { type: "idea", name: "Ideia", icon: "Lightbulb", color: "#ec4899" },
  { type: "goal", name: "Meta", icon: "Target", color: "#f43f5e", hasDate: true },
  { type: "document", name: "Documento", icon: "FileText", color: "#71717a" },
  { type: "bookmark", name: "Favorito", icon: "Bookmark", color: "#3b82f6" },
  { type: "milestone", name: "Marco", icon: "Flag", color: "#f59e0b", hasDate: true, completable: true },
  { type: "routine", name: "Rotina", icon: "ListChecks", color: "#eab308" },
  { type: "symptom", name: "Sintoma", icon: "Thermometer", color: "#f43f5e", hasDate: true },
  { type: "medication", name: "Medicamento", icon: "Pill", color: "#f43f5e", hasDate: true },
  { type: "affirmation", name: "Afirmação", icon: "Heart", color: "#a78bfa" },
  { type: "vision", name: "Visão", icon: "Eye", color: "#a78bfa" },
];

export const ITEM_TYPE_MAP: Record<string, ItemTypeMeta> = Object.fromEntries(
  ITEM_TYPES.map((t) => [t.type, t]),
);

export type ItemStatus = "inbox" | "active" | "done" | "archived" | "snoozed";

export const STATUS_META: Record<ItemStatus, { name: string; color: string }> = {
  inbox: { name: "Entrada", color: "#71717a" },
  active: { name: "Ativo", color: "#10b981" },
  done: { name: "Concluído", color: "#3b82f6" },
  archived: { name: "Arquivado", color: "#71717a" },
  snoozed: { name: "Adiado", color: "#f59e0b" },
};

export const PRIORITY_META = [
  { value: 0, name: "Nenhuma", color: "#71717a" },
  { value: 1, name: "Baixa", color: "#3b82f6" },
  { value: 2, name: "Média", color: "#eab308" },
  { value: 3, name: "Alta", color: "#f59e0b" },
  { value: 4, name: "Urgente", color: "#f43f5e" },
];

export const ENERGY_META = [
  { value: 0, name: "—", color: "#71717a" },
  { value: 1, name: "Baixa", color: "#3b82f6" },
  { value: 2, name: "Média", color: "#eab308" },
  { value: 3, name: "Alta", color: "#f43f5e" },
];

export const REVIEW_PROMPTS = {
  daily: {
    wins: "O que foi bem hoje?",
    challenges: "O que não saiu como planejado?",
    learnings: "O que você aprendeu?",
    gratitude: "Pelo que você é grato?",
    priorities: "Qual seu foco principal para amanhã?",
  },
  weekly: {
    wins: "Quais foram as vitórias desta semana?",
    challenges: "O que te esgotou ou bloqueou seu progresso?",
    learnings: "O que você aprendeu sobre si mesmo?",
    gratitude: "Por quem ou pelo que você é grato esta semana?",
    priorities: "Quais 3 coisas importam mais na próxima semana?",
  },
};
