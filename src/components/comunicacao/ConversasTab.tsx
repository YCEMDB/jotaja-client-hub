import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  MessageSquare, Send, Search, Zap, Plus, Trash2, CheckCheck, Check, Clock, AlertCircle, User,
} from "lucide-react";
import { toast } from "sonner";
import {
  listConversations, listConversationMessages, sendManualMessage, markConversationRead,
  startConversation,
  listQuickReplies, upsertQuickReply, deleteQuickReply,
} from "@/lib/communication/conversations.functions";

type Conversation = {
  id: string;
  peer_address: string;
  peer_name: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_direction: "inbound" | "outbound" | "system" | null;
  unread_count: number;
  status: "open" | "archived";
  order_id: string | null;
  customer_id: string | null;
  channel: string;
};

type Message = {
  id: string;
  direction: "inbound" | "outbound" | "system";
  source: string;
  body: string;
  status: string;
  created_at: string;
  order_id: string | null;
  media_type?: string | null;
  media_url?: string | null;
  media_mime?: string | null;
  caption?: string | null;
};

type QuickReply = {
  id: string;
  restaurant_id: string;
  title: string;
  body: string;
  shortcut: string | null;
  position: number;
  is_active: boolean;
};

function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "");
  if (d.length === 13) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`;
  if (d.length === 12) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,8)}-${d.slice(8)}`;
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return digits;
}

