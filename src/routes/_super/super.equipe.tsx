import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { addSuperAdmin, removeSuperAdmin, listSuperAdmins } from "@/lib/super-admin.functions";
import { sendTransactionalEmail } from "@/lib/email/send";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Plus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_super/super/equipe")({
  component: EquipePage,
  head: () => ({ meta: [{ title: "Super-Admin — Equipe" }] }),
});

function EquipePage() {
  const listFn = useServerFn(listSuperAdmins);
  const addFn = useServerFn(addSuperAdmin);
  const rmFn = useServerFn(removeSuperAdmin);
  const [admins, setAdmins] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const load = async () => {
    try { const r = await listFn(); setAdmins(r.admins); }
    catch (e: any) { toast.error(e?.message ?? "Erro ao carregar"); }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await addFn({ data: form });
      setCreated({ email: r.email, password: r.temporary_password });
      try {
        await sendTransactionalEmail({
          templateName: "admin-welcome",
          recipientEmail: r.email,
          idempotencyKey: `admin-welcome-${r.user_id}`,
          templateData: {
            adminName: r.full_name,
            loginUrl: "https://comandahub.online/auth",
            email: r.email,
            temporaryPassword: r.temporary_password,
          },
        });
        toast.success("Admin criado e e-mail enviado");
      } catch (e: any) {
        toast.warning(`Admin criado, mas e-mail falhou: ${e?.message ?? "erro"}`);
      }
      setForm({ full_name: "", email: "" });
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally { setBusy(false); }
  };

  const remove = async (user_id: string, email: string) => {
    if (!confirm(`Remover acesso de Super-Admin de ${email}?`)) return;
    try { await rmFn({ data: { user_id } }); toast.success("Removido"); await load(); }
    catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-brand-violet" />
          <div>
            <h1 className="font-display text-4xl text-ink tracking-tight">Equipe</h1>
            <p className="text-muted-foreground">Gerencie outros super-administradores da plataforma</p>
          </div>
        </div>
        <Button onClick={() => { setOpen(true); setCreated(null); }}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar Super-Admin
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left">
              <th className="p-3">Nome</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Adicionado em</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.user_id} className="border-t">
                <td className="p-3 font-medium">{a.full_name ?? "—"} {a.is_self && <Badge variant="outline" className="ml-2">você</Badge>}</td>
                <td className="p-3">{a.email ?? "—"}</td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(a.added_at).toLocaleDateString("pt-BR")}</td>
                <td className="p-3 text-right">
                  {!a.is_self && (
                    <Button size="sm" variant="ghost" onClick={() => remove(a.user_id, a.email)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!admins.length && <tr><td colSpan={4} className="p-4 md:p-8 text-center text-muted-foreground">Nenhum super-admin</td></tr>}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{created ? "Admin criado" : "Adicionar Super-Admin"}</DialogTitle></DialogHeader>
          {created ? (
            <div className="space-y-3">
              <p className="text-sm">Credenciais enviadas por e-mail. Cópia abaixo:</p>
              <Card className="p-4 bg-muted/40 space-y-2">
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="font-mono text-sm">{created.email}</p>
                <p className="text-xs text-muted-foreground">Senha temporária</p>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 bg-background rounded border font-mono text-sm">{created.password}</code>
                  <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`E-mail: ${created.email}\nSenha: ${created.password}`)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
              <DialogFooter><Button onClick={() => setOpen(false)}>Fechar</Button></DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Nome completo" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <Input type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <p className="text-xs text-muted-foreground">Uma senha temporária será gerada e enviada por e-mail.</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={submit} disabled={busy || !form.full_name || !form.email}>{busy ? "Adicionando..." : "Adicionar"}</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
