import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  restaurant: { id: string; name: string; trial_ends_at: string | null; plan: string };
  onDone?: () => void;
};

export function ExtendTrialDialog({ open, onOpenChange, restaurant, onDone }: Props) {
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const currentEnd = restaurant.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
  const remainingDays = currentEnd
    ? Math.ceil((currentEnd.getTime() - Date.now()) / 86400000)
    : null;

  const preview = useMemo(() => {
    const base = currentEnd && currentEnd.getTime() > Date.now() ? currentEnd : new Date();
    return new Date(base.getTime() + days * 86400000);
  }, [currentEnd, days]);

  const canSubmit = days > 0 && days <= 90 && reason.trim().length >= 3 && !busy;

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("extend_trial" as never, {
      p_restaurant_id: restaurant.id,
      p_days: days,
      p_reason: reason.trim(),
    } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Trial estendido em ${days} dia(s)`);
    onOpenChange(false);
    onDone?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Estender trial — {restaurant.name}</DialogTitle>
          <DialogDescription>
            A extensão adiciona dias ao trial atual. Nunca reduz o prazo. Ação auditada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Fim atual</Label>
              <p className="font-mono">{currentEnd ? currentEnd.toLocaleDateString("pt-BR") : "—"}</p>
            </div>
            <div>
              <Label className="text-xs">Dias restantes</Label>
              <p className="font-mono">{remainingDays ?? "—"}</p>
            </div>
          </div>
          <div>
            <Label className="text-xs">Adicionar dias (máx. 90)</Label>
            <Input type="number" min={1} max={90} value={days} onChange={(e) => setDays(Math.max(1, Math.min(90, Number(e.target.value) || 1)))} />
          </div>
          <div className="rounded-md border-2 border-dashed border-brand-violet/40 p-2 bg-brand-violet/5">
            <span className="text-xs uppercase font-bold text-brand-violet">Novo fim</span>
            <p className="font-mono">{preview.toLocaleDateString("pt-BR")}</p>
          </div>
          <div>
            <Label className="text-xs">Motivo (obrigatório)</Label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: cliente solicitou mais tempo para avaliar." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSubmit}>{busy ? "Aplicando…" : "Estender trial"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
