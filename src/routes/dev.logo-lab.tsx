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
            Logo <span className="text-[#ff6b35]">Lab</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl font-sans">
            Analisei o sistema Mesivo e seus fluxos operacionais para criar estas 3 novas opções baseadas em <strong>Movimento Operacional</strong>, 
            <strong>Ponto de Contato</strong> e <strong>Sincronia Operacional</strong>.
          </p>
        </header>

        <div className="logo-grid">
          {/* Opção 1: O "M" de Movimento (Baseado nos Dashboards e Fluxos) */}
          <div className="logo-card">
            <span className="logo-label">Opção 01 · Dinâmica Operacional</span>
            <div className="flex items-center gap-6">
              <LogoOption1 size={80} />
              <span className="logo-name">mesivo</span>
            </div>
            <p className="text-sm text-center text-gray-500 max-w-[240px]">
              Um "M" dinâmico construído a partir dos cards do KDS e das barras de faturamento do dashboard. Representa o crescimento e a ordem.
            </p>
          </div>

          {/* Opção 2: O Ponto de Contato (Baseado no PDV e Mobile) */}
          <div className="logo-card">
            <span className="logo-label">Opção 02 · O Ponto de Contato</span>
            <div className="flex items-center gap-6">
              <LogoOption2 size={80} />
              <span className="logo-name">mesivo</span>
            </div>
            <p className="text-sm text-center text-gray-500 max-w-[240px]">
              O círculo central do sistema onde tudo se encontra. Inspirado na interface Mobile e na rapidez do "um clique" do PDV.
            </p>
          </div>

          {/* Opção 3: A Sincronia (Baseado no KDS e Balcão) */}
          <div className="logo-card">
            <span className="logo-label">Opção 03 · Sincronia Pura</span>
            <div className="flex items-center gap-6">
              <LogoOption3 size={80} />
              <span className="logo-name">mesivo</span>
            </div>
            <p className="text-sm text-center text-gray-500 max-w-[240px]">
              Linhas paralelas que nunca se cruzam mas trabalham juntas. A ordem perfeita entre Salão, Cozinha e Balcão.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoOption1({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#FFB82E" />
          <stop offset="1" stopColor="#F0522D" />
        </linearGradient>
      </defs>
      {/* Geometria inspirada no gráfico de barras do dashboard */}
      <rect x="6" y="24" width="8" height="18" rx="2" fill={`url(#${id})`} />
      <rect x="20" y="10" width="8" height="32" rx="2" fill={`url(#${id})`} />
      <rect x="34" y="18" width="8" height="24" rx="2" fill={`url(#${id})`} />
      {/* Linha de tendência/conexão */}
      <path d="M6 24L20 10L34 18L46 6" stroke="#FFF8EE" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

function LogoOption2({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#FFB82E" />
          <stop offset="1" stopColor="#F0522D" />
        </linearGradient>
      </defs>
      {/* Anéis concêntricos inspirados no Donut Chart e status mobile */}
      <circle cx="24" cy="24" r="20" stroke={`url(#${id})`} strokeWidth="4" strokeDasharray="80 40" />
      <circle cx="24" cy="24" r="12" stroke="#FFF8EE" strokeWidth="2" opacity="0.2" />
      <rect x="20" y="20" width="8" height="8" rx="2" fill={`url(#${id})`} />
    </svg>
  );
}

function LogoOption3({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#FFB82E" />
          <stop offset="1" stopColor="#F0522D" />
        </linearGradient>
      </defs>
      {/* Linhas de fluxo inspiradas no KDS e nas faixas de status */}
      <rect x="4" y="8" width="40" height="6" rx="3" fill={`url(#${id})`} />
      <rect x="4" y="21" width="40" height="6" rx="3" fill={`url(#${id})`} opacity="0.6" />
      <rect x="4" y="34" width="40" height="6" rx="3" fill="#FFF8EE" opacity="0.15" />
      {/* Marcador de posição atual (o ponto de foco da operação) */}
      <circle cx="12" cy="24" r="5" fill="#FFF8EE" />
    </svg>
  );
}
