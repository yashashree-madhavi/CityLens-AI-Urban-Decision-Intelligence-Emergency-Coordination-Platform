# CityLens AI — API & Integrations Specification

This document inventories all REST endpoints, WebSocket message protocols, external dependencies, and environment variable requirements for CityLens AI.

---

## 1. Authentication & Role-Based Access Control

### Role Hierarchy
- `citizen`: Can report incidents, upload evidence for owned reports, trigger SOS, check routes, and view personal alerts.
- `admin`: Can review all reports, approve/reject incidents, assign departments, trigger emergency dispatch, view city-wide metrics, and invoke AI Copilot.

### Endpoints

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | None | Public | Register standard citizen user |
| `POST` | `/auth/login` | None | Public | OAuth2 password flow returning JWT |
| `POST` | `/auth/register-admin` | None | Public | Admin registration with `ADMIN_SIGNUP_CODE` |
| `GET` | `/auth/me` | Bearer | Any | Retrieve logged-in profile & role |

---

## 2. Civic Incident & Report Management

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/incidents` | Bearer | Citizen/Admin | Submit new incident report |
| `POST` | `/incidents/{id}/evidence` | Bearer | Owner/Admin | Upload photo evidence (multipart/form-data) |
| `GET` | `/incidents/{id}/evidence` | Bearer | Owner/Admin | Stream authenticated evidence image |
| `GET` | `/incidents/my` | Bearer | Citizen | List authenticated user's submitted reports |
| `GET` | `/incidents` | Bearer | Admin | List all reports with search, filter, pagination |
| `PATCH` | `/incidents/{id}/status` | Bearer | Admin | Update operational lifecycle status |
| `PATCH` | `/incidents/{id}/verification`| Bearer | Admin | Review queue decision (`verified`/`rejected`) |
| `POST` | `/incidents/{id}/assign` | Bearer | Admin | Assign report to department / staff |
| `POST` | `/incidents/{id}/resolve` | Bearer | Admin/Staff | Mark resolved with evidence notes |
| `POST` | `/incidents/{id}/feedback`| Bearer | Owner | Submit 1-5 star citizen rating & feedback |
| `POST` | `/incidents/{id}/reopen` | Bearer | Owner | Reopen resolved incident within 7 days |

---

## 3. Emergency SOS & Coordination

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/emergencies` | Bearer | Citizen/Admin | Trigger immediate SOS alert |
| `GET` | `/emergencies/my` | Bearer | Citizen | List user's active/past SOS alerts |
| `GET` | `/emergencies` | Bearer | Admin | List all emergency incidents |
| `PATCH` | `/emergencies/{id}/status` | Bearer | Admin | Update emergency status (`active`, `dispatched`, `resolved`) |
| `POST` | `/emergencies/{id}/dispatch` | Bearer | Admin | Record agency dispatch handoff |
| `GET` | `/emergencies/agencies` | Bearer | Any | Directory of Mumbai response stations |

---

## 4. Intelligent Navigation & Routing

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/routing/analyze` | None | Public | Calculate multi-route safety & traffic risk |
| `GET` | `/routing/search` | None | Public | Geocode & autocomplete place/landmark query |
| `GET` | `/traffic` | None | Public | Query real-time traffic flow segment |

---

## 5. Flood Intelligence & Analytics

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/flood-risk` | None | Public | Latest flood risk across all BMC stations |
| `GET` | `/flood-risk/{station_id}` | None | Public | Detailed risk score & breakdown for station |
| `POST` | `/ml/flood-forecast` | None | Public | Run candidate ML model on rainfall sequence |
| `GET` | `/rainfall/forecast` | None | Public | Open-Meteo hourly rainfall outlook |
| `GET` | `/analytics/overview` | Bearer | Admin | Summary KPIs, category breakdown, ward trends |
| `POST` | `/copilot/query` | Bearer | Admin | AI Admin Copilot natural language data queries |

---

## 6. External Service Integrations

1. **TomTom Traffic & Routing API**:
   - `TOMTOM_API_KEY`: Required in `.env`.
   - Flow Segment Data: `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json`
   - Calculate Route: `https://api.tomtom.com/routing/1/calculateRoute/{origin}:{dest}/json`
   - Fuzzy Search: `https://api.tomtom.com/search/2/search/{query}.json`
2. **Open-Meteo APIs (Free / No Key Required)**:
   - Weather: `https://api.open-meteo.com/v1/forecast`
   - Air Quality: `https://air-quality-api.open-meteo.com/v1/air-quality`
3. **BMC Disaster Management AWS API**:
   - Sublocations: `https://dmwebtwo.mcgm.gov.in/api/sublocation/loadAll`
   - Station Weather: `https://dmwebtwo.mcgm.gov.in/api/tabWeatherForecastData/loadById`
4. **IITM Tropmet Rain Sensors**:
   - `https://mumbairain.tropmet.res.in/json/map_file`

---

## 7. Environment Variables Reference

| Variable Name | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | `postgresql://postgres:password@localhost:5432/citylens` | Primary relational database connection |
| `SECRET_KEY` | Yes | Long random secret | HMAC signing key for JWT tokens |
| `TOMTOM_API_KEY` | Yes | API Key string | Traffic and routing intelligence |
| `ADMIN_SIGNUP_CODE` | Yes | Secure pass-code | Required to register an admin user |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173,http://localhost:8081` | CORS whitelist for browser clients |
| `DISPATCH_SIMULATION_MODE` | No | `true` | Prevents real external dispatches during testing |
