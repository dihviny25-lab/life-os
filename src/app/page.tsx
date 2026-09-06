import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SmoothHashScroller, SmoothScrollLink } from "@/components/smooth-scroll-link";
import { siteConfig } from "@/lib/seo";
import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  Calendar,
  CircleDot,
  Command,
  Compass,
  ExternalLink,
  Flame,
  Frown,
  Github,
  Heart,
  Home,
  Laugh,
  Leaf,
  Meh,
  Network,
  Palette,
  PenLine,
  Quote,
  Repeat,
  ShieldCheck,
  Smile,
  SmilePlus,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  alternates: {
    canonical: siteConfig.repositoryUrl,
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.repositoryUrl,
    images: [
      {
        url: siteConfig.ogImage,
        width: 2058,
        height: 1338,
        alt: "Life OS public landing page and app preview",
      },
    ],
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  alternateName: [
    "Open-source second brain",
    "Self-hosted personal operating system",
    "Digital brain app",
    "Habit tracker app",
    "Journal app",
    "Task manager",
    "Personal productivity dashboard",
  ],
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Any",
  description: siteConfig.description,
  url: siteConfig.repositoryUrl,
  codeRepository: siteConfig.repositoryUrl,
  license: `${siteConfig.repositoryUrl}/blob/main/LICENSE`,
  isAccessibleForFree: true,
  programmingLanguage: ["TypeScript", "JavaScript"],
  runtimePlatform: "Next.js",
  keywords: siteConfig.keywords.join(", "),
  featureList: [
    "Habit tracker with streaks and weekly heatmaps",
    "Journal app with mood tracking and reflections",
    "Task manager with priorities, due dates, and inbox capture",
    "Master calendar for tasks, bills, appointments, and events",
    "Digital brain graph for linked notes, tasks, goals, habits, and projects",
    "Focus timer with Pomodoro sessions and habit logging",
    "Finance tracker for income, expenses, bills, and goals",
    "Personal knowledge management with connected life domains",
  ],
  screenshot: siteConfig.screenshotUrls,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <SmoothHashScroller />
      {/* ─── Nav ─── */}
      <nav data-public-nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Life OS</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <SmoothScrollLink href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Recursos</SmoothScrollLink>
            <SmoothScrollLink href="#domains" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Domínios</SmoothScrollLink>
            <SmoothScrollLink href="#philosophy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Filosofia</SmoothScrollLink>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-1.5 px-3" asChild>
              <a href={siteConfig.repositoryUrl} target="_blank" rel="noreferrer" aria-label="Ver Life OS no GitHub">
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </Button>
            <Link href="/app">
              <Button className="gap-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700">
                Abrir app <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-32 pb-20">
        {/* animated gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-10 h-96 w-96 animate-pulse rounded-full bg-emerald-500/10 blur-3xl" style={{ animationDuration: "4s" }} />
          <div className="absolute -right-20 top-40 h-96 w-96 animate-pulse rounded-full bg-violet-500/10 blur-3xl" style={{ animationDuration: "6s", animationDelay: "1s" }} />
          <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 animate-pulse rounded-full bg-cyan-500/10 blur-3xl" style={{ animationDuration: "5s" }} />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-muted-foreground">Código aberto · Auto-hospedável · Seus dados, seu cérebro</span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            Sua vida,
            <br />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              lindamente conectada.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Life OS é um sistema operacional pessoal onde tarefas, notas, diários, hábitos e finanças
            não são silos isolados — eles formam um <span className="font-medium text-foreground">cérebro digital</span> onde tudo se conecta.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Use como rastreador de hábitos, app de diário, gerenciador de tarefas, timer de foco,
            calendário mestre, controle financeiro, rastreador de metas e segundo cérebro, tudo em um workspace open-source.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/app">
              <Button size="lg" className="h-12 gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 px-8 text-base text-white shadow-xl shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700">
                Entre no seu cérebro <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <SmoothScrollLink href="#features">
              <Button size="lg" variant="outline" className="h-12 gap-2 px-8 text-base">
                Explorar recursos
              </Button>
            </SmoothScrollLink>
            <Button size="lg" variant="ghost" className="h-12 gap-2 px-6 text-base" asChild>
              <a href={siteConfig.repositoryUrl} target="_blank" rel="noreferrer">
                <Github className="h-5 w-5" /> Ver código-fonte
              </a>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Sem cadastro necessário · Roda totalmente no seu navegador · ⌘K para capturar qualquer coisa
          </p>
        </div>

        {/* App preview mockup */}
        <div className="relative mx-auto mt-16 max-w-5xl px-6">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-border/40 bg-muted/30 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="ml-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Brain className="h-3.5 w-3.5 text-emerald-500" /> Life OS — Painel
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 p-6">
              {/* mini dashboard mock — rich version */}
              <div className="col-span-2 space-y-3">
                {/* Hero greeting */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent p-4">
                  <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-500/10 blur-xl" />
                  <p className="text-xs text-emerald-500">Bom dia.</p>
                  <p className="mt-1 text-lg font-bold">Seu dia está livre. O que importa mais?</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Quarta-feira, 18 de junho · 0 concluídas hoje</p>
                </div>

                {/* Stat pills */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { l: "Entrada", v: "9", c: "#f59e0b", ic: Zap },
                    { l: "A vencer", v: "0", c: "#10b981", ic: Calendar },
                    { l: "Atrasado", v: "0", c: "#f43f5e", ic: AlertTriangle },
                    { l: "Projetos", v: "5", c: "#06b6d4", ic: BookOpen },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg border border-border/40 p-2.5">
                      <div className="flex items-center gap-1.5">
                        <s.ic className="h-3 w-3" style={{ color: s.c }} />
                        <p className="text-lg font-bold" style={{ color: s.c }}>{s.v}</p>
                      </div>
                      <p className="text-[9px] text-muted-foreground">{s.l}</p>
                    </div>
                  ))}
                </div>

                {/* Today's focus with tasks */}
                <div className="rounded-lg border border-border/40 p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Foco de hoje</p>
                  <div className="space-y-1.5">
                    {[
                      { t: "Finalizar texto da landing page", c: "#f59e0b", p: "Urgente", d: "Sex", proj: "Lançar Startup", pc: "#10b981" },
                      { t: "Corrida matinal de 5km", c: "#10b981", p: "Média", d: "Amanhã", proj: "Saúde", pc: "#f43f5e" },
                      { t: "Reservar voos para Tóquio", c: "#f59e0b", p: "Alta", d: "Em 7d", proj: "Viagem ao Japão", pc: "#ec4899" },
                      { t: "Pagar fatura do cartão", c: "#f59e0b", p: "Urgente", d: "Sáb", proj: "Dívidas", pc: "#71717a" },
                    ].map((item) => (
                      <div key={item.t} className="flex items-center gap-2 rounded-lg bg-muted/20 px-2 py-1.5">
                        <div className="h-3.5 w-3.5 rounded-md border-2" style={{ borderColor: item.c }} />
                        <span className="flex-1 truncate text-xs font-medium">{item.t}</span>
                        <span className="rounded px-1 text-[8px] font-bold uppercase" style={{ background: `${item.c}20`, color: item.c }}>{item.p}</span>
                        <span className="text-[9px] text-muted-foreground">{item.d}</span>
                        <span className="hidden text-[9px] sm:inline" style={{ color: item.pc }}>{item.proj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active projects with progress */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { n: "Viagem ao Japão 2025", c: "#ec4899", p: 35 },
                    { n: "Transformação da Saúde", c: "#f43f5e", p: 55 },
                  ].map((proj) => (
                    <div key={proj.n} className="rounded-lg border border-border/40 p-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ background: proj.c }} />
                        <span className="truncate text-[10px] font-semibold">{proj.n}</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${proj.p}%`, background: proj.c }} />
                      </div>
                      <p className="mt-0.5 text-right text-[8px] text-muted-foreground">{proj.p}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right sidebar */}
              <div className="space-y-3">
                {/* Affirmation */}
                <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-transparent p-3">
                  <div className="flex items-center gap-1">
                    <Quote className="h-3 w-3 text-violet-500" />
                    <p className="text-[10px] font-semibold uppercase text-violet-500">Afirmação</p>
                  </div>
                  <p className="mt-1.5 text-xs font-medium italic leading-relaxed">"Eu sou capaz de coisas difíceis"</p>
                </div>

                {/* Mood check-in */}
                <div className="rounded-xl border border-border/40 p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Como você está se sentindo?</p>
                  <div className="flex justify-between">
                    {[
                      { icon: Frown, c: "#f43f5e" },
                      { icon: Meh, c: "#f59e0b" },
                      { icon: Smile, c: "#eab308" },
                      { icon: SmilePlus, c: "#10b981" },
                      { icon: Laugh, c: "#06b6d4" },
                    ].map((m, i) => (
                      <div key={i} className={`flex h-7 w-7 items-center justify-center rounded-lg ${i === 3 ? "bg-violet-500/15 ring-1 ring-violet-500/30" : ""}`}>
                        {(() => {
                          const I = m.icon;
                          return <I className="h-3.5 w-3.5" style={{ color: m.c }} />;
                        })()}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Habits */}
                <div className="rounded-xl border border-border/40 p-3">
                  <div className="mb-2 flex items-center gap-1">
                    <Repeat className="h-3 w-3 text-emerald-500" />
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Hábitos da semana</p>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { h: "Meditar", d: [1,1,0,1,1,1,0], s: 4 },
                      { h: "Ler 20pg", d: [1,1,1,1,0,1,1], s: 6 },
                      { h: "Água 2L", d: [1,1,1,1,1,1,1], s: 9 },
                    ].map((hab) => (
                      <div key={hab.h} className="flex items-center gap-1.5">
                        <span className="w-16 truncate text-[9px] text-muted-foreground">{hab.h}</span>
                        <div className="flex gap-0.5">
                          {hab.d.map((d, i) => (
                            <div key={i} className={`h-2 w-2 rounded-full ${d ? "bg-emerald-500" : "bg-muted"}`} />
                          ))}
                        </div>
                        <span className="ml-auto inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-500"><Flame className="h-2 w-2" />{hab.s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Week finance */}
                <div className="rounded-xl border border-border/40 p-3">
                  <div className="mb-1.5 flex items-center gap-1">
                    <Wallet className="h-3 w-3 text-emerald-500" />
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Esta semana</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded bg-emerald-500/10 p-1.5 text-center">
                      <p className="text-[8px] uppercase text-emerald-600">Receita</p>
                      <p className="text-xs font-bold text-emerald-600">R$ 4.200</p>
                    </div>
                    <div className="rounded bg-rose-500/10 p-1.5 text-center">
                      <p className="text-[8px] uppercase text-rose-500">Despesas</p>
                      <p className="text-xs font-bold text-rose-500">R$ 1.635</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Live Feature Demos ─── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Veja em ação.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Prévias reais e interativas de como é o Life OS. Sem prints — isso é ao vivo.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Live: Quick Capture demo */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 transition-all hover:shadow-xl">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500"><Zap className="h-5 w-5" /></span>
                <h3 className="text-lg font-semibold">Captura Rápida</h3>
                <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-bold">⌘K</kbd>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">Aperte ⌘K em qualquer lugar pra capturar um pensamento. Ele vai pra sua caixa de entrada — processe depois.</p>
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-amber-500" /> Captura Rápida <span className="ml-auto rounded border border-border bg-muted px-1 text-[9px]">⌘K</span>
                </div>
                <div className="mt-2 flex gap-1">
                  {["Tarefa", "Ideia", "Diário", "Favorito"].map((t, i) => (
                    <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${i === 0 ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>{t}</span>
                  ))}
                </div>
                <div className="mt-2 rounded-lg bg-background p-2 text-xs text-muted-foreground">
                  No que você está pensando? Aperte Enter para capturar…
                </div>
              </div>
            </div>

            {/* Live: Brain Graph demo */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 transition-all hover:shadow-xl">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-500"><Network className="h-5 w-5" /></span>
                <h3 className="text-lg font-semibold">Grafo Mental</h3>
                <span className="ml-auto text-[10px] text-muted-foreground">28 conexões</span>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">Veja sua vida inteira como uma rede visual. Tudo se conecta.</p>
              <svg viewBox="0 0 300 160" className="w-full">
                <line x1="80" y1="50" x2="150" y2="80" stroke="#a78bfa" strokeOpacity="0.3" strokeWidth="1.5" />
                <line x1="150" y1="80" x2="220" y2="50" stroke="#a78bfa" strokeOpacity="0.3" strokeWidth="1.5" />
                <line x1="80" y1="50" x2="100" y2="120" stroke="#a78bfa" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="150" y1="80" x2="200" y2="120" stroke="#a78bfa" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="100" y1="120" x2="200" y2="120" stroke="#a78bfa" strokeOpacity="0.25" strokeWidth="1" />
                <circle cx="80" cy="50" r="8" fill="#f59e0b" />
                <rect x="142" y="72" width="16" height="16" rx="3" fill="#a78bfa" />
                <circle cx="220" cy="50" r="8" fill="#10b981" />
                <circle cx="100" cy="120" r="7" fill="#06b6d4" />
                <circle cx="200" cy="120" r="7" fill="#ec4899" />
                <text x="80" y="38" textAnchor="middle" className="fill-foreground text-[8px] font-medium">Tarefa</text>
                <text x="150" y="100" textAnchor="middle" className="fill-foreground text-[8px] font-medium">Projeto</text>
                <text x="220" y="38" textAnchor="middle" className="fill-foreground text-[8px] font-medium">Hábito</text>
                <text x="100" y="138" textAnchor="middle" className="fill-foreground text-[8px] font-medium">Diário</text>
                <text x="200" y="138" textAnchor="middle" className="fill-foreground text-[8px] font-medium">Meta</text>
              </svg>
            </div>

            {/* Live: Focus Timer demo */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 transition-all hover:shadow-xl">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-500/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500"><Brain className="h-5 w-5" /></span>
                <h3 className="text-lg font-semibold">Timer de Foco</h3>
                <span className="ml-auto text-[10px] text-muted-foreground">3 ciclos · 75 min</span>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">Timer Pomodoro com durações personalizadas, som e registro automático de hábitos.</p>
              <div className="flex items-center justify-center gap-4">
                <svg viewBox="0 0 120 120" className="h-28 w-28">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--muted)" strokeWidth="6" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" strokeDasharray="327" strokeDashoffset="82" transform="rotate(-90 60 60)" />
                </svg>
                <div>
                  <div className="font-mono text-3xl font-bold tabular-nums">17:30</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">em andamento</div>
                  <div className="mt-2 flex gap-1 text-amber-500"><CircleDot className="h-4 w-4" /><CircleDot className="h-4 w-4" /><CircleDot className="h-4 w-4" /></div>
                </div>
              </div>
            </div>

            {/* Live: Habit tracker demo */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 transition-all hover:shadow-xl">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500"><Repeat className="h-5 w-5" /></span>
                <h3 className="text-lg font-semibold">Rastreador de Hábitos</h3>
                <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"><Flame className="h-3 w-3 text-orange-500" /> sequência de 9 dias</span>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">Construa sequências com um mapa de calor visual. Um toque pra registrar.</p>
              <div className="space-y-2">
                {[
                  { name: "Meditar 10 min", done: [1,1,0,1,1,1,0], streak: 4 },
                  { name: "Ler 20 páginas", done: [1,1,1,1,0,1,1], streak: 6 },
                  { name: "Beber 2L de água", done: [1,1,1,1,1,1,1], streak: 9 },
                ].map((h) => (
                  <div key={h.name} className="flex items-center gap-2">
                    <span className="w-28 truncate text-xs font-medium">{h.name}</span>
                    <div className="flex gap-1">
                      {h.done.map((d, i) => (
                        <div key={i} className={`h-4 w-4 rounded-sm ${d ? "bg-emerald-500" : "bg-muted"}`} />
                      ))}
                    </div>
                    <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-500"><Flame className="h-3 w-3" />{h.streak}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats bar ─── */}
      <section className="border-y border-border/40 bg-muted/20 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
          {[
            { v: "17", l: "Tipos de item" },
            { v: "8", l: "Domínios de vida" },
            { v: "∞", l: "Conexões" },
            { v: "100%", l: "Seus dados" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-4xl font-bold bg-gradient-to-br from-emerald-500 to-teal-600 bg-clip-text text-transparent">{s.v}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="scroll-mt-24 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Não é só mais um app de tarefas.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              O Life OS entrelaça cada parte da sua vida em um sistema interconectado —
              um santuário, não uma planilha.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Brain, color: "#a78bfa", title: "Cérebro Digital", desc: "Tudo é um nó. Tarefas se conectam a diários, diários a projetos, projetos a metas. Conexões bidirecionais dão vida aos seus dados." },
              { icon: Calendar, color: "#06b6d4", title: "Calendário Mestre", desc: "Um calendário que reúne automaticamente tarefas, contas, compromissos e aniversários. Alterne camadas pra ver sua vida por diferentes ângulos." },
              { icon: Zap, color: "#f59e0b", title: "Captura Sem Fricção", desc: "Aperte ⌘K em qualquer lugar pra capturar um pensamento na hora. Vai pra uma caixa de entrada que você processa depois. Nunca decida na hora onde colocar algo." },
              { icon: Network, color: "#10b981", title: "Grafo Mental", desc: "Veja sua vida inteira como uma rede visual. Dê zoom, navegue e descubra conexões que você nem sabia que existiam entre seus pensamentos." },
              { icon: PenLine, color: "#ec4899", title: "Editor de Diário Completo", desc: "Uma experiência de escrita em página inteira com formatação markdown, contagem de palavras e rastreamento de humor. Seus pensamentos merecem mais que uma caixa de texto." },
              { icon: Repeat, color: "#10b981", title: "Rastreador de Hábitos", desc: "Construa sequências com um lindo mapa de calor. Marque hábitos com um toque. Veja sua consistência ao longo das semanas de relance." },
              { icon: TrendingUp, color: "#10b981", title: "Insights e Gráficos", desc: "Tendências de humor, consistência de hábitos, fluxo de atividades e saúde financeira — tudo visualizado pra você identificar padrões e crescer." },
              { icon: Leaf, color: "#a78bfa", title: "Modo Santuário", desc: "Um espaço calmo para exercícios de respiração, afirmações diárias e visões de vida. Às vezes a coisa mais produtiva é pausar." },
              { icon: Command, color: "#71717a", title: "Teclado em Primeiro Lugar", desc: "⌘K pra capturar, ⌘P pra paleta de comandos, g+d pra navegar. Atalhos estilo Vim fazem power users se sentirem em casa." },
            ].map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 transition-all hover:border-border hover:shadow-lg"
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-20"
                  style={{ background: f.color }}
                />
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
                  style={{ background: `${f.color}18`, color: f.color }}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Domains ─── */}
      <section id="domains" className="scroll-mt-24 border-y border-border/40 bg-muted/20 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Oito domínios. Um sistema.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Cada domínio tem seu próprio widget inteligente — feito sob medida pra essa parte da sua vida.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Compass, color: "#a78bfa", name: "Mente & Alma", desc: "Valores, visões, afirmações, exercícios de respiração" },
              { icon: Calendar, color: "#f59e0b", name: "Tempo & Ação", desc: "Tarefas, hábitos, rotinas, foco do dia" },
              { icon: Heart, color: "#f43f5e", name: "Saúde & Corpo", desc: "Sintomas, medicamentos, consultas, sinais vitais" },
              { icon: Wallet, color: "#10b981", name: "Riqueza & Carreira", desc: "Receitas, despesas, assinaturas, metas de economia" },
              { icon: Users, color: "#06b6d4", name: "Rede", desc: "Contatos, follow-ups, aniversários, relacionamentos" },
              { icon: BookOpen, color: "#3b82f6", name: "Crescimento", desc: "Lista de leitura, cursos, habilidades, aprendizados" },
              { icon: Palette, color: "#ec4899", name: "Criatividade & Alegria", desc: "Ideias, registro de mídia, lista de desejos, eventos" },
              { icon: Home, color: "#71717a", name: "Administração", desc: "Documentos, manutenção da casa, listas de compras" },
            ].map((d) => (
              <div
                key={d.name}
                className="group rounded-2xl border border-border/60 bg-card/50 p-5 transition-all hover:shadow-md"
                style={{ borderColor: `${d.color}30` }}
              >
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: `${d.color}18`, color: d.color }}
                >
                  <d.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold" style={{ color: d.color }}>{d.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Philosophy ─── */}
      <section id="philosophy" className="scroll-mt-24 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-violet-500/5 via-transparent to-emerald-500/5 p-8 sm:p-12">
            <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Um santuário, não uma planilha.</h2>
              <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
                <p>
                  A maioria dos apps de gestão de vida trata sua vida como uma lista de caixinhas pra marcar. O Life OS a trata como
                  um <span className="font-medium text-foreground">ecossistema vivo</span> onde tudo se conecta.
                </p>
                <p>
                  Quando você escreve um diário sobre estresse financeiro, pode linkar ele ao seu
                  projeto "Sair das Dívidas". Quando uma conta vence na terça, ela aparece automaticamente
                  no seu calendário mestre. Quando você não liga pra sua mãe há 3 semanas, o Life OS te lembra gentilmente.
                </p>
                <p>
                  Isso não é sobre fazer mais. É sobre <span className="font-medium text-foreground">fazer o que importa</span>,
                  com clareza e calma.
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Brain, title: "Interconectado", desc: "Links bidirecionais entre tudo" },
                  { icon: Leaf, title: "Calmo por design", desc: "Gradientes suaves, exercícios de respiração, sem ruído" },
                  { icon: TrendingUp, title: "Orientado ao crescimento", desc: "Insights, reflexões e lembretes gentis" },
                ].map((p) => (
                  <div key={p.title} className="rounded-xl border border-border/40 bg-background/50 p-4">
                    <p.icon className="mb-2 h-5 w-5 text-emerald-500" />
                    <p className="text-sm font-semibold">{p.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Pronto pra construir seu
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent"> cérebro digital?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Sem cadastro. Sem assinatura. Só abra o app e comece a conectar sua vida.
          </p>
          <Link href="/app">
            <Button size="lg" className="mt-8 h-14 gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 px-10 text-base text-white shadow-xl shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700">
              Abrir Life OS <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="ml-0 mt-3 h-14 gap-2 px-8 text-base sm:ml-3 sm:mt-0" asChild>
            <a href={siteConfig.repositoryUrl} target="_blank" rel="noreferrer">
              <Github className="h-5 w-5" /> GitHub <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/40 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Life OS</span>
            <span className="text-sm text-muted-foreground">· Seu cérebro digital, interconectado.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <SmoothScrollLink href="#features" className="hover:text-foreground">Recursos</SmoothScrollLink>
            <SmoothScrollLink href="#domains" className="hover:text-foreground">Domínios</SmoothScrollLink>
            <SmoothScrollLink href="#philosophy" className="hover:text-foreground">Filosofia</SmoothScrollLink>
            <a href={siteConfig.repositoryUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
            <Link href="/app" className="hover:text-foreground">Abrir app</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
