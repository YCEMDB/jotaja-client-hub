import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageLayout } from "@/components/AdminPageLayout";

export const Route = createFileRoute("/_super/super/avisos")({
  component: AvisosPage,
  head: () => ({ meta: [{ title: "Super-Admin — Avisos globais" }] }),
});

type Ann = {
  id: string;
  message: string;
  variant: "info" | "success" | "warning" | "danger";
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

const VARIANT_COLOR: Record<Ann["variant"], string> = {
  info: "bg-blue-500/15 text-blue-700 border-blue-300",
  success: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
  warning: "bg-amber-500/15 text-amber-700 border-amber-300",
  danger: "bg-red-500/15 text-red-700 border-red-300",
};

function AvisosPage() {
  const [items, setItems] = useState<Ann[]>([]);
  const [form, setForm] = useState({
    message: "",
    variant: "info" as Ann["variant"],
    is_active: true,
    expires_at: "",
  });

  const load = async () => {
    const { data } = await supabase.from("global_announcements").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as Ann[]);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.message.trim()) return toast.error("Mensagem obrigatória");
    const { error } = await supabase.from("global_announcements").insert({
      message: form.message.trim(),
      variant: form.variant,
      is_active: form.is_active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Aviso publicado");
    setForm({ message: "", variant: "info", is_active: true, expires_at: "" });
    load();
  };

  const toggle = async (a: Ann) => {
    const { error } = await supabase.from("global_announcements").update({ is_active: !a.is_active }).eq("id", a.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esse aviso?")) return;
    const { error } = await supabase.from("global_announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Aviso removido");
    load();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Megaphone className="h-8 w-8 text-brand-violet" />
        <div>
          <h1 className="font-display text-4xl md:text-5xl text-ink tracking-tight leading-[0.95]">Avisos globais</h1>
          <p className="text-muted-foreground">Mensagens exibidas no topo do painel de todas as lojas</p>
        </div>
      </div>

      <Card className="p-5 space-y-3">
        <h2 className="font-bold text-lg">Novo aviso</h2>
        <div>
          <Label className="text-xs">Mensagem</Label>
          <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Ex: Manutenção programada às 22h" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={form.variant} onValueChange={(v) => setForm({ ...form, variant: v as Ann["variant"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Informativo</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="warning">Atenção</SelectItem>
                <SelectItem value="danger">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Expira em (opcional)</Label>
            <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
          </div>
          <div className="flex items-end justify-between rounded border p-2">
            <Label className="text-sm">Ativo</Label>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>
        </div>
        <Button onClick={create}>Publicar aviso</Button>
      </Card>

      <div className="space-y-3">
        <h2 className="font-bold text-lg">Avisos atuais</h2>
        {items.map((a) => (
          <Card key={a.id} className="p-4 flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={VARIANT_COLOR[a.variant]}>{a.variant}</Badge>
                {!a.is_active && <Badge variant="outline" className="border-muted-foreground/30">Desativado</Badge>}
                {a.expires_at && <span className="text-xs text-muted-foreground">expira {new Date(a.expires_at).toLocaleString("pt-BR")}</span>}
              </div>
              <p className="text-sm">{a.message}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={a.is_active} onCheckedChange={() => toggle(a)} />
              <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </Card>
        ))}
        {!items.length && <p className="text-muted-foreground">Nenhum aviso publicado.</p>}
      </div>
    </div>
  );
}
