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
        
        <Link to="/" className="relative z-10 flex items-center group bg-ink border-3 border-brand-orange shadow-[6px_6px_0_0_#e84393] px-6 py-5 w-fit hover:-translate-y-1 hover:-translate-x-1 transition-all active:translate-y-0 active:translate-x-0 active:shadow-none">
          <Logo size="md" variant="white" />
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
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-black uppercase tracking-widest text-ink">E-mail</Label>
        <Input 
          id="email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="seu@restaurante.com"
          required 
          className="h-14 border-3 border-ink rounded-none text-lg font-bold placeholder:text-ink/30 focus-visible:ring-0 focus-visible:border-brand-orange transition-colors"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-black uppercase tracking-widest text-ink">Senha</Label>
          <button
            type="button"
            onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
            className="text-xs font-bold text-brand-magenta hover:text-brand-orange transition-colors uppercase tracking-tight underline underline-offset-4"
          >
            Esqueci a senha
          </button>
        </div>
        <Input 
          id="password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="••••••••"
          required 
          className="h-14 border-3 border-ink rounded-none text-lg font-bold placeholder:text-ink/30 focus-visible:ring-0 focus-visible:border-brand-orange transition-colors"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full h-16 bg-ink hover:bg-brand-orange text-white text-xl font-black rounded-none uppercase italic tracking-tighter shadow-brutal active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
        disabled={submitting}
      >
        {submitting ? "VERIFICANDO..." : "ACESSAR PAINEL"}
      </Button>

      {forgotOpen && (
        <div className="fixed inset-0 z-[100] bg-ink/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setForgotOpen(false)}>
          <Card className="w-full max-w-md border-4 border-ink shadow-[12px_12px_0_0_#ff6b35] p-8 rounded-none bg-white relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-2 bg-brand-magenta" />
            <h2 className="text-3xl font-black mb-2 text-ink uppercase italic tracking-tighter">RECOBRAR SENHA</h2>
            <p className="text-ink/60 font-medium mb-8 leading-snug">
              Enviaremos um link de recuperação para o e-mail cadastrado.
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-sm font-black uppercase tracking-widest text-ink">E-mail de Cadastro</Label>
                <Input 
                  id="forgot-email" 
                  type="email" 
                  value={forgotEmail} 
                  onChange={(e) => setForgotEmail(e.target.value)} 
                  autoFocus 
                  className="h-14 border-3 border-ink rounded-none text-lg font-bold focus-visible:ring-0 focus-visible:border-brand-magenta"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 h-14 border-3 border-ink rounded-none font-black uppercase tracking-tight hover:bg-ink hover:text-white transition-all" 
                  onClick={() => setForgotOpen(false)}
                >
                  VOLTAR
                </Button>
                <Button 
                  type="button" 
                  className="flex-1 h-14 bg-brand-magenta hover:bg-ink text-white rounded-none font-black uppercase tracking-tight shadow-[4px_4px_0_0_#000] active:translate-y-1 transition-all" 
                  disabled={forgotSubmitting} 
                  onClick={onForgot}
                >
                  {forgotSubmitting ? "ENVIANDO..." : "ENVIAR LINK"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </form>
  );
}
