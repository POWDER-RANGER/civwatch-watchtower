# CIVWATCH — BUILDABLE PIPELINE BREAKDOWN

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

## MONOREPO STRUCTURE

```
civwatch/
├── apps/
│   ├── web/                        # React 19 + Vite 6
│   │   ├── src/
│   │   │   ├── pages/              # Route-level components
│   │   │   ├── components/
│   │   │   │   ├── dashboard/      # All card components
│   │   │   │   ├── map/            # Mapbox + overlay layers
│   │   │   │   ├── scanner/        # Live radio transcript UI
│   │   │   │   └── political/      # Official tracker UI
│   │   │   ├── hooks/              # useMap, useIncidents, useScanner, useSocket
│   │   │   ├── store/              # Zustand slices
│   │   │   └── lib/                # API clients, socket client
│   │   ├── public/
│   │   │   └── mapstyle/           # Custom Mapbox style JSON
│   │   └── vite.config.ts
│   ├── mobile/                     # Expo 52 (iOS + Android)
│   │   ├── app/                    # Expo Router file-based routes
│   │   ├── components/
│   │   └── hooks/
│   └── admin/                      # Internal moderation panel
│
├── services/
│   ├── gateway/                    # Express 5 API gateway + rate limiting
│   ├── auth/                       # JWT + refresh token service
│   ├── map-service/                # PostGIS spatial queries
│   ├── scanner-service/            # Audio ingest + WebSocket fan-out
│   ├── political-service/          # FEC + OpenSecrets + entity graph
│   ├── reports-service/            # Community report CRUD
│   ├── surveillance-service/       # Camera registry + OSM sync
│   ├── scoring-service/            # Anomaly detection (Python FastAPI)
│   ├── ingest-service/             # Gov data scrapers + ETL
│   └── notify-service/             # FCM + APNs push
│
├── workers/
│   ├── transcription/              # faster-whisper pipeline
│   ├── scrapers/                   # Playwright + httpx scrapers
│   ├── etl/                        # Normalization + dedup
│   └── ml/                         # DBSCAN + scoring batch jobs
│
├── packages/
│   ├── ui/                         # Shared component lib (shadcn base)
│   ├── types/                      # Shared TypeScript interfaces
│   ├── mapstyle/                   # Mapbox style spec JSON
│   └── utils/                      # Shared utilities
│
└── infra/
    ├── docker/                     # Compose + Dockerfiles
    ├── k8s/                        # Helm charts
    └── nginx/                      # Reverse proxy config
```

---

## PIPELINE 1 — MAP ENGINE

**Reference**: Zenly (gamified social aesthetic) + Mapbox GL JS v3 (rendering)
**Stack**: Mapbox GL JS v3.x, React, custom LUT color JSON, PostGIS backend

**Mapbox init** — dark purple/blue gamified style:
```typescript
// apps/web/src/lib/map/initMap.ts

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
// apps/web/src/components/map/CategoryBar.tsx

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

**Spatial data backend** (`bbox` query → GeoJSON):
```typescript
// services/map-service/src/routes/features.ts

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

**DashCard base component**:
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
1. Build `DashCard` base (glassmorphism dark, no real data)
2. Build skeleton loader for every card
3. Build `CardDrawer` swipe-up (Framer Motion spring)
4. Build `EmergencyCard` with mocked data
5. Build `PoliticalCard` with mocked data
6. Build `ScannerCard`, `ReportsCard`, `SurveillanceCard`, `WeatherCard`
7. Wire each card to its service API endpoint as services come online
8. Wire WebSocket live update for `EmergencyCard` and `ScannerCard`
9. Add pull-to-refresh on mobile

---

## PIPELINE 3 — EMERGENCY SERVICES + SCANNER RADIO

**Reference**: Citizen App (confirmed architecture — scanner audio → faster-whisper AI → human verify queue → Next.js + Postgres + Vercel + WebSocket push)

