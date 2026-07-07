import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DoorOpen, DoorClosed, Ban, Unlock, QrCode, Users, Clock, DollarSign, X, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { blockTable, unblockTable, cancelTableSession, translateTableError, type TableMapRow } from "@/lib/tables";

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Sheet compacto de ações para uma mesa selecionada.
 * Split / merge / transferência ficam para uma próxima sprint.
 */
export function TableActionsSheet({
  table,
  open,
  onOpenChange,
  onOpenSession,
  onCloseSession,
  onShowQr,
  onChanged,
}: {
  table: TableMapRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenSession: (t: TableMapRow) => void;
  onCloseSession: (t: TableMapRow) => void;
  onShowQr: (t: TableMapRow) => void;
  onChanged: () => void;
}) {
  if (!table) return null;
  const status = table.ui_status;

  const doBlock = async () => {
    const reason = window.prompt("Motivo (opcional):") ?? undefined;
    try {
      await blockTable(table.id, reason || undefined);
      toast.success("Mesa bloqueada.");
      onOpenChange(false);
      onChanged();
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro"));
    }
  };
  const doUnblock = async () => {
    try {
      await unblockTable(table.id);
      toast.success("Mesa desbloqueada.");
      onOpenChange(false);
      onChanged();
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro"));
    }
  };
  const doCancel = async () => {
    if (!table.session_id) return;
    if (!confirm("Cancelar a sessão desta mesa (sem cobrar)?")) return;
    try {
      await cancelTableSession(table.session_id);
      toast.success("Sessão cancelada.");
      onOpenChange(false);
      onChanged();
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-baseline gap-2">
            <span>Mesa {table.number}</span>
            {table.name && <span className="text-sm font-normal text-ink/60">· {table.name}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className={cn(
          "rounded-xl border-2 p-4 space-y-2",
          status === "open" && "border-brand-orange bg-brand-orange/10",
          status === "closing" && "border-brand-amber bg-brand-amber/10",
          status === "blocked" && "border-brand-magenta bg-brand-magenta/10",
          (status === "free" || status === "inactive") && "border-ink/15 bg-background",
        )}>
          <div className="flex items-center gap-3 text-sm">
            <Users className="h-4 w-4 text-ink/50" />
            <span>{table.capacity} lugares{table.area ? ` · ${table.area}` : ""}</span>
          </div>
          {(status === "open" || status === "closing") && (
            <>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-ink/50" />
                <span>Aberta {table.opened_at ? new Date(table.opened_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold">
                <DollarSign className="h-4 w-4 text-ink/50" />
                <span>{fmtBRL(Number(table.current_total ?? 0))} · {table.open_orders} pedido(s)</span>
              </div>
              {table.customer_name && (
                <div className="text-sm text-ink/70">Cliente: {table.customer_name}</div>
              )}
            </>
          )}
          {status === "blocked" && <div className="text-sm text-brand-magenta font-bold">Mesa bloqueada</div>}
          {status === "inactive" && <div className="text-sm text-ink/60">Mesa inativa (não aparece para atendimento).</div>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {status === "free" && (
            <Button className="col-span-2" onClick={() => onOpenSession(table)}>
              <DoorOpen className="h-4 w-4 mr-2" /> Abrir mesa
            </Button>
          )}
          {(status === "open" || status === "closing") && (
            <>
              <Button className="col-span-2" onClick={() => onCloseSession(table)}>
                <DoorClosed className="h-4 w-4 mr-2" /> Fechar mesa
              </Button>
              <Button variant="outline" onClick={doCancel}>
                <X className="h-4 w-4 mr-2" /> Cancelar sessão
              </Button>
            </>
          )}
          {status === "blocked" ? (
            <Button variant="outline" onClick={doUnblock}>
              <Unlock className="h-4 w-4 mr-2" /> Desbloquear
            </Button>
          ) : status !== "inactive" && (
            <Button variant="outline" onClick={doBlock}>
              <Ban className="h-4 w-4 mr-2" /> Bloquear
            </Button>
          )}
          <Button variant="outline" onClick={() => onShowQr(table)} className={status === "free" ? "col-span-2" : ""}>
            <QrCode className="h-4 w-4 mr-2" /> QR Code
          </Button>
        </div>

        <p className="text-xs text-ink/50">
          Comandas, divisão de conta, transferência e junção de mesas serão liberadas em uma próxima sprint.
        </p>
      </DialogContent>
    </Dialog>
  );
}
