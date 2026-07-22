import { createFileRoute } from "@tanstack/react-router";
import { getMaintenanceStatus } from "@/lib/maintenance.functions";

function maintenanceHtml(message: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Em manutenção — Mesivo</title>
    <meta name="robots" content="noindex, nofollow" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <style>
      :root {
        --orange: #ff6534;
        --magenta: #e84393;
        --violet: #7c5cff;
        --ink: #0a0a0a;
        --surface: #fff5ef;
        --surface-2: #ffeae0;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; height: 100%; }
      body {
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: var(--surface);
        color: var(--ink);
        font-family: "Manrope", system-ui, -apple-system, sans-serif;
        padding: 1.5rem;
      }
      .background {
        position: fixed;
        inset: 0;
        pointer-events: none;
        background:
          radial-gradient(circle at 10% 20%, rgba(255,101,52,0.18) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(124,92,255,0.14) 0%, transparent 40%),
          radial-gradient(circle at 50% 50%, rgba(232,67,147,0.08) 0%, transparent 50%);
      }
      .noise {
        position: fixed;
        inset: 0;
        pointer-events: none;
        opacity: 0.35;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      }
      .card {
        position: relative;
        max-width: 520px;
        width: 100%;
        text-align: center;
        padding: clamp(2rem, 6vw, 3.5rem);
        background: #fff;
        border: 2px solid var(--ink);
        border-radius: 24px;
        box-shadow: 8px 8px 0 0 var(--ink);
      }
      .brand {
        font-family: "Archivo Black", "Manrope", sans-serif;
        font-size: clamp(2.25rem, 7vw, 3.5rem);
        letter-spacing: -0.04em;
        line-height: 1;
        margin-bottom: 1.5rem;
        background: linear-gradient(135deg, var(--orange) 0%, var(--magenta) 50%, var(--violet) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      h1 {
        font-family: "Archivo Black", "Manrope", sans-serif;
        font-size: clamp(1.5rem, 5vw, 2.25rem);
        letter-spacing: -0.02em;
        margin: 0 0 1rem;
      }
      p {
        font-size: clamp(1rem, 2.5vw, 1.125rem);
        line-height: 1.65;
        color: #4a4a4a;
        margin: 0 0 1.5rem;
      }
      .status {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        padding: 0.5rem 1rem;
        background: var(--surface-2);
        border: 2px solid var(--ink);
        border-radius: 999px;
      }
      .code {
        display: block;
        margin-top: 1.25rem;
        font-size: 0.75rem;
        color: #888;
      }
    </style>
  </head>
  <body>
    <div class="background" aria-hidden="true"></div>
    <div class="noise" aria-hidden="true"></div>
    <main class="card">
      <div class="brand">Mesivo</div>
      <h1>Em manutenção</h1>
      <p>${message.replace(/</g, "&lt;").replace(/"/g, "&quot;")}</p>
      <span class="status">HTTP 503 — Service Unavailable</span>
      <span class="code">Retry-After: 300</span>
    </main>
  </body>
</html>`;
}

export const Route = createFileRoute("/manutencao")({
  server: {
    handlers: {
      GET: async () => {
        const message = "Estamos realizando uma manutenção programada para melhorar ainda mais a sua experiência. Voltaremos em breve.";
        return new Response(maintenanceHtml(message), {
          status: 503,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "retry-after": "300",
          },
        });
      },
    },
  },
});
