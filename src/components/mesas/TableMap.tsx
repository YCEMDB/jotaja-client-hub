import { useMemo, useState } from "react";
import type { TableMapRow, TableUiStatus } from "@/lib/tables";
import { TableCard } from "./TableCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS: { key: "all" | TableUiStatus; label: string; className: string }[] = [
  { key: "all",      label: "Todas",     className: "border-ink/20 text-ink" },
  { key: "free",     label: "Livres",    className: "border-ink/20 text-ink" },
  { key: "open",     label: "Ocupadas",  className: "border-brand-orange text-brand-orange" },
  { key: "closing",  label: "Fechando",  className: "border-brand-amber text-ink" },
  { key: "blocked",  label: "Bloqueadas",className: "border-brand-magenta text-brand-magenta" },
  { key: "inactive", label: "Inativas",  className: "border-ink/10 text-ink/50" },
];

export function TableMap({
  tables,
  onSelect,
  onQr,
}: {
  tables: TableMapRow[];
  onSelect: (t: TableMapRow) => void;
  onQr?: (t: TableMapRow) => void;
}) {
  const [filter, setFilter] = useState<"all" | TableUiStatus>("all");
  const [q, setQ] = useState("");
  const [area, setArea] = useState<string>("all");

  const areas = useMemo(() => {
    const set = new Set<string>();
    tables.forEach((t) => t.area && set.add(t.area));
    return Array.from(set).sort();
  }, [tables]);

  const filtered = useMemo(() => {
    return tables.filter((t) => {
      if (filter !== "all" && t.ui_status !== filter) return false;
      if (area !== "all" && t.area !== area) return false;
      if (q.trim()) {
        const s = q.trim().toLowerCase();
        const hay = `${t.number} ${t.name ?? ""} ${t.customer_name ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [tables, filter, area, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tables.length };
    tables.forEach((t) => { c[t.ui_status] = (c[t.ui_status] ?? 0) + 1; });
    return c;
  }, [tables]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por número, apelido ou cliente..."
            className="pl-9"
          />
        </div>
        {areas.length > 0 && (
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="h-10 rounded-md border-2 border-ink/15 bg-background px-3 text-sm font-medium"
          >
            <option value="all">Todas as áreas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all",
                f.className,
                active ? "bg-ink text-background border-ink shadow-brutal -translate-y-0.5" : "hover:bg-ink/5",
              )}
            >
              {f.label}
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded", active ? "bg-background/20" : "bg-ink/5")}>
                {counts[f.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-ink/15 rounded-xl p-10 text-center text-ink/50 text-sm">
          Nenhuma mesa corresponde ao filtro.
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((t) => (
            <TableCard key={t.id} table={t} onClick={onSelect} onQr={onQr} />
          ))}
        </div>
      )}
    </div>
  );
}
