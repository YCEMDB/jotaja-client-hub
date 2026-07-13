const segmentos = [
  { emoji: "🍔", nome: "Hamburguerias" },
  { emoji: "🍕", nome: "Pizzarias" },
  { emoji: "🥤", nome: "Lanchonetes" },
  { emoji: "🍝", nome: "Restaurantes" },
  { emoji: "🥖", nome: "Padarias" },
  { emoji: "🍧", nome: "Açaiterias" },
  { emoji: "🍺", nome: "Depósitos de bebidas" },
  { emoji: "🥗", nome: "Hortifrutis" },
  { emoji: "🍣", nome: "Sushi & Japonês" },
  { emoji: "🍰", nome: "Confeitarias" },
  { emoji: "🥘", nome: "Marmitarias" },
  { emoji: "🍦", nome: "Sorveterias" },
];

export function Segmentos() {
  return (
    <section id="segmentos" className="py-20 md:py-28 bg-muted/40">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="inline-block bg-accent-soft text-accent-foreground font-bold text-sm px-4 py-1.5 rounded-full mb-4">
            Para quem é
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold leading-tight">
            Feito para <span className="marker-highlight">qualquer delivery</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Não importa o que você vende — se entrega, Mesivo funciona pra você.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {segmentos.map((s) => (
            <div
              key={s.nome}
              className="bg-card rounded-2xl p-5 text-center border border-border hover:border-accent hover:shadow-accent-lg hover:-translate-y-1 transition-bounce cursor-pointer group"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-bounce">{s.emoji}</div>
              <div className="font-semibold text-sm">{s.nome}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
