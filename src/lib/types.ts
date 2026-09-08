export interface Commitment {
  id: string;
  title: string;
  startAt: string;
  location: string | null;
  area?: string | null;
  recurring?: string | null;
}
export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  area?: string | null;
  recurring?: string | null;
  installments?: number | null;
  installmentNumber?: number | null;
}
export interface Task {
  id: string;
  title: string;
  done: boolean;
  doneAt?: string | null;
}
export interface Project {
  id: string;
  name: string;
  area: string;
  objetivo: string | null;
  statusNote: string | null;
  status: string;
  esperandoMotivo: string | null;
  prioridade: string;
  prazo: string | null;
  orcamento: number | null;
  metaContribuicao: number | null;
  metaFrequencia: string | null;
  hasAlert: boolean;
  archived?: boolean;
  tasks: Task[];
}
