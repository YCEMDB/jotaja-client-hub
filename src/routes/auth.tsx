import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Logo } from "@/components/jotaja/Logo";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Entrar — Mesivo" },
      { name: "description", content: "Acesse sua conta Mesivo para gerenciar pedidos, cardápio e clientes do seu restaurante." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Entrar — Mesivo" },
      { property: "og:description", content: "Acesse o painel Mesivo do seu restaurante." },
    ],
  }),
});

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});

function AuthPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) nav({ to: "/admin" });
  }, [user, loading, nav]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink overflow-hidden selection:bg-brand-magenta selection:text-white">
      {/* Coluna Esquerda: Branding & Visual */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-ink relative border-r-3 border-ink">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-grid" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-orange/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-magenta/20 blur-[120px] rounded-full" />
        
        <Link to="/" className="relative z-10 flex items-center group bg-white border-3 border-ink shadow-brutal px-5 py-4 w-fit hover:-translate-y-1 hover:-translate-x-1 transition-transform">
          <Logo size="md" />
        </Link>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-6xl font-black leading-none mb-8 text-white uppercase italic tracking-tighter">
            A GESTÃO <span className="text-brand-orange drop-shadow-glow">QUE LIBERTA</span> SEU NEGÓCIO.
          </h2>
          <div className="flex gap-4 mb-6">
            <div className="h-1 w-24 bg-brand-orange" />
            <div className="h-1 w-12 bg-brand-magenta" />
          </div>
          <p className="text-white/80 text-xl font-medium tracking-tight border-l-3 border-brand-orange pl-6 py-2">
            Acesse o painel central da MESIVO para controlar sua operação em tempo real. Cardápio, pedidos e entregas em um só lugar.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="text-xs font-bold text-white/40 uppercase tracking-widest">© 2026 MESIVO PLATFORM</div>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      </div>

      {/* Coluna Direita: Login Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-white relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-noise" />
        
        <Card className="w-full max-w-md border-3 border-ink shadow-brutal p-8 md:p-10 rounded-none relative z-10 bg-white">
          <div className="lg:hidden flex items-center justify-center mb-10">
            <Logo size="md" />
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-black mb-2 text-ink uppercase tracking-tighter italic">ENTRAR</h1>
            <p className="text-ink/60 font-medium text-lg leading-snug">
              Acesse seu terminal de comando.
            </p>
          </div>

          <LoginForm />

          <div className="mt-10 pt-8 border-t-2 border-ink/10 text-center">
            <p className="text-sm font-bold text-ink/60 uppercase tracking-tight">
              Ainda não é um parceiro?{" "}
              <Link 
                to="/" 
                hash="cadastro" 
                className="text-brand-magenta hover:text-brand-orange transition-colors underline decoration-2 underline-offset-4"
              >
                Solicite acesso agora
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function LoginForm() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email ou senha incorretos" : error.message);
      return;
    }
    toast.success("Bem-vindo de volta!");
    nav({ to: "/admin" });
  };

  const onForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email("Email inválido").safeParse(forgotEmail);
    if (!parsed.success) {
      toast.error("Digite um email válido");
      return;
    }
    setForgotSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Enviamos um link para seu email!");
    setForgotOpen(false);
    setForgotEmail("");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <button
            type="button"
            onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
            className="text-xs text-primary hover:underline font-semibold"
          >
            Esqueci minha senha
          </button>
        </div>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Entrando..." : "Entrar"}
      </Button>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setForgotOpen(false)}>
          <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-1">Recuperar senha</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Digite seu email e enviaremos um link para você criar uma nova senha.
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="forgot-email">Email</Label>
                <Input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} autoFocus />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" className="flex-1" disabled={forgotSubmitting} onClick={onForgot}>
                  {forgotSubmitting ? "Enviando..." : "Enviar link"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </form>
  );
}
