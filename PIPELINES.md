# CIVWATCH — BUILDABLE PIPELINE BREAKDOWN

> **Architecture note (2026-09-27):** Process topology has been reconciled.  
> We are building a **modular monolith** (`client/` + `server/` + `packages/*`) first.  
> The pipeline *behaviors* below are unchanged. The original microservice tree is retained as the **extraction target** once domains need independent scaling. See `ARCHITECTURE.md`.

---

## COMPARABLE APPS (Reference Tree)

| Domain | Reference App | Architecture Signal |
|---|---|---|
| Gamified 3D Map | Snap Map, Zenly (defunct) | Social presence layer, avatar pins, category tabs, living-diorama feel |
| Emergency Alerts | **Citizen App** | Scanner audio → AI transcription → human verify → WebSocket push → geofenced alert |
| Political Finance | **OpenSecrets / FollowTheMoney** | FEC + state disclosures, entity graph, donor network, dark money flags |
| Community Reports | Nextdoor, PulsePoint | Geo-tagged crowdsourced incident reporting + map pins + moderation |
| Surveillance Mapping | EFF Atlas of Surveillance, OpenStreetMap | Camera registry, FOIA crowdsource, density heatmap |
| Scanner Radio | Broadcastify + RadioTranscriber OSS | Audio stream → faster-whisper → structured event log |
| Weather Overlay | Tomorrow.io | Mapbox-native real-time weather tile integration |
| Government Data | ProPublica, USASpending, Data.gov | Open government REST APIs, scraping pipelines |

---

## MONOREPO STRUCTURE (current — modular monolith)

```
civwatch-watchtower/
├── client/                         # React 19 + Vite (web) — future apps/web
│   └── src/
│       ├── pages/
│       ├── components/
│       │   ├── dashboard/          # Card components (Phase 2)
│       │   ├── map/                # Mapbox + overlay layers (Phase 3)
│       │   ├── scanner/
│       │   └── political/
│       ├── hooks/
│       ├── store/                  # Zustand when needed
│       └── lib/                    # API clients, map helpers
├── server/                         # Express gateway + all domain routes (for now)
│   ├── index.ts
│   ├── routes/                     # /api/auth, /api/map, /api/reports, ...
│   ├── db/                         # Postgres client + migrations
│   └── middleware/
├── packages/
│   ├── ui/                         # Shared component lib (DashCard base, etc.)
│   ├── types/                      # Shared TypeScript interfaces
│   ├── core/                       # Shared pure logic
│   ├── api-client/                 # Typed REST / socket client
│   └── config/                     # Env schemas, constants
├── workers/                        # (add at Phase 4) ETL / ML batch jobs
├── apps/
│   └── mobile/                     # (add at Phase 11) Expo 52
├── docker-compose.yml              # Postgres+PostGIS, Redis, Meilisearch
└── .github/workflows/              # CI
```

### Extraction target (later — when needed)

When a domain requires independent scaling or a separate language runtime, lift it:

```
services/
  gateway/          # thin router (or nginx)
  auth/
  map-service/
  political-service/
  reports-service/
  surveillance-service/
  scoring-service/  # Python FastAPI
  ingest-service/
  notify-service/
workers/
  transcription/
  scrapers/
  etl/
  ml/
```

Contracts (`packages/types`, `packages/api-client`) stay the same; only the process boundary changes. Do **not** create these folders until a concrete need exists.

---

## PIPELINE 1 — MAP ENGINE

**Reference**: Zenly (gamified social aesthetic) + Mapbox GL JS v3 (rendering)  
**Stack**: Mapbox GL JS v3.x, React, custom LUT color JSON, PostGIS backend  
**Decision**: Mapbox is the chosen engine (Google Maps file in the scaffold is template leftover and will be replaced).

