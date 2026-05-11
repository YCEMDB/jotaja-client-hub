import { useState, useMemo } from "react";
import { TrendingUp, Calculator } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export function Calculadora() {
  const [pedidos, setPedidos] = useState([300]);
  const [ticket, setTicket] = useState([45]);
  const [comissao, setComissao] = useState([20]);

  const economia = useMemo(() => {
    const faturamentoMes = pedidos[0] * ticket[0];
    const comissaoMes = (faturamentoMes * comissao[0]) / 100;
    const economiaMes = comissaoMes - 99; // mensalidade ComandaHub
    const economiaAno = economiaMes * 12;
    return {
      faturamento: faturamentoMes,
      comissao: comissaoMes,
      mes: Math.max(economiaMes, 0),
      ano: Math.max(economiaAno, 0),
    };
  }, [pedidos, ticket, comissao]);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return (
    <section className="py-20 md:py-28 bg-gradient-warm">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 bg-accent-soft text-accent-foreground font-bold text-sm px-4 py-1.5 rounded-full mb-4">
            <Calculator className="w-4 h-4" /> Calculadora
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold leading-tight">
            Quanto você está <span className="marker-highlight">deixando na mesa?</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="bg-card rounded-3xl p-8 shadow-card border border-border space-y-6">
            <div>
              <div className="flex justify-between mb-3">
                <label className="font-semibold">Pedidos por mês</label>
                <span className="font-display font-extrabold text-primary text-lg">{pedidos[0]}</span>
              </div>
              <Slider value={pedidos} onValueChange={setPedidos} min={50} max={2000} step={50} />
            </div>
            <div>
              <div className="flex justify-between mb-3">
                <label className="font-semibold">Ticket médio</label>
                <span className="font-display font-extrabold text-primary text-lg">{fmt(ticket[0])}</span>
              </div>
              <Slider value={ticket} onValueChange={setTicket} min={20} max={200} step={5} />
            </div>
            <div>
              <div className="flex justify-between mb-3">
                <label className="font-semibold">Comissão atual do app</label>
                <span className="font-display font-extrabold text-primary text-lg">{comissao[0]}%</span>
              </div>
              <Slider value={comissao} onValueChange={setComissao} min={5} max={30} step={1} />
            </div>
          </div>

          <div className="bg-gradient-primary rounded-3xl p-8 lg:p-10 text-primary-foreground shadow-elegant relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent/30 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2 text-primary-foreground/70 font-semibold uppercase text-xs tracking-wider">
                <TrendingUp className="w-4 h-4" /> Sua economia com ComandaHub
              </div>
              <div className="font-display text-6xl lg:text-7xl font-extrabold mb-2 text-accent">
                {fmt(economia.ano)}
              </div>
              <div className="text-primary-foreground/80 mb-6">por ano</div>

              <div className="space-y-3 border-t border-primary-foreground/15 pt-6 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-80">Faturamento mensal</span>
                  <span className="font-bold">{fmt(economia.faturamento)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Comissão paga hoje</span>
                  <span className="font-bold text-destructive">-{fmt(economia.comissao)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Mensalidade ComandaHub</span>
                  <span className="font-bold">R$ 99</span>
                </div>
                <div className="flex justify-between text-base pt-3 border-t border-primary-foreground/15">
                  <span className="font-bold">Você economiza/mês</span>
                  <span className="font-extrabold text-accent">{fmt(economia.mes)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
