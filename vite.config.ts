// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

/**
 * Remove `data-tsd-source` attributes injected by @tanstack/devtools-vite.
 *
 * That plugin emits column-position attributes that DIFFER between the SSR
 * and client passes (because componentTagger runs only in the client
 * environment and shifts subsequent columns). The mismatch surfaces as a
 * React hydration warning in dev. The attribute is a dev-only source-mapping
 * aid and safe to strip — production builds never include it.
 */
function stripTsdSourceAttribute(): Plugin {
  return {
    name: "mesivo:strip-tsd-source",
    enforce: "post",
    apply: "serve",
    transform(code, id) {
      if (!/\.(t|j)sx(\?.*)?$/.test(id)) return null;
      if (!code.includes("data-tsd-source")) return null;
      // jsx-runtime style: "data-tsd-source": "file:line:col"
      // classic JSX style: data-tsd-source="file:line:col"
      const out = code
        .replace(/"data-tsd-source":\s*"[^"]*",?\s*/g, "")
        .replace(/\sdata-tsd-source="[^"]*"/g, "");
      return { code: out, map: null };
    },
  };
}

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: [stripTsdSourceAttribute()],
});
