import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Layers, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminPageLayout } from "@/components/AdminPageLayout";

export const Route = createFileRoute("/_super/super/planos")({
  component: PlanosPage,
  head: () => ({ meta: [{ title: "Super-Admin — Planos & Preços" }] }),
});

type AppPlan = {
  id: string;
  name: string;
  price_monthly: number;
  features: string[];
  position: number;
  is_active: boolean;
};

function PlanosPage() {
  const [plans, setPlans] = useState<AppPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("app_plans").select("*").order("position");
    if (error) toast.error(error.message);
    const parsed = (data ?? []).map((p: any) => ({
      ...p,
      price_monthly: Number(p.price_monthly),
      features: Array.isArray(p.features) ? p.features : [],
    }));
    setPlans(parsed as AppPlan[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateField = (id: string, patch: Partial<AppPlan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const save = async (p: AppPlan) => {
    const { error } = await supabase.from("app_plans").update({
      name: p.name,
      price_monthly: p.price_monthly,
      features: p.features,
      position: p.position,
      is_active: p.is_active,
    }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(`Plano ${p.name} atualizado`);
  };

  const create = async () => {
    const id = prompt("Identificador único do plano (ex: ultra)");
    if (!id) return;
    const { error } = await supabase.from("app_plans").insert({
      id: id.toLowerCase().replace(/[^a-z0-9_]/g, ""),
      name: "Novo plano",
      price_monthly: 0,
      features: [],
      position: plans.length,
      is_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Plano criado");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esse plano? Lojas existentes não serão afetadas.")) return;
    const { error } = await supabase.from("app_plans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Plano removido");
    load();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8 text-brand-violet" />
          <div>
            <h1 className="font-display text-4xl md:text-5xl text-ink tracking-tight leading-[0.95]">Planos & Preços</h1>
            <p className="text-muted-foreground">Catálogo público mostrado na landing page</p>
          </div>
        </div>
        <Button onClick={create}><Plus className="h-4 w-4 mr-2" />Novo plano</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">id: {p.id}</div>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Nome</Label>
                <Input value={p.name} onChange={(e) => updateField(p.id, { name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Preço/mês (R$)</Label>
                  <Input
                    type="number" min={0} step="0.01"
                    value={p.price_monthly}
                    onChange={(e) => updateField(p.id, { price_monthly: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Posição</Label>
                  <Input
                    type="number" min={0}
                    value={p.position}
                    onChange={(e) => updateField(p.id, { position: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Recursos (um por linha)</Label>
                <Textarea
                  rows={6}
                  value={p.features.join("\n")}
                  onChange={(e) => updateField(p.id, { features: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                />
              </div>
              <div className="flex items-center justify-between rounded border p-2">
                <Label className="text-sm">Ativo</Label>
                <Switch checked={p.is_active} onCheckedChange={(v) => updateField(p.id, { is_active: v })} />
              </div>
              <Button className="w-full" onClick={() => save(p)}>Salvar</Button>
            </Card>
          ))}
          {!plans.length && <p className="text-muted-foreground col-span-3">Nenhum plano cadastrado.</p>}
        </div>
      )}
    </div>
  );
}
