// Notificações de novo pedido: som + Notification API (sem service worker)

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

let audioCtx: AudioContext | null = null;

export function playOrderBeep() {
  try {
    if (typeof window === "undefined") return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    audioCtx ??= new Ctx();
    const ctx = audioCtx;
    if (ctx.state === "suspended") ctx.resume();

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    playTone(880, 0, 0.18);
    playTone(1175, 0.22, 0.18);
    playTone(1480, 0.44, 0.25);
  } catch (e) {
    console.warn("playOrderBeep failed", e);
  }
}

export function showOrderNotification(orderNumber: number, customerName: string, total: number | string) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const n = new Notification(`🔔 Novo pedido #${orderNumber}`, {
      body: `${customerName} — R$ ${Number(total).toFixed(2)}`,
      tag: `order-${orderNumber}`,
      requireInteraction: true,
    });
    n.onclick = () => { window.focus(); n.close(); };
  } catch (e) {
    console.warn("notification failed", e);
  }
}