**Working tree** (Citizen's confirmed pipeline per micah.sh postmortem):
```
Radio Feed
  → Audio clip captured per transmission
  → AI transcription queue (speed: 3x audio for processing throughput)
  → Incident creation (human or auto-verified)
  → WebSocket fan-out to geofenced users
  → Postgres persistence (moved from Firebase for consistency)
  → TTI (Time to Incident) metric tracked end-to-end
```

**CIVWATCH audio sources** (in priority order):
1. **RTL-SDR dongle + Trunk Recorder** — capture local P25/DMR/analog feeds yourself. Free. Full control. Best for local deployments.
2. **Broadcastify Calls API** — `POST https://api.broadcastify.com/call-upload`. Requires dev application at `bcfy.io/dev/apply`. Flat $2,500/month for live catalog API (not viable early-stage). Calls ingest API is free if you contribute feeds back.
3. **OpenMHZ** — `openMHz.com` — free community archive, 30-day retention, no live stream. Good for historical log.

**Transcription worker**:
```python
# workers/transcription/transcribe_worker.py
# Reference: RadioTranscriber (github.com/Nite01007/RadioTranscriber)
# Uses faster-whisper (CTranslate2 INT8) — 3–4x faster than openai-whisper on CPU

from faster_whisper import WhisperModel
import webrtcvad, redis, json, time, os

model = WhisperModel(
    "large-v3",
    device="cuda",                     # "cpu" fallback if no GPU
    compute_type="int8_float16",       # INT8 quantization — same accuracy, 4x faster
)
r = redis.Redis(host=os.getenv('REDIS_HOST'))

HALLUCINATION_BLOCK = [
    "Thank you for watching", "Subscribe", "www.", "♪",
    "Transcribed by", "Auto-generated",
]

def process_clip(clip_path: str, meta: dict) -> dict | None:
    segments, _ = model.transcribe(
        clip_path,
        beam_size=5,
        language="en",
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500},
        initial_prompt=f"Police fire EMS dispatch {meta.get('county', '')} county unit",
    )

    text = " ".join(s.text for s in segments).strip()

    if len(text) < 5 or any(p in text for p in HALLUCINATION_BLOCK):
        return None

    event = {
        "id":            str(uuid4()),
        "transcript":    text,
        "feed_id":       meta["feed_id"],
        "talkgroup":     meta.get("talkgroup"),
        "agency":        classify_agency(meta.get("talkgroup")),
        "incident_type": classify_incident(text),
        "location":      extract_location(text),
        "confidence":    float(sum(s.avg_logprob for s in segments) / max(len(list(segments)), 1)),
        "timestamp":     time.time(),
        "county":        meta.get("county"),
    }

    # Fan-out to dashboard clients
    r.publish("scanner:events", json.dumps(event))

    # Queue for Postgres persist
    r.lpush("scanner:persist_queue", json.dumps(event))

    return event
```

**Build order**:
1. Hardware: RTL-SDR dongle ($25) + install Trunk Recorder on local Linux server
2. Configure Trunk Recorder for local P25/DMR system (RadioReference.com for talkgroup list)
3. Build audio ingest endpoint — multipart POST → S3 storage → enqueue path for worker
4. Deploy faster-whisper worker (CUDA INT8 quantization; CPU fallback fine for low-volume)
5. Build hallucination filter + incident type classifier (regex/keyword → upgrade to classifier)
6. Wire Redis Pub/Sub between Python worker and Node scanner-service
7. Build socket.io geo-room join logic
8. Build historical log API `GET /scanner/events?county=&from=&to=` with pagination
9. Apply for Broadcastify Calls dev account (bcfy.io/dev/apply) for broader coverage when ready

---

## PIPELINE 4 — POLITICAL FINANCE TRACKER

**Reference**: OpenSecrets + FollowTheMoney (now merged for federal data; FollowTheMoney still live for state-level races)

**Free APIs** (no cost, require key registration):

| API | URL | Data | Limit |
|---|---|---|---|
| FEC | `api.open.fec.gov/v1` | Candidates, committees, transactions | 1,000/hour (free key via api.data.gov) |
| OpenSecrets | `opensecrets.org/api` | Donor industries, dark money, incumbents | 200 req/day free |
| FollowTheMoney | `followthemoney.org/our-data/apis` | State-level finance | Free with account |
| ProPublica Congress | `projects.propublica.org/api-docs` | Legislators, voting records | Free |
| ProPublica Campaign Finance | `projects.propublica.org/api-docs/campaign-finance` | IEs, disbursements | Free |
| GovTrack | `api.govtrack.us/v2` | Voting records, bill sponsorship | Free |

**Build order**:
1. Register: FEC key (api.data.gov), OpenSecrets key, FollowTheMoney account, ProPublica key (no key needed for Congress API)
2. Build Postgres schema (officials, transactions, voting_records)
3. Build FEC candidate ingest + transaction ingest workers
4. Build ProPublica voting record ingest
5. Build OpenSecrets contribution by industry ingest
6. Build FollowTheMoney state-level ingest
7. Run all workers on cron (daily; every 30min during active election cycle)
8. Build IsolationForest anomaly scorer + transparency score
9. Build `GET /political/officials` API with jurisdiction filtering
10. Build `PoliticalCard` → tap → full official profile page with D3 donor graph

---

## PIPELINE 5 — COMMUNITY REPORTING

**Reference**: Nextdoor (geo-tagged community posts), PulsePoint (incident pins + moderation)

**Report types**:
```typescript
type ReportType =
  | 'surveillance_camera'     // physical camera sighting
  | 'government_activity'     // unusual gov activity
  | 'police_activity'         // notable law enforcement presence
  | 'civil_rights_concern'    // rights violation concern
  | 'public_meeting'          // local government meeting notice
  | 'infrastructure'          // road closures, utilities
  | 'community_support'       // resource sharing
  | 'other'
```

**Build order**:
1. Build report form (React, file upload, location picker via Mapbox click)
2. Build S3 media upload
3. Build Postgres report storage with PostGIS location
4. Build auto-classifier (keyword matching → type determination)
5. Build admin moderation panel (apps/admin)
6. Build WebSocket fan-out for approved reports
7. Build community upvote/downvote + verification count system
8. Build map pin layer for approved reports (GeoJSON from reports-service)
9. Build anonymous mode (no userId stored — hashed device fingerprint for rate limiting only)
10. Build report history feed (paginated, filterable by type)

---

## PIPELINE 6 — SURVEILLANCE MAPPING

**Reference**: EFF Atlas of Surveillance (atlasofsurveillance.org), OpenStreetMap surveillance tag layer

**Data sources**:
- **OpenStreetMap** Overpass API — `surveillance`, `camera`, `man_made=surveillance` tagged nodes — free
- **EFF Atlas of Surveillance** — CSV download at atlasofsurveillance.org/data — free
- **CIVWATCH community reports** — type: `surveillance_camera` from Pipeline 5
- **FOIA requests** — municipal camera registry template generated by app

**Build order**:
1. Build Overpass scraper with US bbox chunking (run nightly cron)
2. Load EFF Atlas CSV into PostGIS (one-time + quarterly refresh)
3. Wire community report type `surveillance_camera` into surveillance pipeline
4. Build deduplication worker (cluster within 50m → merge)
5. Build `GET /surveillance/density?bbox=` GeoJSON endpoint
6. Build Mapbox heatmap layer
7. Build individual camera pin layer (click → operator, type, community confirmations)
8. Add FOIA request template generator page (user enters city/municipality → generates formal FOIA letter for camera registry)

---

## PIPELINE 7 — DATA INGESTION + ETL

**Reference**: ProPublica Data Store, Data.gov, USASpending.gov

**All free sources**:

| Source | Endpoint | Data | Key Required |
|---|---|---|---|
| FEC | `api.open.fec.gov/v1` | Candidate/committee finance | Yes (api.data.gov, free) |
| ProPublica Congress | `projects.propublica.org/api-docs` | Legislators, votes | Yes (free) |
| ProPublica Campaign Finance | `projects.propublica.org/api-docs/campaign-finance` | IEs, disbursements | Yes (free) |
| GovTrack | `api.govtrack.us/v2` | Votes, bills, sponsorship | No |
| USASpending | `api.usaspending.gov` | Federal contracts/grants by location | No |
| Data.gov | `catalog.data.gov/api/3` | Local government datasets | No |
| NOAA | `api.weather.gov` | Emergency weather alerts, forecasts | No |
| AirNow | `airnowapi.org` | AQI by location | Yes (free) |
| OSM Overpass | `overpass-api.de/api/interpreter` | Spatial civic data | No |
| Ballotpedia | (scrape only, no public API) | Candidates, ballot measures | N/A — scrape |

**Cron schedule**:
```yaml
# infra/docker/cron-schedule.yaml

jobs:
  - name: fec-ingest
    schedule: "0 2 * * *"           # Daily 2 AM
    cmd: python -m workers.etl.fec_pipeline

  - name: usa-spending-ingest
    schedule: "0 3 * * 0"           # Weekly Sunday 3 AM
    cmd: python -m workers.etl.spending_pipeline

  - name: osm-surveillance
    schedule: "0 4 * * 0"           # Weekly Sunday 4 AM
    cmd: python -m workers.scrapers.surveillance_osm

  - name: anomaly-scoring
    schedule: "0 5 * * *"           # Daily 5 AM (after ingest)
    cmd: python -m workers.ml.score_all

  - name: propublica-congress
    schedule: "0 6 * * *"           # Daily 6 AM
    cmd: python -m workers.scrapers.propublica_congress

  - name: weather-alerts
    schedule: "*/10 * * * *"         # Every 10 minutes (NOAA)
    cmd: python -m workers.scrapers.noaa_alerts
```

---

## PIPELINE 8 — ANOMALY DETECTION + NEUTRAL SCORING

**Stack**: Python FastAPI (scoring-service), scikit-learn (IsolationForest, DBSCAN), PostGIS

**Neutral scoring rubric** (strictly factual, no political framing):
```python
def compute_official_score(official_id: str) -> dict:
    """
    All metrics are public record and quantitative.
    No partisan framing. Score is purely informational.
    """
    return {
        "fec_filing_completeness":   check_fec_disclosure_filings(official_id),  # % filed on time
        "donation_anomaly_score":    compute_donation_anomaly_score(official_id), # IsolationForest
        "voting_attendance_rate":    compute_attendance_pct(official_id),         # from ProPublica
        "dark_money_ratio":          compute_dark_money_pct(official_id),         # % from undisclosed
        "top_industry_concentration": compute_herfindahl_index(official_id),      # donor diversity
        "score_version":             "1.0",
        "computed_at":               datetime.utcnow().isoformat(),
        "sources":                   ["fec", "opensecrets", "propublica"],
    }
```

---

## PIPELINE 9 — AUTH + USER ROLES

**Stack**: Supabase Auth (JWT + Row Level Security) — fastest path; swap to Auth.js v5 for self-hosted

**Roles**:
```
anonymous       → read-only public data, no reporting
citizen         → submit community reports, view all data
verified_reporter → elevated trust reports (auto-approve path)
moderator       → access moderation queue + approve/reject reports
admin           → full access + ingest controls
```

**Build order**:
1. Initialize Supabase project
2. Configure JWT with role claim hook
3. Set anonymous read-only RLS policies on all public tables
4. Add citizen role on report submission (Supabase Auth → email verify)
5. Build moderation role assignment in admin panel
6. Set RLS: moderators see `status = 'pending_review'` reports only
7. Add rate limiting on report submission endpoint (Redis sliding window)

---

## PIPELINE 10 — PUSH NOTIFICATIONS

**Stack**: Firebase Cloud Messaging (Android + Web), APNs via Expo (iOS)

**Trigger points**:
- New scanner event (incident_type = fire/ems/police + confidence > 0.7) → 2km radius push
- Community report approved within 1km of user's last location
- High-severity incident cluster (>5 events, severity > 3) → 5km push
- NOAA emergency weather alert for user's county

---

## PIPELINE 11 — BUILD + PACKAGE

**Web** (Vite + Cloudflare Pages):
```bash
# apps/web
pnpm build
# → dist/ → deploy to Cloudflare Pages via wrangler
# Environment: VITE_MAPBOX_TOKEN, VITE_API_URL, VITE_WS_URL
# CDN: Cloudflare handles static assets + edge caching
# Code split: map bundle lazy-loaded, dashboard bundle inline
```

**Mobile** (Expo EAS):
```bash
# apps/mobile
eas build --platform ios     --profile production
eas build --platform android --profile production
eas submit --platform ios              # App Store Connect
eas submit --platform android         # Google Play Console

# OTA updates (skip app store for JS-only changes)
eas update --branch production --message "Dashboard card fix"
```

**CI/CD** (GitHub Actions):
```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck && pnpm test

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm build --filter=web
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_PAGES_TOKEN }}
          projectName: civwatch-web
          directory: apps/web/dist
```

---

## DATA STORES (Single Source of Truth Per Domain)

| Store | Engine | Purpose |
|---|---|---|
| Primary DB | PostgreSQL 16 + PostGIS | Officials, transactions, reports, scanner events, map features |
| Cache | Redis 7 | WebSocket presence, session state, pub/sub bus, rate limiting |
| Time-series | TimescaleDB (Postgres extension) | Scanner event logs, incident timelines, finance transaction history |
| Object storage | S3 / Cloudflare R2 | Report media, scanner audio clips, map tile caches |
| Search | Meilisearch | Full-text search across officials, reports, events |

---

## BUILD SEQUENCE — CORRECT ORDER

```
1. Monorepo scaffold          → pnpm workspaces, shared packages, tsconfig
2. Pipeline 9 (Auth)          → everything gates on auth; build this first
3. Pipeline 2 (Dashboard)     → shell + DashCard base, all mocked data
4. Pipeline 1 (Map)           → Mapbox style, avatar markers, category tabs, static GeoJSON
5. Pipeline 7 (Ingestion)     → ETL workers running, Postgres populated
6. Pipeline 4 (Political)     → FEC/OpenSecrets wired, PoliticalCard live
7. Pipeline 3 (Scanner)       → RTL-SDR → faster-whisper → WebSocket → ScannerCard live
8. Pipeline 5 (Reports)       → submission form, moderation, map pins
9. Pipeline 6 (Surveillance)  → Overpass scraper, EFF Atlas load, heatmap live
10. Pipeline 8 (Scoring)      → DBSCAN clusters, anomaly scores populate
11. Pipeline 10 (Push)        → geofenced alerts firing on real events
12. Pipeline 11 (Package)     → web → Cloudflare Pages, mobile → EAS, services → k8s
```

---

*CIVWATCH: WATCHTOWER — Buildable Pipeline Breakdown*
*June 29, 2026*
