import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";
import logo from "@/assets/jotaja-logo.png";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="" className="h-10 w-10 brightness-0 invert" width={40} height={40} loading="lazy" />
              <span className="font-display font-black text-2xl">JOTAJÁ</span>
            </div>
            <p className="text-background/70 text-sm leading-relaxed">
              Plataforma de gestão de pedidos delivery para restaurantes que querem sua própria base de clientes.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4">Navegação</h4>
            <ul className="space-y-2 text-background/70 text-sm">
              <li><a href="#inicio" className="hover:text-primary transition-smooth">Início</a></li>
              <li><a href="#vantagens" className="hover:text-primary transition-smooth">Vantagens</a></li>
              <li><a href="#funcionalidades" className="hover:text-primary transition-smooth">Funcionalidades</a></li>
              <li><a href="#faq" className="hover:text-primary transition-smooth">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4">Contato</h4>
            <ul className="space-y-3 text-background/70 text-sm">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> 21 2042-2913</li>
              <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary" /> 21 9 6475-7948</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> contato@jotaja.com.br</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Rio de Janeiro, RJ</li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4">Suporte</h4>
            <p className="text-background/70 text-sm leading-relaxed">
              Atendimento todos os dias, inclusive feriados, das <strong>8h às 22h</strong>.
            </p>
          </div>
        </div>

        <div className="border-t border-background/10 pt-6 flex flex-col md:flex-row gap-4 justify-between items-center text-sm text-background/60">
          <p>© {new Date().getFullYear()} Jotajá. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-smooth">Política de Privacidade</a>
            <a href="#" className="hover:text-primary transition-smooth">Termos de Uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
