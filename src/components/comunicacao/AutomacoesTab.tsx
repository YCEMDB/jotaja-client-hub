// Sprint 4.3 — Aba Automações
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Sparkles, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import {
  listAutomationRules, upsertAutomationRule, deleteAutomationRule,
  toggleAutomationRule, seedDefaultAutomationRules,
} from "@/lib/communication/automation.functions";

type Rule = {
  id: string; restaurant_id: string; code: string | null; name: string;
  trigger_type: "keyword" | "regex"; trigger_value: string;
  match_mode: "exact" | "contains" | "starts_with";
  response_template_id: string | null; response_body: string | null;
  handoff: boolean; is_active: boolean; priority: number; cooldown_seconds: number;
};

const empty = (rid: string): Rule => ({
  id: "", restaurant_id: rid, code: null, name: "",
  trigger_type: "keyword", trigger_value: "", match_mode: "contains",
  response_template_id: null, response_body: "",
  handoff: false, is_active: true, priority: 100, cooldown_seconds: 60,
});

export function AutomacoesTab({ restaurantId }: { restaurantId: string }) {
  const listFn = useServerFn(listAutomationRules);
  const upsertFn = useServerFn(upsertAutomationRule);
  const delFn = useServerFn(deleteAutomationRule);
  const toggleFn = useServerFn(toggleAutomationRule);
  const seedFn = useServerFn(seedDefaultAutomationRules);

  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Rule | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listFn({ data: { restaurant_id: restaurantId } });
      setRules(data as Rule[]);
    } catch (e: any) { toast.error(e.message ?? "Erro ao carregar"); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [restaurantId]);

  async function seed() {
    try {
      const r = await seedFn({ data: { restaurant_id: restaurantId } });
      toast.success(`${(r as any).inserted} regras padrão criadas`);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  }

  async function save() {
    if (!editing) return;
    try {
      await upsertFn({
        data: {
          id: editing.id || undefined,
          restaurant_id: editing.restaurant_id,
          code: editing.code,
          name: editing.name,
          trigger_type: editing.trigger_type,
          trigger_value: editing.trigger_value,
          match_mode: editing.match_mode,
          response_template_id: editing.response_template_id,
          response_body: editing.response_body,
          handoff: editing.handoff,
          is_active: editing.is_active,
          priority: editing.priority,
          cooldown_seconds: editing.cooldown_seconds,
        } as any,
      });
      toast.success("Regra salva");
      setEditing(null);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  }

  async function remove(id: string) {
    if (!confirm("Excluir regra?")) return;
    try { await delFn({ data: { id } }); refresh(); toast.success("Removida"); }
    catch (e: any) { toast.error(e.message); }
  }

  async function toggle(id: string, is_active: boolean) {
    try { await toggleFn({ data: { id, is_active } }); refresh(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Automações</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Respostas automáticas por palavra-chave. Toda resposta passa pela fila oficial.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={seed}><Sparkles className="w-4 h-4 mr-2" /> Regras padrão</Button>
          <Button onClick={() => setEditing(empty(restaurantId))}><Plus className="w-4 h-4 mr-2" /> Nova</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Gatilho</TableHead>
                <TableHead>Modo</TableHead>
                <TableHead>Cooldown</TableHead>
                <TableHead>Prio.</TableHead>
                <TableHead>Ativa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.name}
                    {r.handoff && <Badge variant="secondary" className="ml-2">handoff</Badge>}
                  </TableCell>
                  <TableCell><code className="text-xs">{r.trigger_value}</code></TableCell>
                  <TableCell><Badge variant="outline">{r.trigger_type}/{r.match_mode}</Badge></TableCell>
                  <TableCell>{r.cooldown_seconds}s</TableCell>
                  <TableCell>{r.priority}</TableCell>
                  <TableCell>
                    <Switch checked={r.is_active} onCheckedChange={v => toggle(r.id, v)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma regra. Clique em "Regras padrão" para começar.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar regra" : "Nova regra"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Nome</Label>
                <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={editing.trigger_type} onValueChange={(v: any) => setEditing({ ...editing, trigger_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyword">Palavra-chave</SelectItem>
                      <SelectItem value="regex">Regex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Modo</Label>
                  <Select value={editing.match_mode} onValueChange={(v: any) => setEditing({ ...editing, match_mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contém</SelectItem>
                      <SelectItem value="exact">Igual</SelectItem>
                      <SelectItem value="starts_with">Começa com</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Gatilho</Label>
                <Input value={editing.trigger_value} onChange={e => setEditing({ ...editing, trigger_value: e.target.value })} placeholder="ex: status" />
              </div>
              <div>
                <Label>Resposta (use {"{{customer_name}}"}, {"{{order_number}}"}, {"{{order_status}}"}, {"{{order_total}}"}, {"{{menu_url}}"})</Label>
                <Textarea rows={4} value={editing.response_body ?? ""} onChange={e => setEditing({ ...editing, response_body: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Prioridade</Label>
                  <Input type="number" value={editing.priority} onChange={e => setEditing({ ...editing, priority: Number(e.target.value) || 100 })} />
                </div>
                <div>
                  <Label>Cooldown (s)</Label>
                  <Input type="number" value={editing.cooldown_seconds} onChange={e => setEditing({ ...editing, cooldown_seconds: Number(e.target.value) || 0 })} />
                </div>
                <div className="flex items-end gap-2">
                  <Switch checked={editing.handoff} onCheckedChange={v => setEditing({ ...editing, handoff: v })} />
                  <Label>Handoff humano</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
