import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createTenant } from "@/lib/super-admin.functions";
import { sendTransactionalEmail } from "@/lib/email/send";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, Mail } from "lucide-react";
import { toast } from "sonner";

export type Plan = "trial" | "essential" | "professional";
export type LeadLike = {
  id?: string;
  restaurant_name?: string;
  name?: string;
  email?: string;
  phone?: string;
};

export function CreateTenantDialog({
  open, onOpenChange, prefill, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  prefill: LeadLike | null;
  onCreated: () => void;
}) {
  const createTenantFn = useServerFn(createTenant);
  const [form, setForm] = useState({
    restaurant_name: "",
    phone: "",
    plan: "trial" as Plan,
    trial_days: 14,
    owner_full_name: "",
    owner_email: "",
    owner_phone: "",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ password: string | null; createdNew: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setResult(null);
      setForm({
        restaurant_name: prefill?.restaurant_name ?? "",
        phone: prefill?.phone ?? "",
        plan: "trial",
        trial_days: 14,
        owner_full_name: prefill?.name ?? "",
        owner_email: prefill?.email ?? "",
        owner_phone: prefill?.phone ?? "",
      });
    }
  }, [open, prefill]);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await createTenantFn({ data: { ...form, lead_id: prefill?.id ?? null } });
      toast.success("Loja criada com sucesso!");
      setResult({ password: r.temporary_password, createdNew: r.created_new_user });
      onCreated();
      // Dispara e-mail de boas-vindas com as credenciais
      try {
        await sendTransactionalEmail({
          templateName: "restaurant-welcome",
          recipientEmail: form.owner_email,
          idempotencyKey: `welcome-${r.restaurant_id}`,
          templateData: {
            restaurantName: form.restaurant_name,
            ownerName: form.owner_full_name,
            loginUrl: "https://comandahub.online/auth",
            email: form.owner_email,
            temporaryPassword: r.temporary_password,
            isReset: false,
          },
        });
        toast.success("E-mail com credenciais enviado ao dono", { icon: "📧" });
      } catch (e: any) {
        toast.warning(`Loja criada, mas e-mail falhou: ${e?.message ?? "erro"}`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar loja");
    } finally {
      setBusy(false);
    }
  };

  const copy = (s: string) => {
    navigator.clipboard.writeText(s);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{result ? "Loja criada" : "Nova loja"}</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <p className="text-sm">Loja criada com sucesso. {result.createdNew ? "Envie estas credenciais ao dono:" : "O dono já tinha conta — ele entra com a senha atual."}</p>
            {result.password && (
              <Card className="p-4 bg-muted/40">
                <p className="text-xs text-muted-foreground mb-1">E-mail</p>
                <p className="font-mono text-sm mb-3">{form.owner_email}</p>
                <p className="text-xs text-muted-foreground mb-1">Senha temporária</p>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 bg-background rounded border font-mono text-sm">{result.password}</code>
                  <Button size="sm" variant="outline" onClick={() => copy(`E-mail: ${form.owner_email}\nSenha: ${result.password}`)}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Copie agora — esta senha não será mostrada novamente.</p>
              </Card>
            )}
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Concluído</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Loja</p>
              <Input placeholder="Nome do restaurante" value={form.restaurant_name}
                onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })} />
              <p className="text-[11px] text-muted-foreground">O slug (URL) é gerado automaticamente a partir do nome.</p>
              <Input placeholder="Telefone (opcional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v as Plan })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="essential">Essential</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" min={0} max={365} value={form.trial_days}
                  onChange={(e) => setForm({ ...form, trial_days: Number(e.target.value) || 0 })}
                  placeholder="Dias de trial" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Dono</p>
              <Input placeholder="Nome completo" value={form.owner_full_name} onChange={(e) => setForm({ ...form, owner_full_name: e.target.value })} />
              <Input type="email" placeholder="E-mail" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} />
              <Input placeholder="Telefone (opcional)" value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} />
            </div>

            <p className="text-xs text-muted-foreground">
              Uma senha temporária será gerada e mostrada uma única vez para você enviar ao dono.
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={busy || !form.restaurant_name || !form.owner_email || !form.owner_full_name}>
                {busy ? "Criando..." : "Criar loja"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
