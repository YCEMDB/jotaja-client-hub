import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  archiveCategory, restoreCategory, archiveProduct, restoreProduct,
} from "@/lib/menu";
import { translateMenuError } from "@/lib/menu-errors";
import { validateMenuReason } from "@/hooks/useMenuCapabilities";
import { ReasonField } from "@/components/stock/ReasonField";

type Kind = "category" | "product";
type Mode = "archive" | "restore";

export function ArchiveConfirmDialog({
  open, onOpenChange, kind, mode, id, name, onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kind: Kind;
  mode: Mode;
  id: string | null;
  name: string;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setReason(""); }, [open]);

  const label = kind === "category"
    ? (mode === "archive" ? "Arquivar categoria" : "Restaurar categoria")
    : (mode === "archive" ? "Arquivar produto" : "Restaurar produto");

  const description = kind === "category"
    ? (mode === "archive"
        ? "A categoria some do cardápio público e dos seletores. Restauração é possível."
        : "A categoria volta a ficar disponível.")
    : (mode === "archive"
        ? "O produto some do cardápio público. Restauração é possível."
        : "O produto volta ao cardápio, mas indisponível. Ative depois manualmente.");

  const submit = async () => {
    if (!id) return;
    const err = validateMenuReason(reason);
    if (err) return toast.error(err);
    setSaving(true);
    try {
      if (kind === "category") {
        if (mode === "archive") await archiveCategory(id, reason);
        else await restoreCategory(id, reason);
      } else {
        if (mode === "archive") await archiveProduct(id, reason);
        else await restoreProduct(id, reason);
      }
      toast.success(mode === "archive" ? "Arquivado" : "Restaurado");
      onOpenChange(false);
      onDone();
    } catch (e) {
      toast.error(translateMenuError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}{name ? ` — ${name}` : ""}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <ReasonField value={reason} onChange={setReason} required />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={submit}
            disabled={saving}
            variant={mode === "archive" ? "destructive" : "default"}
          >
            {saving ? "Enviando…" : (mode === "archive" ? "Arquivar" : "Restaurar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
