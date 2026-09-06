# Central de Comando — Roadmap de Transformação do Life OS

> Documento de contexto e execução para agentes e desenvolvedores que trabalhem neste fork.
>
> Repositório: `dihviny25-lab/life-os`
> Base original: `karim-coder/life-os`
> Status deste documento: plano inicial após auditoria estrutural. Nenhuma decisão marcada como P0 deve ser ignorada em favor de trabalho visual.

## 1. Objetivo

Transformar o Life OS em uma **Central de Comando pessoal**, preservando os bons fundamentos do projeto e evoluindo-o para responder, principalmente:

> **O que precisa da minha atenção agora?**

A Central deverá agregar planejamento diário, agenda, tarefas, finanças, projetos, família, trabalho, desenvolvimento de software, igreja/ministério, conhecimento e, posteriormente, uma camada de IA capaz de consultar e relacionar essas informações.

A intenção não é criar outro dashboard genérico nem duplicar dados indiscriminadamente. O sistema deve se tornar a camada operacional que organiza prioridades e conecta fontes especializadas.

---

## 2. Princípios de execução para outros agentes

1. **Não reescrever o projeto do zero.** A arquitetura atual oferece uma base útil.
2. **Não desenvolver diretamente na `main`.** Toda mudança relevante deve ocorrer em branch própria e, preferencialmente, PR pequeno/revisável.
3. **Segurança antes de dados reais.** Não popular a aplicação com informações pessoais/financeiras reais antes da conclusão do PR de isolamento por usuário.
4. **Evitar refactors oportunistas.** Não misturar segurança, redesign, integrações e novas features no mesmo PR.
5. **Preservar funcionalidades existentes enquanto não houver decisão explícita de remoção.**
6. **Validar build, TypeScript, lint e testes disponíveis antes de considerar uma etapa concluída.**
7. **Mudanças de schema devem ter estratégia de migração e rollback.** Não usar `db push` cegamente em ambiente com dados reais.
8. **Não colocar segredos no repositório.** Credenciais, tokens, chaves de IA, banco e integrações devem permanecer em variáveis de ambiente/secret stores.
9. **Documentar decisões arquiteturais relevantes neste arquivo ou em ADRs futuros.**
10. **Não priorizar aparência antes da fundação P0.** O primeiro ciclo é segurança e isolamento.

---

## 3. Estado técnico auditado

### Stack atual

- Next.js 16 / App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- Prisma 6
- PostgreSQL configurado no `prisma/schema.prisma`
- Zustand
- TanStack Query
- Radix UI / shadcn-style components
- Framer Motion
- Recharts
- PWA
- autenticação própria baseada em sessão assinada
- bcrypt para senha
- TOTP/2FA opcional
- infraestrutura de IA configurável

### Fundamento de dados

O núcleo é o modelo universal `Item`, usado para representar diferentes tipos de informação. Tipos atuais incluem, entre outros:

- task
- note
- journal
- habit
- event
- finance
- contact
- idea
- goal
- document
- bookmark
- milestone
- routine
- symptom
- medication
- affirmation
- vision

`Item` pode se relacionar com `Domain`, `Project`, `Tag`, `Review`, `Reminder`, `HabitLog` e outros `Item`s por meio de `Link`.

Tipos de relacionamento existentes incluem:

- related
- blocks
- parent
- subtask
- references
- depends-on

Esse modelo deve ser preservado inicialmente porque permite organizar **Área → Projeto → Item/Tarefa/Nota/Evento** sem criar tabelas específicas prematuramente.

### Views já existentes e potencialmente reutilizáveis

O projeto possui, entre outras:

- Dashboard
- Agenda
- Calendar
- Inbox
- All Items
- Projects
- Domain
- Focus
- Graph / Digital Brain
- Insights
- Journal
- Reviews
- Sanctuary

Existem também APIs para itens, projetos, domínios, calendário, inbox, insights, graph, reviews, preferências, backup/exportação, IA e autenticação.

---

## 4. P0 identificado — isolamento e autorização de dados

### Problema

Existe autenticação de usuário, porém o modelo principal não possui ownership consistente.

Na auditoria inicial:

- `User` existe.
- `Item` não possui `userId`.
- `Project` não possui `userId`.
- `Domain` não possui `userId`.
- `Review`, `Tag`, `Setting` e outros dados também não estão claramente isolados por usuário.
- `/api/items` consulta e cria registros sem autenticar a sessão e sem aplicar filtro por usuário.
- Outros endpoints, como `/api/reset-db`, já utilizam `getUserFromRequest`, mostrando que a infraestrutura de sessão existe, mas a proteção não está aplicada uniformemente.

