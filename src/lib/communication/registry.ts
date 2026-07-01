import type { CommunicationProvider } from "./types";
import { EvolutionProvider } from "./providers/evolution";
import { NoopProvider } from "./providers/noop";

// Registry central. Nenhuma regra de negócio deve importar providers/* diretamente.
const REGISTRY = new Map<string, CommunicationProvider>();

function register(p: CommunicationProvider) {
  REGISTRY.set(p.code, p);
}

register(EvolutionProvider);
register(NoopProvider);

export function getProvider(code: string): CommunicationProvider {
  const p = REGISTRY.get(code);
  if (!p) throw new Error(`communication_provider_not_registered: ${code}`);
  return p;
}

export function listProviderCodes(): string[] {
  return Array.from(REGISTRY.keys());
}
