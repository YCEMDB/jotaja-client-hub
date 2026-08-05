import qz from "qz-tray";

// Configurações de impressão térmica 80mm e 58mm
export type PrinterConfig = {
  printerName: string;
  autoPrint: boolean;
  silent: boolean; // Se verdadeiro, usa QZ Tray para impressão sem diálogo
  copies: number;
  showCustomerData: boolean;
  paperWidth: "80mm" | "58mm";
};

type PrintOrder = {
  order_number: number;
  status: string;
  type: string;
  payment: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: any;
  subtotal: number | string;
  discount: number | string;
  delivery_fee: number | string;
  total: number | string;
  notes: string | null;
  created_at: string;
  change_for?: number | null;
  coupon_code?: string | null;
};

type PrintItem = {
  product_name: string;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
  notes?: string | null;
  options?: any;
};

const money = (v: number | string) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  card_machine: "Maquininha",
};

const TYPE_LABEL: Record<string, string> = {
  delivery: "Entrega",
  pickup: "Retirada",
  dine_in: "Consumir no local",
};

/**
 * Conecta ao QZ Tray se necessário
 */
async function ensureQZ() {
  if (!qz.websocket.isActive()) {
    try {
      await qz.websocket.connect();
    } catch (err) {
      console.error("Erro ao conectar ao QZ Tray:", err);
      throw new Error("QZ Tray não está respondendo. Verifique se o aplicativo está aberto.");
    }
  }
}

/**
 * Gera o HTML do recibo
 */
function generateReceiptHtml(opts: {
  restaurantName: string;
  restaurantPhone?: string | null;
  order: PrintOrder;
  items: PrintItem[];
  paperWidth?: "80mm" | "58mm";
}) {
  const { restaurantName, restaurantPhone, order, items, paperWidth = "80mm" } = opts;
  const date = new Date(order.created_at);
  const addr = order.delivery_address;
  const widthPx = paperWidth === "58mm" ? "54mm" : "74mm";

  const itemsHtml = items.map((it) => {
    const optsArr: string[] = [];
    if (Array.isArray(it.options)) {
      it.options.forEach((g: any) => {
        if (g?.items) g.items.forEach((i: any) => optsArr.push(`  + ${i.name}`));
      });
    }
    return `
      <div class="row item">
        <div>
          <strong>${it.quantity}x</strong> ${escapeHtml(it.product_name)}
          ${optsArr.length ? `<div class="opts">${optsArr.map(escapeHtml).join("<br/>")}</div>` : ""}
          ${it.notes ? `<div class="opts">Obs: ${escapeHtml(it.notes)}</div>` : ""}
        </div>
        <div>${money(it.subtotal)}</div>
      </div>
    `;
  }).join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>Pedido #${order.order_number}</title>
<style>
  @page { size: ${paperWidth} auto; margin: 3mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; width: ${widthPx}; }
  h1 { font-size: 16px; text-align: center; margin: 0 0 2px; }
  .center { text-align: center; }
  .small { font-size: 10px; }
  .bold { font-weight: bold; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 6px; margin: 2px 0; }
  .item { align-items: flex-start; }
  .opts { font-size: 10px; padding-left: 8px; color: #333; }
  .total { font-size: 14px; font-weight: bold; }
  .badge { border: 1px solid #000; padding: 2px 6px; display: inline-block; }
  @media print {
    button { display: none !important; }
  }
</style>
</head><body>
  <h1>${escapeHtml(restaurantName)}</h1>
  ${restaurantPhone ? `<div class="center small">${escapeHtml(restaurantPhone)}</div>` : ""}
  <hr/>
  <div class="center">
    <div class="bold">PEDIDO #${order.order_number}</div>
    <div class="small">${date.toLocaleString("pt-BR")}</div>
    <div class="small badge">${TYPE_LABEL[order.type] ?? order.type}</div>
  </div>
  <hr/>
  <div><span class="bold">Cliente:</span> ${escapeHtml(order.customer_name)}</div>
  <div><span class="bold">Tel:</span> ${escapeHtml(order.customer_phone)}</div>
  ${addr ? `
    <div class="bold" style="margin-top:4px">Endereço:</div>
    <div class="small">
      ${escapeHtml(addr.street ?? "")}, ${escapeHtml(addr.number ?? "")}
      ${addr.complement ? ` — ${escapeHtml(addr.complement)}` : ""}<br/>
      ${addr.neighborhood ? escapeHtml(addr.neighborhood) : ""}
      ${addr.city ? ` — ${escapeHtml(addr.city)}` : ""}
      ${addr.reference ? `<br/>Ref: ${escapeHtml(addr.reference)}` : ""}
    </div>
  ` : ""}
  <hr/>
  ${itemsHtml}
  <hr/>
  <div class="row"><div>Subtotal</div><div>${money(order.subtotal)}</div></div>
  ${Number(order.delivery_fee) > 0 ? `<div class="row"><div>Entrega</div><div>${money(order.delivery_fee)}</div></div>` : ""}
  ${Number(order.discount) > 0 ? `<div class="row"><div>Desconto${order.coupon_code ? ` (${escapeHtml(order.coupon_code)})` : ""}</div><div>- ${money(order.discount)}</div></div>` : ""}
  <div class="row total"><div>TOTAL</div><div>${money(order.total)}</div></div>
  <hr/>
  <div><span class="bold">Pagamento:</span> ${escapeHtml(PAYMENT_LABEL[order.payment] ?? order.payment)}</div>
  ${order.change_for ? `<div>Troco para: ${money(order.change_for)}</div>` : ""}
  ${order.notes ? `<hr/><div class="bold">Observações:</div><div class="small">${escapeHtml(order.notes)}</div>` : ""}
  <hr/>
  <div class="center small">Obrigado pela preferência!</div>
  <div style="height:20mm"></div>
</body></html>`;
}

/**
 * Função principal para impressão (Suporta Browser ou QZ Tray)
 */
export async function printReceipt(opts: {
  restaurantName: string;
  restaurantPhone?: string | null;
  order: PrintOrder;
  items: PrintItem[];
  config?: PrinterConfig;
}) {
  const config = opts.config || (JSON.parse(localStorage.getItem("printer_settings") || "null") as PrinterConfig) || {
    silent: false,
    paperWidth: "80mm",
    copies: 1
  };

  const html = generateReceiptHtml({
    ...opts,
    paperWidth: config.paperWidth
  });

  if (config.silent && config.printerName) {
    try {
      await ensureQZ();
      const printConfig = qz.configs.create(config.printerName);
      const data: any[] = [{
        type: 'html',
        format: 'plain',
        data: html
      }];
      
      for (let i = 0; i < (config.copies || 1); i++) {
        await qz.print(printConfig, data);
      }
      return true;
    } catch (err: any) {
      console.error("Falha na impressão automática:", err);
      // Fallback para impressão via browser se falhar
    }
  }

  // Fallback: Impressão via Window
  const w = window.open("", "_blank", "width=400,height=600");
  if (!w) {
    alert("Permita pop-ups para imprimir o pedido.");
    return false;
  }
  
  const browserHtml = html.replace("</body>", `
    <button onclick="window.print()" style="margin: 10px auto; display: block; padding: 10px 20px;">Imprimir Manualmente</button>
    <script>
      window.addEventListener('load', () => { 
        setTimeout(() => {
          window.print();
          if (window.location.search.includes('autoclose')) window.close();
        }, 500); 
      });
    </script>
  </body>`);

  w.document.open();
  w.document.write(browserHtml);
  w.document.close();
  return true;
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
