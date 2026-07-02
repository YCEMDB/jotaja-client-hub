import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FeatureGate } from "@/components/FeatureGate";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  MessageSquare, Plus, Wifi, WifiOff, RefreshCw, Trash2, Copy, Play, X, AlertCircle, CheckCircle2, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listCommunicationSettings, upsertCommunicationSetting,
  deleteCommunicationSetting, testCommunicationConnection,
} from "@/lib/communication/settings.functions";
import {
  listCommunicationTemplates, upsertCommunicationTemplate,
  deleteCommunicationTemplate, previewCommunicationTemplate,
} from "@/lib/communication/templates.functions";
import { ConversasTab } from "@/components/comunicacao/ConversasTab";

export const Route = createFileRoute("/_authenticated/admin/comunicacao")({
  component: ComunicacaoPage,
});

function ComunicacaoPage() {
  return (
    <FeatureGate feature="communication_channels_max">
      <ComunicacaoInner />
    </FeatureGate>
  );
}

function ComunicacaoInner() {
  const { restaurantId } = useAuth();
  if (!restaurantId) return null;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader
        kicker="Sprint 4.2"
        title="Central de Comunicação"
        subtitle="Converse, envie mensagens e acompanhe canais em tempo real"
      />
      <Tabs defaultValue="conversas" className="w-full">
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="conversas">Conversas</TabsTrigger>
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="queue">Fila</TabsTrigger>
        </TabsList>
        <TabsContent value="conversas" className="mt-6"><ConversasTab restaurantId={restaurantId} /></TabsContent>
        <TabsContent value="channels" className="mt-6"><ChannelsTab restaurantId={restaurantId} /></TabsContent>
        <TabsContent value="templates" className="mt-6"><TemplatesTab restaurantId={restaurantId} /></TabsContent>
        <TabsContent value="queue" className="mt-6"><QueueTab restaurantId={restaurantId} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// CANAIS
// ============================================================================
type Setting = {
  id: string;
  provider_code: string;
  channel: string;
  display_name: string;
  config: Record<string, unknown>;
  is_active: boolean;
  health: string;
  last_sync_at: string | null;
  last_error: string | null;
  last_latency_ms: number | null;
};

function healthBadge(h: string) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    healthy: { label: "Saudável", cls: "bg-green-500/10 text-green-700 border-green-500/30", icon: CheckCircle2 },
    degraded: { label: "Degradado", cls: "bg-amber-500/10 text-amber-700 border-amber-500/30", icon: AlertCircle },
    down: { label: "Fora do ar", cls: "bg-red-500/10 text-red-700 border-red-500/30", icon: WifiOff },
    unknown: { label: "Desconhecido", cls: "bg-muted text-muted-foreground", icon: Clock },
  };
  const m = map[h] ?? map.unknown;
  const Icon = m.icon;
  return <Badge variant="outline" className={m.cls}><Icon className="h-3 w-3 mr-1" />{m.label}</Badge>;
}

