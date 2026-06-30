# CIVWATCH: WATCHTOWER — Module to Pipeline Cross-Reference

This document provides a detailed mapping of the core CIVWATCH: WATCHTOWER modules to their corresponding technical pipelines, as defined in `PIPELINES.md`.

---

## Module-Pipeline Mapping

| WATCHTOWER Module | Pipeline Match | Notes |
|---|---|---|
| **Dashboard** | Pipeline 2 (Dashboard Shell + Cards) | Direct match. Provides the core UI shell and card components. |
| **Map** | Pipeline 1 (Map Engine) | Direct match. Includes 3D map rendering, avatar markers, and category layers. Weather functionality is split: Tomorrow.io radar tiles feed the Map overlay, while NOAA alerts feed the Communications Log. |
| **Citizen Reports** | Pipeline 5 (Community Reporting) | Direct match. Handles geo-tagged crowdsourced incident reporting, moderation, and map pins. |
| **Visualizations** | Pipeline 1 (heatmap/overlay layers), Pipeline 4 (donor network graph, industry bar chart), Pipeline 6 (surveillance heatmap), Pipeline 8 (score charts, sparklines) | This is not a standalone pipeline but rather the rendering layer that aggregates and displays data from multiple pipelines. |
| **Data Storage** | Pipeline 7 (Data Ingestion + ETL) + Data Stores table | Direct match. Encompasses all data ingestion, ETL processes, and the underlying data store technologies (PostgreSQL, Redis, S3, Meilisearch). |
| **Anomaly Detection** | Pipeline 8 (Anomaly Detection + Neutral Scoring) | Direct match. Focuses on pattern discovery, signal prioritization, incident clustering, and neutral scoring. |
| **Political Finance** | Pipeline 4 (Political Finance Tracker) | Direct match. Tracks political contributions, expenditures, and applies anomaly detection to financial data. This module was explicitly added to the `README.md` for clarity. |
| **Communications Log** | Pipeline 3 (Emergency Services + Scanner Radio), specifically NOAA alerts | This is a slimmed-down version of Pipeline 3. The RTL-SDR, Trunk Recorder, and faster-whisper components are cut for now. It primarily focuses on NOAA weather alerts, which are ingested via Pipeline 7. |

---

## Pipelines with No Direct User-Facing Module

Some pipelines are foundational infrastructure or cross-cutting concerns that do not map to a single user-facing module but are critical for the system's operation.

| Pipeline | Purpose |
|---|---|
| **Pipeline 9 (Auth)** | Provides core authentication and authorization services (JWT, RLS) for the entire platform. |
| **Pipeline 10 (Push)** | Manages geofenced push notifications (FCM, APNs) triggered by events across various modules. |
| **Pipeline 11 (Package)** | Handles the build, packaging, and deployment processes for web, mobile, and service applications. |

---

*CIVWATCH: WATCHTOWER — Module to Pipeline Cross-Reference*
*June 30, 2026*
