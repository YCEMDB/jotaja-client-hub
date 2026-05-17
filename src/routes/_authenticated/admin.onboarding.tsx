import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { isReservedSlug } from "@/lib/reserved-slugs";

export const Route = createFileRoute("/_authenticated/admin/onboarding")({
  component: Onboarding,
  head: () => ({ meta: [{ title: "Configurar restaurante — ComandaHub" }] }),
});

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(80),
  whatsapp: z.string().trim().min(10, "Whatsapp obrigatório").max(20),
  description: z.string().trim().max(280).optional(),
});

function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function generateUniqueSlug(base: string): Promise<string> {
    let candidate = slugify(base) || "loja";
    if (isReservedSlug(candidate)) candidate = `${candidate}-loja`;
    for (let i = 0; i < 20; i++) {
      const try_ = i === 0 ? candidate : `${candidate}-${i + 1}`;
      const { data } = await supabase.from("restaurants").select("id").eq("slug", try_).maybeSingle();
      if (!data) return try_;
    }
    return `${candidate}-${Date.now().toString(36)}`;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ name, whatsapp, description });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const slug = await generateUniqueSlug(parsed.data.name);
    const { data, error } = await supabase
      .from("restaurants")
      .insert({ owner_id: user.id, slug, ...parsed.data })
      .select("id")
      .single();
    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }
    await supabase.from("user_roles").insert({ user_id: user.id, role: "owner", restaurant_id: data.id });
    await supabase.from("profiles").update({ restaurant_id: data.id }).eq("id", user.id);
    await refreshProfile();
    toast.success("Restaurante criado!");
    nav({ to: "/admin" });
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl text-ink tracking-tight leading-[0.95]">Vamos configurar seu restaurante</h1>
        <p className="text-muted-foreground mt-2">Leva menos de 1 minuto. Você pode ajustar tudo depois.</p>
      </div>

      <Card className="p-4 md:p-8">
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
      </Card>
    </div>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
}
