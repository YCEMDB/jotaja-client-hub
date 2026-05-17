import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, Printer, FileText } from "lucide-react";
import { downloadCSV, printReportHTML } from "@/lib/export-csv";

export const Route = createFileRoute("/_authenticated/admin/relatorios")({
  component: RelatoriosPage,
  head: () => ({ meta: [{ title: "Relatórios — ComandaHub" }] }),
});

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

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", preparing: "Em preparo",
  ready: "Pronto", out_for_delivery: "Saiu p/ entrega",
  delivered: "Entregue", cancelled: "Cancelado",
};
const TYPE_LABEL: Record<string, string> = {
  delivery: "Entrega", pickup: "Retirada", dine_in: "No local",
};
const PAYMENT_LABEL: Record<string, string> = {
  cash: "Dinheiro", pix: "Pix", credit_card: "Crédito", debit_card: "Débito",
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
      TYPE_LABEL[o.type] ?? o.type,
      PAYMENT_LABEL[o.payment] ?? o.payment,
      STATUS_LABEL[o.status] ?? o.status,
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
        <td>${STATUS_LABEL[o.status] ?? o.status}</td>
        <td>${TYPE_LABEL[o.type] ?? o.type}</td>
        <td>${PAYMENT_LABEL[o.payment] ?? o.payment}</td>
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

  if (!restaurantId) return <div className="p-8">Configure seu restaurante primeiro.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl text-ink tracking-tight leading-[0.95]">Relatórios</h1>
          <p className="text-muted-foreground">Exporte e analise seus pedidos por período</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={!orders.length}>
            <Download className="h-4 w-4 mr-2" />CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} disabled={!orders.length}>
            <Printer className="h-4 w-4 mr-2" />PDF
          </Button>
        </div>
      </div>

      <Card className="p-4 flex flex-wrap items-end gap-4">
        <div>
          <Label className="text-xs">De</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Até</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button onClick={load} disabled={loading}>
          <FileText className="h-4 w-4 mr-2" />{loading ? "Carregando..." : "Atualizar"}
        </Button>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Faturamento</p><p className="text-2xl font-bold">{fmtMoney(stats.total)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Pedidos válidos</p><p className="text-2xl font-bold">{stats.tickets}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Ticket médio</p><p className="text-2xl font-bold">{fmtMoney(stats.ticketAvg)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Cancelados</p><p className="text-2xl font-bold">{stats.cancelled}</p></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
                <tr key={o.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-medium">#{o.order_number}</td>
                  <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</td>
                  <td className="p-3">{o.customer_name}</td>
                  <td className="p-3">{STATUS_LABEL[o.status] ?? o.status}</td>
                  <td className="p-3">{TYPE_LABEL[o.type] ?? o.type}</td>
                  <td className="p-3">{PAYMENT_LABEL[o.payment] ?? o.payment}</td>
                  <td className="p-3 text-right font-medium">{fmtMoney(Number(o.total))}</td>
                </tr>
              ))}
              {!orders.length && !loading && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum pedido no período</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
