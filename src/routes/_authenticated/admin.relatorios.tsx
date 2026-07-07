import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, Printer, FileText, BarChart3 } from "lucide-react";
import { downloadCSV, printReportHTML } from "@/lib/export-csv";
import { FeatureGate } from "@/components/FeatureGate";
import { AdminPageLayout, StatCard, DashboardGrid, Section, FilterBar, EmptyState, LoadingState } from "@/components/ds";
import { orderStatusLabel, orderTypeLabel, paymentLabel } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/admin/relatorios")({
  component: RelatoriosPageGated,
  head: () => ({ meta: [{ title: "Relatórios — Comandex" }] }),
});

function RelatoriosPageGated() {
  return (
    <FeatureGate feature="advanced_reports">
      <RelatoriosPage />
    </FeatureGate>
  );
}

type OrderRow = {
  id: string;
  order_number: number;
  status: string;
  type: string;
  payment: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  created_at: string;
};

function fmtMoney(v: number) { return `R$ ${Number(v).toFixed(2).replace(".", ",")}`; }
function todayISO(offsetDays = 0) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function RelatoriosPage() {
  const { restaurantId } = useAuth();
  const [from, setFrom] = useState(todayISO(-30));
  const [to, setTo] = useState(todayISO(0));
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!restaurantId) return;
    setLoading(true);
    const start = new Date(from + "T00:00:00").toISOString();
    const end = new Date(to + "T23:59:59").toISOString();
    const { data } = await supabase
      .from("orders")
      .select("id,order_number,status,type,payment,customer_name,customer_phone,subtotal,discount,delivery_fee,total,created_at")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as OrderRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [restaurantId]);

  const stats = useMemo(() => {
    const valid = orders.filter((o) => o.status !== "cancelled");
    const total = valid.reduce((s, o) => s + Number(o.total), 0);
    const tickets = valid.length;
    const ticketAvg = tickets ? total / tickets : 0;
    const cancelled = orders.length - valid.length;
    return { total, tickets, ticketAvg, cancelled };
  }, [orders]);

  const exportCSV = () => {
    const header = ["Pedido", "Data", "Cliente", "Telefone", "Tipo", "Pagamento", "Status", "Subtotal", "Entrega", "Desconto", "Total"];
    const rows = orders.map((o) => [
      o.order_number,
      new Date(o.created_at).toLocaleString("pt-BR"),
      o.customer_name,
      o.customer_phone,
      orderTypeLabel(o.type),
      paymentLabel(o.payment),
      orderStatusLabel(o.status),
      Number(o.subtotal).toFixed(2),
      Number(o.delivery_fee).toFixed(2),
      Number(o.discount).toFixed(2),
      Number(o.total).toFixed(2),
    ]);
    downloadCSV(`pedidos_${from}_a_${to}.csv`, [header, ...rows]);
  };

  const exportPDF = () => {
    const tableRows = orders.map((o) => `
      <tr>
        <td>#${o.order_number}</td>
        <td>${new Date(o.created_at).toLocaleString("pt-BR")}</td>
        <td>${o.customer_name}</td>
        <td>${orderStatusLabel(o.status)}</td>
        <td>${orderTypeLabel(o.type)}</td>
        <td>${paymentLabel(o.payment)}</td>
        <td class="right">${fmtMoney(o.total)}</td>
      </tr>`).join("");
    const html = `
      <p><strong>Período:</strong> ${from} a ${to}</p>
      <p><strong>Total de pedidos:</strong> ${orders.length} | <strong>Faturamento:</strong> ${fmtMoney(stats.total)} | <strong>Ticket médio:</strong> ${fmtMoney(stats.ticketAvg)}</p>
      <table>
        <thead><tr><th>Pedido</th><th>Data</th><th>Cliente</th><th>Status</th><th>Tipo</th><th>Pagamento</th><th class="right">Total</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>`;
    printReportHTML(`Relatório de Pedidos — ${from} a ${to}`, html);
  };

  if (!restaurantId) {
    return (
      <AdminPageLayout kicker="Análise" title="Relatórios" accent="violet" icon={BarChart3}>
        <EmptyState icon={BarChart3} title="Configure seu restaurante primeiro" />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      kicker="Análise"
      title="Relatórios"
      subtitle="Exporte e analise seus pedidos por período"
      accent="violet"
      icon={BarChart3}
      actions={
        <>
          <Button variant="outline" onClick={exportCSV} disabled={!orders.length}>
            <Download className="h-4 w-4 mr-2" />CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} disabled={!orders.length}>
            <Printer className="h-4 w-4 mr-2" />PDF
          </Button>
        </>
      }
    >
      <FilterBar
        actions={
          <Button onClick={load} disabled={loading}>
            <FileText className="h-4 w-4 mr-2" />{loading ? "Carregando..." : "Atualizar"}
          </Button>
        }
      >
        <div>
          <Label className="text-xs">De</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Até</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </FilterBar>

      <DashboardGrid cols={4}>
        <StatCard label="Faturamento" value={fmtMoney(stats.total)} accent="green" />
        <StatCard label="Pedidos válidos" value={stats.tickets} accent="orange" />
        <StatCard label="Ticket médio" value={fmtMoney(stats.ticketAvg)} accent="violet" />
        <StatCard label="Cancelados" value={stats.cancelled} accent="magenta" />
      </DashboardGrid>

      {loading ? (
        <LoadingState />
      ) : orders.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum pedido no período" description="Ajuste as datas e clique em Atualizar." />
      ) : (
        <Section className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="p-3">#</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Pgto</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-ink/10 hover:bg-muted/50">
                    <td className="p-3 font-medium">#{o.order_number}</td>
                    <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</td>
                    <td className="p-3">{o.customer_name}</td>
                    <td className="p-3">{orderStatusLabel(o.status)}</td>
                    <td className="p-3">{orderTypeLabel(o.type)}</td>
                    <td className="p-3">{paymentLabel(o.payment)}</td>
                    <td className="p-3 text-right font-medium">{fmtMoney(Number(o.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </AdminPageLayout>
  );
}
