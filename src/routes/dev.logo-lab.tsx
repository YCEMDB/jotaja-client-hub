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
            Explorações para a marca Mesivo. O objetivo é transmitir <strong>conexão</strong>, 
            <strong>fluxo operacional</strong> e a energia calorosa da hospitalidade brasileira.
          </p>
        </header>

        <div className="logo-grid">
          {/* Opção 1: O Fluxo Conectado (Evolução do Mark atual) */}
          <div className="logo-card">
            <span className="logo-label">Opção A · Conexão & Fluxo</span>
            <div className="flex items-center gap-6">
              <LogoOptionA size={80} />
              <span className="logo-name">mesivo</span>
            </div>
            <p className="text-sm text-center text-gray-500 max-w-[240px]">
              Três pilares que simbolizam o pedido, a produção e a entrega, conectados por uma base sólida.
            </p>
          </div>

          {/* Opção 2: O Abraço da Gestão (Círculo Dinâmico) */}
          <div className="logo-card">
            <span className="logo-label">Opção B · Unificação</span>
            <div className="flex items-center gap-6">
              <LogoOptionB size={80} />
              <span className="logo-name">mesivo</span>
            </div>
            <p className="text-sm text-center text-gray-500 max-w-[240px]">
              Formas orgânicas que se abraçam, simbolizando a unificação de todos os canais em um só lugar.
            </p>
          </div>

          {/* Opção 3: A Velocidade Operacional (Geometria M) */}
          <div className="logo-card">
            <span className="logo-label">Opção C · Ritmo & Velocidade</span>
            <div className="flex items-center gap-6">
              <LogoOptionC size={80} />
              <span className="logo-name">mesivo</span>
            </div>
            <p className="text-sm text-center text-gray-500 max-w-[240px]">
              Um "M" estilizado que sugere movimento ascendente e precisão matemática.
            </p>
          </div>
        </div>

        <div className="mt-24 p-8 border border-white/10 rounded-3xl bg-white/5">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Diretrizes Visuais</h2>
          <div className="grid md:grid-cols-3 gap-8 text-sm text-gray-400">
            <div>
              <h3 className="text-white font-bold mb-2">Paleta "Sunset Blaze"</h3>
              <p>Gradientes de #FFB82E (Âmbar) a #F0522D (Laranja Queimado). Energia, calor e apetite.</p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-2">Tipografia Manrope</h3>
              <p>Wordmark em Manrope ExtraBold. Moderna, legível e técnica o suficiente para SaaS.</p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-2">Geometria</h3>
              <p>Cantos arredondados (radius: 12px) para manter a marca amigável e acessível.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoOptionA({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#FFB82E" />
          <stop offset="1" stopColor="#F0522D" />
        </linearGradient>
      </defs>
      <rect x="4" y="12" width="10" height="24" rx="5" fill={`url(#${id})`} />
      <rect x="19" y="4" width="10" height="40" rx="5" fill={`url(#${id})`} />
      <rect x="34" y="12" width="10" height="24" rx="5" fill={`url(#${id})`} />
      <rect x="4" y="34" width="40" height="6" rx="3" fill="#FFF8EE" opacity="0.15" />
    </svg>
  );
}

function LogoOptionB({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#FFB82E" />
          <stop offset="1" stopColor="#F0522D" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" stroke={`url(#${id})`} strokeWidth="8" />
      <path d="M24 4C35.0457 4 44 12.9543 44 24C44 35.0457 35.0457 44 24 44" stroke="#FFF8EE" strokeWidth="8" strokeLinecap="round" opacity="0.2" />
      <circle cx="24" cy="24" r="6" fill={`url(#${id})`} />
    </svg>
  );
}

function LogoOptionC({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#FFB82E" />
          <stop offset="1" stopColor="#F0522D" />
        </linearGradient>
      </defs>
      <path d="M4 36L14 12L24 36L34 12L44 36" stroke={`url(#${id})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="18" r="4" fill="#FFF8EE" opacity="0.3" />
    </svg>
  );
}
