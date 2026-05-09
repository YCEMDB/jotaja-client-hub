import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/5521964757948?text=Oi! Quero conhecer o Comanda."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-success text-success-foreground rounded-full shadow-elegant px-5 py-4 flex items-center gap-2 font-bold hover:scale-105 transition-bounce animate-pulse-glow"
    >
      <MessageCircle className="w-5 h-5" fill="currentColor" />
      <span className="hidden sm:inline">Fale no WhatsApp</span>
    </a>
  );
}
