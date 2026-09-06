"use client";

import { PageHeader, SectionCard } from "../layout";

export function GoalsView() {
  return <div className="space-y-6"><PageHeader title="Objetivos" subtitle="Metas pessoais, familiares, profissionais e ministeriais em um só lugar." icon="Target" color="#f43f5e" /><SectionCard title="Em construção" icon="Sparkles"><p className="text-sm text-muted-foreground">Esta área será conectada aos objetivos existentes e aos projetos da Central. A navegação já está preparada para a implementação funcional.</p></SectionCard></div>;
}

export function CentralAIView() {
  return <div className="space-y-6"><PageHeader title="Central IA" subtitle="Pergunte o que precisa da sua atenção e transforme informação em próximas ações." icon="Sparkles" color="#8b5cf6" /><SectionCard title="Próxima etapa" icon="Brain"><p className="text-sm text-muted-foreground">A Central IA será ativada depois do isolamento de dados e das integrações. Ela deverá consultar somente os dados autorizados do usuário.</p></SectionCard></div>;
}
