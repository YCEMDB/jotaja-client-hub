import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import { adminUpsertSetting, translateAdminError } from "@/lib/super-admin";

export const Route = createFileRoute("/_super/super/configuracoes")({
  component: ConfiguracoesPage,
  head: () => ({ meta: [{ title: "Super-Admin — Configurações" }] }),
});

const SETTINGS_KEYS = [
  { key: "support_whatsapp", label: "WhatsApp de suporte", placeholder: "5527992877008" },
  { key: "support_email", label: "E-mail de suporte", placeholder: "contato@comandahub.online" },
  { key: "public_url", label: "URL pública", placeholder: "https://comandahub.online" },
  { key: "company_name", label: "Razão social", placeholder: "Comandex Tecnologia" },
  { key: "company_cnpj", label: "CNPJ", placeholder: "00.000.000/0001-00" },
] as const;

function ConfiguracoesPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("key,value");
    const map: Record<string, string> = {};
    (data ?? []).forEach((row: { key: string; value: unknown }) => {
      const v = row.value;
      map[row.key] =
        typeof v === "string"
          ? v
          : v && typeof v === "object" && "value" in (v as Record<string, unknown>)
            ? String((v as Record<string, unknown>).value ?? "")
            : JSON.stringify(v);
    });
    setValues(map);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (key: string) => {
    const reason = (reasons[key] ?? "").trim();
    if (reason.length < 5) {
      toast.error("Informe um motivo (mínimo 5 caracteres).");
      return;
    }
    setSaving(key);
    try {
      const res = await adminUpsertSetting({
        key,
        value: values[key] ?? "",
        reason,
      });
      if (res.changed) {
        toast.success("Configuração salva");
        setReasons((r) => ({ ...r, [key]: "" }));
        await load();
      } else {
        toast.message("Sem alterações");
      }
    } catch (err) {
      toast.error(translateAdminError(err));
    } finally {
      setSaving(null);
    }
  };

  return (
    <AdminPageLayout
      kicker="Super-admin"
      title="Configurações"
      subtitle="Valores globais usados pela landing e pelo painel"
      accent="violet"
      icon={Settings2}
      maxWidth="3xl"
    >
      {loading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (
        <div className="space-y-3">
          {SETTINGS_KEYS.map((s) => (
            <Card key={s.key} className="p-4 space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold">{s.label}</Label>
              <Input
                placeholder={s.placeholder}
                value={values[s.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
              />
              <Textarea
                placeholder="Motivo da alteração (mín. 5 caracteres) — auditado"
                value={reasons[s.key] ?? ""}
                onChange={(e) => setReasons((r) => ({ ...r, [s.key]: e.target.value }))}
                rows={2}
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">
                  Chave: <code>{s.key}</code>
                </p>
                <Button onClick={() => save(s.key)} disabled={saving === s.key}>
                  {saving === s.key ? "Salvando…" : "Salvar"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminPageLayout>
  );
}
