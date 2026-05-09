import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration = 2000) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          setVal(Math.floor(p * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);

  return { val, ref };
}

export function Stats() {
  const a = useCountUp(2500);
  const b = useCountUp(80);
  const c = useCountUp(15);

  return (
    <section id="clientes" className="py-20 bg-gradient-primary text-primary-foreground">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div ref={a.ref}>
            <div className="font-display text-5xl md:text-6xl font-black mb-2">+{a.val.toLocaleString("pt-BR")}</div>
            <p className="text-lg text-primary-foreground/90">Clientes ativos e satisfeitos</p>
          </div>
          <div ref={b.ref}>
            <div className="font-display text-5xl md:text-6xl font-black mb-2">+{b.val}</div>
            <p className="text-lg text-primary-foreground/90">Colaboradores treinados</p>
          </div>
          <div ref={c.ref}>
            <div className="font-display text-5xl md:text-6xl font-black mb-2">{c.val}+</div>
            <p className="text-lg text-primary-foreground/90">Anos de experiência no mercado</p>
          </div>
        </div>
      </div>
    </section>
  );
}
