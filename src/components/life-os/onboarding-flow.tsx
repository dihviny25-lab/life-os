"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "./icon";
import { motion, AnimatePresence } from "framer-motion";
import { useLifeOS } from "@/store/life-os";

const STEPS = [
  {
    icon: "Brain",
    color: "#a78bfa",
    title: "Bem-vindo ao seu Cérebro Digital",
    desc: "O Life OS conecta tudo — tarefas, notas, diários, hábitos, finanças e muito mais — em um único sistema interconectado. Nada vive isolado.",
  },
  {
    icon: "Zap",
    color: "#f59e0b",
    title: "Capture qualquer coisa, instantaneamente",
    desc: "Aperte ⌘K em qualquer lugar pra capturar um pensamento. Ele vai pra sua Entrada. Processe depois — sem precisar decidir na hora onde ele se encaixa.",
  },
  {
    icon: "CalendarDays",
    color: "#06b6d4",
    title: "Um calendário para tudo",
    desc: "Tarefas, contas, compromissos e aniversários aparecem automaticamente no seu Calendário Mestre. Alterne camadas pra ver sua vida por diferentes ângulos.",
  },
  {
    icon: "Network",
    color: "#10b981",
    title: "Tudo se conecta",
    desc: "Ligue uma entrada de diário a um projeto. Conecte uma tarefa a uma meta. Veja sua vida inteira como um grafo. As conexões dão vida aos seus dados.",
  },
  {
    icon: "NotebookPen",
    color: "#ec4899",
    title: "Reflita e cresça",
    desc: "Reflexões diárias, revisões semanais, rastreamento de humor e insights mantêm seu sistema — e sua mente — confiáveis ao longo do tempo.",
  },
];

export function OnboardingFlow() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const { setView } = useLifeOS();

  useEffect(() => {
    const seen = localStorage.getItem("lifeos-onboarded");
    if (!seen) {
      // Small delay to let the app load
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  }

  function finish() {
    localStorage.setItem("lifeos-onboarded", "1");
    setOpen(false);
  }

  function skip() {
    localStorage.setItem("lifeos-onboarded", "1");
    setOpen(false);
  }

  const current = STEPS[step];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) skip(); }}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Bem-vindo ao Life OS</DialogTitle>
          <DialogDescription>Um tour rápido pelo seu cérebro digital.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          {/* Gradient background */}
          <div
            className="h-48 overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${current.color}20, transparent)` }}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl"
              style={{ background: current.color }}
            />
            <div className="flex h-full items-center justify-center">
              <motion.div
                key={step}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg"
                style={{ background: `${current.color}22`, color: current.color }}
              >
                <Icon name={current.icon} className="h-10 w-10" />
              </motion.div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-xl font-bold tracking-tight">{current.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{current.desc}</p>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-foreground" : "w-2 bg-muted"}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {step < STEPS.length - 1 && (
                  <Button variant="ghost" size="sm" onClick={skip}>Pular</Button>
                )}
                <Button size="sm" onClick={next} className="gap-1.5" style={{ background: current.color, color: "white" }}>
                  {step < STEPS.length - 1 ? "Próximo" : "Começar"}
                  <Icon name={step < STEPS.length - 1 ? "ArrowRight" : "Check"} className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
