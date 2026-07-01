import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, XCircle, LogIn } from "lucide-react";

export const Route = createFileRoute("/aceitar-convite/$token")({
  component: AcceptInvitePage,
  head: () => ({ meta: [{ title: "Aceitar convite · Comandex" }] }),
});

function AcceptInvitePage() {
  const { token } = Route.useParams();
  const { user, loading, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [state, setState] = useState<"idle" | "accepting" | "ok" | "error">("idle");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // guarda o token e manda pro auth
      try { sessionStorage.setItem("pending_invite_token", token); } catch {}
      return;
    }
    if (state !== "idle") return;
    setState("accepting");
    supabase.rpc("accept_team_invite", { p_token: token }).then(async ({ error }) => {
      if (error) {
        setState("error");
        setMsg(
          error.message.includes("email_mismatch")
            ? "Este convite foi enviado para outro e-mail. Faça login com o e-mail correto."
            : error.message.includes("invite_invalid_or_expired")
              ? "Convite inválido ou expirado."
              : error.message,
        );
        return;
      }
      try { sessionStorage.removeItem("pending_invite_token"); } catch {}
      await refreshProfile();
      setState("ok");
      toast.success("Bem-vindo(a) à equipe!");
      setTimeout(() => nav({ to: "/admin" }), 1200);
    });
  }, [user, loading, token, state, nav, refreshProfile]);

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-mesh p-6">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Convite de equipe</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!user && !loading && (
            <>
              <p className="text-sm text-ink/70">
                Faça login (ou crie sua conta) com o e-mail que recebeu o convite para aceitar.
              </p>
              <Button asChild className="w-full">
                <Link to="/auth"><LogIn className="h-4 w-4 mr-2" /> Fazer login</Link>
              </Button>
            </>
          )}
          {state === "accepting" && <p className="text-sm">Aceitando convite…</p>}
          {state === "ok" && (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" /> Convite aceito! Redirecionando…
            </div>
          )}
          {state === "error" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-red-600">
                <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <p className="text-sm">{msg}</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">Voltar ao início</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
