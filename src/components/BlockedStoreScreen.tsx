import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MessageCircle, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function BlockedStoreScreen({ restaurantName, reason }: { restaurantName: string; reason: "trial" | "subscription" }) {
  const { signOut } = useAuth();
  const whatsapp = "5527992877008"; // Ghabriel
  const msg = encodeURIComponent(
    `Olá! Sou da loja "${restaurantName}" e meu acesso ao Comandex foi bloqueado. Quero regularizar o pagamento.`,
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="max-w-lg w-full p-8 text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Acesso bloqueado</h1>
          <p className="text-muted-foreground">
            {reason === "trial"
              ? `O período de teste de "${restaurantName}" terminou.`
              : `A assinatura de "${restaurantName}" venceu ou está pendente.`}
          </p>
          <p className="text-sm text-muted-foreground">
            Entre em contato para regularizar e voltar a receber pedidos.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild size="lg">
            <a href={`https://wa.me/${whatsapp}?text=${msg}`} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" /> Falar no WhatsApp
            </a>
          </Button>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </Card>
    </div>
  );
}
