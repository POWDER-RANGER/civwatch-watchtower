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

  const apiOk = health?.status === "ok" || health?.db === "ok";

  return (
    <div data-theme="ops" className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-lg leading-none">
            <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="h-7 w-7 shrink-0">
              <g fill="none" stroke="currentColor" strokeWidth="4.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.5 18.5V10.5a4 4 0 0 1 4-4h8" />
                <path d="M41.5 29.5v8a4 4 0 0 1-4 4h-8" />
              </g>
              <circle cx="24" cy="24" r="5" className="fill-primary" />
            </svg>
            <span className="font-semibold tracking-[0.06em]">CIVWATCH</span>
            <span aria-hidden="true" className="h-[18px] w-px bg-foreground" />
            <span className="font-normal">Platform</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Map and report services for the CIVWATCH web app</p>
        </div>
        <div className="flex gap-2 items-center">
          <span
            className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium ${
              apiOk ? "border-[color:var(--success)] text-[color:var(--success)]" : "border-input text-muted-foreground"
            }`}
          >
            <span aria-hidden="true">{apiOk ? "✓" : "…"}</span>
            {health ? `API ${health.status ?? health.db ?? "up"}` : "Connecting"}
          </span>
          <Button asChild variant="outline" size="sm">
            <a href="https://civintelligence.onrender.com" target="_blank" rel="noreferrer">
              CIVWATCH web app
            </a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        {error && (
          <p className="rounded-md border border-[color:var(--warning)] bg-card px-4 py-2 text-sm">
            <span className="font-medium text-[color:var(--warning)]">API unreachable</span> ({error}). Start the server with{" "}
            <code className="font-mono">pnpm dev:server</code>.
          </p>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Summary">
          {[
            { label: "Map features", value: String(features.length) },
            { label: "Weather alerts (NWS)", value: String(civint.alerts) },
            { label: "Federal awards (USAspending)", value: String(civint.awards) },
            { label: "ALPR devices (OpenStreetMap)", value: String(civint.alpr) },
          ].map((m) => (
            <div key={m.label} className="rounded-md border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="mt-1 font-mono text-2xl font-medium tabular-nums">{m.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-md border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Feature layer</h2>
            <span className="text-xs text-muted-foreground font-mono">GET /api/features</span>
          </div>
          <ul className="divide-y divide-border">
            {features.map((f) => (
              <li key={f.id} className="px-4 py-3 flex flex-wrap items-start justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{String(f.properties?.label ?? f.id)}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {f.category} · {f.latitude.toFixed(5)}, {f.longitude.toFixed(5)}
                  </p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">Confidence {f.confidence ?? "—"}</span>
              </li>
            ))}
            {features.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted-foreground">No map features yet.</li>
            )}
          </ul>
        </section>

        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          CIVWATCH Platform serves map features and public-record snapshots (NWS alerts, USAspending awards,
          OpenStreetMap ALPR nodes) to the{" "}
          <a className="text-primary underline underline-offset-2" href="https://github.com/POWDER-RANGER/CivilianIntelligence">
            CIVWATCH web app
          </a>
          . It documents public infrastructure and public records; it does not access camera feeds or track individuals.
        </p>
      </main>
    </div>
  );
}
