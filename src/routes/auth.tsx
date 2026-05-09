import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import logo from "@/assets/comanda-logo.png";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Entrar — Comanda" }] }),
});

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "Informe seu nome").max(100),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
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
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Comanda" className="h-10 w-10 rounded-lg bg-white p-1" />
          <span className="text-2xl font-bold">Comanda</span>
        </Link>
        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Seu delivery, sua marca,<br />zero comissão.
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Junte-se a milhares de restaurantes que reduziram custos e aumentaram a margem de lucro.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">© 2026 Comanda</p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md p-8">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src={logo} alt="Comanda" className="h-10 w-10" />
            <span className="text-2xl font-bold">Comanda</span>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login"><LoginForm /></TabsContent>
            <TabsContent value="signup"><SignupForm /></TabsContent>
          </Tabs>
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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

function SignupForm() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ fullName, phone, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("already registered") ? "Esse email já está cadastrado" : error.message);
      return;
    }
    toast.success("Conta criada! Vamos configurar seu restaurante.");
    nav({ to: "/admin" });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome completo</Label>
        <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="phone-s">Telefone</Label>
        <Input id="phone-s" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="email-s">Email</Label>
        <Input id="email-s" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="password-s">Senha</Label>
        <Input id="password-s" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres</p>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Criando conta..." : "Criar minha conta grátis"}
      </Button>
    </form>
  );
}
