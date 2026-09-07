"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Compass, User, ArrowRight, Shield, Check, Loader2, QrCode, X, Lock, Mail, Wallet, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Step = "auth" | "verify" | "qr-confirm" | "done";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("auth");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [qrConfirmToken, setQrConfirmToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => {
      if (d.authenticated) window.location.href = "/app";
    });

    const params = new URLSearchParams(window.location.search);
    const qrToken = params.get("qr");
    if (qrToken) {
      setQrConfirmToken(qrToken);
      setStep("qr-confirm");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Falha na autenticação"); return; }
      if (data.requiresVerification) { setStep("verify"); }
      else if (data.authenticated) { setStep("done"); setTimeout(() => { window.location.href = "/app"; }, 800); }
    } catch { setError("Erro de rede. Tente novamente."); }
    finally { setLoading(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Falha na verificação"); return; }
      setStep("done");
      setTimeout(() => { window.location.href = "/app"; }, 800);
    } catch { setError("Erro de rede"); }
    finally { setLoading(false); }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Animated background — floating orbs + grid pattern */}
      <div className="pointer-events-none absolute inset-0">
        {/* two soft washes of color, nothing more */}
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-[#33415c]/[0.06] blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-amber-500/[0.08] blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col px-6">
        {/* Logo + title */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3d4f6e] to-[#242f42] shadow-xl shadow-[#33415c]/20"
          >
            <Compass className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Central</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">O que precisa da sua atenção, num só lugar.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card/95 p-8 shadow-2xl backdrop-blur-xl dark:border-border/60 dark:bg-card/90"
        >
          <AnimatePresence mode="wait">
            {/* ─── Auth ─── */}
            {step === "auth" && (
              <motion.div key="auth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {/* Tabs */}
                <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1">
                  <button
                    onClick={() => { setMode("login"); setError(""); }}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${mode === "login" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => { setMode("register"); setError(""); }}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${mode === "register" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                  >
                    Criar conta
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "register" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                      <Label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Nome</Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="h-11 pl-10" />
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <Label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                      <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" className="h-11 pl-10" />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Senha</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-11 pl-10 pr-10"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <X className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </button>
                    </div>
                    {mode === "register" && <p className="mt-1 text-[10px] text-muted-foreground">Mínimo de 8 caracteres</p>}
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
                      {error}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full gap-2 bg-gradient-to-br from-[#3d4f6e] to-[#242f42] text-base text-white shadow-lg shadow-[#33415c]/20 hover:from-[#465a7c] hover:to-[#2b384f]"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <>
                        {mode === "login" ? "Entrar" : "Criar conta"}
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Features list */}
                <div className="mt-6 space-y-2 border-t border-border/40 pt-4">
                  {[
                    { icon: Wallet, color: "#10b981", text: "Saldo real: o que já está comprometido, o que é livre de verdade" },
                    { icon: Compass, color: "#a78bfa", text: "Cada área da sua vida, no seu lugar" },
                    { icon: BookOpen, color: "#8b5cf6", text: "Um versículo por dia pra guardar no coração" },
                  ].map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <f.icon className="h-3.5 w-3.5" style={{ color: f.color }} />
                      <span>{f.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── 2FA Verify ─── */}
            {step === "verify" && (
              <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6 text-center">
                  <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
                    <Shield className="h-7 w-7 text-emerald-500" />
                  </div>
                  <h2 className="font-display text-xl font-semibold">Verificação em duas etapas</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">Digite o código de 6 dígitos do seu app autenticador</p>
                </div>
                <form onSubmit={handleVerify} className="space-y-4">
                  <Input
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="h-16 text-center text-3xl font-bold tracking-[0.4em] tabular-nums"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                  {error && <p className="text-center text-sm text-rose-500">{error}</p>}
                  <Button type="submit" disabled={loading || verifyCode.length !== 6} className="h-11 w-full gap-2 bg-gradient-to-br from-[#3d4f6e] to-[#242f42] text-white">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Verificar <ArrowRight className="h-5 w-5" /></>}
                  </Button>
                </form>
                <button onClick={() => { setStep("auth"); setError(""); setVerifyCode(""); }} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
                  ← Voltar para o login
                </button>
              </motion.div>
            )}

            {/* ─── QR Confirm ─── */}
            {step === "qr-confirm" && (
              <motion.div key="qr-confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6 text-center">
                  <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15">
                    <QrCode className="h-7 w-7 text-violet-500" />
                  </div>
                  <h2 className="font-display text-xl font-semibold">Confirmar login</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">Digite suas credenciais para entrar neste dispositivo</p>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  setError("");
                  try {
                    const res = await fetch("/api/auth/qr-login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "confirm", token: qrConfirmToken, email, password }),
                    });
                    const data = await res.json();
                    if (!res.ok) { setError(data.error || "Falha ao confirmar"); return; }
                    setStep("done");
                    setTimeout(() => { window.location.href = "/app"; }, 800);
                  } catch { setError("Erro de rede"); }
                  finally { setLoading(false); }
                }} className="space-y-4">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                    <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" className="h-11 pl-10" />
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                    <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11 pl-10" />
                  </div>
                  {error && <p className="text-sm text-rose-500">{error}</p>}
                  <Button type="submit" disabled={loading} className="h-11 w-full gap-2 bg-gradient-to-br from-[#3d4f6e] to-[#242f42] text-white">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Confirmar login <ArrowRight className="h-5 w-5" /></>}
                  </Button>
                </form>
                <button onClick={() => { setStep("auth"); window.history.replaceState({}, "", "/login"); }} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
                  ← Cancelar
                </button>
              </motion.div>
            )}

            {/* ─── Done ─── */}
            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#3d4f6e] to-[#242f42] text-white shadow-xl shadow-[#33415c]/20"
                >
                  <Check className="h-8 w-8" strokeWidth={3} />
                </motion.div>
                <h2 className="font-display text-xl font-semibold">Bem-vindo à Central</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">Abrindo seu cérebro digital…</p>
                <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-muted-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          <Shield className="mr-1 inline h-3 w-3" />
          Código aberto · Auto-hospedado · Seus dados, seu cérebro
        </p>
      </div>
    </div>
  );
}
