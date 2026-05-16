import { useState, type ReactNode } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const SUPPORT_WHATSAPP = "5527992877008";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  restaurant_name: z.string().trim().min(2, "Informe o nome do restaurante").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().min(10, "WhatsApp inválido").max(20),
  city: z.string().trim().max(120).optional(),
  message: z.string().trim().max(500).optional(),
});

type FormState = z.infer<typeof schema>;

const empty: FormState = {
  name: "",
  restaurant_name: "",
  email: "",
  phone: "",
  city: "",
  message: "",
};

interface LeadFormProps {
  variant?: "dark" | "light";
  onDone?: () => void;
}

export function LeadForm({ variant = "light", onDone }: LeadFormProps) {
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("signup_leads").insert({
      name: parsed.data.name,
      restaurant_name: parsed.data.restaurant_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      notes: [parsed.data.city && `Cidade: ${parsed.data.city}`, parsed.data.message]
        .filter(Boolean).join(" — ") || null,
    });
    setBusy(false);

    if (error) {
      toast.error("Não consegui registrar — tente direto no WhatsApp.");
    } else {
      toast.success("Recebido! Abrindo WhatsApp...");
    }

    const txt = encodeURIComponent(
      `Oi! Quero conhecer o ComandaHub.\n\n` +
      `• Nome: ${parsed.data.name}\n` +
      `• Restaurante: ${parsed.data.restaurant_name}\n` +
      `• E-mail: ${parsed.data.email}\n` +
      `• WhatsApp: ${parsed.data.phone}\n` +
      (parsed.data.city ? `• Cidade: ${parsed.data.city}\n` : "") +
      (parsed.data.message ? `\n${parsed.data.message}` : ""),
    );
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${txt}`, "_blank", "noopener");
    setForm(empty);
    onDone?.();
  };

  const labelCls = variant === "dark" ? "text-background/80" : "text-ink/70";
  const inputCls = variant === "dark"
    ? "bg-background/10 border-2 border-background/30 text-background placeholder:text-background/40 focus-visible:border-brand-orange"
    : "bg-background border-2 border-ink text-ink focus-visible:border-brand-orange";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Seu nome" labelCls={labelCls}>
          <Input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="João da Silva" />
        </Field>
        <Field label="Nome do restaurante" labelCls={labelCls}>
          <Input className={inputCls} value={form.restaurant_name} onChange={(e) => set("restaurant_name", e.target.value)} placeholder="Burger do João" />
        </Field>
        <Field label="E-mail" labelCls={labelCls}>
          <Input className={inputCls} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="voce@email.com" />
        </Field>
        <Field label="WhatsApp" labelCls={labelCls}>
          <Input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-9999" />
        </Field>
        <Field label="Cidade" labelCls={labelCls} optional>
          <Input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="São Paulo / SP" />
        </Field>
      </div>
      <Field label="Conte rapidinho sobre seu restaurante" labelCls={labelCls} optional>
        <Textarea className={inputCls} rows={3} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Quantos pedidos por dia, o que está usando hoje..." />
      </Field>
      <Button
        type="submit"
        size="lg"
        disabled={busy}
        className="w-full rounded-xl bg-brand-orange hover:bg-brand-orange text-ink font-bold h-14 text-base shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-wider border-2 border-ink"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <>
            <MessageCircle className="w-5 h-5 mr-2" strokeWidth={3} />
            Quero começar grátis
            <ArrowRight className="w-5 h-5 ml-2" strokeWidth={3} />
          </>
        )}
      </Button>
      <p className={`text-[11px] text-center ${variant === "dark" ? "text-background/50" : "text-ink/50"}`}>
        Ao enviar, você abre uma conversa com a gente no WhatsApp.
      </p>
    </form>
  );
}

function Field({ label, children, labelCls, optional }: { label: string; children: ReactNode; labelCls: string; optional?: boolean }) {
  return (
    <div>
      <Label className={`text-[11px] uppercase tracking-[0.15em] font-bold mb-1.5 block ${labelCls}`}>
        {label} {optional && <span className="opacity-60 font-medium normal-case tracking-normal">(opcional)</span>}
      </Label>
      {children}
    </div>
  );
}

interface DialogProps {
  trigger: ReactNode;
}

export function LeadFormDialog({ trigger }: DialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl border-2 border-ink shadow-brutal-lg bg-background p-0 overflow-hidden">
        <div className="bg-ink text-background px-6 py-5 border-b-2 border-ink relative overflow-hidden">
          <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
          <DialogHeader className="relative">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-background/70">14 dias grátis · sem cartão</span>
            </div>
            <DialogTitle className="font-display text-2xl md:text-3xl text-background leading-tight tracking-tight">
              Vamos colocar seu delivery no ar.
            </DialogTitle>
            <p className="text-sm text-background/70 mt-1">
              Preencha pra gente entender seu cenário. Em seguida você fala direto com o time no WhatsApp.
            </p>
          </DialogHeader>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <LeadForm onDone={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
