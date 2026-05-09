import { Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import heroImg from "@/assets/hero-restaurant.jpg";

export function Hero() {
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Recebemos seu contato! Em breve um consultor entrará em contato.");
      setForm({ nome: "", email: "", telefone: "" });
      setLoading(false);
    }, 800);
  };

  return (
    <section id="inicio" className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Restaurante elegante"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/40" />
      </div>

      <div className="container relative mx-auto px-6 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-primary mb-4 uppercase tracking-wide">
              Entre em contato e conheça nossos planos!
            </p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] text-foreground mb-6">
              Tenha sua própria base{" "}
              <span className="text-primary">de clientes no delivery!</span>
            </h1>
            <div className="w-20 h-1.5 bg-primary rounded-full mb-6" />
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              O <strong className="text-foreground">Jotajá</strong> é um programa que agiliza as entregas
              de pedidos online, feitas para seu restaurante, usando o WhatsApp e as redes sociais
              como principais canais de comunicação.
            </p>
            <Button size="lg" variant="outline" className="rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold" asChild>
              <a href="#funcionalidades">
                Ver como funciona <Play className="ml-2 w-4 h-4 fill-current" />
              </a>
            </Button>
          </div>

          {/* Right: form */}
          <div id="contato" className="bg-card rounded-3xl shadow-elegant p-8 md:p-10 border border-border">
            <h2 className="font-display text-2xl md:text-3xl font-black text-primary text-center mb-2">
              RECEBA NOSSA LIGAÇÃO!
            </h2>
            <p className="text-center text-muted-foreground mb-6">
              Preencha o formulário e aguarde nosso contato!
            </p>
            <form onSubmit={submit} className="space-y-4">
              <Input
                placeholder="Seu nome*"
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="h-12 bg-muted border-0 rounded-lg"
              />
              <Input
                type="email"
                placeholder="Seu e-mail*"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-12 bg-muted border-0 rounded-lg"
              />
              <Input
                placeholder="Seu ddd + telefone*"
                required
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                className="h-12 bg-muted border-0 rounded-lg"
              />
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full h-12 rounded-lg font-bold uppercase tracking-wide shadow-elegant"
              >
                {loading ? "Enviando..." : (<>Receber ligação <ArrowRight className="ml-2 w-4 h-4" /></>)}
              </Button>
              <p className="text-xs text-muted-foreground border-l-2 border-primary pl-3">
                *Não compartilhamos informações pessoais
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
