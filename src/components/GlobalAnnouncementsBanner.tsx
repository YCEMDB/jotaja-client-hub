import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, X } from "lucide-react";

type Ann = {
  id: string;
  message: string;
  variant: "info" | "success" | "warning" | "danger";
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

const VARIANT_CLASS: Record<Ann["variant"], string> = {
  info: "bg-blue-500/10 text-blue-900 border-blue-400",
  success: "bg-emerald-500/10 text-emerald-900 border-emerald-400",
  warning: "bg-amber-500/15 text-amber-900 border-amber-400",
  danger: "bg-red-500/10 text-red-900 border-red-400",
};

const DISMISSED_KEY = "dismissed_announcements";

function getDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function GlobalAnnouncementsBanner() {
  const [items, setItems] = useState<Ann[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(getDismissed);

  const load = async () => {
    const nowIso = new Date().toISOString();
    const { data } = await supabase
      .from("global_announcements")
      .select("*")
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Ann[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("global_announcements_banner")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "global_announcements" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const dismiss = (id: string) => {
    const next = Array.from(new Set([...dismissed, id]));
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {}
  };

  const visible = items.filter((a) => !dismissed.includes(a.id));
  if (!visible.length) return null;

  return (
    <div className="space-y-2 p-3">
      {visible.map((a) => (
        <div
          key={a.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border-2 ${VARIANT_CLASS[a.variant]} shadow-brutal`}
        >
          <Megaphone className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="flex-1 text-sm font-bold leading-snug whitespace-pre-wrap">{a.message}</p>
          <button
            onClick={() => dismiss(a.id)}
            className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
            aria-label="Dispensar aviso"
            title="Dispensar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