### Risco

Se a aplicação for exposta e possuir mais de uma conta, dados de uma conta podem potencialmente ser consultados/manipulados por outra ou por endpoints não autenticados, dependendo da rota.

Como a Central armazenará dados pessoais, familiares e financeiros, isso é bloqueador para uso real.

### PR 1 obrigatório

Branch sugerida:

`security/user-data-isolation`

Objetivo:

> Garantir que toda informação privada tenha proprietário e que toda API privada exija uma sessão válida e opere exclusivamente no escopo do usuário autenticado.

Checklist mínimo:

- [ ] inventariar todos os modelos Prisma e classificá-los como globais ou pertencentes ao usuário;
- [ ] adicionar relações/ownership adequados (`userId`) aos modelos privados;
- [ ] decidir como tratar `Domain` e configurações padrão por usuário;
- [ ] criar estratégia de migração para registros existentes;
- [ ] centralizar helper de autenticação/autorização para rotas;
- [ ] proteger GET/POST/PATCH/PUT/DELETE das APIs privadas;
- [ ] filtrar consultas por `userId` no servidor;
- [ ] impedir que IDs enviados pelo cliente permitam acessar registros de outro usuário;
- [ ] revisar APIs de graph, export, backup, insights, calendar, inbox, projects, reviews, tags, reminders e IA;
- [ ] revisar rotas de autenticação/2FA/QR login;
- [ ] garantir `SESSION_SECRET` forte e obrigatório em produção;
- [ ] substituir comparação de assinatura por comparação timing-safe se aplicável;
- [ ] revisar cookies (`HttpOnly`, `Secure`, `SameSite`, expiração e path);
- [ ] revisar CSRF para operações mutáveis baseadas em cookie;
- [ ] adicionar testes de isolamento entre pelo menos dois usuários;
- [ ] testar acesso não autenticado;
- [ ] testar tentativa de leitura/escrita usando ID pertencente a outro usuário;
- [ ] executar lint, TypeScript, testes e build;
- [ ] não adicionar dados pessoais reais até aprovação deste PR.

### Critério de aceite do P0

Dadas duas contas A e B:

- A nunca pode listar, buscar, alterar, relacionar, exportar ou excluir dados privados de B;
- B nunca pode acessar dados privados de A;
- requisições sem sessão não podem acessar APIs privadas;
- operações administrativas/destrutivas precisam de proteção explícita;
- export/backup deve conter apenas dados do usuário autenticado.

---

## 5. Decisão inicial de banco

### Manter

**PostgreSQL + Prisma**.

O schema atual já está configurado com `provider = "postgresql"`. Não há justificativa, neste estágio, para remover Prisma apenas para usar Supabase.

Arquitetura prevista inicialmente:

```text
Aplicação Next.js
      |
    Prisma
      |
PostgreSQL
      |
Supabase ou outro host PostgreSQL
```

Se Supabase for escolhido como infraestrutura, inicialmente ele será principalmente o host PostgreSQL. A adoção de Supabase Auth, Storage, Realtime ou APIs nativas deve ser uma decisão separada e justificada, não uma migração automática.

---

## 6. Arquitetura funcional alvo

### Navegação conceitual

```text
CENTRAL
├── Hoje
├── Inbox
└── Agenda

ÁREAS
├── Família
├── Finanças
├── Barbearia
├── Desenvolvimento
├── Igreja & Ministério
├── Pessoal
└── Conhecimento

PLANEJAMENTO
├── Projetos
├── Objetivos
└── Revisões

INTELIGÊNCIA
├── Insights
├── Digital Brain
└── Central IA

SISTEMA
└── Configurações
```

Os nomes finais podem mudar durante UX/design, mas a separação conceitual deve ser preservada.

### Modelo mental

Usar preferencialmente:

```text
Área / Domain
  └── Projeto
       ├── Tarefa
       ├── Nota
       ├── Documento
       ├── Evento
       ├── Financeiro
       └── outros Items relacionados
```

Exemplos:

```text
Igreja & Ministério
└── Pregação Mateus 11
    ├── Estudar vv. 28-30
    ├── Nota de contexto
    ├── Esboço
    └── Evento de pregação

Desenvolvimento
└── Seminário Huguenotes
    ├── Validar PR
    ├── Nota sobre teacher_id
    └── Marco de publicação

Família
└── Férias
    ├── Orçamento
    ├── Hospedagem
    └── Evento
```

---

## 7. Dashboard alvo

