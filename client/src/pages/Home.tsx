import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Health = { status?: string; db?: string };
type Feature = {
  id: string;
  category: string;
  latitude: number;
  longitude: number;
  properties?: Record<string, unknown>;
  confidence?: number | null;
};

const API = import.meta.env.VITE_API_URL ?? "";

export default function Home() {
  const [health, setHealth] = useState<Health | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [civint, setCivint] = useState<{ alerts: number; awards: number; alpr: number }>({
    alerts: 0,
    awards: 0,
    alpr: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    async function load() {
      try {
        const [h, f, a, w, p] = await Promise.all([
          fetch(`${API}/api/health`).then((r) => r.json()),
          fetch(`${API}/api/features`).then((r) => r.json()),
          fetch(`${API}/api/civint/alerts`).then((r) => r.json()).catch(() => ({ alerts: [] })),
          fetch(`${API}/api/civint/awards`).then((r) => r.json()).catch(() => ({ awards: [] })),
          fetch(`${API}/api/civint/alpr`).then((r) => r.json()).catch(() => ({ elements: [] })),
        ]);
        if (!live) return;
        setHealth(h);
        setFeatures(f.features ?? []);
        setCivint({
          alerts: Array.isArray(a.alerts) ? a.alerts.length : 0,
          awards: Array.isArray(w.awards) ? w.awards.length : 0,
          alpr: Array.isArray(p.elements) ? p.elements.length : 0,
        });
        setError(null);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : "load_failed");
      }
    }
    void load();
    const t = setInterval(load, 15_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">CIVWATCH</p>
          <h1 className="text-2xl font-semibold tracking-tight text-emerald-400">Watchtower</h1>
          <p className="text-sm text-zinc-400">Map-first civic oversight · CIVINTELLIGENCE pillar</p>
        </div>
        <div className="flex gap-2 items-center">
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-mono ${
              health?.status === "ok" || health?.db === "ok"
                ? "border-emerald-600 text-emerald-400"
                : "border-zinc-600 text-zinc-400"
            }`}
          >
            {health ? `API ${health.status ?? health.db ?? "up"}` : "connecting…"}
          </span>
          <Button asChild variant="outline" size="sm">
            <a href="https://github.com/POWDER-RANGER/CivilianIntelligence" target="_blank" rel="noreferrer">
              CIVINTELLIGENCE
            </a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {error && (
          <p className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-4 py-2 text-sm text-amber-200">
            API unreachable ({error}). Start the server with <code className="font-mono">pnpm dev:server</code>.
          </p>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Map features", value: String(features.length) },
            { label: "CIVINT alerts", value: String(civint.alerts) },
            { label: "CIVINT awards", value: String(civint.awards) },
            { label: "CIVINT ALPR nodes", value: String(civint.alpr) },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{m.label}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-50">{m.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
            <h2 className="font-medium">Feature layer (API)</h2>
            <span className="text-xs text-zinc-500 font-mono">GET /api/features</span>
          </div>
          <ul className="divide-y divide-zinc-800">
            {features.map((f) => (
              <li key={f.id} className="px-4 py-3 flex flex-wrap items-start justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{String(f.properties?.label ?? f.id)}</p>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">
                    {f.category} · {f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-400">conf {f.confidence ?? "—"}</span>
              </li>
            ))}
            {features.length === 0 && (
              <li className="px-4 py-6 text-sm text-zinc-500">No features loaded.</li>
            )}
          </ul>
        </section>

        <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
          Watchtower is the map-first oversight pillar of{" "}
          <a className="text-emerald-400 hover:underline" href="https://github.com/POWDER-RANGER/CivilianIntelligence">
            CIVINTELLIGENCE
          </a>
          . CIVINT panels soft-load public snapshots (NWS alerts, USAspending awards, OSM ALPR). Public-interest
          data only — defensive use.
        </p>
      </main>
    </div>
  );
}
