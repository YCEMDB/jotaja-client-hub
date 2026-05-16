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
      { title: "Entrar — ComandaHub" },
      { name: "description", content: "Acesse sua conta ComandaHub para gerenciar pedidos, cardápio e clientes do seu restaurante." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Entrar — ComandaHub" },
      { property: "og:description", content: "Acesse o painel ComandaHub do seu restaurante." },
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <Link to="/" className="flex items-center group bg-white rounded-xl px-4 py-3 w-fit">
          <Logo size="md" />
        </Link>
        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Seu delivery, sua marca,<br />zero comissão.
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Acesse o painel da sua loja para gerenciar pedidos, cardápio e entregadores.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">© 2026 ComandaHub</p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md p-8">
          <div className="lg:hidden flex items-center mb-8">
            <Logo size="md" />
          </div>

          <h1 className="text-2xl font-bold mb-1">Entrar</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Acesse o painel da sua loja com suas credenciais.
          </p>

          <LoginForm />

          <p className="text-xs text-muted-foreground text-center mt-6">
            Ainda não tem acesso?{" "}
            <Link to="/" hash="cadastro" className="text-primary font-semibold underline">
              Solicite seu teste grátis
            </Link>
          </p>
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
