// Renderização segura de variáveis {{var}}.
// Bloqueia recursão: substitui uma vez, sem re-render do resultado.
export function renderTemplate(
  body: string | null | undefined,
  vars: Record<string, unknown> = {},
): string {
  if (!body) return "";
  return body.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_m, key: string) => {
    const val = vars[key];
    if (val === null || val === undefined) return "";
    // Sanitiza: remove chars de controle e neutraliza qualquer {{ }} vindo do valor.
    return String(val)
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .replace(/\{\{|\}\}/g, "");
  });
}

export function extractVariables(body: string): string[] {
  const set = new Set<string>();
  for (const m of body.matchAll(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g)) set.add(m[1]);
  return Array.from(set);
}
