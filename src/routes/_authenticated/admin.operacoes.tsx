import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { translateError } from "@/lib/error-messages";
import { AdminPageLayout, Section, SectionHeader } from "@/components/ds";

export const Route = createFileRoute("/_authenticated/admin/operacoes")({
  component: OperacoesPage,
  head: () => ({ meta: [{ title: "Operações — Comandex" }] }),
});

type Ops = {
  sound_enabled: boolean;
  sla_green_minutes: number;
  sla_yellow_minutes: number;
  sla_red_minutes: number;
  auto_print_on_confirmed: boolean;
  auto_print_on_preparing: boolean;
  auto_print_on_ready: boolean;
  default_driver: string;
  printer_name: string | null;
};

const DEFAULTS: Ops = {
  sound_enabled: true, sla_green_minutes: 10, sla_yellow_minutes: 20, sla_red_minutes: 30,
  auto_print_on_confirmed: false, auto_print_on_preparing: true, auto_print_on_ready: false,
  default_driver: "browser", printer_name: null,
};

type Station = { id: string; name: string; color: string; position: number; is_active: boolean };

function OperacoesPage() {
  const { restaurantId } = useAuth();
  const [ops, setOps] = useState<Ops>(DEFAULTS);
  const [stations, setStations] = useState<Station[]>([]);
  const [newStation, setNewStation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    supabase.from("operations_settings").select("*").eq("restaurant_id", restaurantId).maybeSingle()
      .then(({ data }) => data && setOps({ ...DEFAULTS, ...(data as Ops) }));
    loadStations();
  }, [restaurantId]);

  const loadStations = () => {
    if (!restaurantId) return;
    supabase.from("kitchen_stations").select("*").eq("restaurant_id", restaurantId).order("position")
      .then(({ data }) => setStations((data ?? []) as Station[]));
  };

  const save = async () => {
    if (!restaurantId) return;
    setSaving(true);
    const { error } = await supabase.from("operations_settings")
      .upsert({ restaurant_id: restaurantId, ...ops });
    setSaving(false);
    if (error) toast.error(translateError(error));
    else toast.success("Configurações salvas");
  };

  const addStation = async () => {
    const name = newStation.trim();
    if (!name || !restaurantId) return;
    const { error } = await supabase.from("kitchen_stations")
      .insert({ restaurant_id: restaurantId, name, position: stations.length });
    if (error) toast.error(translateError(error));
    else { setNewStation(""); loadStations(); }
  };

  const removeStation = async (id: string) => {
    const { error } = await supabase.from("kitchen_stations").delete().eq("id", id);
    if (error) toast.error(translateError(error));
    else loadStations();
  };

  return (
    <AdminPageLayout
      kicker="Operações"
      title="Operações"
      subtitle="KDS, som, SLA, impressão e estações."
      accent="violet"
      icon={Settings2}
      maxWidth="4xl"
      actions={
        <Button onClick={save} disabled={saving} className="bg-gradient-sunset text-white shadow-brutal">
          {saving ? "Salvando…" : "Salvar configurações"}
        </Button>
      }
    >
      <Section>
        <SectionHeader title="SLA (cores por tempo no KDS)" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Verde até (min)</Label>
            <Input type="number" min={1} value={ops.sla_green_minutes}
              onChange={(e) => setOps({ ...ops, sla_green_minutes: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Amarelo a partir de (min)</Label>
            <Input type="number" min={1} value={ops.sla_yellow_minutes}
              onChange={(e) => setOps({ ...ops, sla_yellow_minutes: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Vermelho a partir de (min)</Label>
            <Input type="number" min={1} value={ops.sla_red_minutes}
              onChange={(e) => setOps({ ...ops, sla_red_minutes: Number(e.target.value) })} />
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader title="Som" />
        <div className="flex items-center justify-between">
          <Label>Alertas sonoros no KDS</Label>
          <Switch checked={ops.sound_enabled} onCheckedChange={(v) => setOps({ ...ops, sound_enabled: v })} />
        </div>
      </Section>

      <Section>
        <SectionHeader title="Impressão automática" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ao confirmar pedido</Label>
            <Switch checked={ops.auto_print_on_confirmed}
              onCheckedChange={(v) => setOps({ ...ops, auto_print_on_confirmed: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Ao iniciar preparo</Label>
            <Switch checked={ops.auto_print_on_preparing}
              onCheckedChange={(v) => setOps({ ...ops, auto_print_on_preparing: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Ao ficar pronto</Label>
            <Switch checked={ops.auto_print_on_ready}
              onCheckedChange={(v) => setOps({ ...ops, auto_print_on_ready: v })} />
          </div>
          <div>
            <Label>Nome da impressora (opcional, drivers futuros)</Label>
            <Input value={ops.printer_name ?? ""} onChange={(e) => setOps({ ...ops, printer_name: e.target.value })} />
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader title="Estações" description="Cadastre estações (Cozinha, Bar, Pizzaria…) e associe produtos no cardápio." />
        <div className="flex gap-2 mb-3">
          <Input value={newStation} onChange={(e) => setNewStation(e.target.value)}
            placeholder="Ex.: Cozinha" onKeyDown={(e) => e.key === "Enter" && addStation()} />
          <Button onClick={addStation}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
        </div>
        <ul className="divide-y divide-ink/10">
          {stations.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="font-medium">{s.name}</span>
                {!s.is_active && <span className="text-xs text-muted-foreground">(inativa)</span>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeStation(s.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          ))}
          {stations.length === 0 && <li className="text-sm text-muted-foreground py-4">Nenhuma estação.</li>}
        </ul>
      </Section>
    </AdminPageLayout>
  );
}