O Dashboard deve evoluir de um resumo genérico para uma central de decisão.

Pergunta principal:

> **O que precisa da minha atenção agora?**

Blocos previstos:

### Hoje

- compromissos do dia;
- tarefas prioritárias;
- itens atrasados relevantes;
- captura rápida.

### Próximos compromissos

- família;
- igreja;
- trabalho;
- compromissos pessoais.

### Financeiro

- contas próximas;
- previsão semanal;
- entradas previstas;
- despesas recorrentes;
- alertas de caixa.

### Projetos

- ativos;
- bloqueados;
- aguardando decisão;
- prazos próximos;
- progresso.

### Igreja & Ministério

- próxima pregação/aula;
- estudos em preparação;
- eventos;
- tarefas ministeriais.

### Desenvolvimento

- projetos ativos;
- tarefas técnicas;
- PRs e deploys futuramente via integração GitHub/Vercel.

O Dashboard não deve tentar exibir tudo. Deve priorizar atenção e próxima ação.

---

## 8. Estratégia de fontes de verdade

Evitar duplicação desnecessária.

Direção inicial:

| Domínio | Fonte de verdade prevista |
|---|---|
| Eventos e compromissos externos | Google Calendar |
| Conhecimento, documentos e materiais longos | Notion quando apropriado |
| Código, issues e PRs | GitHub |
| Deploys | Vercel |
| Tarefas pessoais, prioridades, finanças operacionais e relações entre áreas | Central |
| Snapshots/cache para agregação | Central, quando necessário |

Integrações devem manter identificadores externos e estratégia de sincronização. Não copiar todo o conteúdo de serviços externos sem necessidade.

---

## 9. Roadmap de PRs

### PR 1 — Segurança e fundação

Prioridade: **P0**

- ownership por usuário;
- autorização das APIs;
- segurança de sessão/cookies;
- testes de isolamento;
- preparação segura do banco.

Nenhum redesign grande neste PR.

### PR 2 — Identidade da Central

Prioridade: **P1**

- renomear/personalizar Life OS;
- adaptar navegação;
- definir Domains reais;
- reorganizar Dashboard;
- preservar recursos úteis existentes;
- revisar experiência mobile/PWA;
- evitar remover features apenas por preferência estética.

### PR 3 — Financeiro

Prioridade: **P1**

Objetivo: transformar o item financeiro genérico em ferramenta operacional.

Previsto:

- entradas;
- renda variável;
- despesas;
- contas recorrentes;
- assinaturas;
- vencimentos;
- dívidas/parcelas;
- previsão semanal e mensal;
- fluxo de caixa;
- categorias;
- alertas;
- histórico;
- visão do que precisa ser reservado/pago.

O desenho de schema específico deve ser decidido somente após auditar o módulo financeiro atual.

### PR 4 — Áreas da vida

Prioridade: **P1/P2**

Adaptar Domains e experiências para:

- Família;
- Barbearia;
- Desenvolvimento;
- Igreja & Ministério;
- Pessoal;
- Conhecimento.

Evitar criar seis sistemas independentes. Reutilizar `Domain`, `Project`, `Item`, `Link`, `Tag` e componentes universais sempre que adequado.

### PR 5 — Integrações

Prioridade: **P2**

Ordem inicial:

1. Google Calendar;
2. GitHub;
3. Notion;
4. Vercel, se trouxer valor operacional;
5. outras fontes somente com caso de uso claro.

Requisitos:

- tokens protegidos;
- menor escopo OAuth possível;
- sync idempotente;
- tratamento de falhas;
- estado da última sincronização;
- evitar duplicação;
- possibilidade de desconectar a integração.

### PR 6 — Central IA

Prioridade: **P2**

A IA deve ser uma interface sobre dados autorizados, não uma feature decorativa.

Perguntas alvo:

- "O que precisa da minha atenção hoje?"
- "O que está atrasado?"
- "O que vence nesta semana?"
- "Quanto preciso separar para as próximas contas?"
- "Quais projetos estão bloqueados?"
- "O que preciso preparar para a igreja?"
- "Como estão meus projetos de desenvolvimento?"

Requisitos de segurança:

- respeitar o mesmo escopo de autorização das APIs;
- não enviar mais dados ao provedor de IA do que o necessário;
- permitir desligar IA;
- tornar claro quais integrações/dados a consulta está usando;
- proteger chaves de API no servidor.

---

## 10. Funcionalidades existentes: classificação inicial

### Manter

