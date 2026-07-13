import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Rocket } from "lucide-react";
import { toast } from "sonner";
import { AdminPageLayout, Section } from "@/components/ds";

export const Route = createFileRoute("/_authenticated/admin/onboarding")({
  component: Onboarding,
  head: () => ({ meta: [{ title: "Configurar restaurante — Comandex" }] }),
});

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(80),
  whatsapp: z.string().trim().min(10, "Whatsapp obrigatório").max(20),
  description: z.string().trim().max(280).optional(),
});

function translateOnboardingError(msg: string): string {
  if (msg.includes("invalid_name")) return "Nome inválido (2 a 80 caracteres).";
  if (msg.includes("invalid_whatsapp")) return "WhatsApp inválido.";
  if (msg.includes("invalid_description")) return "Descrição muito longa (máx. 280).";
  if (msg.includes("unauthenticated")) return "Sessão expirada, entre novamente.";
  return msg || "Não foi possível criar o restaurante.";
}

function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ name, whatsapp, description });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("create_owned_restaurant", {
      p_name: parsed.data.name,
      p_whatsapp: parsed.data.whatsapp,
      p_description: parsed.data.description ?? null,
    });
    if (error) {
      setSubmitting(false);
      toast.error(translateOnboardingError(error.message));
      return;
    }
    await refreshProfile();
    toast.success("Restaurante criado!");
    nav({ to: "/admin" });
  };

  return (
    <AdminPageLayout
      kicker="Primeiros passos"
      title="Vamos configurar seu restaurante"
      subtitle="Leva menos de 1 minuto. Você pode ajustar tudo depois."
      accent="orange"
      icon={Rocket}
      maxWidth="3xl"
    >
      <Section>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">Nome do restaurante *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Burger do Zé" required />
            <p className="text-xs text-muted-foreground mt-1.5">
              O link da sua loja será gerado automaticamente a partir do nome.
            </p>
          </div>

          <div>
            <Label htmlFor="whatsapp">WhatsApp para receber pedidos *</Label>
            <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" required />
          </div>

          <div>
            <Label htmlFor="desc">Descrição curta</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Os melhores burgers artesanais da cidade" rows={3} />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Criando..." : "Criar restaurante"}
          </Button>
        </form>
      </Section>
    </AdminPageLayout>
  );
}
