import type { TableMapRow, TableUiStatus } from "@/lib/tables";
import { cn } from "@/lib/utils";
import { Users, Clock, DollarSign, QrCode, Ban, Lock } from "lucide-react";

const STATUS: Record<TableUiStatus, { label: string; bg: string; text: string; ring: string }> = {
  free:     { label: "Livre",    bg: "bg-background",         text: "text-ink",             ring: "border-ink/15" },
  open:     { label: "Ocupada",  bg: "bg-brand-orange/15",    text: "text-brand-orange",    ring: "border-brand-orange" },
  closing:  { label: "Fechando", bg: "bg-brand-amber/20",     text: "text-ink",             ring: "border-brand-amber" },
  blocked:  { label: "Bloqueada",bg: "bg-brand-magenta/15",   text: "text-brand-magenta",   ring: "border-brand-magenta" },
  inactive: { label: "Inativa",  bg: "bg-ink/5",              text: "text-ink/50",          ring: "border-ink/10" },
};

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDuration(fromIso: string | null): string {
  if (!fromIso) return "";
  const mins = Math.max(0, Math.floor((Date.now() - new Date(fromIso).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}min`;
}

export function TableCard({
  table,
  onClick,
  onQr,
}: {
  table: TableMapRow;
  onClick?: (t: TableMapRow) => void;
  onQr?: (t: TableMapRow) => void;
}) {
  const s = STATUS[table.ui_status];
  const isBusy = table.ui_status === "open" || table.ui_status === "closing";
  return (
    <button
      type="button"
      onClick={() => onClick?.(table)}
      className={cn(
        "group text-left relative rounded-xl border-2 p-4 transition-all",
        "shadow-[3px_3px_0_0_hsl(var(--foreground)/0.08)] hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5",
        s.bg,
        s.ring,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-ink/50">
            Mesa
          </div>
          <div className={cn("font-display text-3xl leading-none mt-1", s.text)}>
            {table.number}
          </div>
          {table.name && (
            <div className="text-xs text-ink/60 mt-1 truncate max-w-[10rem]">{table.name}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border-2", s.ring, s.text)}>
            {s.label}
          </span>
          {table.ui_status === "inactive" && <Lock className="h-3.5 w-3.5 text-ink/40" />}
          {table.ui_status === "blocked" && <Ban className="h-3.5 w-3.5 text-brand-magenta" />}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/70">
        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{table.capacity} lug.</span>
        {table.area && <span className="text-ink/40">·</span>}
        {table.area && <span className="truncate max-w-[6rem]">{table.area}</span>}
      </div>

      {isBusy && (
        <div className="mt-3 pt-3 border-t border-ink/10 grid grid-cols-2 gap-2 text-xs">
          <div className="inline-flex items-center gap-1 text-ink/70">
            <Clock className="h-3.5 w-3.5" /> {fmtDuration(table.opened_at)}
          </div>
          <div className="inline-flex items-center gap-1 justify-end font-bold text-ink">
            <DollarSign className="h-3.5 w-3.5" /> {fmtBRL(Number(table.current_total ?? 0))}
          </div>
          {table.customer_name && (
            <div className="col-span-2 text-ink/60 truncate">{table.customer_name}</div>
          )}
        </div>
      )}

      {onQr && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onQr(table); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onQr(table); } }}
          className="absolute top-2 right-2 h-7 w-7 grid place-items-center rounded-md border-2 border-ink/10 bg-background/80 opacity-0 group-hover:opacity-100 hover:bg-ink hover:text-background transition-all cursor-pointer"
          title="Ver QR Code"
          aria-label="Ver QR Code"
        >
          <QrCode className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  );
}
