# CityLens AI — Project Baseline Audit & System Inventory

**Audit Date**: October 2026  
**Auditor**: Lead Full-Stack, AI/ML, DevOps & QA Engineering Team  
**Workspace**: `C:\Users\Yashi\Downloads\CityLensAI-Integrated\CityLensAl-1`

---

## 1. Executive Summary

CityLens AI is an urban civic decision-intelligence and emergency response platform built for Mumbai. It bridges citizen incident reporting, emergency SOS dispatch, hyper-local flood monitoring, real-time traffic hazards, and municipal administrative workflows.

Before modifying code, an exhaustive audit was performed across all frontend apps, backend micro-services, machine learning modules, schedulers, databases, and network communication channels.

### Discovered Technology Stack (Confirmed from Source Code)
- **Backend**: FastAPI 0.115+ (Python 3.12 / venv), SQLAlchemy 2.0 ORM, Pydantic v2 schemas, Uvicorn ASGI server, WebSockets (`ConnectionManager`).
- **Database**: PostgreSQL with `psycopg` driver; SQLite fallback capability for isolated in-memory unit/integration tests.
- **Admin Dashboard**: React 19, Vite 8, Leaflet / React-Leaflet, WebSockets for live SOS/incident telemetry (`frontend/admin-dashboard`).
- **Citizen Mobile App**: React Native 0.86, Expo SDK 57, Expo Router, TypeScript, React Native Maps & WebView (`frontend/citizen-App`). *(Note: Project prompt colloquially referenced "Flutter charts"; actual confirmed codebase is React Native/Expo. No Dart or Flutter code is present)*.
- **AI & Analytics**: Scikit-Learn (`IsolationForest`, Logistic Regression/Random Forest for flood prediction), Joblib serialized pipelines, Pandas, NumPy.
- **External Integrations**:
  - TomTom Traffic Flow & Routing APIs (`TOMTOM_API_KEY`)
  - Open-Meteo Weather & Open-Meteo Air Quality APIs (free public endpoints)
  - BMC Disaster Management AWS portal (`dmwebtwo.mcgm.gov.in`)
  - IITM Tropmet Mumbai Rain portal (`mumbairain.tropmet.res.in`)
  - OpenStreetMap Overpass API for Mumbai suburban nodes

---

## 2. Inventory of Applications & Directory Layout

```
CityLensAl-1/
├── backend/
│   ├── app/
│   │   ├── ai/                      # AI models, dataset prep, anomaly detector, resource recommender
│   │   ├── database/                # SQLAlchemy database connection & session generator
│   │   ├── models/                  # SQLAlchemy ORM models (User, Incident, Emergency, Weather, etc.)
│   │   ├── routes/                  # FastAPI API routers (auth, incidents, emergency, routing, etc.)
│   │   ├── scheduler/               # Background schedulers for weather & AQI ingestion
│   │   ├── schemas/                 # Pydantic v2 validation models
│   │   ├── security/                # JWT creation, bcrypt hashing, role dependencies
│   │   ├── services/                # External API wrappers & business intelligence logic
│   │   └── websocket/               # Live broadcast manager & WebSocket endpoint
│   ├── tests/                       # Pytest unit & lifecycle test suite
│   ├── uploads/incident_evidence/   # Evidence image persistence directory
│   └── venv/                        # Python 3.12 virtual environment
├── frontend/
│   ├── admin-dashboard/             # React 19 + Vite admin web console
│   │   └── src/
│   │       ├── components/          # IncidentMap (Leaflet), UI cards
│   │       ├── pages/               # AdminDashboard, AdminLogin, AdminSignup, AdminWelcome
│   │       └── api.js               # REST client & WebSocket helper
│   └── citizen-App/                 # React Native / Expo citizen mobile application
│       └── src/
│           ├── app/                 # Expo Router tabs (Home, Map, Alerts, Reports, Profile, SOS)
│           ├── components/          # Reusable cards, buttons, maps, legends
│           ├── services/            # API integration clients (incident, SOS, home, routing)
│           └── ThemeContext.tsx     # Theme provider (dark/light)
└── docs/                            # Project engineering documentation
```

---

## 3. Discovered Feature Baseline & Status Matrix

