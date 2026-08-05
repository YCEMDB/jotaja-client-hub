import { createFileRoute } from "@tanstack/react-router";
import { useId } from "react";
import { PROTO_CSS } from "@/dev-proto/proto-tokens";

export const Route = createFileRoute("/dev/logo-lab")({
  component: LogoLab,
  head: () => ({
    meta: [
      { title: "Mesivo · Logo Lab (dev)" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function LogoLab() {
  const logos = [
    { component: OptionNexus, label: "04 · Nexus Brutalista", desc: "Interseção geométrica pura." },
    { component: OptionFlux, label: "05 · Fluxo Contínuo", desc: "A linha que nunca para." },
    { component: OptionCore, label: "06 · Core Atômico", desc: "O centro da operação." },
    { component: OptionData, label: "07 · Matriz de Dados", desc: "Ordem e volume." },
    { component: OptionSync, label: "08 · Sincronia Laser", desc: "Precisão absoluta." },
    { component: OptionWave, label: "09 · Onda de Status", desc: "Ritmo de pedidos." },
    { component: OptionGrid, label: "10 · Grid de Comando", desc: "Visão 360 do salão." },
    { component: OptionFlow, label: "11 · Flow Dinâmico", desc: "Agilidade pura." },
    { component: OptionApex, label: "12 · Ápice Operacional", desc: "O topo da performance." },
  ];

  return (
    <div className="mkt-root bg-ink min-h-screen p-8 md:p-16 text-[#FFF8EE] overflow-y-auto">
      <style dangerouslySetInnerHTML={{ __html: PROTO_CSS }} />
      <style>{`
        .logo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }
        .logo-card {
          background: #0F0A08;
          border: 1px solid #2A1F1B;
          border-radius: 1.5rem;
          padding: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          transition: all 0.3s ease;
        }
        .logo-card:hover {
          border-color: #ff6b35;
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
          background: #1A120F;
        }
        .logo-label {
          font-family: "Manrope", sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .logo-name {
          font-family: "Manrope", sans-serif;
          font-weight: 800;
          font-size: 2.5rem;
          letter-spacing: -0.04em;
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', color: '#FFF8EE' }}>
            Logo <span className="text-[#ff6b35]">Lab</span> <span className="text-sm opacity-50">v6</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl font-sans">
            Expandi o laboratório com <strong>9 novas opções</strong> baseadas em linguagens de design variadas para a Mesivo.
          </p>
        </header>

        <div className="logo-grid">
          {logos.map((logo, i) => (
            <div key={i} className="logo-card">
              <span className="logo-label">Opção {logo.label}</span>
              <div className="flex items-center gap-6">
                <logo.component size={80} />
                <span className="logo-name">mesivo</span>
              </div>
              <p className="text-sm text-center text-gray-500 max-w-[240px]">
                {logo.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OptionNexus({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#FF6B35" />
          <stop offset="1" stopColor="#E84393" />
        </linearGradient>
      </defs>
      <path d="M4 42L16 6L24 24L32 6L44 42H34L28 26L24 32L20 26L14 42H4Z" fill={`url(#${id})`} />
    </svg>
  );
}

function OptionFlux({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#7C5CFF" />
          <stop offset="1" stopColor="#E84393" />
        </linearGradient>
      </defs>
      <path d="M4 24H10L14 10L24 38L34 10L38 24H44" stroke={`url(#${id})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OptionCore({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#FFB82E" />
          <stop offset="1" stopColor="#FF6B35" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" stroke={`url(#${id})`} strokeWidth="4" strokeDasharray="10 5" />
      <path d="M16 30V18L24 26L32 18V30" stroke={`url(#${id})`} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function OptionData({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="6" y="6" width="10" height="10" rx="2" fill="#FF6B35" />
      <rect x="20" y="6" width="10" height="10" rx="2" fill="#FF6B35" opacity="0.6" />
      <rect x="34" y="6" width="10" height="10" rx="2" fill="#FF6B35" opacity="0.2" />
      <rect x="6" y="20" width="10" height="10" rx="2" fill="#E84393" />
      <rect x="20" y="20" width="10" height="10" rx="2" fill="#E84393" />
      <rect x="34" y="20" width="10" height="10" rx="2" fill="#E84393" opacity="0.6" />
      <path d="M6 34L24 34L42 34" stroke="#FFF8EE" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function OptionSync({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M8 8V40H40" stroke="#7C5CFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 32L18 22L28 28L40 10" stroke="#FF6B35" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OptionWave({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M4 36C12 36 12 12 24 12C36 12 36 36 44 36" stroke="#FFB82E" strokeWidth="6" strokeLinecap="round" />
      <circle cx="24" cy="12" r="4" fill="#E84393" />
    </svg>
  );
}

function OptionGrid({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="6" y="6" width="36" height="36" rx="6" stroke="#FFF8EE" strokeWidth="2" opacity="0.2" />
      <path d="M14 34V14L24 24L34 14V34" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OptionFlow({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M10 10H38C40 10 42 12 42 14V34C42 36 40 38 38 38H10C8 38 6 36 6 34V14C6 12 8 10 10 10Z" stroke="#7C5CFF" strokeWidth="3" />
      <path d="M12 24L18 30L36 12" stroke="#FFB82E" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OptionApex({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 6L44 38H4L24 6Z" stroke="#E84393" strokeWidth="4" strokeLinejoin="round" />
      <path d="M18 30L24 24L30 30" stroke="#FFF8EE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="22" y="32" width="4" height="6" fill="#FFB82E" />
    </svg>
  );
}