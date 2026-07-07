import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Save, RotateCw, Square, Circle, Trash2, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateTableLayout, type TableMapRow, type TableShape, type TableLayoutPatch } from "@/lib/tables";

type NodeState = {
  id: string;
  x: number; y: number;
  w: number; h: number;
  rot: number;
  shape: TableShape;
  area: string | null;
  number: number;
  name: string | null;
  ui_status: TableMapRow["ui_status"];
};

const GRID = 10;
const CANVAS_W = 1600;
const CANVAS_H = 1000;

function snap(v: number) { return Math.round(v / GRID) * GRID; }

function statusColor(s: NodeState["ui_status"]) {
  switch (s) {
    case "open":     return "bg-brand-orange text-white border-brand-orange";
    case "closing":  return "bg-brand-amber text-ink border-brand-amber";
    case "blocked":  return "bg-brand-magenta text-white border-brand-magenta";
    case "inactive": return "bg-ink/10 text-ink/50 border-ink/20";
    default:         return "bg-background text-ink border-ink";
  }
}

export function TableLayoutEditor({
  restaurantId,
  tables,
  onSaved,
}: {
  restaurantId: string;
  tables: TableMapRow[];
  onSaved: () => void;
}) {
  const [nodes, setNodes] = useState<NodeState[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(0.7);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: string; mode: "move" | "resize"; ox: number; oy: number; sx: number; sy: number; sw: number; sh: number } | null>(null);

  useEffect(() => {
    // Auto-layout inicial: se posições nulas, distribui em grade.
    const per = 8;
    const step = 130;
    setNodes(tables.map((t, i) => ({
      id: t.id,
      x: t.position_x ?? (60 + (i % per) * step),
      y: t.position_y ?? (60 + Math.floor(i / per) * step),
      w: t.width ?? 96,
      h: t.height ?? 96,
      rot: t.rotation ?? 0,
      shape: t.shape ?? "rect",
      area: t.area,
      number: t.number,
      name: t.name,
      ui_status: t.ui_status,
    })));
    setDirty(false);
  }, [tables]);

  const selected = useMemo(() => nodes.find((n) => n.id === selectedId) ?? null, [nodes, selectedId]);

  function updateNode(id: string, patch: Partial<NodeState>) {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    setDirty(true);
  }

  function onPointerDown(e: React.PointerEvent, id: string, mode: "move" | "resize") {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const n = nodes.find((x) => x.id === id);
    if (!n) return;
    setSelectedId(id);
    dragRef.current = { id, mode, ox: e.clientX, oy: e.clientY, sx: n.x, sy: n.y, sw: n.w, sh: n.h };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.ox) / zoom;
    const dy = (e.clientY - d.oy) / zoom;
    if (d.mode === "move") {
      updateNode(d.id, {
        x: Math.max(0, Math.min(CANVAS_W - 40, snap(d.sx + dx))),
        y: Math.max(0, Math.min(CANVAS_H - 40, snap(d.sy + dy))),
      });
    } else {
      updateNode(d.id, {
        w: Math.max(40, Math.min(400, snap(d.sw + dx))),
        h: Math.max(40, Math.min(400, snap(d.sh + dy))),
      });
    }
  }
  function onPointerUp() { dragRef.current = null; }

  async function handleSave() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const updates: TableLayoutPatch[] = nodes.map((n) => ({
        id: n.id,
        position_x: n.x, position_y: n.y,
        width: n.w, height: n.h,
        rotation: n.rot, shape: n.shape,
        area: n.area,
      }));
      const count = await updateTableLayout(restaurantId, updates);
      toast.success(`Layout salvo (${count} mesas).`);
      setDirty(false);
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar layout.");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setNodes(tables.map((t, i) => ({
      id: t.id, x: t.position_x ?? (60 + (i % 8) * 130), y: t.position_y ?? (60 + Math.floor(i / 8) * 130),
      w: t.width ?? 96, h: t.height ?? 96, rot: t.rotation ?? 0, shape: t.shape ?? "rect",
      area: t.area, number: t.number, name: t.name, ui_status: t.ui_status,
    })));
    setDirty(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {/* Canvas */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? "Salvando..." : "Salvar layout"}
          </Button>
          <Button size="sm" variant="outline" onClick={reset} disabled={!dirty}>
            <Undo2 className="h-4 w-4 mr-1" /> Descartar
          </Button>
          <div className="flex items-center gap-1 ml-auto">
            <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-mono tabular-nums w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative overflow-auto border-2 border-ink/15 rounded-xl bg-ink/[0.02]" style={{ height: 620 }}>
          <div
            ref={canvasRef}
            onClick={() => setSelectedId(null)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className="relative"
            style={{
              width: CANVAS_W * zoom,
              height: CANVAS_H * zoom,
              backgroundImage: `linear-gradient(to right, hsl(var(--ink) / 0.06) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--ink) / 0.06) 1px, transparent 1px)`,
              backgroundSize: `${GRID * zoom}px ${GRID * zoom}px`,
            }}
          >
            {nodes.map((n) => {
              const isSel = n.id === selectedId;
              return (
                <div
                  key={n.id}
                  onPointerDown={(e) => onPointerDown(e, n.id, "move")}
                  className={cn(
                    "absolute select-none border-2 shadow-brutal flex flex-col items-center justify-center text-center transition-shadow",
                    statusColor(n.ui_status),
                    n.shape === "circle" ? "rounded-full" : "rounded-lg",
                    isSel && "ring-4 ring-brand-violet/60 z-10 cursor-grabbing",
                    !isSel && "cursor-grab",
                  )}
                  style={{
                    left: n.x * zoom,
                    top: n.y * zoom,
                    width: n.w * zoom,
                    height: n.h * zoom,
                    transform: `rotate(${n.rot}deg)`,
                  }}
                >
                  <div className="font-display text-lg leading-none" style={{ fontSize: Math.max(12, 20 * zoom) }}>
                    {n.number}
                  </div>
                  {n.name && (
                    <div className="text-[10px] opacity-80 truncate max-w-full px-1" style={{ fontSize: Math.max(8, 10 * zoom) }}>
                      {n.name}
                    </div>
                  )}
                  {isSel && (
                    <div
                      onPointerDown={(e) => onPointerDown(e, n.id, "resize")}
                      className="absolute -right-1.5 -bottom-1.5 h-4 w-4 bg-brand-violet border-2 border-background rounded-sm cursor-nwse-resize"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-ink/50">
          Clique para selecionar. Arraste para mover. Alça inferior direita redimensiona. Grade {GRID}px.
        </p>
      </div>

      {/* Inspector */}
      <div className="rounded-xl border-2 border-ink/15 p-4 space-y-4 bg-background">
        <div className="text-xs uppercase font-bold tracking-wider text-ink/50">Inspetor</div>
        {!selected ? (
          <div className="text-sm text-ink/50">Selecione uma mesa no canvas para editar.</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-display text-2xl">Mesa {selected.number}</div>
              <span className="text-[10px] uppercase font-bold text-ink/40">{selected.ui_status}</span>
            </div>
            {selected.name && <div className="text-sm text-ink/60">{selected.name}</div>}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input type="number" value={selected.x} onChange={(e) => updateNode(selected.id, { x: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input type="number" value={selected.y} onChange={(e) => updateNode(selected.id, { y: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Largura</Label>
                <Input type="number" min={40} max={400} value={selected.w} onChange={(e) => updateNode(selected.id, { w: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Altura</Label>
                <Input type="number" min={40} max={400} value={selected.h} onChange={(e) => updateNode(selected.id, { h: Number(e.target.value) })} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Rotação ({selected.rot}°)</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range" min={-180} max={180} step={5}
                  value={selected.rot}
                  onChange={(e) => updateNode(selected.id, { rot: Number(e.target.value) })}
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={() => updateNode(selected.id, { rot: (selected.rot + 45) % 360 })}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs">Forma</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Button
                  size="sm" variant={selected.shape === "rect" ? "default" : "outline"}
                  onClick={() => updateNode(selected.id, { shape: "rect" })}
                >
                  <Square className="h-4 w-4 mr-1" /> Retângulo
                </Button>
                <Button
                  size="sm" variant={selected.shape === "circle" ? "default" : "outline"}
                  onClick={() => updateNode(selected.id, { shape: "circle" })}
                >
                  <Circle className="h-4 w-4 mr-1" /> Círculo
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs">Área / setor</Label>
              <Input
                value={selected.area ?? ""}
                onChange={(e) => updateNode(selected.id, { area: e.target.value || null })}
                placeholder="Ex: Salão, Varanda, VIP"
              />
            </div>

            <Button
              size="sm" variant="outline" className="w-full"
              onClick={() => { updateNode(selected.id, { w: 96, h: 96, rot: 0, shape: "rect" }); }}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Resetar mesa
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
