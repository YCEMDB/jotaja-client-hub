import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center text-white font-bold text-sm shadow-blue">
                C
              </div>
              <span className="font-display font-bold text-lg tracking-tight">
                Comanda
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              A plataforma de delivery próprio para restaurantes que querem crescer com autonomia.
            </p>
          </div>

          {[
            {
              title: "Produto",
              links: [
                { label: "Funcionalidades", href: "#funcionalidades" },
                { label: "Planos", href: "#planos" },
                { label: "Depoimentos", href: "#depoimentos" },
                { label: "FAQ", href: "#faq" },
              ],
            },
            {
              title: "Empresa",
              links: [
                { label: "Sobre", href: "#" },
                { label: "Contato", href: "#" },
                { label: "Blog", href: "#" },
              ],
            },
            {
              title: "Legal",
              links: [
                { label: "Termos", href: "#" },
                { label: "Privacidade", href: "#" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Comanda. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Feito com cuidado para restaurantes brasileiros.
          </p>
        </div>
      </div>
    </footer>
  );
}