| Component / Feature | Discovered State | Actual Root Cause / Observations | Phase Priority |
| :--- | :--- | :--- | :--- |
| **Bug 4.1: Report Evidence Image Upload & Admin View** | **Broken / Partial** | 1. Citizen app `uploadIncidentEvidence` only sent `image/jpeg` or raw mime and swallowed upload errors silently.<br>2. Backend restricted uploads to strictly 3 exact MIME string keys (`image/jpeg`, `image/png`, `image/webp`). Upper case, query params, or `image/jpg` caused 415 HTTP error.<br>3. Admin dashboard required authentication header to view `GET /incidents/{id}/evidence`, rendering direct `<img>` tags broken without Blob object URLs.<br>4. Incidents main table had no evidence preview column at all. | **Phase 1 (Fix Bugs)** |
| **Bug 4.2: Visualizations / Charts Showing Unavailable Data** | **Broken / Partial** | 1. `FloodRiskCard.tsx`, `WeatherCard.tsx`, `AQICard.tsx`, `TrafficCard.tsx` in citizen app were 0-byte blank files.<br>2. Admin dashboard lacked interactive analytics charts (category distribution, resolution times, ward density).<br>3. `calculate_flood_risk` returned `risk_level: "UNAVAILABLE"` whenever observation age was >30 mins, with no distinction between missing data and stale offline fallback. | **Phase 1 (Fix Bugs)** |
| **Bug 4.3: Map Routing "Insufficient Data" Voice/UI Warning** | **Broken** | In `backend/app/routes/routing.py` line 143, when `flood_status == "NO_CURRENT_DATA"`, `overall_status` was unconditionally assigned `"INSUFFICIENT_DATA"`. This overrode valid TomTom routes, zero-traffic conditions, and spoke "insufficient data" even for normal clear roads. | **Phase 1 (Fix Bugs)** |
| **Authentication & RBAC** | **Working (Partial)** | JWT authentication with bcrypt password hashing is operational. Role enforcement (`admin` vs `citizen`) works. Password reset / OTP endpoints are missing (empty frontend files `OTPVerification.jsx` and `OTP.jsx`). | **Phase 2 & 9** |
| **Admin Report Review Queue** | **Partially Working** | Review queue allows approving (`verified`), rejecting (`rejected`), or deferring (`needs_review`). Lacks search, filtering, department assignment, SLA tracking, and resolution proof. | **Phase 2** |
| **Emergency SOS Lifecycle** | **Partially Working** | SOS creation and WebSocket broadcast works. However, no multi-agency service directory (police, fire, medical, flood rescue), no dispatch lifecycle stages (`acknowledged`, `dispatched`, `arrived`, `resolved`), and no simulation mode. | **Phase 4** |
| **Citizen Navigation & Routing** | **Partially Working** | Point-to-point routing works via map tap. Lacks typed destination autocomplete search, spoken turn-by-turn guidance, and real-time hazard avoidance. | **Phase 5** |
| **Notifications & Automation** | **Partially Working** | DB table `alerts` exists with user-specific and broadcast alerts. Automated event-driven notifications for report review, assignment changes, and SLA breach escalation are missing. | **Phase 6** |
| **Flood Intelligence & Risk Engine** | **Partially Working** | Rule engine parses BMC rainfall. Scikit-learn model exists in `flood_model.joblib`. Live inference pipeline needs integration with station data and graceful handling of dry periods. | **Phase 7** |
| **AI Admin Copilot** | **Missing** | Admin dashboard has no natural-language copilot to query live database records (ward statistics, open complaints, emergency clusters). | **Phase 8** |
| **Database & Environment Resiliency** | **Needs Hardening** | `main.py` ran `create_all(bind=engine)` at module import time against a hardcoded Postgres URL. If Postgres service was down or in local development/test environments, tests halted with OperationalError. | **Phase 1 & 9** |

---

## 4. Test Baseline & Environment Validation

1. **Python Virtual Environment**: Verified at `backend\venv\Scripts\python.exe` (Python 3.12.9).
2. **Existing Pytest Run**: Executing `pytest backend/tests` revealed an import-time `psycopg.OperationalError` because `main.py` executed `Base.metadata.create_all(bind=engine)` directly at import time without setting test environment overrides or handling database connectivity.
3. **Frontend Builds**:
   - Admin Dashboard: React 19 Vite application runs on port 5173.
   - Citizen App: Expo React Native application configured with TypeScript.

This audit establishes our verified baseline. No code will be removed or destructively changed; existing capabilities will be systematically fixed, expanded, and verified against tests.
