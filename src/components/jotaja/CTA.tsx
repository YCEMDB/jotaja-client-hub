import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20),
  restaurante: z.string().trim().min(2, "Nome do restaurante muito curto").max(100),
});

export function CTA() {
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", restaurante: "" });
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      toast.success("Recebemos seu cadastro! Em breve entraremos em contato 🎉");
      setForm({ nome: "", email: "", telefone: "", restaurante: "" });
      setLoading(false);
    }, 800);
  };

  return (
    <section id="cadastro" className="py-20 md:py-28 bg-gradient-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent blur-3xl" />
      </div>

      <div className="container relative mx-auto px-6 max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-accent text-accent-foreground font-bold text-sm px-4 py-1.5 rounded-full mb-5">
              Comece grátis hoje
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold leading-tight mb-5">
              Pronto pra <span className="text-accent">parar de pagar comissão?</span>
            </h2>
            <p className="text-lg text-primary-foreground/85 mb-6 leading-relaxed">
              14 dias grátis em qualquer plano. Sem cartão. Sem fidelidade. Configure em 5 minutos e comece a vender ainda hoje.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-accent" /> Onboarding guiado por especialistas</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-accent" /> Importação do seu cardápio atual</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-accent" /> Suporte WhatsApp todos os dias</li>
            </ul>
          </div>

          <form onSubmit={submit} className="bg-card text-foreground rounded-3xl p-7 md:p-8 shadow-elegant space-y-3">
            <h3 className="font-display font-extrabold text-2xl mb-1">Quero testar grátis</h3>
            <p className="text-muted-foreground text-sm mb-4">Em 5 min você está vendendo.</p>
            <Input
              placeholder="Seu nome*"
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="h-12 bg-muted border-0"
              maxLength={100}
            />
            <Input
              placeholder="Nome do seu restaurante*"
              required
              value={form.restaurante}
              onChange={(e) => setForm({ ...form, restaurante: e.target.value })}
              className="h-12 bg-muted border-0"
              maxLength={100}
            />
            <Input
              type="email"
              placeholder="Seu melhor e-mail*"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-12 bg-muted border-0"
              maxLength={255}
            />
            <Input
              placeholder="WhatsApp com DDD*"
              required
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              className="h-12 bg-muted border-0"
              maxLength={20}
            />
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full h-13 rounded-full font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent-lg"
            >
              {loading ? "Enviando..." : (<>Criar minha conta grátis <ArrowRight className="ml-2 w-5 h-5" /></>)}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Ao continuar você aceita nossos termos e política de privacidade.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
