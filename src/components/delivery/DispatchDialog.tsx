import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bike, Circle, Loader2, UserX } from "lucide-react";
import { assignDriver, unassignDriver, type DeliveryDriver, type DeliveryOrder } from "@/lib/delivery";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  order: DeliveryOrder | null;
  drivers: DeliveryDriver[];
  onDone?: () => void;
}

const STATUS_DOT: Record<DeliveryDriver["status"], string> = {
  available: "text-emerald-500 fill-emerald-500",
  busy: "text-amber-500 fill-amber-500",
  offline: "text-ink/30 fill-ink/30",
};

const STATUS_LABEL: Record<DeliveryDriver["status"], string> = {
  available: "Disponível",
  busy: "Ocupado",
  offline: "Offline",
};

export function DispatchDialog({ open, onOpenChange, order, drivers, onDone }: Props) {
  const [saving, setSaving] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (open) setSelected(order?.driver_id ?? null);
  }, [open, order?.driver_id]);

  if (!order) return null;

  const currentDriverId = order.driver_id;
  const isChange = !!currentDriverId;

  const handleAssign = async (driverId: string) => {
    if (!order) return;
    setSaving(driverId);
    try {
      await assignDriver(order.id, driverId);
      toast.success(isChange ? "Motoboy trocado" : "Motoboy atribuído");
      onDone?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao atribuir motoboy");
    } finally {
      setSaving(null);
    }
  };

  const handleUnassign = async () => {
    if (!order || !confirm("Cancelar despacho e liberar motoboy?")) return;
    setSaving("__unassign");
    try {
      await unassignDriver(order.id, "Cancelado pelo admin");
      toast.success("Despacho cancelado");
      onDone?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao cancelar");
    } finally {
      setSaving(null);
    }
  };

  const activeDrivers = drivers.filter((d) => d.is_active);
  const available = activeDrivers.filter((d) => d.status === "available");
  const busy = activeDrivers.filter((d) => d.status === "busy");
  const offline = activeDrivers.filter((d) => d.status === "offline");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isChange ? "Trocar motoboy" : "Despachar pedido"}
            <span className="ml-2 text-ink/60 text-lg">#{order.order_number}</span>
          </DialogTitle>
          <DialogDescription>
            Cliente: <strong>{order.customer_name}</strong> · Total: R$ {order.total.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          {activeDrivers.length === 0 && (
            <div className="p-6 border-2 border-dashed border-ink/20 rounded-xl text-center text-sm text-ink/60">
              Nenhum motoboy ativo cadastrado. Cadastre em <strong>Entregadores</strong>.
            </div>
          )}

          {[
            { label: "Disponíveis", list: available, empty: "Nenhum motoboy disponível agora." },
            { label: "Ocupados", list: busy, empty: "" },
            { label: "Offline", list: offline, empty: "" },
          ].map((g) =>
            g.list.length === 0 && !g.empty ? null : (
              <div key={g.label}>
                <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-ink/60 mb-2">{g.label}</p>
                {g.list.length === 0 ? (
                  <p className="text-xs text-ink/40 italic">{g.empty}</p>
                ) : (
                  <div className="space-y-2">
                    {g.list.map((d) => {
                      const isCurrent = d.id === currentDriverId;
                      const isSelected = d.id === selected;
                      return (
                        <button
                          key={d.id}
                          onClick={() => setSelected(d.id)}
                          disabled={saving !== null}
                          className={cn(
                            "w-full text-left border-2 border-ink rounded-xl p-3 flex items-center gap-3 transition-all",
                            "hover:shadow-[3px_3px_0_0_oklch(0.15_0.02_30)] hover:-translate-x-0.5 hover:-translate-y-0.5",
                            isSelected ? "bg-brand-orange/10 shadow-[3px_3px_0_0_oklch(0.15_0.02_30)]" : "bg-card",
                            saving !== null && "opacity-60 cursor-not-allowed",
                          )}
                        >
                          <div className="h-10 w-10 rounded-lg bg-brand-violet/10 border-2 border-ink grid place-items-center shrink-0">
                            <Bike className="h-4 w-4 text-ink" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm truncate flex items-center gap-2">
                              {d.name}
                              {isCurrent && (
                                <Badge variant="outline" className="text-[10px] border-brand-orange text-brand-orange">
                                  atual
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-ink/60 flex items-center gap-2 mt-0.5">
                              <Circle className={cn("h-2 w-2", STATUS_DOT[d.status])} />
                              {STATUS_LABEL[d.status]}
                              {d.vehicle && <span>· {d.vehicle}</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ),
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
          {isChange && (
            <Button
              variant="outline"
              onClick={handleUnassign}
              disabled={saving !== null}
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              {saving === "__unassign" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserX className="h-4 w-4 mr-2" />}
              Cancelar despacho
            </Button>
          )}
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving !== null}>
              Fechar
            </Button>
            <Button
              onClick={() => selected && handleAssign(selected)}
              disabled={!selected || selected === currentDriverId || saving !== null}
            >
              {saving && saving !== "__unassign" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {isChange ? "Trocar motoboy" : "Despachar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
