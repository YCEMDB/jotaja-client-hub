import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePlanFeatures, type PlanFeatures } from "@/hooks/usePlanFeatures";

const FEATURE_LABEL: Record<string, { title: string; need: string }> = {
  coupons:         { title: "Cupons promocionais", need: "Pro" },
  drivers:         { title: "Gestão de entregadores", need: "Pro" },
  manual_pdv:      { title: "PDV manual (balcão)", need: "Pro" },
  online_payment:  { title: "Pagamento online (PIX/cartão)", need: "Pro" },
  auto_print:      { title: "Impressão automática", need: "Pro" },
  advanced_reports:{ title: "Relatórios avançados", need: "Pro" },
  api_access:      { title: "Acesso à API", need: "Business" },
  multi_location:  { title: "Multi-unidades", need: "Business" },
  communication_channels_max: { title: "Central de Comunicação (WhatsApp)", need: "Pro" },
  tables_max:      { title: "Controle de Mesas e Comandas", need: "Pro" },
};

export function FeatureGate({
  feature,
  children,
  fallback,
}: {
  feature: keyof PlanFeatures;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { has, plan, loading } = usePlanFeatures();
  if (loading) return null;
  if (has(feature)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  const info = FEATURE_LABEL[feature as string] ?? { title: String(feature), need: "Pro" };

  return (
    <div className="p-4 md:p-8">
      <Card className="p-8 md:p-12 text-center max-w-2xl mx-auto border-2 border-ink shadow-brutal card-brand">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-sunset text-background mb-4 border-2 border-ink shadow-brutal">
          <Lock className="h-6 w-6" />
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
          Disponível no plano {info.need}
        </p>
        <h2 className="font-display text-3xl md:text-4xl text-ink mt-1 mb-2 tracking-tight leading-tight">
          {info.title}
        </h2>
        <p className="text-muted-foreground mb-6">
          Seu plano atual <strong>{plan?.name ?? "Starter"}</strong> não inclui este recurso.
          Faça upgrade para desbloquear e turbinar o seu restaurante.
        </p>
        <Button asChild variant="gradient" size="lg" className="lift-on-hover">
          <Link to="/admin/configuracoes">
            <Sparkles className="h-4 w-4 mr-2" /> Ver planos e fazer upgrade
          </Link>
        </Button>
      </Card>
    </div>
  );
}
