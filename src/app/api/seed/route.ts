import { db } from "@/lib/db";
import { ok, bad } from "@/lib/auth-utils";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { DOMAINS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function daysFromNow(n: number, h = 9, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(h, m, 0, 0);
  return d;
}

// POST /api/seed — seeds demo data for the authenticated user
export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const userId = session.userId;

  // Check if this user already has data
  const existingDomains = await db.domain.count({ where: { userId } });
  if (existingDomains > 0) {
    return bad("Data already exists. Reset the database first.", 409);
  }

  // Seed domains
  const domainMap: Record<string, string> = {};
  for (const dom of DOMAINS) {
    const d = await db.domain.create({
      data: { userId, key: dom.key, name: dom.name, description: dom.description, icon: dom.icon, color: dom.color, order: dom.order },
    });
    domainMap[dom.key] = d.id;
  }

  // Seed projects
  const projects = await Promise.all([
    db.project.create({ data: { userId, name: "Viagem ao Japão 2025", description: "Duas semanas de aventura por Tóquio, Quioto e Osaka.", color: "#ec4899", icon: "Plane", domainId: domainMap.pessoal, status: "active", progress: 35, targetDate: daysFromNow(120) } }),
    db.project.create({ data: { userId, name: "Transformação da Saúde", description: "Ganhar força, dormir melhor e correr uma meia maratona.", color: "#f43f5e", icon: "HeartPulse", domainId: domainMap.pessoal, status: "active", progress: 55, targetDate: daysFromNow(200) } }),
    db.project.create({ data: { userId, name: "Lançar a Barbearia", description: "Abrir a agenda, divulgar o Instagram e chegar a 50 clientes fixos.", color: "#10b981", icon: "Rocket", domainId: domainMap.barbearia, status: "active", progress: 20, targetDate: daysFromNow(90) } }),
    db.project.create({ data: { userId, name: "Sair das Dívidas", description: "Quitar cartão de crédito e empréstimos.", color: "#71717a", icon: "TrendingDown", domainId: domainMap.financas, status: "active", progress: 40, targetDate: daysFromNow(300) } }),
    db.project.create({ data: { userId, name: "Ler 24 Livros", description: "Dois livros por mês durante o ano.", color: "#3b82f6", icon: "BookOpen", domainId: domainMap.conhecimento, status: "active", progress: 50, targetDate: daysFromNow(180) } }),
  ]);
  const pmap: Record<string, string> = {};
  projects.forEach((p) => { pmap[p.name] = p.id; });

  async function item(data: Record<string, any>) {
    const meta = data.metadata ? { metadata: JSON.stringify(data.metadata) } : {};
    const { metadata, ...rest } = data;
    return db.item.create({ data: { ...rest, userId, ...meta } as any });
  }

  // Tarefas
  await item({ type: "task", title: "Reservar passagens para o Japão", domainId: domainMap.pessoal, projectId: pmap["Viagem ao Japão 2025"], status: "active", priority: 3, dueDate: daysFromNow(7), metadata: { estimate: "2h" } });
  await item({ type: "task", title: "Pesquisar opções de JR Pass", domainId: domainMap.pessoal, projectId: pmap["Viagem ao Japão 2025"], status: "active", priority: 2, dueDate: daysFromNow(10) });
  await item({ type: "task", title: "Corrida matinal de 5km", domainId: domainMap.pessoal, projectId: pmap["Transformação da Saúde"], status: "active", priority: 2, dueDate: daysFromNow(1) });
  await item({ type: "task", title: "Finalizar textos do Instagram da barbearia", domainId: domainMap.barbearia, projectId: pmap["Lançar a Barbearia"], status: "active", priority: 4, dueDate: daysFromNow(2) });
  await item({ type: "task", title: "Configurar cobrança online", domainId: domainMap.barbearia, projectId: pmap["Lançar a Barbearia"], status: "active", priority: 3, dueDate: daysFromNow(5) });
  await item({ type: "task", title: "Pagar fatura do cartão de crédito", domainId: domainMap.financas, projectId: pmap["Sair das Dívidas"], status: "active", priority: 4, dueDate: daysFromNow(3), metadata: { amount: 850 } });
  await item({ type: "task", title: "Compras: aveia, ovos, espinafre, banana", domainId: domainMap.familia, status: "active", priority: 2, dueDate: daysFromNow(1), content: "Compras da semana" });
  await item({ type: "task", title: "Trocar filtro do ar-condicionado", domainId: domainMap.familia, status: "active", priority: 1, dueDate: daysFromNow(6) });

  // Hábitos
  const medHabit = await item({ type: "habit", title: "Meditar 10 minutos", domainId: domainMap.pessoal, status: "active", metadata: { cadence: "daily", target: 10, unit: "min", streak: 4 } });
  const runHabit = await item({ type: "habit", title: "Correr / caminhar 5km", domainId: domainMap.pessoal, status: "active", metadata: { cadence: "daily", target: 5, unit: "km", streak: 2 } });
  const readHabit = await item({ type: "habit", title: "Ler 20 páginas", domainId: domainMap.conhecimento, status: "active", projectId: pmap["Ler 24 Livros"], metadata: { cadence: "daily", target: 20, unit: "pages", streak: 6 } });
  const waterHabit = await item({ type: "habit", title: "Beber 2L de água", domainId: domainMap.pessoal, status: "active", metadata: { cadence: "daily", target: 2, unit: "L", streak: 9 } });
  const writeHabit = await item({ type: "habit", title: "Escrever pela manhã", domainId: domainMap.pessoal, status: "active", metadata: { cadence: "daily", target: 1, unit: "entry", streak: 3 } });

  // Registros de hábitos
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const r = Math.random();
    if (medHabit && r > 0.2) await db.habitLog.create({ data: { itemId: medHabit.id, date: d, value: 10 } }).catch(() => {});
    if (runHabit && r > 0.45) await db.habitLog.create({ data: { itemId: runHabit.id, date: d, value: 5 } }).catch(() => {});
    if (readHabit && r > 0.3) await db.habitLog.create({ data: { itemId: readHabit.id, date: d, value: 20 } }).catch(() => {});
    if (waterHabit && r > 0.15) await db.habitLog.create({ data: { itemId: waterHabit.id, date: d, value: 2 } }).catch(() => {});
    if (writeHabit && r > 0.5) await db.habitLog.create({ data: { itemId: writeHabit.id, date: d, value: 1 } }).catch(() => {});
  }

  // Diário
  await item({ type: "journal", title: "Ansiedade com dinheiro", domainId: domainMap.pessoal, projectId: pmap["Sair das Dívidas"], status: "active", scheduledAt: daysFromNow(-2, 21), content: "Sentindo o peso das dívidas de novo hoje. Preciso sentar e fazer um plano de verdade." });
  await item({ type: "journal", title: "Ótimo treino hoje", domainId: domainMap.pessoal, projectId: pmap["Transformação da Saúde"], status: "active", scheduledAt: daysFromNow(-1, 8), content: "Bati um novo recorde no agachamento hoje. A energia finalmente está voltando." });

  // Notas
  await item({ type: "note", title: "Pesquisa de bairros em Tóquio", domainId: domainMap.pessoal, projectId: pmap["Viagem ao Japão 2025"], status: "active", content: "## Onde ficar\n- **Shinjuku** — animado, ótimo transporte\n- **Shibuya** — jovem, energético\n- **Asakusa** — mais tranquilo, tradicional" });
  await item({ type: "note", title: "Ideias de preço para a barbearia", domainId: domainMap.barbearia, projectId: pmap["Lançar a Barbearia"], status: "active", content: "Corte simples → combo → assinatura mensal. Fidelidade com desconto a partir do 5º corte." });

  // Financeiro
  await item({ type: "finance", title: "Salário", domainId: domainMap.financas, status: "active", dueDate: daysFromNow(5), metadata: { kind: "income", amount: 4200, recurring: "monthly" } });
  await item({ type: "finance", title: "Aluguel", domainId: domainMap.financas, status: "active", dueDate: daysFromNow(2), metadata: { kind: "expense", amount: 1450, recurring: "monthly" } });
  await item({ type: "finance", title: "Netflix", domainId: domainMap.financas, status: "active", dueDate: daysFromNow(8), metadata: { kind: "expense", amount: 15.99, recurring: "monthly", subscription: true } });
  await item({ type: "finance", title: "Spotify", domainId: domainMap.financas, status: "active", dueDate: daysFromNow(12), metadata: { kind: "expense", amount: 11.99, recurring: "monthly", subscription: true } });
  await item({ type: "finance", title: "Meta de reserva de emergência", domainId: domainMap.financas, status: "active", metadata: { kind: "goal", amount: 10000, current: 3200 } });

  // Contatos
  await item({ type: "contact", title: "Sara Chen", domainId: domainMap.familia, status: "active", metadata: { relationship: "amigo próximo", birthday: "1992-04-18", lastContact: daysFromNow(-12).toISOString() } });
  await item({ type: "contact", title: "Marcos Ribeiro", domainId: domainMap.igreja_ministerio, status: "active", metadata: { relationship: "mentor", lastContact: daysFromNow(-30).toISOString() } });
  await item({ type: "contact", title: "Priscila Souza", domainId: domainMap.barbearia, status: "active", metadata: { relationship: "colega", lastContact: daysFromNow(-3).toISOString() } });

  // Livros e mídia
  await item({ type: "bookmark", title: "Hábitos Atômicos", domainId: domainMap.conhecimento, projectId: pmap["Ler 24 Livros"], status: "active", metadata: { author: "James Clear", medium: "book", status: "reading", rating: 5, currentPage: 180, totalPages: 320 }, content: "Pequenas mudanças, resultados notáveis. Foco em sistemas em vez de metas." });
  await item({ type: "bookmark", title: "Trabalho Focado", domainId: domainMap.conhecimento, projectId: pmap["Ler 24 Livros"], status: "done", priority: 2, completedAt: daysFromNow(-20), metadata: { author: "Cal Newport", medium: "book", status: "finished", rating: 5 } });
  await item({ type: "bookmark", title: "O Almanaque de Naval Ravikant", domainId: domainMap.conhecimento, status: "active", metadata: { author: "Eric Jorgenson", medium: "book", status: "queued" } });

  // Filmes
  await item({ type: "bookmark", title: "Tudo em Todo Lugar ao Mesmo Tempo", domainId: domainMap.pessoal, status: "active", metadata: { medium: "movie", status: "queued", author: "Daniels" } });
  await item({ type: "bookmark", title: "Duna: Parte Dois", domainId: domainMap.pessoal, status: "active", metadata: { medium: "movie", status: "queued", author: "Denis Villeneuve" } });
  await item({ type: "bookmark", title: "A Viagem de Chihiro", domainId: domainMap.pessoal, status: "done", metadata: { medium: "movie", status: "finished", rating: 5, author: "Hayao Miyazaki" }, completedAt: daysFromNow(-8) });

  // Vida pessoal
  await item({ type: "vision", title: "Viver com intenção", domainId: domainMap.pessoal, status: "active", content: "Quero que cada dia seja uma escolha deliberada, não uma reação." });
  await item({ type: "affirmation", title: "Eu sou capaz de coisas difíceis", domainId: domainMap.pessoal, status: "active" });
  await item({ type: "goal", title: "Correr uma meia maratona", domainId: domainMap.pessoal, projectId: pmap["Transformação da Saúde"], status: "active", dueDate: daysFromNow(90), metadata: { measure: "corrida de 21km" } });

  // Ideias
  await item({ type: "idea", title: "App para cuidar de plantas", domainId: domainMap.conhecimento, status: "inbox", content: "Notificação + calendário de rega com identificação da planta." });
  await item({ type: "idea", title: "Podcast de fim de semana sobre comida local", domainId: domainMap.conhecimento, status: "inbox" });

  // Itens no inbox
  await item({ type: "note", title: "Pesquisar contas com incentivo fiscal", domainId: domainMap.financas, status: "inbox" });
  await item({ type: "task", title: "Responder ao proprietário sobre a renovação do contrato", domainId: domainMap.familia, status: "inbox" });

  // Revisões
  await db.review.create({ data: { userId, type: "daily", date: daysFromNow(-1, 21), status: "completed", wins: "Publiquei a seção principal da página da barbearia.", challenges: "Me distraí com notificações.", learnings: "Blocos de foco precisam ser sem celular.", gratitude: "Grato pelo apoio da minha família.", mood: 4, energy: 3 } });
  await db.review.create({ data: { userId, type: "weekly", date: daysFromNow(-4, 20), status: "completed", weekStart: daysFromNow(-10), weekEnd: daysFromNow(-4), wins: "Meditei 5 de 7 dias, li 80 páginas.", challenges: "Gastei demais com delivery.", learnings: "Preparar as refeições no domingo deixa a semana mais leve.", gratitude: "Grato pela mentoria do Marcos.", priorities: '["Divulgar a barbearia","Planejar roteiro do Japão","3 treinos de força"]', mood: 4, energy: 3 } });

  // Vínculos
  const debtJournal = await db.item.findFirst({ where: { userId, title: "Ansiedade com dinheiro" } });
  const financialVision = await db.item.findFirst({ where: { userId, title: "Viver com intenção" } });
  if (debtJournal && financialVision) {
    await db.link.create({ data: { fromId: debtJournal.id, toId: financialVision.id, type: "related" } }).catch(() => {});
  }
  if (medHabit && writeHabit) {
    await db.link.create({ data: { fromId: medHabit.id, toId: writeHabit.id, type: "related" } }).catch(() => {});
  }

  return ok({ success: true, message: "Dados de exemplo criados com sucesso" });
}
