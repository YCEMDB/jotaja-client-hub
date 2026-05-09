import { Phone, MessageCircle, Mail, MapPin, Instagram, Facebook, Linkedin } from "lucide-react";
import logo from "@/assets/comanda-logo.png";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Comanda" className="h-10 w-10" width={40} height={40} loading="lazy" />
              <span className="font-display font-extrabold text-2xl">Comanda<span className="text-accent">.</span></span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-4">
              Plataforma de delivery próprio para restaurantes que querem sua marca, seus clientes e zero comissão.
            </p>
            <div className="flex gap-2">
              {[Instagram, Facebook, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-smooth">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4 text-accent">Produto</h4>
            <ul className="space-y-2 text-primary-foreground/70 text-sm">
              <li><a href="#funcionalidades" className="hover:text-accent transition-smooth">Funcionalidades</a></li>
              <li><a href="#como-funciona" className="hover:text-accent transition-smooth">Como funciona</a></li>
              <li><a href="#planos" className="hover:text-accent transition-smooth">Planos</a></li>
              <li><a href="#segmentos" className="hover:text-accent transition-smooth">Para quem é</a></li>
              <li><a href="#faq" className="hover:text-accent transition-smooth">Perguntas frequentes</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4 text-accent">Contato</h4>
            <ul className="space-y-3 text-primary-foreground/70 text-sm">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-accent" /> (21) 2042-2913</li>
              <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-accent" /> (21) 9 6475-7948</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-accent" /> oi@comanda.app</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Rio de Janeiro, RJ</li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4 text-accent">Suporte humanizado</h4>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-3">
              Atendimento todos os dias, inclusive feriados.
            </p>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="font-display font-extrabold text-2xl text-accent">8h — 22h</div>
              <div className="text-xs text-primary-foreground/70">WhatsApp · Tel · E-mail</div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row gap-4 justify-between items-center text-sm text-primary-foreground/60">
          <p>© {new Date().getFullYear()} Comanda. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-accent transition-smooth">Política de Privacidade</a>
            <a href="#" className="hover:text-accent transition-smooth">Termos de Uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
