import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSupportContext, type SupportContext } from "@/hooks/useSupportContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { AdminPageLayout } from "@/components/ds";
import { toast } from "sonner";
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, Receipt, Lock, Unlock,
  TrendingUp, TrendingDown, Loader2, FileDown, Eye, Zap, ShieldAlert,
} from "lucide-react";
import { downloadCSV } from "@/lib/export-csv";

export const Route = createFileRoute("/_authenticated/admin/caixa")({
  component: CaixaPage,
});

// Traduções amigáveis dos erros retornados pelas RPCs de caixa.
const ERR_MSG: Record<string, string> = {
  forbidden: "Você não tem permissão para esta operação.",
  cash_already_open: "Já existe um caixa aberto para este restaurante.",
  cash_session_not_open: "Esta sessão de caixa não está aberta.",
  cash_session_close_race: "Outra operação alterou o caixa. Recarregue e tente novamente.",
  invalid_amount: "Informe um valor válido maior que zero.",
  invalid_opening_amount: "Informe um valor de abertura válido.",
  invalid_closing_amount: "Informe um valor de fechamento válido.",
  amount_out_of_range: "Valor acima do limite permitido por operação.",
  invalid_movement_type: "Tipo de movimentação não permitido.",
  reason_required_for_support_open: "Informe um motivo (mín. 5 caracteres) para abrir o caixa em suporte.",
  reason_required_for_support_close: "Informe um motivo (mín. 5 caracteres) para fechar o caixa em suporte.",
  reason_required_for_support_movement: "Informe um motivo (mín. 5 caracteres) para movimentar em suporte.",
  support_session_expired: "Sessão de suporte expirada. Reinicie o atendimento.",
  support_access_denied: "Sua sessão de suporte não tem nível suficiente para esta ação.",
};
function friendlyError(msg: string | undefined | null): string {
  if (!msg) return "Erro desconhecido.";
  for (const k of Object.keys(ERR_MSG)) if (msg.includes(k)) return ERR_MSG[k];
  return msg;
}

type Session = {
  id: string;
  restaurant_id: string;
  opened_by: string | null;
  opened_at: string;
  opening_amount: number;
  closed_by: string | null;
  closed_at: string | null;
  closing_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  status: "open" | "closed";
  notes: string | null;
  origin?: "manual" | "automatic" | null;
};

type Movement = {
  id: string;
  session_id: string;
  type: "sale" | "reinforcement" | "withdrawal" | "expense";
  amount: number;
  description: string | null;
  order_id: string | null;
  created_at: string;
};