**Mapbox init** — dark purple/blue gamified style:
```typescript
// client/src/lib/map/initMap.ts

const map = new mapboxgl.Map({
  container: 'civwatch-map',
  style: 'mapbox://styles/YOUR_USER/YOUR_STYLE_ID',  // custom studio style
  center: [-91.3985, 40.3961],                        // default: Keokuk
  zoom: 14,
  pitch: 52,
  bearing: 0,
  antialias: true,
  accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
})

// Night preset + purple/blue LUT applied in Mapbox Studio
map.on('style.load', () => {
  map.setConfigProperty('basemap', 'lightPreset', 'night')
  map.setConfigProperty('basemap', 'show3dObjects', true)
  map.setConfigProperty('basemap', 'showPointOfInterestLabels', false)
  
  // Load civic data as GeoJSON sources
  loadCivicSources(map)
  loadCivicLayers(map)
})
```

**3D blocky buildings** (fill-extrusion layer in Studio or at runtime):
```json
{
  "id": "civwatch-buildings-3d",
  "type": "fill-extrusion",
  "source": "composite",
  "source-layer": "building",
  "paint": {
    "fill-extrusion-color": "#1a0a3c",
    "fill-extrusion-height": ["get", "height"],
    "fill-extrusion-base": ["get", "min_height"],
    "fill-extrusion-opacity": 0.92,
    "fill-extrusion-ambient-occlusion-intensity": 0.8
  }
}
```

**Custom avatar marker** (user position, glowing blue):
```tsx
// packages/ui/MapAvatar.tsx

export const MapAvatar = ({ user, isCurrentUser }: MapAvatarProps) => (
  <div className="relative cursor-pointer">
    {isCurrentUser && (
      <div className="absolute -top-5 left-1/2 -translate-x-1/2
                      bg-blue-500 rounded-full w-3 h-3
                      shadow-[0_0_10px_#3b82f6,0_0_20px_#60a5fa]
                      animate-pulse z-10" />
    )}
    <div className={`
      rounded-full w-12 h-12 border-2 overflow-hidden
      ${isCurrentUser
        ? 'border-blue-400 shadow-[0_0_14px_#60a5fa]'
        : 'border-purple-400 shadow-[0_0_8px_#a855f7]'
      }
    `}>
      <img src={user.avatarUrl} className="w-full h-full object-cover" />
    </div>
    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2
                    text-xs text-white/80 whitespace-nowrap font-medium">
      {isCurrentUser ? 'You' : user.displayName}
    </div>
  </div>
)

// Mount via mapboxgl.Marker
export function mountAvatar(map: mapboxgl.Map, user: User, isCurrentUser: boolean) {
  const el = document.createElement('div')
  const root = ReactDOM.createRoot(el)
  root.render(<MapAvatar user={user} isCurrentUser={isCurrentUser} />)
  new mapboxgl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat([user.lng, user.lat])
    .addTo(map)
}
```

**Category layer toggle bar** (Memories → Footsteps → Incidents → Reports → Cameras → Officials):
```tsx
// client/src/components/map/CategoryBar.tsx

const CIVWATCH_LAYERS: Record<string, string> = {
  incidents:    'civwatch-incidents-layer',
  cameras:      'civwatch-cameras-heatmap',
  reports:      'civwatch-reports-layer',
  footsteps:    'civwatch-footsteps-layer',
  officials:    'civwatch-officials-layer',
  historical:   'civwatch-historical-layer',
}

const TABS = [
  { key: 'incidents',  label: 'Active',    icon: <Siren size={14} /> },
  { key: 'reports',    label: 'Reports',   icon: <MessageSquare size={14} /> },
  { key: 'cameras',    label: 'Cameras',   icon: <Camera size={14} /> },
  { key: 'officials',  label: 'Officials', icon: <Landmark size={14} /> },
  { key: 'footsteps',  label: 'Footsteps', icon: <Footprints size={14} /> },
  { key: 'historical', label: 'History',   icon: <Clock size={14} /> },
]

export const CategoryBar = ({ map }: { map: mapboxgl.Map }) => {
  const [active, setActive] = useState<Set<string>>(new Set(['incidents']))

  const toggle = (key: string) => {
    const layerId = CIVWATCH_LAYERS[key]
    const vis = map.getLayoutProperty(layerId, 'visibility')
    map.setLayoutProperty(layerId, 'visibility', vis === 'visible' ? 'none' : 'visible')
    setActive(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto">
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => toggle(tab.key)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
            font-medium whitespace-nowrap transition-all
            ${active.has(tab.key)
              ? 'bg-blue-500 text-white shadow-[0_0_8px_#3b82f6]'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
            }
          `}>
          {tab.icon}{tab.label}
        </button>
      ))}
    </div>
  )
}
```

**Weather overlay** (top-right corner readout):
```typescript
// services: Tomorrow.io API → /weather/current?lat=&lng=
// Mapbox raster tile: map.addSource('weather-radar', {
//   type: 'raster',
//   tiles: ['https://api.tomorrow.io/v4/map/tile/{z}/{x}/{y}/precipitationIntensity/now?apikey=KEY'],
//   tileSize: 256
// })
```

**Spatial data backend** (`bbox` query → GeoJSON) — lives in `server/routes/map.ts` for now:
```typescript
// server/routes/map.ts