function timeShort(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function StatusIcon({ status }: { status: string }) {
  if (status === "pending") return <Clock className="h-3 w-3 opacity-70" />;
  if (status === "sent") return <Check className="h-3 w-3" />;
  if (status === "delivered" || status === "read") return <CheckCheck className="h-3 w-3" />;
  if (status === "failed") return <AlertCircle className="h-3 w-3 text-red-500" />;
  return null;
}

export function ConversasTab({ restaurantId }: { restaurantId: string }) {
  const listConvs = useServerFn(listConversations);
  const listMsgs = useServerFn(listConversationMessages);
  const send = useServerFn(sendManualMessage);
  const markRead = useServerFn(markConversationRead);
  const start = useServerFn(startConversation);

  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"open"|"all">("open");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const rows = await listConvs({ data: { restaurant_id: restaurantId, search, status: statusFilter } });
      setConvs(rows as Conversation[]);
    } finally { setLoading(false); }
  };

  const loadMsgs = async (id: string) => {
    setMsgsLoading(true);
    try {
      const rows = await listMsgs({ data: { conversation_id: id } });
      setMsgs(rows as Message[]);
      await markRead({ data: { conversation_id: id } });
      setConvs((cs) => cs.map((c) => c.id === id ? { ...c, unread_count: 0 } : c));
    } finally { setMsgsLoading(false); }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [restaurantId, statusFilter]);
  useEffect(() => {
    const t = setTimeout(() => { refresh(); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [search]);
  useEffect(() => {
    if (activeId) loadMsgs(activeId);
    // eslint-disable-next-line
  }, [activeId]);

  // Realtime: novos INSERTs em conversation_messages do restaurante
  useEffect(() => {
    const ch = supabase.channel(`convmsgs:${restaurantId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "conversation_messages",
          filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          const row = payload.new as any;
          if (activeId && row.conversation_id === activeId) {
            setMsgs((prev) => prev.some((m) => m.id === row.id) ? prev : [...prev, row]);
          }
          refresh();
        })
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversation_messages",
          filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          const row = payload.new as any;
          setMsgs((prev) => prev.map((m) => m.id === row.id ? { ...m, ...row } : m));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [restaurantId, activeId]);

  // Autoscroll
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [msgs.length, activeId]);

  const activeConv = useMemo(() => convs.find((c) => c.id === activeId) ?? null, [convs, activeId]);

  const submit = async () => {
    if (!activeId || !draft.trim()) return;
    setSending(true);
    try {
      await send({ data: { conversation_id: activeId, body: draft.trim() } });
      setDraft("");
      await loadMsgs(activeId);
      refresh();
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg.includes("no_active_channel")) {
        toast.error("Nenhum canal WhatsApp ativo. Configure em Canais.");
      } else if (msg.includes("forbidden")) {
        toast.error("Sem permissão nesta conversa.");
      } else toast.error(msg || "Erro ao enviar");
    } finally { setSending(false); }
  };

  const insertQuick = (body: string) => {
    setDraft((d) => (d ? d + "\n\n" : "") + body);
    setShowQR(false);
  };

  const handleStart = async (phone: string, name: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) { toast.error("Telefone inválido"); return; }
    try {
      const r = await start({ data: { restaurant_id: restaurantId, peer_address: digits, peer_name: name || undefined } });
      setShowNew(false);
      await refresh();
      setActiveId(r.conversation_id);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 h-[calc(100vh-14rem)] min-h-[500px]">
      {/* LISTA */}
      <Card className="flex flex-col overflow-hidden border-2 border-ink shadow-brutal">
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Button size="sm" variant="gradient" onClick={() => setShowNew(true)} title="Nova conversa">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant={statusFilter === "open" ? "default" : "outline"} onClick={() => setStatusFilter("open")}>Abertas</Button>
            <Button size="sm" variant={statusFilter === "all" ? "default" : "outline"} onClick={() => setStatusFilter("all")}>Todas</Button>
            <div className="ml-auto text-xs text-muted-foreground self-center">{convs.length}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando…</p>
          ) : convs.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
              Nenhuma conversa ainda.<br/>Aguarde mensagens ou inicie uma.
            </div>
          ) : convs.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left px-3 py-3 border-b border-border hover:bg-muted/40 transition ${activeId === c.id ? "bg-muted/60" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-sm truncate flex items-center gap-2">
                  {c.peer_name || formatPhone(c.peer_address)}
                  {c.order_id && <Badge variant="outline" className="text-[10px] px-1 py-0">pedido</Badge>}
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0">{timeShort(c.last_message_at)}</div>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="text-xs text-muted-foreground truncate">
                  {c.last_direction === "outbound" && "↗ "}
                  {c.last_message_preview || <span className="italic">Sem mensagens</span>}
                </div>
                {c.unread_count > 0 && (
                  <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] bg-brand-orange text-ink border-ink">
                    {c.unread_count}
                  </Badge>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{formatPhone(c.peer_address)}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* CHAT */}
      <Card className="flex flex-col overflow-hidden border-2 border-ink shadow-brutal">
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground p-6">
            <div>
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold truncate flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {activeConv.peer_name || formatPhone(activeConv.peer_address)}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {formatPhone(activeConv.peer_address)} · {activeConv.channel}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowQR(true)}>
                <Zap className="h-3 w-3 mr-1" /> Respostas rápidas
              </Button>
            </div>

            <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/20">
              {msgsLoading ? (
                <p className="text-sm text-muted-foreground text-center">Carregando…</p>
              ) : msgs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">Sem mensagens ainda.</p>
              ) : msgs.map((m) => {
                const outbound = m.direction === "outbound";
                const system = m.direction === "system";
                if (system) return (
                  <div key={m.id} className="text-center text-[11px] text-muted-foreground italic">
                    {m.body}
                  </div>
                );
                return (
                  <div key={m.id} className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 border-2 border-ink shadow-brutal ${outbound ? "bg-brand-orange text-ink" : "bg-background"}`}>
                      {m.media_type === "image" && m.media_url && (
                        <img src={m.media_url} alt={m.caption ?? ""} className="rounded-lg mb-1 max-h-56 object-cover" />
                      )}
                      {m.media_type === "audio" && m.media_url && (
                        <audio controls src={m.media_url} className="mb-1 w-full" />
                      )}
                      {m.media_type === "video" && m.media_url && (
                        <video controls src={m.media_url} className="rounded-lg mb-1 max-h-56 w-full" />
                      )}
                      {m.media_type === "document" && m.media_url && (
                        <a href={m.media_url} target="_blank" rel="noreferrer" className="underline text-xs block mb-1">
                          📄 {m.caption ?? "Documento"}
                        </a>
                      )}
                      {m.body && <div className="whitespace-pre-wrap text-sm break-words">{m.body}</div>}
                      <div className={`flex items-center gap-1 text-[10px] mt-1 ${outbound ? "text-ink/70 justify-end" : "text-muted-foreground"}`}>
                        <span>{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        {outbound && <StatusIcon status={m.status} />}
                        {m.source === "automated" && <span className="italic font-bold">🤖 auto</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border p-3 space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escreva uma mensagem…"
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); }
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">Ctrl/Cmd + Enter para enviar</p>
                <Button onClick={submit} disabled={sending || !draft.trim()} variant="gradient">
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? "Enviando…" : "Enviar"}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <QuickRepliesDialog
        open={showQR}
        onOpenChange={setShowQR}
        restaurantId={restaurantId}
        onPick={insertQuick}
      />
      <NewConversationDialog
        open={showNew}
        onOpenChange={setShowNew}
        onStart={handleStart}
      />
    </div>
  );
}

// ============================================================================
// QUICK REPLIES DIALOG
// ============================================================================
function QuickRepliesDialog({
  open, onOpenChange, restaurantId, onPick,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  restaurantId: string; onPick: (body: string) => void;
}) {
  const listQR = useServerFn(listQuickReplies);
  const upsert = useServerFn(upsertQuickReply);
  const del = useServerFn(deleteQuickReply);
  const [rows, setRows] = useState<QuickReply[]>([]);
  const [editing, setEditing] = useState<Partial<QuickReply> | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try { setRows((await listQR({ data: { restaurant_id: restaurantId } })) as QuickReply[]); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (open) refresh(); /* eslint-disable-next-line */ }, [open, restaurantId]);

  const save = async () => {
    if (!editing?.title || !editing?.body) { toast.error("Preencha título e mensagem"); return; }
    try {
      await upsert({ data: {
        id: editing.id,
        restaurant_id: restaurantId,
        title: editing.title!, body: editing.body!,
        shortcut: editing.shortcut ?? null,
        position: editing.position ?? 0,
        is_active: editing.is_active ?? true,
      }});
      setEditing(null); refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover resposta?")) return;
    try { await del({ data: { id } }); refresh(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Respostas rápidas</DialogTitle></DialogHeader>
        {editing ? (
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <div>
              <Label>Atalho (opcional)</Label>
              <Input value={editing.shortcut ?? ""} placeholder="/ola" onChange={(e) => setEditing({ ...editing, shortcut: e.target.value })} />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea rows={5} value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
              <Label>Ativa</Label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button variant="gradient" onClick={save}>Salvar</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Clique em uma resposta para inserir no editor.</p>
              <Button size="sm" variant="gradient" onClick={() => setEditing({ position: rows.length })}>
                <Plus className="h-4 w-4 mr-1" /> Nova
              </Button>
            </div>
            {loading ? <p className="text-sm">Carregando…</p> : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma resposta rápida ainda.</p>
            ) : (
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {rows.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <button onClick={() => onPick(r.body)} className="flex-1 text-left">
                        <div className="font-semibold text-sm">{r.title}
                          {r.shortcut && <code className="ml-2 text-xs text-muted-foreground">{r.shortcut}</code>}
                          {!r.is_active && <Badge variant="secondary" className="ml-2 text-[10px]">off</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-2">{r.body}</div>
                      </button>
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>Editar</Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-3 w-3 text-red-600" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// NEW CONVERSATION DIALOG
// ============================================================================
function NewConversationDialog({
  open, onOpenChange, onStart,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  onStart: (phone: string, name: string) => void;
}) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  useEffect(() => { if (open) { setPhone(""); setName(""); } }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nova conversa</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Telefone (com DDD)</Label>
            <Input placeholder="27999999999" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Nome (opcional)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="gradient" onClick={() => onStart(phone, name)}>Abrir conversa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
