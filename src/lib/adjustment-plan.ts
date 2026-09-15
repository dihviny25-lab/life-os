export const ADJUSTMENT_PLAN_MARKER = "sistema:plano-ajuste-v1";
export const ADJUSTMENT_PLAN_NAME = "Plano de ajuste — 90 dias";
export const DEVELOPMENT_WIP_LIMIT = 3;

export interface AdjustmentStageDefinition {
  key: string;
  title: string;
  summary: string;
  objective: "financas" | "desenvolvimento" | "presenca";
  tasks: string[];
}

export const ADJUSTMENT_STAGES: AdjustmentStageDefinition[] = [
  {
    key: "aliviar-carga-mental",
    title: "Tirar o peso da cabeça",
    summary: "Usar a Central como fonte oficial e impedir que compromissos dependam apenas da memória.",
    objective: "presenca",
    tasks: [
      "Confirmar a Central como única fonte oficial de compromissos",
      "Esvaziar WhatsApp, papel e notas para a Inbox",
      "Implantar uma revisão semanal de 30 minutos",
      "Dar a cada pendência uma ação, uma data ou o status em espera",
    ],
  },
  {
    key: "decidir-antes-de-organizar",
    title: "Decidir antes de reorganizar",
    summary: "Fazer o sistema produzir escolhas, sem reconstruí-lo para evitar decisões difíceis.",
    objective: "desenvolvimento",
    tasks: [
      "Congelar grandes reformulações da Central por 60 dias",
      "Aplicar na revisão semanal: executar, esperar ou encerrar",
      "Só alterar o sistema quando um problema concreto se repetir três vezes",
    ],
  },
  {
    key: "presenca-emocional",
    title: "Ouvir antes de resolver",
    summary: "Abrir espaço para presença emocional com Jéssica e com as crianças.",
    objective: "presenca",
    tasks: [
      "Perguntar: você quer escuta, opinião ou ajuda para resolver?",
      "Implantar um alinhamento regular com Jéssica",
      "Definir um rodízio de tempo individual com Ester, Estevão e Ethan",
      "Proteger um momento familiar sem celular, trabalho ou planejamento",
    ],
  },
  {
    key: "valor-alem-da-utilidade",
    title: "Separar valor pessoal de utilidade",
    summary: "Distinguir responsabilidade real de peso assumido por medo de decepcionar.",
    objective: "presenca",
    tasks: [
      "Separar o que depende de mim do que apenas assumi como meu",
      "Delegar ou encerrar uma responsabilidade neste mês",
      "Implantar um bloco semanal de descanso sem produção",
      "Levar o tema descanso, culpa e provisão para uma conversa honesta ou terapia",
    ],
  },
  {
    key: "transicao-desenvolvimento",
    title: "Transformar desenvolvimento em renda",
    summary: "Conduzir a transição profissional por um marco comercial, não apenas por mais código.",
    objective: "desenvolvimento",
    tasks: [
      "Declarar o Seminário como aposta comercial dos próximos 90 dias",
      "Colocar a Igreja Vision em manutenção controlada",
      "Escolher apenas um projeto remunerado principal",
      "Implantar dois blocos protegidos de desenvolvimento por semana",
      "Apresentar a plataforma e buscar um piloto remunerado",
    ],
  },
  {
    key: "margem-financeira",
    title: "Construir margem financeira",
    summary: "Tratar semanas melhores como recuperação e segurança, não como novo dinheiro livre.",
    objective: "financas",
    tasks: [
      "Atualizar contas, parcelas, atrasos e valores atuais",
      "Conferir se a base semanal de R$ 1.500 cobre o plano completo",
      "Aplicar a ordem semanal: dízimo, essenciais, provisões, atrasos e reserva",
      "Congelar novas parcelas e assinaturas durante a regularização",
      "Definir no financeiro o destino de toda entrada acima de R$ 1.500",
    ],
  },
  {
    key: "capacidade-real",
    title: "Planejar com capacidade real",
    summary: "Limitar frentes simultâneas e parar de tratar todo repositório como uma promessa aberta.",
    objective: "desenvolvimento",
    tasks: [
      "Classificar os repositórios em ativo, manutenção, espera, concluído, experimental ou descartado",
      "Manter no máximo três frentes ativas de desenvolvimento",
      "Colocar em espera projetos sem tempo reservado nos próximos 14 dias",
      "Aplicar a regra: um projeto entra quando outro sai",
    ],
  },
  {
    key: "rastreabilidade",
    title: "Delegar com rastreabilidade",
    summary: "Manter contexto suficiente para confiar no trabalho sem precisar reconstruir tudo mentalmente.",
    objective: "desenvolvimento",
    tasks: [
      "Criar um STATUS.md em cada repositório ativo",
      "Registrar onde ficam as credenciais sem salvar senhas no projeto",
      "Definir o que significa pronto antes de iniciar uma mudança",
      "Registrar branch, PR, preview, testes, bloqueios e próxima ação",
    ],
  },
  {
    key: "risco-completo",
    title: "Avaliar também o risco cumulativo",
    summary: "Aplicar aos compromissos de tempo e dinheiro o mesmo cuidado usado em produção e dados.",
    objective: "desenvolvimento",
    tasks: [
      "Aplicar o checklist de horas, custo, responsável, saída e reversibilidade",
      "Separar decisões reversíveis das difíceis de reverter",
      "Definir uma janela final para validar, publicar ou registrar o bloqueio",
      "Revisar o impacto cumulativo antes de aceitar um novo compromisso",
    ],
  },
  {
    key: "pessoas-antes-do-sistema",
    title: "Usar sistemas para servir pessoas",
    summary: "Manter família, fé e ministério humanos, mesmo quando existe uma boa estrutura por trás.",
    objective: "presenca",
    tasks: [
      "Incluir pessoas a acompanhar na revisão ministerial",
      "Procurar pessoalmente quem faltou ou está sobrecarregado",
      "Verificar o que crianças, casais e voluntários realmente compreenderam",
      "Preservar momentos sem roteiro, formulário ou entregável",
    ],
  },
];