router.get('/features', async (req, res) => {
  const { bbox, layers } = req.query
  const [west, south, east, north] = (bbox as string).split(',').map(Number)
  const layerList = (layers as string).split(',')

  const features = await db.$queryRaw`
    SELECT 
      id, type, ST_AsGeoJSON(location)::json AS geometry,
      title, incident_type, severity, created_at
    FROM civwatch.map_features
    WHERE ST_Within(
      location,
      ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)
    )
    AND layer = ANY(${layerList})
    AND created_at > NOW() - INTERVAL '48 hours'
    ORDER BY created_at DESC
    LIMIT 500
  `

  res.json({
    type: 'FeatureCollection',
    features: features.map(f => ({
      type: 'Feature',
      geometry: f.geometry,
      properties: { id: f.id, type: f.type, title: f.title, severity: f.severity },
    }))
  })
})
```

**Build order**:
1. Mapbox account → generate access token
2. Mapbox Studio → new style from "Dark" template → shift palette to deep purple/blue (#0d0520 background, #1a0a3c buildings, #7c3aed accent) → enable 3D Standard → export style URL
3. Add `fill-extrusion` layer for buildings
4. Initialize map in React with pitch 52, night preset
5. Mount `MapAvatar` HTML markers
6. Build `CategoryBar` component with layer visibility toggle
7. Add GeoJSON source fed by `/api/map/features?bbox=` endpoint
8. Add civic data layers (incidents circles, camera heatmap, report pins)
9. Wire `Tomorrow.io` weather raster overlay + corner readout component
10. Connect WebSocket-pushed GeoJSON updates to `map.getSource('civwatch-live').setData()`

---

## PIPELINE 2 — DASHBOARD SHELL + CARDS

**Reference**: Apple Maps (iOS spatial chrome) + Carrot Weather (gamified dark card aesthetic)

**Layout**:
```
┌──────────────────────────────────────┐
│  📍 Keokuk, Iowa    ⛅ 71°F   [•••] │  ← Status bar (weather + location)
├──────────────────────────────────────┤
│                                      │
│   [3D MAP — 60% of screen height]    │
│   [Avatar + civic pins live]         │
│                                      │
├──────────────────────────────────────┤
│  Incidents  Reports  Cameras  ...    │  ← Category tab bar
├──────────────────────────────────────┤
│  ↑ Drag up for dashboard             │
│  ┌──────────────┐ ┌──────────────┐   │
│  │ Emergency    │ │  Political   │   │
│  │ Activity     │ │  Finance     │   │
│  └──────────────┘ └──────────────┘   │
│  ┌──────────────┐ ┌──────────────┐   │
│  │  Scanner     │ │  Community   │   │
│  │  Radio       │ │  Reports     │   │
│  └──────────────┘ └──────────────┘   │
│  ┌─────────────────────────────────┐ │
│  │   Surveillance Camera Density   │ │  ← Full-width
│  └─────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**DashCard base component** — lives in `packages/ui`:
```tsx
// packages/ui/DashCard.tsx

interface DashCardProps {
  title: string
  icon: React.ReactNode
  accent: 'red' | 'amber' | 'blue' | 'purple' | 'green'
  live?: boolean
  children: React.ReactNode
}

const ACCENT_MAP = {
  red:    'border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]',
  amber:  'border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
  blue:   'border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]',
  purple: 'border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]',
  green:  'border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]',
}

export const DashCard = ({ title, icon, accent, live, children }: DashCardProps) => (
  <div className={`
    relative rounded-2xl border bg-black/40 backdrop-blur-xl
    p-4 ${ACCENT_MAP[accent]}
  `}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-white/80">
        {icon}
        <span className="text-sm font-semibold tracking-wide">{title}</span>
      </div>
      {live && (
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400 font-medium">LIVE</span>
        </div>
      )}
    </div>
    {children}
  </div>
)
```

