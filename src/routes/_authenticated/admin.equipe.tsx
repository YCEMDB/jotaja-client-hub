import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Copy, Trash2, Mail, ShieldAlert, RefreshCw } from "lucide-react";

function translateInviteError(msg: string): string {
  if (msg.includes("plan_limit_reached")) return "Limite de usuários do plano atingido. Faça upgrade.";
  if (msg.includes("duplicate_invite")) return "Já existe um convite pendente para este e-mail.";
  if (msg.includes("already_member")) return "Este usuário já faz parte da equipe.";
  if (msg.includes("is_owner")) return "Este e-mail é o dono do restaurante.";
  if (msg.includes("invalid_email")) return "E-mail inválido.";
  if (msg.includes("forbidden")) return "Você não tem permissão para essa ação.";
  if (msg.includes("already_accepted_or_missing")) return "Convite não encontrado ou já aceito.";
  return msg;
}

export const Route = createFileRoute("/_authenticated/admin/equipe")({
  component: EquipePage,
});

type Member = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: "owner" | "manager" | "employee" | "super_admin";
  is_owner: boolean;
  created_at: string;
};

type Invite = {
  id: string;
  email: string;
  role: "employee" | "manager";
  token: string;
  expires_at: string;
  created_at: string;
};

function EquipePage() {
  const { restaurantId } = useAuth();
  const { plan } = usePlanFeatures();
  const maxUsers = plan?.features?.max_users ?? 1;
  const isUnlimited = maxUsers === null;

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"employee" | "manager">("employee");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!restaurantId) return;
    setLoading(true);
    const [m, i] = await Promise.all([
      supabase.rpc("list_team_members", { p_restaurant_id: restaurantId }),
      supabase
        .from("restaurant_invites")
        .select("id,email,role,token,expires_at,created_at")
        .eq("restaurant_id", restaurantId)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }),
    ]);
    setMembers((m.data as Member[]) ?? []);
    setInvites((i.data as Invite[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [restaurantId]);

  const totalUsed = members.length + invites.length;
  const atLimit = !isUnlimited && typeof maxUsers === "number" && totalUsed >= maxUsers;

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId || !email.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc("create_team_invite", {
      p_restaurant_id: restaurantId,
      p_email: email.trim(),
      p_role: role,
    });
    setSubmitting(false);
    if (error) {
      toast.error(translateInviteError(error.message));
      return;
    }
    setEmail("");
    const token = (data as any)?.token;
    if (token) {
      const link = `${window.location.origin}/aceitar-convite/${token}`;
      await navigator.clipboard.writeText(link).catch(() => {});
      toast.success("Convite criado! Link copiado para a área de transferência.");
    }
    load();
  };

  const copyLink = async (token: string) => {
    const link = `${window.location.origin}/aceitar-convite/${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado");
  };

  const resendInvite = async (id: string) => {
    const { data, error } = await supabase.rpc("resend_team_invite", { p_invite_id: id });
    if (error) return toast.error(translateInviteError(error.message));
    const token = (data as any)?.token;
    if (token) {
      const link = `${window.location.origin}/aceitar-convite/${token}`;
      await navigator.clipboard.writeText(link).catch(() => {});
    }
    toast.success("Convite renovado por mais 7 dias. Link copiado.");
    load();
  };

  const cancelInvite = async (id: string) => {
    if (!confirm("Cancelar este convite?")) return;
    const { error } = await supabase.rpc("cancel_team_invite", { p_invite_id: id });
    if (error) return toast.error(translateInviteError(error.message));
    toast.success("Convite cancelado");
    load();
  };

  const removeMember = async (userId: string) => {
    if (!restaurantId) return;
    if (!confirm("Remover este membro da equipe?")) return;
    const { error } = await supabase.rpc("remove_team_member", {
      p_restaurant_id: restaurantId,
      p_user_id: userId,
    });
    if (error) return toast.error(error.message);
    toast.success("Membro removido");
    load();
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7" />
        <div>
          <h1 className="text-2xl md:text-3xl font-display">Equipe</h1>
          <p className="text-sm text-ink/60">
            {isUnlimited ? "Usuários ilimitados no seu plano" : `${totalUsed} de ${maxUsers} usuários usados`}
          </p>
        </div>
      </div>

      {atLimit && (
        <div className="flex items-start gap-3 p-4 border-2 border-brand-orange/50 bg-brand-orange/10 rounded-lg">
          <ShieldAlert className="h-5 w-5 text-brand-orange shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>Limite atingido.</strong> Faça upgrade para convidar mais membros.
          </div>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Convidar por e-mail</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={invite} className="grid grid-cols-1 md:grid-cols-[1fr,180px,auto] gap-3 items-end">
            <div>
              <Label htmlFor="inv-email">E-mail</Label>
              <Input id="inv-email" type="email" required value={email} disabled={atLimit}
                onChange={(e) => setEmail(e.target.value)} placeholder="colega@restaurante.com" />
            </div>
            <div>
              <Label>Função</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)} disabled={atLimit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Funcionário</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={submitting || atLimit}>
              <Mail className="h-4 w-4 mr-2" /> Convidar
            </Button>
          </form>
          <p className="text-xs text-ink/50 mt-3">
            O link do convite é copiado para você compartilhar por WhatsApp, e-mail ou pessoalmente. O convite expira em 7 dias.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Membros ({members.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-ink/60">Carregando…</p> : (
            <div className="divide-y">
              {members.map((m) => (
                <div key={m.user_id + m.role} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.full_name || m.email || m.user_id.slice(0, 8)}</div>
                    <div className="text-xs text-ink/60 truncate">{m.email}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={m.is_owner ? "default" : "secondary"}>
                      {m.is_owner ? "Dono" : m.role === "manager" ? "Gerente" : "Funcionário"}
                    </Badge>
                    {!m.is_owner && (
                      <Button size="sm" variant="ghost" onClick={() => removeMember(m.user_id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Convites pendentes ({invites.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {invites.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{i.email}</div>
                    <div className="text-xs text-ink/60">
                      {i.role === "manager" ? "Gerente" : "Funcionário"} · expira {new Date(i.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => copyLink(i.token)}>
                      <Copy className="h-4 w-4 mr-1" /> Link
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => cancelInvite(i.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
