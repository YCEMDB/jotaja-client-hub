import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/entregadores")({
  component: Entregadores,
  head: () => ({ meta: [{ title: "Entregadores — ComandaHub" }] }),
});

interface Driver {
  id: string;
  name: string;
  phone: string | null;
  vehicle: string | null;
  license_plate: string | null;
  is_active: boolean;
}

function Entregadores() {
  const { restaurantId } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", vehicle: "", license_plate: "", is_active: true });

  const load = async () => {
    if (!restaurantId) return;
    const { data } = await supabase.from("delivery_drivers").select("*").eq("restaurant_id", restaurantId).order("name");
    setDrivers((data as Driver[]) ?? []);
  };

  useEffect(() => { load(); }, [restaurantId]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", phone: "", vehicle: "", license_plate: "", is_active: true });
    setOpen(true);
  };

  const openEdit = (d: Driver) => {
    setEditing(d);
    setForm({ name: d.name, phone: d.phone ?? "", vehicle: d.vehicle ?? "", license_plate: d.license_plate ?? "", is_active: d.is_active });
    setOpen(true);
  };

  const save = async () => {
    if (!restaurantId || !form.name) return;
    const payload = { ...form, restaurant_id: restaurantId, phone: form.phone || null, vehicle: form.vehicle || null, license_plate: form.license_plate || null };
    const res = editing
      ? await supabase.from("delivery_drivers").update(payload).eq("id", editing.id)
      : await supabase.from("delivery_drivers").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing ? "Entregador atualizado" : "Entregador cadastrado");
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este entregador?")) return;
    const { error } = await supabase.from("delivery_drivers").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removido"); load();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl text-ink tracking-tight leading-[0.95]">Entregadores</h1>
          <p className="text-muted-foreground">Gerencie sua equipe de entregas</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo entregador</Button>
      </div>

      {drivers.length === 0 ? (
        <Card className="p-12 text-center">
          <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum entregador cadastrado ainda.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{d.name}</h3>
                  <p className="text-sm text-muted-foreground">{d.phone ?? "Sem telefone"}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${d.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {d.is_active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                {d.vehicle && <div>🛵 {d.vehicle}</div>}
                {d.license_plate && <div>🔢 {d.license_plate}</div>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(d)}><Pencil className="h-3 w-3 mr-1" />Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar entregador" : "Novo entregador"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Veículo</Label><Input value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} placeholder="Moto Honda CG 160" /></div>
            <div><Label>Placa</Label><Input value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value })} placeholder="ABC-1234" /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Ativo</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
