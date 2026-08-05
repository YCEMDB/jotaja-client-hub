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
          <stop offset="0" stopColor="#FF6B35" />
          <stop offset="1" stopColor="#E84393" />
        </linearGradient>
      </defs>
      {/* 
         O "M" MESIVO OPERACIONAL:
         Geometria inspirada no hardware de autoatendimento e na precisão milimétrica.
         Brutalismo elegante com proporções áureas.
      */}
      <path d="M6 10C6 7.79086 7.79086 6 10 6H12V42H10C7.79086 42 6 40.2091 6 38V10Z" fill={`url(#${id})`} />
      <rect x="18" y="4" width="12" height="40" rx="2" fill={`url(#${id})`} />
      <path d="M36 6H38C40.2091 6 42 7.79086 42 10V38C42 40.2091 40.2091 42 38 42H36V6Z" fill={`url(#${id})`} />
      
      {/* Detalhe de Pulso (Conexão em tempo real) */}
      <rect x="18" y="22" width="12" height="4" fill="#0F0A08" opacity="0.6" />
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
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      {/* 
         NÚCLEO DE DADOS:
         Inspirado na arquitetura de microsserviços e no fluxo de pedidos.
         Simboliza a inteligência central que distribui ordens.
      */}
      <rect x="4" y="4" width="40" height="40" rx="6" stroke={`url(#${id})`} strokeWidth="3" strokeDasharray="12 6" />
      <path d="M12 24H36M24 12V36" stroke="#FFF8EE" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
      
      {/* O "M" oculto na geometria de fluxo */}
      <path d="M16 30V18L24 26L32 18V30" stroke={`url(#${id})`} strokeWidth="5" strokeLinecap="square" />
      
      {/* Ponto de origem (O Cliente) */}
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
         ASCENSÃO OPERACIONAL:
         Inspirado no KDS Mesivo (cozinha) e no crescimento de receita.
         Formas ascendentes que formam um 'M' implícito.
      */}
      <rect x="4" y="24" width="10" height="18" rx="3" fill={`url(#${id})`} />
      <rect x="19" y="12" width="10" height="30" rx="3" fill={`url(#${id})`} />
      <rect x="34" y="6" width="10" height="36" rx="3" fill={`url(#${id})`} />
      
      {/* Linha de Corte de Eficiência */}
      <path d="M4 36L44 8" stroke="#FFF8EE" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 8" opacity="0.4" />
      
      {/* Check de conclusão */}
      <circle cx="39" cy="11" r="5" fill="#FFF8EE" />
      <path d="M37 11L38.5 12.5L41 10" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
