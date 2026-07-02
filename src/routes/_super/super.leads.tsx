import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Inbox } from "lucide-react";
import { toast } from "sonner";
import { CreateTenantDialog } from "@/components/super/CreateTenantDialog";
import { AdminPageLayout } from "@/components/AdminPageLayout";

export const Route = createFileRoute("/_super/super/leads")({
  component: LeadsPage,
  head: () => ({ meta: [{ title: "Super-Admin — Leads" }] }),
});

type LeadStatus = "new" | "contacted" | "approved" | "rejected";
type Lead = {
  id: string; name: string; restaurant_name: string; email: string; phone: string;
  status: LeadStatus; notes: string | null; restaurant_id: string | null; created_at: string;
};

const LEAD_LABEL: Record<LeadStatus, string> = {
  new: "Novo", contacted: "Contatado", approved: "Aprovado", rejected: "Recusado",
};
const LEAD_COLOR: Record<LeadStatus, string> = {
  new: "bg-amber-500/15 text-amber-700 border-amber-300",
  contacted: "bg-blue-500/15 text-blue-700 border-blue-300",
  approved: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
  rejected: "bg-red-500/15 text-red-700 border-red-300",
};

function fmtDateTime(s: string) { return new Date(s).toLocaleString("pt-BR"); }

function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [noteEditing, setNoteEditing] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState<Lead | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("signup_leads").select("*").order("created_at", { ascending: false });
    setLeads((data ?? []) as Lead[]);
  };

  const list = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  const setStatus = async (l: Lead, status: LeadStatus) => {
    const { error } = await supabase.from("signup_leads").update({ status }).eq("id", l.id);
    if (error) return toast.error(error.message);
    toast.success(`Lead marcado como ${LEAD_LABEL[status]}`);
    load();
  };

  const saveNote = async () => {
    if (!noteEditing) return;
    const { error } = await supabase.from("signup_leads").update({ notes: noteText }).eq("id", noteEditing.id);
    if (error) return toast.error(error.message);
    toast.success("Nota salva");
    setNoteEditing(null);
    load();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Inbox className="h-8 w-8 text-brand-violet" />
        <div>
          <h1 className="font-display text-4xl md:text-5xl text-ink tracking-tight leading-[0.95]">Leads</h1>
          <p className="text-muted-foreground">Solicitações recebidas pelo formulário do site</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "new", "contacted", "approved", "rejected"] as const).map((s) => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s === "all" ? "Todos" : LEAD_LABEL[s]}
            <span className="ml-2 text-xs opacity-70">
              {s === "all" ? leads.length : leads.filter((l) => l.status === s).length}
            </span>
          </Button>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-3">Recebido</th>
                <th className="p-3">Restaurante</th>
                <th className="p-3">Contato</th>
                <th className="p-3">Status</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id} className="border-t align-top">
                  <td className="p-3 text-xs whitespace-nowrap">{fmtDateTime(l.created_at)}</td>
                  <td className="p-3">
                    <div className="font-medium">{l.restaurant_name}</div>
                    <div className="text-xs text-muted-foreground">{l.name}</div>
                  </td>
                  <td className="p-3 text-xs">
                    <div>{l.email}</div>
                    <div className="text-muted-foreground">{l.phone}</div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={LEAD_COLOR[l.status]}>{LEAD_LABEL[l.status]}</Badge>
                    {l.notes && <p className="text-xs text-muted-foreground mt-1 max-w-xs">📝 {l.notes}</p>}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="default" onClick={() => { setCreatePrefill(l); setCreateOpen(true); }} disabled={l.status === "approved"}>
                        Aprovar e criar loja
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(l, "contacted")} disabled={l.status === "contacted"}>Contatado</Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(l, "rejected")} disabled={l.status === "rejected"}>Recusar</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setNoteEditing(l); setNoteText(l.notes ?? ""); }}>Nota</Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={`https://wa.me/55${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!list.length && (<tr><td colSpan={5} className="p-4 md:p-8 text-center text-muted-foreground">Nenhum lead nessa categoria</td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!noteEditing} onOpenChange={(o) => !o && setNoteEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nota interna</DialogTitle></DialogHeader>
          <Textarea rows={4} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Anotação visível apenas para super-admins" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteEditing(null)}>Cancelar</Button>
            <Button onClick={saveNote}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateTenantDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        prefill={createPrefill}
        onCreated={() => load()}
      />
    </div>
  );
}
