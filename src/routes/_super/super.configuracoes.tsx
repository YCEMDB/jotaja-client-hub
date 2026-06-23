import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_super/super/configuracoes")({
  component: ConfiguracoesPage,
  head: () => ({ meta: [{ title: "Super-Admin — Configurações" }] }),
});

const SETTINGS_KEYS = [
  { key: "support_whatsapp", label: "WhatsApp de suporte", placeholder: "5527992877008" },
  { key: "support_email", label: "E-mail de suporte", placeholder: "contato@comandahub.online" },
  { key: "company_name", label: "Razão social", placeholder: "Comandex Tecnologia" },
  { key: "company_cnpj", label: "CNPJ", placeholder: "00.000.000/0001-00" },
] as const;

function ConfiguracoesPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("key,value");
    const map: Record<string, string> = {};
    (data ?? []).forEach((row: any) => {
      const v = row.value;
      map[row.key] = typeof v === "string" ? v : (v?.value ?? JSON.stringify(v));
    });
    setValues(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (key: string) => {
    setSaving(key);
    const { error } = await supabase.from("app_settings").upsert({
      key,
      value: values[key] ?? "",
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    setSaving(null);
    if (error) return toast.error(error.message);
    toast.success("Configuração salva");
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Settings2 className="h-8 w-8 text-brand-violet" />
        <div>
          <h1 className="font-display text-4xl md:text-5xl text-ink tracking-tight leading-[0.95]">Configurações</h1>
          <p className="text-muted-foreground">Valores globais usados pela landing e pelo painel</p>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (
        <div className="space-y-3">
          {SETTINGS_KEYS.map((s) => (
            <Card key={s.key} className="p-4 space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold">{s.label}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={s.placeholder}
                  value={values[s.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                />
                <Button onClick={() => save(s.key)} disabled={saving === s.key}>
                  {saving === s.key ? "Salvando…" : "Salvar"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Chave: <code>{s.key}</code></p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
