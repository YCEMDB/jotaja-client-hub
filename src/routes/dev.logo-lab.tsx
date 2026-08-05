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
          <stop offset="0.5" stopColor="#FF6B35" />
          <stop offset="1" stopColor="#E84393" />
        </linearGradient>
      </defs>
      {/* 
         O M Monolítico: Inspirado no hardware Mesivo (totens e balcões).
         Representa a solidez e a integração de 3 pilares.
      */}
      <path d="M4 12C4 8.68629 6.68629 6 10 6H14V42H10C6.68629 42 4 39.3137 4 36V12Z" fill={`url(#${id})`} />
      <rect x="17" y="2" width="14" height="44" rx="2" fill={`url(#${id})`} />
      <path d="M34 6H38C41.3137 6 44 8.68629 44 12V36C44 39.3137 41.3137 42 38 42H34V6Z" fill={`url(#${id})`} />
      
      {/* Conector de Fluxo Dinâmico */}
      <rect x="19" y="20" width="10" height="8" rx="1" fill="#0F0A08" opacity="0.8" />
    </svg>
  );
}

function LogoOption2({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#7C5CFF" />
          <stop offset="1" stopColor="#E84393" />
        </linearGradient>
      </defs>
      {/* 
         O Nexus Operacional: A convergência de todos os canais.
         Inspirado no radar de pedidos e na fluidez do PDV Mesivo.
      */}
      <circle cx="24" cy="24" r="20" stroke={`url(#${id})`} strokeWidth="4" strokeDasharray="1 10" strokeLinecap="round" />
      <circle cx="24" cy="24" r="14" stroke="#FFF8EE" strokeWidth="1.5" opacity="0.15" />
      
      {/* O "M" central estilizado por vetores de força */}
      <path d="M16 32V16L24 24L32 16V32" stroke={`url(#${id})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Indicador de Status Ativo */}
      <circle cx="24" cy="24" r="3" fill="#FFF8EE" />
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
          <stop offset="1" stopColor="#FF6B35" />
        </linearGradient>
      </defs>
      {/* 
         O Cubo de Dados: Inteligência e organização brutalista.
         Inspirado nos módulos do Dashboard e na precisão do KDS.
      */}
      <rect x="6" y="6" width="36" height="36" rx="4" stroke={`url(#${id})`} strokeWidth="2" strokeDasharray="6 4" />
      
      {/* A forma do "M" esculpida em blocos operacionais */}
      <rect x="10" y="20" width="6" height="14" rx="1.5" fill={`url(#${id})`} />
      <rect x="21" y="14" width="6" height="20" rx="1.5" fill={`url(#${id})`} />
      <rect x="32" y="20" width="6" height="14" rx="1.5" fill={`url(#${id})`} />
      
      {/* Nodo de Inteligência */}
      <path d="M10 10H14M34 10H38" stroke="#FFF8EE" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}
