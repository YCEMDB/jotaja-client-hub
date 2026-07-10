import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  restaurant: { id: string; name: string };
};

export function StartSupportSessionDialog({ open, onOpenChange, restaurant }: Props) {
  const { selectRestaurant } = useAuth();
  const [reason, setReason] = useState("");
  const [level, setLevel] = useState<"view_only" | "operational" | "administrative">("view_only");
  const [minutes, setMinutes] = useState(60);
  const [busy, setBusy] = useState(false);

  const canSubmit = reason.trim().length >= 5 && minutes >= 5 && minutes <= 240 && !busy;

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("start_support_session" as never, {
      p_restaurant_id: restaurant.id,
      p_reason: reason.trim(),
      p_access_level: level,
      p_minutes: minutes,
    } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Sessão de suporte iniciada — todas as ações serão registradas");
    selectRestaurant(restaurant.id);
    onOpenChange(false);
    setTimeout(() => { window.location.href = "/admin"; }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar acesso assistido — {restaurant.name}</DialogTitle>
          <DialogDescription>
            Você entrará no contexto do restaurante em modo de suporte. Um banner permanente será exibido e todas as ações serão auditadas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <Label className="text-xs">Nível de permissão</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="view_only">Somente visualização (padrão)</SelectItem>
                <SelectItem value="operational">Operacional (pedidos e caixa)</SelectItem>
                <SelectItem value="administrative">Administrativa (todas as configurações)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Duração (5–240 min)</Label>
            <Input type="number" min={5} max={240} value={minutes} onChange={(e) => setMinutes(Math.max(5, Math.min(240, Number(e.target.value) || 60)))} />
          </div>
          <div>
            <Label className="text-xs">Motivo (obrigatório)</Label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: cliente relata erro ao imprimir pedido #123." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSubmit}>{busy ? "Iniciando…" : "Iniciar acesso"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
