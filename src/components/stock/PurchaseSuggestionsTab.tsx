import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, SectionContent, EmptyState, LoadingState, FilterBar } from "@/components/ds";
import { downloadCSV } from "@/lib/export-csv";
import { formatBRL, getPurchaseSuggestions, type PurchaseSuggestionGroup } from "@/lib/stock";
import { toast } from "sonner";
import { Download, ShoppingCart, RefreshCw, Phone, Mail, Lock, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function PurchaseSuggestionsTab({ restaurantId, enabled }: { restaurantId: string; enabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<PurchaseSuggestionGroup[]>([]);

  const load = useCallback(async () => {
    if (!restaurantId || !enabled) return;
    setLoading(true);
    try { setGroups(await getPurchaseSuggestions(restaurantId)); }
    catch (e: any) { toast.error(e?.message ?? "Erro"); }
    finally { setLoading(false); }
  }, [restaurantId, enabled]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = (g: PurchaseSuggestionGroup) => {
    const rows: (string | number)[][] = [
      ["Fornecedor", g.supplier_name],
      ["Ingrediente","Unidade","Atual","Mínimo","Sugerido","Custo un.","Custo total"],
      ...g.items.map(i => [i.name, i.unit ?? "", i.current_qty, i.min_qty, i.suggested_qty, Number(i.avg_cost).toFixed(2), Number(i.line_cost).toFixed(2)]),
      ["","","","","","Total", Number(g.estimated_cost).toFixed(2)],
    ];
    downloadCSV(`compras-${g.supplier_name.replace(/\s+/g,"-").toLowerCase()}.csv`, rows);
  };

  if (!enabled) {
    return (
      <Section>
        <div className="grid place-items-center text-center py-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-sunset text-background mb-4 border-2 border-ink shadow-brutal">
            <Lock className="h-6 w-6" />
          </div>
          <p className="text-xs uppercase tracking-wider text-ink/60 font-bold">Plano Business</p>
          <h3 className="font-display text-2xl md:text-3xl text-ink mt-1 mb-2">Sugestão de Compra</h3>
          <p className="text-sm text-ink/60 max-w-md mb-4">
            Gere ordens de compra por fornecedor para reabastecer ingredientes abaixo do mínimo, com quantidade e custo estimados.
          </p>
          <Button asChild variant="gradient">
            <Link to="/admin/configuracoes"><Sparkles className="h-4 w-4 mr-2" /> Ver planos</Link>
          </Button>
        </div>
      </Section>
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar actions={<Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>}>
        <p className="text-sm text-ink/60">Ingredientes abaixo do mínimo agrupados por fornecedor. Sugestão = déficit + 20%.</p>
      </FilterBar>

      {loading ? <LoadingState /> : groups.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Nada para comprar" description="Nenhum ingrediente ativo abaixo do mínimo. 🎉" />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Section key={g.supplier_key}>
              <SectionHeader
                title={g.supplier_name}
                description={[g.phone, g.email].filter(Boolean).join(" · ") || undefined}
                actions={
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl text-ink">{formatBRL(g.estimated_cost)}</span>
                    <Button size="sm" variant="outline" onClick={() => exportCSV(g)}><Download className="h-4 w-4 mr-2" />CSV</Button>
                  </div>
                }
              />
                actions={
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl text-ink">{formatBRL(g.estimated_cost)}</span>
                    <Button size="sm" variant="outline" onClick={() => exportCSV(g)}><Download className="h-4 w-4 mr-2" />CSV</Button>
                  </div>
                }
              />
              <SectionContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-[11px] uppercase tracking-wider text-ink/60">
                      <tr>
                        <th className="py-2">Ingrediente</th>
                        <th className="py-2 text-right">Atual</th>
                        <th className="py-2 text-right">Mínimo</th>
                        <th className="py-2 text-right">Sugerido</th>
                        <th className="py-2 text-right">Custo un.</th>
                        <th className="py-2 text-right">Custo total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((i) => (
                        <tr key={i.ingredient_id} className="border-t border-ink/10">
                          <td className="py-2 font-bold">{i.name} <span className="text-ink/40 text-xs">{i.unit ?? ""}</span></td>
                          <td className="py-2 text-right">{Number(i.current_qty).toLocaleString("pt-BR")}</td>
                          <td className="py-2 text-right text-ink/60">{Number(i.min_qty).toLocaleString("pt-BR")}</td>
                          <td className="py-2 text-right font-bold text-brand-orange">{Number(i.suggested_qty).toLocaleString("pt-BR")}</td>
                          <td className="py-2 text-right">{formatBRL(i.avg_cost)}</td>
                          <td className="py-2 text-right font-bold">{formatBRL(i.line_cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionContent>
            </Section>
          ))}
        </div>
      )}
    </div>
  );
}
