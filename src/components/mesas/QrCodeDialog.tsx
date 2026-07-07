import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Copy, RefreshCw, Printer, Download } from "lucide-react";
import { toast } from "sonner";
import { regenTableQr, translateTableError, type TableMapRow } from "@/lib/tables";

function buildPublicUrl(token: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/mesa/${token}`;
}

export function QrCodeDialog({
  table,
  open,
  onOpenChange,
  onRegen,
}: {
  table: TableMapRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRegen: () => void;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const effectiveToken = token ?? table?.qr_token ?? "";
  const url = useMemo(() => (effectiveToken ? buildPublicUrl(effectiveToken) : ""), [effectiveToken]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado.");
  };

  const regen = async () => {
    if (!table) return;
    if (!confirm("Regenerar o QR invalidará o anterior. Continuar?")) return;
    setBusy(true);
    try {
      const t = await regenTableQr(table.id);
      setToken(t);
      toast.success("QR regenerado.");
      onRegen();
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro ao regenerar QR"));
    } finally {
      setBusy(false);
    }
  };

  const downloadSvg = () => {
    const svg = document.getElementById("mesa-qr-svg");
    if (!svg) return;
    const s = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([s], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mesa-${table?.number ?? "qr"}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const print = () => {
    const w = window.open("", "_blank", "width=420,height=560");
    if (!w) return;
    const svg = document.getElementById("mesa-qr-svg")?.outerHTML ?? "";
    w.document.write(`<!doctype html><html><head><title>Mesa ${table?.number}</title>
      <style>body{font-family:system-ui,sans-serif;text-align:center;padding:32px}h1{margin:0}small{color:#666}</style>
      </head><body>
      <h1>Mesa ${table?.number ?? ""}</h1>
      ${table?.name ? `<p>${table.name}</p>` : ""}
      <div>${svg}</div>
      <p><small>${url}</small></p>
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setToken(null); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code · Mesa {table?.number}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {effectiveToken ? (
            <div className="p-4 bg-background border-2 border-ink rounded-xl shadow-brutal">
              <QRCodeSVG id="mesa-qr-svg" value={url} size={220} level="M" includeMargin />
            </div>
          ) : (
            <div className="p-6 text-sm text-ink/50">Gerando QR...</div>
          )}
          <div className="w-full">
            <div className="text-[10px] uppercase tracking-wider font-bold text-ink/50">Link público</div>
            <div className="mt-1 flex items-center gap-2">
              <input readOnly value={url} className="flex-1 h-10 rounded-md border-2 border-ink/15 bg-background px-3 text-sm truncate" />
              <Button size="sm" variant="outline" onClick={copy}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        <DialogFooter className="!justify-between flex-wrap gap-2">
          <Button variant="ghost" onClick={regen} disabled={busy}>
            <RefreshCw className="h-4 w-4 mr-1" /> Regenerar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadSvg}><Download className="h-4 w-4 mr-1" />SVG</Button>
            <Button onClick={print}><Printer className="h-4 w-4 mr-1" />Imprimir</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
