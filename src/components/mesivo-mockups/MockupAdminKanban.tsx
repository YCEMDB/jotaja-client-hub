import { DEMO_ORDERS } from "./demo-data";
import { Clock, Printer, ChevronRight, Truck, User, Package } from "lucide-react";

const COLS = [
  {
    key: "novo",
    label: "Novos",
    color: "bg-[#ffb000]",
    ring: "shadow-[4px_4px_0_0_oklch(0.78_0.17_65)]",
  },
  {
    key: "produzindo",
    label: "Em preparo",
    color: "bg-[#ff6b35]",
    ring: "shadow-[4px_4px_0_0_oklch(0.69_0.22_38)]",
  },
  {
    key: "pronto",
    label: "Prontos · Entrega",
    color: "bg-[#e84393]",
    ring: "shadow-[4px_4px_0_0_oklch(0.62_0.24_0)]",
  },
  {
    key: "entregue",
    label: "Concluídos",
    color: "bg-[#00c853]",
    ring: "shadow-[4px_4px_0_0_oklch(0.7_0.16_150)]",
  },
];

/** 
 * MockupAdminKanban — RÉPLICA EXATA do Kanban real.
 */
export function MockupAdminKanban({ className }: { className?: string }) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-[#f1f3f5] font-sans ${className}`}
      role="img"
      aria-label="Mockup do painel de pedidos Mesivo (Réplica Real)"
    >
      {COLS.map((col) => {
        const colOrders = DEMO_ORDERS.filter((o) => o.status === col.key);
        return (
          <div key={col.key} className={`flex flex-col bg-white border-[1.5px] border-black/80 rounded-xl overflow-hidden shadow-[3px_3px_0_0_rgba(0,0,0,0.1)] min-w-[200px]`}>
            {/* Header da Coluna */}
            <div className={`${col.color} text-white px-2.5 py-2 flex items-center justify-between border-b-[1.5px] border-black/80`}>
              <span className="font-black text-[10px] uppercase tracking-wider">{col.label}</span>
              <span className="font-black text-[10px] bg-black text-white px-1.5 py-0.5 rounded min-w-[20px] text-center">
                {colOrders.length}
              </span>
            </div>

            {/* Lista de Cards */}
            <div className="flex-1 p-2 space-y-2 bg-[#f8f9fa] min-h-[260px]">
              {colOrders.map((o) => (
                <div
                  key={o.id}
                  className="bg-white border-[1.5px] border-black/80 rounded-lg p-2.5 shadow-[2px_2px_0_0_rgba(0,0,0,0.05)] hover:shadow-[4px_4px_0_0_rgba(255,107,53,0.3)] transition-all cursor-default"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-[13px] text-black leading-none">{o.code}</span>
                    <span className="text-[8px] text-black/40 font-bold flex items-center gap-1 uppercase tracking-wide">
                      <Clock className="h-2 w-2" /> 5min
                    </span>
                  </div>
                  
                  <p className="text-[11px] font-black text-black truncate">{o.customer}</p>
                  
                  <div className="mt-1.5 py-1 px-1.5 bg-black/[0.03] rounded border border-dashed border-black/10">
                    <p className="text-[9px] text-black/60 leading-tight italic line-clamp-1">{o.items}</p>
                  </div>

                  {/* Footer do Card */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-dashed border-black/10">
                    <span className="font-black text-[11px] text-[#e84393]">{o.total}</span>
                    <div className="flex items-center gap-1">
                      <div className="h-5 w-5 grid place-items-center rounded border border-black/10 text-black/30">
                        <Printer className="h-2.5 w-2.5" />
                      </div>
                      <div className="h-5 px-1 flex items-center rounded bg-[#ff6b35] text-white font-black text-[8px] uppercase tracking-wide gap-0.5">
                        OK <ChevronRight className="h-2 w-2" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {colOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-black/10">
                  <Package className="h-5 w-5 mb-1.5" />
                  <p className="text-[8px] uppercase tracking-widest font-black">vazio</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}