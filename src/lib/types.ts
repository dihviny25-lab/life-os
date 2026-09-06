export interface Commitment {
  id: string;
  title: string;
  startAt: string;
  location: string | null;
  area?: string | null;
}
export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  area?: string | null;
}
export interface Project {
  id: string;
  name: string;
  area: string;
  statusNote: string | null;
  needsDecision: boolean;
  hasAlert: boolean;
}
