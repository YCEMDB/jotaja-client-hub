import { Check, Minus } from "lucide-react";
import { Reveal } from "./Reveal";

type Cell = boolean | string;

const plans = ["Starter", "Pro", "Business"] as const;

const groups: { title: string; rows: { feature: string; values: [Cell, Cell, Cell]; hint?: string }[] }[] = [
  {
    title: "Cardápio e pedidos",
    rows: [
      { feature: "Cardápio digital ilimitado", values: [true, true, true] },
      { feature: "Pedidos online via link", values: [true, true, true] },
      { feature: "Adicionais e variações", values: [true, true, true] },
      { feature: "Cupons e promoções", values: [false, true, true] },
      { feature: "Programa de fidelidade", values: [false, false, true] },
    ],
  },
  {
    title: "Pagamento e entrega",
    rows: [
      { feature: "Pix e cartão na entrega", values: [true, true, true] },
      { feature: "Pagamento online (Pix instantâneo)", values: [false, true, true] },
      { feature: "Áreas de entrega por bairro", values: [false, true, true] },
      { feature: "Gestão de motoboys", values: [false, true, true] },
      { feature: "Múltiplas unidades", values: [false, false, true] },
    ],
  },
  {
    title: "Gestão e dados",
    rows: [
      { feature: "Relatórios básicos", values: [true, true, true] },
      { feature: "Relatórios avançados", values: [false, true, true] },
      { feature: "Exportação de dados (CSV)", values: [false, true, true] },
      { feature: "API e integrações", values: [false, false, true] },
      { feature: "Usuários", values: ["1", "5", "Ilimitados"] },
    ],
  },
  {
    title: "Suporte",
    rows: [
      { feature: "Suporte por e-mail", values: [true, true, true] },
      { feature: "WhatsApp prioritário", values: [false, true, true] },
      { feature: "Gerente de sucesso dedicado", values: [false, false, true] },
      { feature: "Onboarding guiado", values: [false, true, true] },
    ],
  },
];

function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary">
        <Check className="w-3.5 h-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 text-muted-foreground/50">
        <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  return <span className="text-sm font-medium text-foreground">{value}</span>;
}

export function ComparativoPlanos() {
  return (
    <section id="comparativo" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        <Reveal className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Compare os planos
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            Veja o que entra em cada plano.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Todos os planos incluem o essencial. Conforme você cresce, libere recursos avançados.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-14 max-w-5xl mx-auto">
          {/* Desktop / tablet table */}
          <div className="hidden md:block rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60">
                  <tr>
                    <th className="text-left font-semibold text-foreground py-5 px-6 w-2/5">
                      Recursos
                    </th>
                    {plans.map((p) => (
                      <th
                        key={p}
                        className={`text-center font-semibold py-5 px-4 ${
                          p === "Pro" ? "text-primary" : "text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {p}
                          {p === "Pro" && (
                            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                              Popular
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <>
                      <tr key={`g-${group.title}`} className="bg-secondary/30">
                        <td
                          colSpan={4}
                          className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
                        >
                          {group.title}
                        </td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr
                          key={row.feature}
                          className="border-t border-border hover:bg-secondary/40 transition-smooth"
                        >
                          <td className="py-3.5 px-6 text-foreground/90">{row.feature}</td>
                          {row.values.map((v, i) => (
                            <td
                              key={i}
                              className={`py-3.5 px-4 text-center ${
                                plans[i] === "Pro" ? "bg-primary/[0.03]" : ""
                              }`}
                            >
                              <CellValue value={v} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: stacked cards per plan */}
          <div className="md:hidden space-y-5">
            {plans.map((p, planIdx) => (
              <div
                key={p}
                className={`rounded-2xl border bg-card p-5 ${
                  p === "Pro" ? "border-primary shadow-blue" : "border-border shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-sm font-semibold">{p}</span>
                  {p === "Pro" && (
                    <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                      Popular
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-5">
                  {groups.map((group) => (
                    <div key={group.title}>
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {group.title}
                      </div>
                      <ul className="mt-2 space-y-2">
                        {group.rows.map((row) => (
                          <li
                            key={row.feature}
                            className="flex items-center justify-between gap-3 text-sm py-1"
                          >
                            <span className="text-foreground/85">{row.feature}</span>
                            <CellValue value={row.values[planIdx]} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