- Dashboard como conceito;
- Inbox / Quick Capture;
- Agenda e Calendar;
- Projects;
- Domains;
- Items universais;
- links bidirecionais;
- Tags;
- Reminders;
- Reviews;
- PWA;
- backup/exportação;
- Insights;
- Digital Brain / Graph;
- infraestrutura de IA;
- autenticação enquanto a revisão de segurança não indicar substituição.

### Adaptar

- Dashboard;
- Domains;
- Finance;
- Projects;
- navegação;
- Insights;
- IA;
- onboarding;
- linguagem/copy;
- mobile.

### Avaliar depois

- Sanctuary;
- Focus/Pomodoro;
- Journal;
- hábitos;
- QR login;
- tipos de Item pouco usados.

**Não remover nesta fase.** Apenas reduzir destaque na navegação se necessário.

### Construir

- dashboard orientado a atenção;
- experiência financeira mais profunda;
- visão por áreas reais da vida;
- conectores externos;
- visão operacional de desenvolvimento;
- visão ministerial;
- Central IA;
- mecanismos de sincronização/cache quando necessários.

---

## 11. Requisitos não funcionais

### Segurança

- deny-by-default para dados privados;
- autenticação server-side;
- autorização por ownership;
- segredos fora do Git;
- validação de entrada;
- proteção contra acesso por IDs de terceiros;
- atenção a CSRF/XSS e conteúdo rich text/Markdown;
- logs sem dados sensíveis desnecessários.

### Qualidade

Cada PR deve, quando aplicável:

- passar TypeScript;
- passar ESLint;
- passar testes existentes;
- adicionar testes para regressões relevantes;
- passar build de produção;
- não introduzir erros no console nos fluxos validados.

### UX

- mobile-first/PWA funcional;
- captura rápida com poucos passos;
- dashboard sem excesso de informação;
- prioridade visual para ação;
- estados de loading leves;
- empty states úteis;
- acessibilidade básica preservada.

### Performance

- evitar consultas globais desnecessárias;
- paginação onde houver crescimento de dados;
- índices adequados para `userId`, status, datas, domain/project;
- evitar carregar o Digital Brain completo no Dashboard;
- sincronizações externas fora do caminho crítico da navegação quando possível.

---

## 12. Fluxo recomendado para cada agente

Antes de implementar uma tarefa:

1. Ler este documento.
2. Identificar o PR/fase à qual a tarefa pertence.
3. Inspecionar os arquivos existentes relacionados.
4. Confirmar que a mudança não atravessa outro escopo sem necessidade.
5. Criar branch específica.
6. Implementar a menor mudança completa possível.
7. Adicionar/ajustar testes.
8. Rodar verificações.
9. Registrar limitações e decisões no PR.
10. Não fazer merge automático se houver falha, dúvida de segurança ou migração de dados não validada.

Formato recomendado de relatório ao concluir trabalho:

```md
## O que foi alterado

## Arquivos principais

## Decisões tomadas

## Testes executados

## Resultado

## Riscos / pendências

## Próximo passo recomendado
```

---

## 13. Sequência imediata

Estado atual:

- [x] fork criado em `dihviny25-lab/life-os`;
- [x] auditoria estrutural inicial;
- [x] identificado P0 de isolamento/autorização;
- [x] definida direção inicial PostgreSQL + Prisma;
- [x] definido roadmap macro;
- [ ] abrir e executar PR 1 — `security/user-data-isolation`;
- [ ] revisar todas as rotas privadas;
- [ ] criar testes multiusuário;
- [ ] validar build/CI;
- [ ] somente depois iniciar personalização visual e uso com dados reais.

---

## 14. Regra de prioridade

Se um agente encontrar durante o desenvolvimento uma vulnerabilidade que permita acesso indevido, perda de dados ou exposição de segredos, deve:

1. interromper mudanças de feature relacionadas;
2. documentar o problema;
3. classificar o risco;
4. corrigir em escopo isolado ou propor PR específico;
5. validar regressão antes de prosseguir.

**Segurança e integridade dos dados têm precedência sobre redesign e novas funcionalidades.**

---

## 15. Visão de produto

A Central estará cumprindo seu objetivo quando deixar de ser apenas um lugar onde informações são armazenadas e passar a ajudar a decidir a próxima ação.

A experiência desejada é:

```text
Abrir a Central
      ↓
Entender o dia
      ↓
Ver o que exige atenção
      ↓
Tomar uma decisão
      ↓
Executar
      ↓
Capturar novos dados rapidamente
      ↓
Revisar e planejar
```

A IA, integrações e gráficos devem servir esse fluxo, não competir com ele.