function ChannelsTab({ restaurantId }: { restaurantId: string }) {
  const list = useServerFn(listCommunicationSettings);
  const upsert = useServerFn(upsertCommunicationSetting);
  const del = useServerFn(deleteCommunicationSetting);
  const test = useServerFn(testCommunicationConnection);
  const [rows, setRows] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Setting | null>(null);

  const refresh = async () => {
    setLoading(true);
    try { setRows((await list({ data: { restaurant_id: restaurantId } })) as Setting[]); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [restaurantId]);

  const onTest = async (id: string) => {
    const t = toast.loading("Testando conexão...");
    try {
      const r = await test({ data: { id } }) as any;
      toast.dismiss(t);
      if (r.health === "healthy") toast.success(`Conexão OK (${r.latency_ms}ms)`);
      else toast.error(`Falha: ${r.error ?? r.health}`);
      refresh();
    } catch (e: any) { toast.dismiss(t); toast.error(e.message); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Remover este canal?")) return;
    try { await del({ data: { id } }); toast.success("Canal removido"); refresh(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Configure provedores de mensagens (Evolution API, etc).</p>
        <Button onClick={() => { setEditing(null); setOpen(true); }} variant="gradient">
          <Plus className="h-4 w-4 mr-2" /> Novo canal
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          Nenhum canal configurado ainda.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((s) => (
            <Card key={s.id} className="border-2 border-ink shadow-brutal">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{s.display_name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {s.provider_code} · {s.channel}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {healthBadge(s.health)}
                    <Badge variant={s.is_active ? "default" : "secondary"}>
                      {s.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-1">
                  <div><span className="text-muted-foreground">Endpoint:</span> {(s.config as any)?.endpoint ?? "—"}</div>
                  <div><span className="text-muted-foreground">Instância:</span> {(s.config as any)?.instance ?? "—"}</div>
                  <div><span className="text-muted-foreground">Número:</span> {(s.config as any)?.phone_number ?? "—"}</div>
                  <div><span className="text-muted-foreground">Última sincronização:</span> {s.last_sync_at ? new Date(s.last_sync_at).toLocaleString("pt-BR") : "—"}</div>
                  {s.last_error && (
                    <div className="text-red-600 mt-1"><span className="text-muted-foreground">Erro:</span> {s.last_error}</div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => onTest(s.id)}>
                    <Play className="h-3 w-3 mr-1" /> Testar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(s); setOpen(true); }}>
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDelete(s.id)}>
                    <Trash2 className="h-3 w-3 mr-1 text-red-600" /> Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ChannelDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        restaurantId={restaurantId}
        onSaved={() => { setOpen(false); refresh(); }}
        upsert={upsert}
      />
    </div>
  );
}

function ChannelDialog({
  open, onOpenChange, editing, restaurantId, onSaved, upsert,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  editing: Setting | null; restaurantId: string; onSaved: () => void;
  upsert: ReturnType<typeof useServerFn<typeof upsertCommunicationSetting>>;
}) {
  const [displayName, setDisplayName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [instance, setInstance] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDisplayName(editing?.display_name ?? "WhatsApp Principal");
      setEndpoint(((editing?.config as any)?.endpoint as string) ?? "");
      setInstance(((editing?.config as any)?.instance as string) ?? "");
      setPhone(((editing?.config as any)?.phone_number as string) ?? "");
      setToken("");
      setIsActive(editing?.is_active ?? true);
    }
  }, [open, editing]);

  const save = async () => {
    setSaving(true);
    try {
      await upsert({ data: {
        id: editing?.id,
        restaurant_id: restaurantId,
        provider_code: editing?.provider_code ?? "evolution",
        channel: "whatsapp",
        display_name: displayName,
        config: { endpoint, instance, phone_number: phone },
        is_active: isActive,
        ...(token ? { token } : {}),
      }});
      toast.success(editing ? "Canal atualizado" : "Canal criado");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar canal" : "Novo canal WhatsApp (Evolution API)"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome de exibição</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <Label>Endpoint</Label>
            <Input placeholder="https://evo.seudominio.com" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
          </div>
          <div>
            <Label>Instância</Label>
            <Input placeholder="minha-instancia" value={instance} onChange={(e) => setInstance(e.target.value)} />
          </div>
          <div>
            <Label>Número (com DDI)</Label>
            <Input placeholder="5511999999999" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Token / API Key {editing && <span className="text-xs text-muted-foreground">(deixe em branco para manter)</span>}</Label>
            <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Canal ativo</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="gradient" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// TEMPLATES
// ============================================================================
type Template = {
  id: string;
  restaurant_id: string | null;
  channel: string;
  category: string;
  code: string;
  name: string;
  subject: string | null;
  body: string;
  is_active: boolean;
  version: number;
  variables: string[];
};

const CATEGORIES = [
  { value: "orders", label: "Pedido" },
  { value: "payment", label: "Pagamento" },
  { value: "delivery", label: "Entrega" },
  { value: "system", label: "Sistema" },
  { value: "marketing", label: "Marketing" },
  { value: "crm", label: "CRM" },
];

function TemplatesTab({ restaurantId }: { restaurantId: string }) {
  const list = useServerFn(listCommunicationTemplates);
  const upsert = useServerFn(upsertCommunicationTemplate);
  const del = useServerFn(deleteCommunicationTemplate);
  const preview = useServerFn(previewCommunicationTemplate);

  const [rows, setRows] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [filter, setFilter] = useState("all");

  const refresh = async () => {
    setLoading(true);
    try { setRows((await list({ data: { restaurant_id: restaurantId } })) as Template[]); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [restaurantId]);

  const filtered = useMemo(() =>
    rows.filter((r) => filter === "all" || r.category === filter),
  [rows, filter]);

  const onDuplicate = (t: Template) => {
    setEditing({ ...t, id: undefined as any, code: `${t.code}_copy`, name: `${t.name} (cópia)`, restaurant_id: restaurantId });
    setOpen(true);
  };
  const onDelete = async (id: string) => {
    if (!confirm("Remover template?")) return;
    try { await del({ data: { id } }); toast.success("Removido"); refresh(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo template
        </Button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum template</TableCell></TableRow>
                ) : filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      {t.name}
                      {t.restaurant_id === null && <Badge variant="secondary" className="ml-2 text-xs">Padrão</Badge>}
                    </TableCell>
                    <TableCell><code className="text-xs">{t.code}</code></TableCell>
                    <TableCell>{CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}</TableCell>
                    <TableCell>{t.channel}</TableCell>
                    <TableCell>v{t.version}</TableCell>
                    <TableCell>
                      <Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "Ativo" : "Inativo"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => { setEditing({ ...t, restaurant_id: restaurantId }); setOpen(true); }}>Editar</Button>
                        <Button size="sm" variant="ghost" onClick={() => onDuplicate(t)}><Copy className="h-3 w-3" /></Button>
                        {t.restaurant_id === restaurantId && (
                          <Button size="sm" variant="ghost" onClick={() => onDelete(t.id)}><Trash2 className="h-3 w-3 text-red-600" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <TemplateDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        restaurantId={restaurantId}
        upsert={upsert}
        preview={preview}
        onSaved={() => { setOpen(false); refresh(); }}
      />
    </div>
  );
}

function TemplateDialog({
  open, onOpenChange, editing, restaurantId, upsert, preview, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  editing: Template | null; restaurantId: string;
  upsert: ReturnType<typeof useServerFn<typeof upsertCommunicationTemplate>>;
  preview: ReturnType<typeof useServerFn<typeof previewCommunicationTemplate>>;
  onSaved: () => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("orders");
  const [channel, setChannel] = useState("whatsapp");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [createVersion, setCreateVersion] = useState(false);
  const [previewOut, setPreviewOut] = useState<{ subject: string; body: string; variables: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCode(editing?.code ?? "");
      setName(editing?.name ?? "");
      setCategory(editing?.category ?? "orders");
      setChannel(editing?.channel ?? "whatsapp");
      setSubject(editing?.subject ?? "");
      setBody(editing?.body ?? "");
      setIsActive(editing?.is_active ?? true);
      setCreateVersion(false);
      setPreviewOut(null);
    }
  }, [open, editing]);

  const doPreview = async () => {
    try {
      const sampleVars: Record<string, string> = {
        customer_name: "João Silva", order_number: "1234", order_total: "89.90",
        order_status: "confirmed", restaurant_name: "Restaurante Demo", estimated_minutes: "35",
      };
      const r = await preview({ data: { body, subject: subject || undefined, variables: sampleVars } });
      setPreviewOut(r as any);
    } catch (e: any) { toast.error(e.message); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await upsert({ data: {
        id: editing?.id,
        restaurant_id: restaurantId,
        channel: channel as any,
        category: category as any,
        code, name, subject: subject || null, body, is_active: isActive,
        createNewVersion: createVersion,
      }});
      toast.success("Template salvo");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing?.id ? "Editar template" : "Novo template"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Código (snake_case)</Label><Input value={code} onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))} /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Canal</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Assunto (opcional, para email)</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label>Corpo da mensagem</Label>
            <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)}
              placeholder="Olá {{customer_name}}, seu pedido #{{order_number}} foi confirmado!" />
            <p className="text-xs text-muted-foreground mt-1">
              Use <code>{"{{variavel}}"}</code>. Ex: customer_name, order_number, order_total, order_status, restaurant_name, estimated_minutes.
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Ativo</Label>
            </div>
            {editing?.id && (
              <div className="flex items-center gap-2">
                <Switch checked={createVersion} onCheckedChange={setCreateVersion} />
                <Label>Criar nova versão</Label>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={doPreview}>Pré-visualizar</Button>
          </div>
          {previewOut && (
            <Card className="bg-muted/30">
              <CardContent className="p-3 space-y-2">
                {previewOut.subject && <div className="text-sm"><strong>Assunto:</strong> {previewOut.subject}</div>}
                <div className="text-sm whitespace-pre-wrap"><strong>Mensagem:</strong>{"\n"}{previewOut.body}</div>
                {previewOut.variables.length > 0 && (
                  <div className="text-xs text-muted-foreground">Variáveis: {previewOut.variables.join(", ")}</div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="gradient" onClick={save} disabled={saving || !code || !name || !body}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// FILA
// ============================================================================
type QueueRow = {
  id: string;
  status: "pending" | "processing" | "sent" | "failed" | "retrying" | "dead_letter" | "cancelled";
  channel: string;
  to_address: string;
  event_name: string;
  template_code: string | null;
  rendered_body: string | null;
  attempts: number;
  max_attempts: number;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
  next_retry_at: string | null;
  variables: Record<string, unknown> | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  processing: "bg-purple-500/10 text-purple-700 border-purple-500/30",
  sent: "bg-green-500/10 text-green-700 border-green-500/30",
  failed: "bg-red-500/10 text-red-700 border-red-500/30",
  retrying: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  dead_letter: "bg-gray-800/10 text-gray-900 border-gray-800/30",
  cancelled: "bg-muted text-muted-foreground",
};

function QueueTab({ restaurantId }: { restaurantId: string }) {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const refresh = async () => {
    setLoading(true);
    let q = supabase.from("communication_queue")
      .select("id,status,channel,to_address,event_name,template_code,rendered_body,attempts,max_attempts,error_code,error_message,created_at,sent_at,next_retry_at,variables")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (status !== "all") q = q.eq("status", status as any);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data as QueueRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [restaurantId, status]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      r.to_address.toLowerCase().includes(s) ||
      r.event_name.toLowerCase().includes(s) ||
      (r.variables?.order_number as string)?.toString().toLowerCase().includes(s)
    );
  }, [rows, search]);

  const cancel = async (id: string) => {
    if (!confirm("Cancelar esta mensagem?")) return;
    const { error } = await supabase.from("communication_queue")
      .update({ status: "cancelled" as any, locked_at: null, locked_by: null })
      .eq("id", id).in("status", ["pending", "retrying", "failed"] as any);
    if (error) return toast.error(error.message);
    toast.success("Cancelada"); refresh();
  };

  const retry = async (id: string) => {
    const { error } = await supabase.from("communication_queue")
      .update({ status: "pending" as any, next_retry_at: null, locked_at: null, locked_by: null, attempts: 0 } as any)
      .eq("id", id).in("status", ["failed", "dead_letter", "cancelled"] as any);
    if (error) return toast.error(error.message);
    toast.success("Reenfileirada"); refresh();
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    rows.forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {(["pending", "processing", "sent", "failed", "retrying", "dead_letter"] as const).map((s) => (
          <Card key={s} className="border-2 border-ink shadow-brutal">
            <CardContent className="p-3 text-center">
              <div className="font-display text-2xl">{counts[s] ?? 0}</div>
              <div className="text-xs text-muted-foreground capitalize">{s.replace("_", " ")}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="processing">Processando</SelectItem>
            <SelectItem value="sent">Enviadas</SelectItem>
            <SelectItem value="failed">Falhas</SelectItem>
            <SelectItem value="retrying">Retry</SelectItem>
            <SelectItem value="dead_letter">DLQ</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Buscar por telefone, evento, pedido..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Button variant="outline" onClick={refresh}><RefreshCw className="h-4 w-4 mr-2" /> Atualizar</Button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Criada</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma mensagem</TableCell></TableRow>
                ) : filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_STYLES[r.status]}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{r.event_name}</TableCell>
                    <TableCell className="text-xs">{r.to_address}</TableCell>
                    <TableCell className="text-xs"><code>{r.template_code ?? "—"}</code></TableCell>
                    <TableCell className="text-xs">{r.attempts}/{r.max_attempts}</TableCell>
                    <TableCell className="text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {["failed", "dead_letter", "cancelled"].includes(r.status) && (
                          <Button size="sm" variant="ghost" onClick={() => retry(r.id)} title="Reenfileirar">
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                        {["pending", "retrying", "failed"].includes(r.status) && (
                          <Button size="sm" variant="ghost" onClick={() => cancel(r.id)} title="Cancelar">
                            <X className="h-3 w-3 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
