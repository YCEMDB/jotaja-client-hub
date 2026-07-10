import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { useSupportContext } from "@/hooks/useSupportContext";
import {
  METHOD_LABEL, upsertEntry,
  type FinanceCategory, type FinanceCostCenter, type FinanceDirection, type FinanceEntry, type FinancePayMethod,
} from "@/lib/finance";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  restaurantId: string;
  direction: FinanceDirection;
  editing?: FinanceEntry | null;
  categories: FinanceCategory[];
  costCenters: FinanceCostCenter[];
  canCostCenters: boolean;
  onSaved?: () => void;
}

const METHODS: FinancePayMethod[] = ["cash", "pix", "credit", "debit", "transfer", "boleto", "other"];

const todayISO = () => new Date().toISOString().slice(0, 10);

export function EntryDialog({
  open, onOpenChange, restaurantId, direction, editing, categories, costCenters, canCostCenters, onSaved,
}: Props) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayISO());
  const [issueDate, setIssueDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState<string>("none");
  const [costCenterId, setCostCenterId] = useState<string>("none");
  const [method, setMethod] = useState<string>("none");
  const [party, setParty] = useState("");
  const [doc, setDoc] = useState("");
  const [notes, setNotes] = useState("");
  const [isFixed, setIsFixed] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredCats = useMemo(
    () => categories.filter((c) => c.is_active && c.direction === direction),
    [categories, direction],
  );
  const activeCenters = useMemo(() => costCenters.filter((c) => c.is_active), [costCenters]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDescription(editing.description);
      setAmount(String(editing.amount));
      setDueDate(editing.due_date);
      setIssueDate(editing.issue_date);
      setCategoryId(editing.category_id ?? "none");
      setCostCenterId(editing.cost_center_id ?? "none");
      setMethod(editing.payment_method ?? "none");
      setParty(direction === "payable" ? (editing.supplier ?? "") : (editing.customer ?? ""));
      setDoc(editing.document ?? "");
      setNotes(editing.notes ?? "");
      setIsFixed(editing.is_fixed);
    } else {
      setDescription("");
      setAmount("");
      setDueDate(todayISO());
      setIssueDate(todayISO());
      setCategoryId("none");
      setCostCenterId("none");
      setMethod("none");
      setParty("");
      setDoc("");
      setNotes("");
      setIsFixed(false);
    }
  }, [open, editing, direction]);

  const save = async () => {
    const desc = description.trim();
    if (!desc) { toast.error("Informe uma descrição"); return; }
    if (desc.length > 200) { toast.error("Descrição muito longa"); return; }
    const amt = parseFloat(amount.replace(",", "."));
    if (!amt || amt <= 0) { toast.error("Valor inválido"); return; }
    if (!dueDate) { toast.error("Informe o vencimento"); return; }
    setSaving(true);
    try {
      await upsertEntry({
        id: editing?.id,
        restaurant_id: restaurantId,
        direction,
        description: desc,
        amount: amt,
        due_date: dueDate,
        issue_date: issueDate,
        category_id: categoryId === "none" ? null : categoryId,
        cost_center_id: costCenterId === "none" ? null : costCenterId,
        payment_method: method === "none" ? null : (method as FinancePayMethod),
        supplier: direction === "payable" ? party || null : null,
        customer: direction === "receivable" ? party || null : null,
        document: doc || null,
        notes: notes || null,
        is_fixed: isFixed,
      });
      toast.success(editing ? "Lançamento atualizado" : "Lançamento criado");
      onOpenChange(false);
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const title = editing
    ? `Editar ${direction === "payable" ? "conta a pagar" : "conta a receber"}`
    : `Nova ${direction === "payable" ? "conta a pagar" : "conta a receber"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Descrição *</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} placeholder="Ex.: Fornecedor de bebidas" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$) *</Label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label>Vencimento *</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Emissão</Label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div>
              <Label>Forma de pagamento</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definida</SelectItem>
                  {METHODS.map((m) => <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {filteredCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {canCostCenters && (
              <div>
                <Label>Centro de custo</Label>
                <Select value={costCenterId} onValueChange={setCostCenterId}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {activeCenters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{direction === "payable" ? "Fornecedor" : "Cliente"}</Label>
              <Input value={party} onChange={(e) => setParty(e.target.value)} maxLength={120} />
            </div>
            <div>
              <Label>Documento / nº nota</Label>
              <Input value={doc} onChange={(e) => setDoc(e.target.value)} maxLength={60} />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
          </div>

          <div className="flex items-center justify-between rounded-lg border-2 border-ink/10 bg-muted/40 px-3 py-2">
            <div>
              <p className="text-sm font-bold text-ink">Despesa/receita fixa</p>
              <p className="text-xs text-ink/60">Marca este lançamento como recorrente para relatórios.</p>
            </div>
            <Switch checked={isFixed} onCheckedChange={setIsFixed} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
