import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Logo } from "@/components/jotaja/Logo";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Redefinir senha — Comandex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"validating" | "ready" | "invalid">("validating");
  const [errMsg, setErrMsg] = useState<string>("");

  useEffect(() => {
    // O webhook do Comandex envia o link no formato:
    // https://comandahub.online/reset-password?token_hash=xxx&type=recovery
    // (PKCE/OTP — precisa de verifyOtp antes do updateUser)
    //
    // O fluxo antigo padrão Supabase usa hash:
    // https://comandahub.online/reset-password#access_token=...&type=recovery
    // (cria sessão automaticamente)
    //
    // Cobrimos os dois.
    const run = async () => {
      const url = new URL(window.location.href);
      const tokenHash = url.searchParams.get("token_hash");
      const code = url.searchParams.get("code");
      const type = url.searchParams.get("type");
      const errorDesc = url.searchParams.get("error_description") || url.hash.match(/error_description=([^&]+)/)?.[1];

      if (errorDesc) {
        setErrMsg(decodeURIComponent(errorDesc));
        setStatus("invalid");
        return;
      }

      // Fluxo PKCE (?code=...) — usado quando o webhook reescreve o link
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { setErrMsg(error.message); setStatus("invalid"); return; }
        setStatus("ready");
        return;
      }

      // Fluxo OTP (?token_hash=...&type=recovery)
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: (type as "recovery") || "recovery",
        });
        if (error) { setErrMsg(error.message); setStatus("invalid"); return; }
        setStatus("ready");
        return;
      }

      // Fluxo legado (#access_token=...) — Supabase já criou sessão
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setStatus("ready");
      });
      const { data } = await supabase.auth.getSession();
      if (data.session) setStatus("ready");
      else {
        // espera 1.5s pelo evento; se não vier, link inválido
        setTimeout(() => {
          if (status === "validating") {
            setErrMsg("Link expirado ou inválido. Solicite um novo e-mail de recuperação.");
            setStatus("invalid");
          }
        }, 2000);
      }
      return () => sub.subscription.unsubscribe();
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().min(6, "Mínimo 6 caracteres").max(100).safeParse(password);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (password !== confirm) { toast.error("As senhas não coincidem"); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha redefinida com sucesso!");
    // desloga e manda para login com a nova senha
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md p-8">
        <div className="flex justify-center mb-6">
          <Link to="/" className="inline-flex group"><Logo size="md" /></Link>
        </div>
        <h1 className="text-2xl font-bold mb-1">Nova senha</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {status === "validating" && "Validando link de recuperação..."}
          {status === "ready" && "Crie uma nova senha para sua conta."}
          {status === "invalid" && "Não foi possível validar o link."}
        </p>

        {status === "ready" && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoFocus />
            </div>
            <div>
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        )}

        {status === "validating" && (
          <div className="text-center text-sm text-muted-foreground py-8 animate-pulse">
            Validando…
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-3">
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
              {errMsg || "Link expirado ou inválido."}
            </div>
            <Link to="/auth" className="text-primary font-semibold underline text-sm block text-center">
              Voltar para o login e solicitar novo link
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