export const ADJUSTMENT_OBJECTIVES = [
  {
    key: "financas" as const,
    title: "Estabilizar minha vida financeira",
    description: "Regularizar obrigações, impedir novos compromissos e começar a construir margem.",
    color: "#10b981",
  },
  {
    key: "desenvolvimento" as const,
    title: "Transformar desenvolvimento em renda",
    description: "Validar o Seminário comercialmente sem multiplicar frentes de trabalho.",
    color: "#6366f1",
  },
  {
    key: "presenca" as const,
    title: "Recuperar presença e margem pessoal",
    description: "Reduzir carga mental e proteger casamento, filhos, descanso e cuidado direto com pessoas.",
    color: "#0ea5e9",
  },
];

export const OPERATING_RULES = [
  "No máximo três frentes de desenvolvimento ativas.",
  "Um projeto novo só entra quando outro deixa de estar ativo.",
  "Sem reconstruir a Central por 60 dias, salvo problema real repetido.",
  "Tudo que exige ação passa pela Inbox.",
  "Entrada acima de R$ 1.500 não vira automaticamente dinheiro disponível.",
  "Trabalho voluntário possui limite de tempo e de escopo.",
  "Decisões irreversíveis exigem revisão; decisões reversíveis recebem prazo curto.",
  "Família e descanso entram na agenda antes de depender do tempo que sobrar.",
  "Funcionalidade nova precisa servir à operação atual ou ter validação comercial.",
  "O sistema serve à vida; a vida não existe para alimentar o sistema.",
];

export const PRIORITY_ACTIONS = [
  "Classificar os repositórios em ativo, manutenção, espera, concluído, experimental ou descartado",
  "Declarar o Seminário como aposta comercial dos próximos 90 dias",
  "Atualizar contas, parcelas, atrasos e valores atuais",
  "Implantar um alinhamento regular com Jéssica",
];

export const CENTRAL_RHYTHMS = [
  {
    title: "Revisão semanal pessoal",
    task: "Implantar uma revisão semanal de 30 minutos",
    detail: "Limpar a Inbox e decidir o que executar, esperar ou encerrar.",
  },
  {
    title: "Revisão financeira",
    task: "Aplicar a ordem semanal: dízimo, essenciais, provisões, atrasos e reserva",
    detail: "Executar quando a renda da barbearia entrar, mesmo que o dia varie.",
  },
  {
    title: "Alinhamento com Jéssica",
    task: "Implantar um alinhamento regular com Jéssica",
    detail: "Ouvir, compartilhar e registrar apenas decisões que realmente precisam ser lembradas.",
  },
  {
    title: "Blocos de desenvolvimento",
    task: "Implantar dois blocos protegidos de desenvolvimento por semana",
    detail: "Usar os blocos para aproximar o Seminário de um piloto remunerado.",
  },
  {
    title: "Descanso e presença",
    task: "Implantar um bloco semanal de descanso sem produção",
    detail: "Proteger tempo que não precisa gerar tarefa, conteúdo ou entrega.",
  },
];