const TYPE_LABEL: Record<Movement["type"], string> = {
  sale: "Venda",
  reinforcement: "Reforço",
  withdrawal: "Sangria",
  expense: "Despesa",
};

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CaixaPage() {
  const { restaurantId, user } = useAuth();
  const support = useSupportContext();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [history, setHistory] = useState<Session[]>([]);
  const [tab, setTab] = useState("atual");

  // Se estiver em sessão de suporte para outra loja, usa o restaurante da sessão.
  const activeRestaurantId = support.active && support.restaurantId
    ? support.restaurantId
    : restaurantId;

  const canWrite = !support.active || support.level === "administrative";
  const supportBlockedReason =
    support.active && support.level !== "administrative"
      ? "Esta operação exige uma sessão de suporte administrativo."
      : null;

  const loadOpen = async () => {
    if (!activeRestaurantId) return;
    const { data } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("restaurant_id", activeRestaurantId)
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSession((data ?? null) as Session | null);
    if (data) {
      const { data: mv } = await supabase
        .from("cash_movements")
        .select("*")
        .eq("session_id", data.id)
        .order("created_at");
      setMovements((mv ?? []) as Movement[]);
    } else {
      setMovements([]);
    }
    setLoading(false);
  };

  const loadHistory = async () => {
    if (!activeRestaurantId) return;
    const { data } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("restaurant_id", activeRestaurantId)
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .limit(100);
    setHistory((data ?? []) as Session[]);
  };

  useEffect(() => {
    loadOpen();
    loadHistory();
  }, [activeRestaurantId]);

  // Realtime nas movimentações da sessão aberta
  useEffect(() => {
    if (!session?.id) return;
    const ch = supabase
      .channel(`cash-session-${session.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cash_movements", filter: `session_id=eq.${session.id}` },
        () => loadOpen(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session?.id]);

  const totals = useMemo(() => {
    const sum = (t: Movement["type"]) =>
      movements.filter((m) => m.type === t).reduce((s, m) => s + Number(m.amount), 0);
    const sales = sum("sale");
    const reinforcement = sum("reinforcement");
    const withdrawal = sum("withdrawal");
    const expense = sum("expense");
    const opening = Number(session?.opening_amount ?? 0);
    const expected = opening + sales + reinforcement - withdrawal - expense;
    return { sales, reinforcement, withdrawal, expense, opening, expected };
  }, [movements, session]);

  if (loading) {
    return (
      <AdminPageLayout title="Caixa" kicker="Operação" icon={Wallet} accent="amber">
        <div className="grid place-items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Caixa"
      subtitle="Controle de abertura, movimentações e fechamento."
      kicker="Operação"
      icon={Wallet}
      accent="amber"
    >
      {supportBlockedReason && (
        <div className="mb-4 rounded-xl border-2 border-brand-violet/40 bg-brand-violet/10 p-3 flex items-start gap-2 text-sm">
          <ShieldAlert className="h-4 w-4 mt-0.5 text-brand-violet shrink-0" />
          <span>{supportBlockedReason} Ações de escrita estão desabilitadas.</span>
        </div>
      )}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="atual">Caixa atual</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="atual" className="mt-4">
          {!session ? (
            <OpenForm
              restaurantId={activeRestaurantId!}
              support={support}
              canWrite={canWrite}
              onOpened={() => loadOpen()}
            />
          ) : (
            <CurrentSession
              session={session}
              movements={movements}
              totals={totals}
              support={support}
              canWrite={canWrite}
              onChange={() => loadOpen()}
              onClosed={() => { loadOpen(); loadHistory(); setTab("historico"); }}
            />
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <HistoryView history={history} />
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}

/* ============== OPEN ============== */

function OpenForm({
  restaurantId, support, canWrite, onOpened,
}: {
  restaurantId: string;
  support: SupportContext;
  canWrite: boolean;
  onOpened: () => void;
}) {
  const [amount, setAmount] = useState("0");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const requiresReason = support.active;

  const open = async () => {
    if (!restaurantId) return;
    const n = Number((amount || "0").replace(",", "."));
    if (isNaN(n) || n < 0) return toast.error("Informe um valor válido");
    if (requiresReason && reason.trim().length < 5) {
      return toast.error("Informe um motivo com pelo menos 5 caracteres.");
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("cash_session_open" as never, {
      p_restaurant_id: restaurantId,
      p_opening_amount: n,
      p_reason: requiresReason ? reason.trim() : null,
    } as never);
    setSubmitting(false);
    if (error) return toast.error(friendlyError(error.message));
    toast.success("Caixa aberto!");
    onOpened();
  };

  return (
    <Card className="p-6 max-w-md space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-brand-orange/10 grid place-items-center">
          <Unlock className="h-5 w-5 text-brand-orange" />
        </div>
        <div>
          <h2 className="font-bold text-lg">Abrir caixa</h2>
          <p className="text-sm text-muted-foreground">Informe o valor inicial em espécie (fundo de troco).</p>
        </div>
      </div>
      <div>
        <Label htmlFor="opening">Valor inicial (R$)</Label>
        <Input
          id="opening"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
          disabled={!canWrite}
        />
      </div>
      {requiresReason && (
        <div>
          <Label htmlFor="open-reason">Motivo do atendimento (obrigatório em suporte)</Label>
          <Textarea id="open-reason" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Descreva por que está abrindo o caixa em nome do cliente." disabled={!canWrite} />
        </div>
      )}
      <Button onClick={open} disabled={submitting || !canWrite} className="w-full">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Abrir caixa"}
      </Button>
    </Card>
  );
}

/* ============== CURRENT SESSION ============== */

function CurrentSession({
  session, movements, totals, support, canWrite, onChange, onClosed,
}: {
  session: Session;
  movements: Movement[];
  totals: { opening: number; sales: number; reinforcement: number; withdrawal: number; expense: number; expected: number };
  support: SupportContext;
  canWrite: boolean;
  onChange: () => void;
  onClosed: () => void;
}) {
  const [movDialog, setMovDialog] = useState<null | "reinforcement" | "withdrawal" | "expense">(null);
  const [closeOpen, setCloseOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Status header */}
      <Card className="p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Sessão aberta em</p>
          <p className="font-semibold">{new Date(session.opened_at).toLocaleString("pt-BR")}</p>
          {session.origin === "automatic" && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Abertura automática — saldo inicial R$ 0,00. Ajuste com um reforço se necessário.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {session.origin === "automatic" && (
            <Badge variant="outline" className="gap-1.5 border-brand-orange/40 text-brand-orange">
              <Zap className="h-3.5 w-3.5" /> Automático
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1.5"><Unlock className="h-3.5 w-3.5" /> Aberto</Badge>
        </div>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Abertura" value={totals.opening} />
        <SummaryCard label="Vendas dinheiro" value={totals.sales} variant="up" />
        <SummaryCard label="Reforços" value={totals.reinforcement} variant="up" />
        <SummaryCard label="Sangrias + Despesas" value={totals.withdrawal + totals.expense} variant="down" />
      </div>

      <Card className="p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total esperado em caixa</p>
          <p className="text-3xl font-bold">{fmt(totals.expected)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setMovDialog("reinforcement")} disabled={!canWrite}>
            <ArrowUpCircle className="h-4 w-4 mr-1.5" /> Reforço
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMovDialog("withdrawal")} disabled={!canWrite}>
            <ArrowDownCircle className="h-4 w-4 mr-1.5" /> Sangria
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMovDialog("expense")} disabled={!canWrite}>
            <Receipt className="h-4 w-4 mr-1.5" /> Despesa
          </Button>
          <Button size="sm" onClick={() => setCloseOpen(true)} disabled={!canWrite}>
            <Lock className="h-4 w-4 mr-1.5" /> Fechar caixa
          </Button>
        </div>
      </Card>

      {/* Movimentações */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b font-semibold">Movimentações ({movements.length})</div>
        <div className="divide-y max-h-[400px] overflow-y-auto">
          {movements.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground text-center">Nenhuma movimentação ainda.</p>
          )}
          {[...movements].reverse().map((m) => {
            const isIn = m.type === "sale" || m.type === "reinforcement";
            return (
              <div key={m.id} className="p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center shrink-0 ${isIn ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {isIn ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{TYPE_LABEL[m.type]}{m.description ? ` — ${m.description}` : ""}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <p className={`font-bold ${isIn ? "text-green-700" : "text-red-700"}`}>
                  {isIn ? "+" : "-"}{fmt(Number(m.amount))}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <MovementDialog
        open={movDialog !== null}
        type={movDialog}
        sessionId={session.id}
        support={support}
        onClose={() => setMovDialog(null)}
        onSaved={() => { setMovDialog(null); onChange(); }}
      />

      <CloseDialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        session={session}
        expected={totals.expected}
        support={support}
        onClosed={() => { setCloseOpen(false); onClosed(); }}
      />
    </div>
  );
}

function SummaryCard({ label, value, variant }: { label: string; value: number; variant?: "up" | "down" }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${variant === "up" ? "text-green-700" : variant === "down" ? "text-red-700" : ""}`}>
        {fmt(value)}
      </p>
    </Card>
  );
}

/* ============== MOVEMENT DIALOG ============== */

function MovementDialog({
  open, type, sessionId, restaurantId, userId, onClose, onSaved,
}: {
  open: boolean;
  type: Movement["type"] | null;
  sessionId: string;
  restaurantId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setAmount(""); setDescription(""); } }, [open]);

  if (!type) return null;
  const title =
    type === "reinforcement" ? "Reforço de caixa" :
    type === "withdrawal" ? "Sangria" :
    type === "expense" ? "Despesa" : "Movimentação";

  const save = async () => {
    const n = Number((amount || "0").replace(",", "."));
    if (isNaN(n) || n <= 0) return toast.error("Informe um valor maior que zero");
    setSaving(true);
    const { error } = await supabase.from("cash_movements").insert({
      session_id: sessionId,
      restaurant_id: restaurantId,
      type,
      amount: n,
      description: description.trim() || null,
      created_by: userId,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Movimentação registrada");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="mv-amount">Valor (R$)</Label>
            <Input id="mv-amount" type="number" step="0.01" min="0" autoFocus
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="mv-desc">Motivo / descrição</Label>
            <Textarea id="mv-desc" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={type === "expense" ? "Ex.: pagamento de fornecedor" : type === "withdrawal" ? "Ex.: retirada do dono" : "Ex.: reforço de troco"} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============== CLOSE DIALOG ============== */

function CloseDialog({
  open, onClose, session, expected, userId, onClosed,
}: {
  open: boolean;
  onClose: () => void;
  session: Session;
  expected: number;
  userId: string;
  onClosed: () => void;
}) {
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setCounted(expected.toFixed(2)); setNotes(""); } }, [open, expected]);

  const countedNum = Number((counted || "0").replace(",", "."));
  const diff = isNaN(countedNum) ? 0 : countedNum - expected;

  const close = async () => {
    if (isNaN(countedNum) || countedNum < 0) return toast.error("Informe o valor contado");
    setSaving(true);
    const { error } = await supabase.from("cash_sessions").update({
      status: "closed",
      closed_by: userId,
      closed_at: new Date().toISOString(),
      closing_amount: countedNum,
      expected_amount: expected,
      difference: diff,
      notes: notes.trim() || null,
    }).eq("id", session.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Caixa fechado");
    onClosed();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Fechar caixa</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-sm">
            <Row label="Valor esperado em caixa" value={fmt(expected)} />
          </div>
          <div>
            <Label htmlFor="counted">Valor contado em espécie (R$)</Label>
            <Input id="counted" type="number" step="0.01" min="0" autoFocus
              value={counted} onChange={(e) => setCounted(e.target.value)} />
          </div>
          <div className={`rounded-lg p-3 text-sm font-semibold ${diff === 0 ? "bg-green-50 text-green-800" : diff > 0 ? "bg-blue-50 text-blue-800" : "bg-red-50 text-red-800"}`}>
            Diferença: {diff >= 0 ? "+" : ""}{fmt(diff)}
            {diff !== 0 && <span className="font-normal block text-xs mt-0.5">{diff > 0 ? "Sobra de caixa" : "Falta no caixa"}</span>}
          </div>
          <div>
            <Label htmlFor="cl-notes">Observações</Label>
            <Textarea id="cl-notes" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional: justificar diferença, observações do turno..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={close} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar fechamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
  );
}

/* ============== HISTORY ============== */

function HistoryView({ history }: { history: Session[] }) {
  const [detail, setDetail] = useState<Session | null>(null);

  const exportCsv = () => {
    if (!history.length) return;
    const header = ["Abertura", "Fechamento", "Valor inicial", "Esperado", "Contado", "Diferenca", "Observacoes"];
    const rows = history.map((s) => [
      new Date(s.opened_at).toLocaleString("pt-BR"),
      s.closed_at ? new Date(s.closed_at).toLocaleString("pt-BR") : "",
      Number(s.opening_amount).toFixed(2),
      Number(s.expected_amount ?? 0).toFixed(2),
      Number(s.closing_amount ?? 0).toFixed(2),
      Number(s.difference ?? 0).toFixed(2),
      s.notes ?? "",
    ]);
    downloadCSV("caixa-historico.csv", [header, ...rows]);
  };

  if (!history.length) {
    return <Card className="p-8 text-center text-muted-foreground">Nenhum caixa fechado ainda.</Card>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCsv}><FileDown className="h-4 w-4 mr-1.5" /> Exportar CSV</Button>
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="divide-y">
          {history.map((s) => {
            const d = Number(s.difference ?? 0);
            return (
              <div key={s.id} className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[180px]">
                  <p className="font-semibold">{new Date(s.opened_at).toLocaleDateString("pt-BR")} • Aberto {new Date(s.opened_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  <p className="text-xs text-muted-foreground">Fechado {s.closed_at ? new Date(s.closed_at).toLocaleString("pt-BR") : "—"}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground text-xs">Esperado</p>
                  <p className="font-medium">{fmt(Number(s.expected_amount ?? 0))}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground text-xs">Contado</p>
                  <p className="font-medium">{fmt(Number(s.closing_amount ?? 0))}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">Diferença</p>
                  <p className={`font-bold ${d === 0 ? "text-green-700" : d > 0 ? "text-blue-700" : "text-red-700"}`}>
                    {d >= 0 ? "+" : ""}{fmt(d)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setDetail(s)}><Eye className="h-4 w-4" /></Button>
              </div>
            );
          })}
        </div>
      </Card>

      <SessionDetailDialog session={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function SessionDetailDialog({ session, onClose }: { session: Session | null; onClose: () => void }) {
  const [movements, setMovements] = useState<Movement[]>([]);
  useEffect(() => {
    if (!session) return;
    supabase.from("cash_movements").select("*").eq("session_id", session.id).order("created_at")
      .then(({ data }) => setMovements((data ?? []) as Movement[]));
  }, [session?.id]);

  if (!session) return null;

  const sum = (t: Movement["type"]) =>
    movements.filter((m) => m.type === t).reduce((s, m) => s + Number(m.amount), 0);

  return (
    <Dialog open={!!session} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Detalhes do caixa</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-lg bg-muted/40 p-3 space-y-1">
            <Row label="Abertura" value={new Date(session.opened_at).toLocaleString("pt-BR")} />
            <Row label="Fechamento" value={session.closed_at ? new Date(session.closed_at).toLocaleString("pt-BR") : "—"} />
            <Row label="Valor inicial" value={fmt(Number(session.opening_amount))} />
            <Row label="Vendas dinheiro" value={fmt(sum("sale"))} />
            <Row label="Reforços" value={fmt(sum("reinforcement"))} />
            <Row label="Sangrias" value={fmt(sum("withdrawal"))} />
            <Row label="Despesas" value={fmt(sum("expense"))} />
            <Row label="Esperado" value={fmt(Number(session.expected_amount ?? 0))} />
            <Row label="Contado" value={fmt(Number(session.closing_amount ?? 0))} />
            <Row label="Diferença" value={fmt(Number(session.difference ?? 0))} />
          </div>
          {session.notes && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Observações</p>
              <p className="rounded-lg border p-3 whitespace-pre-wrap">{session.notes}</p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Movimentações ({movements.length})</p>
            <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
              {movements.length === 0 && <p className="p-3 text-muted-foreground text-center">Nenhuma.</p>}
              {movements.map((m) => {
                const isIn = m.type === "sale" || m.type === "reinforcement";
                return (
                  <div key={m.id} className="p-2.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{TYPE_LABEL[m.type]}{m.description ? ` — ${m.description}` : ""}</p>
                      <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                    <p className={`font-semibold ${isIn ? "text-green-700" : "text-red-700"}`}>
                      {isIn ? "+" : "-"}{fmt(Number(m.amount))}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
