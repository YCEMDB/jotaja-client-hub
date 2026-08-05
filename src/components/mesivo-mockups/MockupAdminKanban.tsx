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

const TYPE_LABEL: Record<string, string> = {
  delivery: "Entrega",
  pickup: "Retirada",
  dine_in: "Mesa",
};

/** 
 * MockupAdminKanban — RÉPLICA EXATA do Kanban real (src/routes/_authenticated/admin.pedidos.tsx).
 */
export function MockupAdminKanban({ className }: { className?: string }) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#f8f9fa] font-sans ${className}`}
      role="img"
      aria-label="Mockup do painel de pedidos Mesivo (Réplica Real)"
    >
      {COLS.map((col) => {
        const colOrders = DEMO_ORDERS.filter((o) => o.status === col.key);
        return (
          <div key={col.key} className={`flex flex-col bg-white border-2 border-black rounded-2xl overflow-hidden ${col.ring} min-w-[240px]`}>
            {/* Header da Coluna */}
            <div className={`${col.color} text-white px-3 py-2.5 flex items-center justify-between border-b-2 border-black`}>
              <span className="font-black text-[11px] uppercase tracking-wider">{col.label}</span>
              <span className="font-black text-xs bg-black text-white px-2 py-0.5 rounded-md min-w-[24px] text-center">
                {colOrders.length}
              </span>
            </div>

            {/* Lista de Cards */}
            <div className="flex-1 p-2.5 space-y-2.5 bg-[#f0f0f0]/30 min-h-[300px]">
              {colOrders.map((o) => (
                <div
                  key={o.id}
                  className="bg-white border-2 border-black rounded-xl p-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[5px_5px_0_0_rgba(255,107,53,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-default"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-black text-base text-black leading-none">{o.code}</span>
                    <span className="text-[9px] text-black/50 font-bold flex items-center gap-1 uppercase tracking-wide">
                      <Clock className="h-2.5 w-2.5" /> 5min
                    </span>
                  </div>
                  
                  <p className="text-xs font-black text-black truncate">{o.customer}</p>
                  <p className="text-[9px] text-black/60 truncate uppercase tracking-wide font-black mt-0.5">
                    {o.customer.includes("Mesa") ? "Mesa" : "Entrega"} · PIX
                  </p>

                  {/* Detalhes do Pedido */}
                  <div className="mt-2 py-1.5 px-2 bg-black/5 rounded-md border border-dashed border-black/10">
                    <p className="text-[10px] text-black/70 leading-tight italic line-clamp-2">{o.items}</p>
                  </div>

                  {/* Footer do Card */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t-2 border-dashed border-black/10">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-[#e84393] leading-none">{o.total}</span>
                      <span className="text-[8px] px-1 py-0.5 rounded font-black border border-black/80 bg-[#00c853] text-black">
                        PAGO
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <div className="h-6 w-6 grid place-items-center rounded-md border border-black/10 text-black/40">
                        <Printer className="h-3 w-3" />
                      </div>
                      <div className="h-6 px-1.5 flex items-center rounded-md bg-[#ff6b35] text-white font-black text-[9px] uppercase tracking-wide gap-1">
                        OK <ChevronRight className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {colOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-black/20">
                  <Package className="h-6 w-6 mb-2" />
                  <p className="text-[9px] uppercase tracking-widest font-black">vazio</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}