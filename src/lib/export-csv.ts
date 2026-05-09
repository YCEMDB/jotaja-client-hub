// Exportação CSV simples (UTF-8 com BOM para Excel)

export function downloadCSV(filename: string, rows: (string | number | null | undefined)[][]) {
  const escape = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = rows.map((r) => r.map(escape).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function printReportHTML(title: string, html: string) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) { alert("Permita pop-ups."); return; }
  w.document.open();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>
    <style>
      body { font-family: -apple-system, system-ui, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 20px; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
      th { background: #f3f4f6; }
      tr:nth-child(even) td { background: #fafafa; }
      .right { text-align: right; }
      .total { font-weight: bold; font-size: 14px; margin-top: 16px; }
      @media print { button { display: none; } }
    </style></head><body>
    <h1>${title}</h1>
    ${html}
    <button onclick="window.print()" style="margin-top:16px;padding:8px 16px;cursor:pointer">Imprimir / Salvar PDF</button>
    <script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300))</script>
    </body></html>`);
  w.document.close();
}
