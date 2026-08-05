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
{Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="logo-card">
              <span className="logo-label">Opção 0{i + 4} · Exploração {i + 4}</span>
              <div className="flex items-center gap-6">
                {i % 3 === 0 ? <LogoOption1 size={80} /> : i % 3 === 1 ? <LogoOption2 size={80} /> : <LogoOption3 size={80} />}
                <span className="logo-name">mesivo</span>
              </div>
              <p className="text-sm text-center text-gray-500 max-w-[240px]">
                Exploração conceitual #{i + 4} aprofundando a linguagem brutalista e modular do sistema Mesivo.
              </p>
            </div>
          ))}
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
          <stop offset="1" stopColor="#7C5CFF" />
        </linearGradient>
      </defs>
      {/* 
         M-NEXUS: 
         Interseção brutalista de fluxos. 
         Dois polígonos que se unem para formar um M através de espaço negativo.
      */}
      <path d="M4 42L16 6L24 24L32 6L44 42H34L28 26L24 32L20 26L14 42H4Z" fill={`url(#${id})`} />
      
      {/* Detalhe técnico: Guia de alinhamento operacional */}
      <rect x="22" y="38" width="4" height="4" fill="#FFF8EE" opacity="0.4" />
    </svg>
  );
}

function LogoOption2({ size = 48 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#E84393" />
          <stop offset="1" stopColor="#7C5CFF" />
        </linearGradient>
      </defs>
      {/* 
         ORBITAL DATA: 
         Movimento circular de dados em torno de um núcleo estável.
         O "M" é fragmentado em 3 órbitas de processamento.
      */}
      <path d="M8 32C8 32 12 10 24 10C36 10 40 32 40 32" stroke={`url(#${id})`} strokeWidth="6" strokeLinecap="round" />
      <path d="M14 36C14 36 18 20 24 20C30 20 34 36 34 36" stroke="#FFF8EE" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
      
      {/* Ponto de Sincronia */}
      <circle cx="24" cy="40" r="4" fill={`url(#${id})`} />
      
      {/* Vetores de Direção */}
      <path d="M4 40H12M36 40H44" stroke="#FFF8EE" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
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
          <stop offset="1" stopColor="#E84393" />
        </linearGradient>
      </defs>
      {/* 
         SISTEMA DE PULSO: 
         Inspirado na frequência de pedidos e no ritmo da cozinha.
         Um M formado por uma única linha de oscilação contínua.
      */}
      <path d="M4 24H10L14 10L24 38L34 10L38 24H44" stroke={`url(#${id})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Indicadores de Pico Operacional */}
      <circle cx="14" cy="10" r="3" fill="#FFF8EE" />
      <circle cx="34" cy="10" r="3" fill="#FFF8EE" />
      
      {/* Base de Estabilidade */}
      <rect x="4" y="42" width="40" height="2" rx="1" fill="#FFF8EE" opacity="0.1" />
    </svg>
  );
}