**Build order**:
1. Build `DashCard` base (glassmorphism dark, no real data) in `packages/ui`
2. Build skeleton loader for every card
3. Build `CardDrawer` swipe-up (Framer Motion spring)
4. Build `EmergencyCard` with mocked data
5. Build `PoliticalCard` with mocked data
6. Build `ScannerCard`, `ReportsCard`, `SurveillanceCard`, `WeatherCard`
7. Wire each card to its server route as domains come online
8. Wire WebSocket live update for `EmergencyCard` and `ScannerCard`
9. Add pull-to-refresh on mobile

---

## PIPELINE 3 — EMERGENCY SERVICES + SCANNER RADIO (slimmed for now)

**Reference**: Citizen App  
**Current scope**: NOAA alert stream only. RTL-SDR / Trunk Recorder / faster-whisper deferred.

**Build order (slim)**:
1. Ingest NOAA alerts via Pipeline 7
2. Historical log API `GET /scanner/events?county=&from=&to=`
3. Wire `ScannerCard` to live NOAA stream
4. (Later) RTL-SDR + faster-whisper if local hardware path is prioritized

---

## PIPELINE 4 — POLITICAL FINANCE TRACKER

**Reference**: OpenSecrets + FollowTheMoney  
**Implementation home (monolith)**: `server/routes/political.ts` + `packages/types` + `client/src/components/political`

(Full technical detail unchanged from original PIPELINES.md — FEC, OpenSecrets, entity graph, IsolationForest scoring, official profiles. Implement inside the modular monolith first; extract `services/political-service` only if needed.)

---

## PIPELINE 5 — CITIZEN REPORTS

Submission form, S3/R2 upload, PostGIS storage, moderation queue, WebSocket fan-out.  
Home: `server/routes/reports.ts` + moderation UI in client.

---

## PIPELINE 6 — SURVEILLANCE MAPPING

Overpass scraper, EFF Atlas CSV, DBSCAN 50m dedup, heatmap layer on Mapbox.  
Home: `server/routes/surveillance.ts` + map layers in client.

---

## PIPELINE 7 — DATA INGESTION + ETL

Prefect (or simple cron + scripts under `workers/` when added). Sources: FEC, ProPublica, OpenSecrets, USASpending, NOAA, AirNow.  
Until workers/ exists, scripts can live under `server/scripts/` or a temporary `workers/` folder.

---

## PIPELINE 8 — ANOMALY DETECTION + NEUTRAL SCORING

IsolationForest, DBSCAN clustering, scoring rubrics. Can start as pure functions in `packages/core` + a route; move to Python FastAPI service later if model size or language preference requires it.

---

## PIPELINE 9 — AUTH

Supabase JWT + RLS + RBAC (or equivalent self-hosted).  
Home: `server/routes/auth.ts` + middleware; Supabase project config in env.

---

## PIPELINE 10 — PUSH NOTIFICATIONS

FCM + APNs via Expo, geofenced PostGIS queries.  
Home: `server/routes/notify.ts` (or later `services/notify-service`).

---

## PIPELINE 11 — PACKAGING / MOBILE

Expo 52 under `apps/mobile` when Phase 11 starts. Web continues under `client/`.

---

## Data stores (unchanged)

| Store | Role |
|-------|------|
| PostgreSQL 16 + PostGIS | Primary system of record, spatial queries |
| Redis 7 | Cache, pub/sub, rate limits, queues |
| Meilisearch | Full-text search |
| S3 / Cloudflare R2 | Object storage (report media, audio clips) |

Defined in `docker-compose.yml`. Must be wired into `server/` before Phase 0 is closed.

---

*Pipeline behaviors are stable. Process topology follows `ARCHITECTURE.md`. Last reconciled: 2026-09-27.*
