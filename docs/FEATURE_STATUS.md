# CityLens AI — Feature Status Matrix

This document tracks the verified status of all functional modules and features across the platform.

**Status Legend**:
- `PLANNED`: Requirements defined, ready for implementation.
- `IN_PROGRESS`: Currently being coded or configured.
- `IMPLEMENTED`: Code written, pending test verification.
- `TESTED_AND_VERIFIED`: Verified through passing automated tests or manual verification.
- `BLOCKED`: Blocked by external third-party API or unavailable credentials.

---

## 1. Baseline Bug Fixes (Phase 1)

| Feature ID | Description | Status | Verification Notes |
| :--- | :--- | :--- | :--- |
| **BUG-01** | Report evidence image upload, processing & admin preview | `IN_PROGRESS` | Root cause analyzed (MIME restrictions, FormData handling, missing preview column). |
| **BUG-02** | Visualizations & charts showing "unavailable data" | `IN_PROGRESS` | Root cause analyzed (0-byte card files, lack of chart widgets, overly aggressive freshness cutoff). |
| **BUG-03** | Map routing & voice message "insufficient data" bug | `IN_PROGRESS` | Root cause analyzed (line 143 forcing `INSUFFICIENT_DATA` when `flood_status == "NO_CURRENT_DATA"`). |
| **REG-01** | Test execution & database import resilience | `IN_PROGRESS` | Database URL override and connection fallback for testing and development. |

---

## 2. Admin Dashboard & Report Management (Phase 2)

| Feature ID | Description | Status | Verification Notes |
| :--- | :--- | :--- | :--- |
| **ADM-01** | Enhanced review queue with filter, search, pagination | `PLANNED` | Filters by status, category, date, and priority. |
| **ADM-02** | Evidence zoom modal & image inspection | `PLANNED` | Allows reviewing full-resolution evidence. |
| **ADM-03** | Mandatory rejection reason & audit logging | `PLANNED` | Prevents arbitrary rejections without documented justification. |
| **ADM-04** | Complete report lifecycle state transitions | `PLANNED` | Enforces state machine transitions in backend API. |
| **ADM-05** | Dashboard analytics & metric aggregation endpoints | `PLANNED` | Real backend aggregation queries (no fake statistics). |
| **ADM-06** | Department & staff assignment workflows | `PLANNED` | Assigning cases to municipal departments and field staff. |

---

## 3. Essential AI Features (Phase 3)

| Feature ID | Description | Status | Verification Notes |
| :--- | :--- | :--- | :--- |
| **AI-01** | Civic image verification (potholes, garbage, flood, etc.) | `PLANNED` | Vision heuristics & relevance scoring against claimed category. |
| **AI-02** | Transparent suspicion scoring & factor explanation | `PLANNED` | Multi-factor anomaly calculation with readable explanation notes. |
| **AI-03** | Duplicate detection & incident clustering | `PLANNED` | Spatio-temporal clustering to prevent duplicated field dispatches. |
| **AI-04** | Automated department & priority recommendation | `PLANNED` | Recommends department and priority based on severity and category. |

---

## 4. Emergency SOS System (Phase 4)

| Feature ID | Description | Status | Verification Notes |
| :--- | :--- | :--- | :--- |
| **EMG-01** | Citizen SOS intake & immediate acknowledgment | `PLANNED` | Fast geolocation alert ingestion. |
| **EMG-02** | Mumbai emergency service directory & agency routing | `PLANNED` | Police, Fire, Ambulance, and Disaster Ward lookup. |
| **EMG-03** | Multi-stage dispatch lifecycle tracking | `PLANNED` | `Received -> Validating -> Notified -> Acknowledged -> Dispatched -> Resolved`. |
| **EMG-04** | Admin emergency console with live broadcast | `PLANNED` | Dedicated urgent SOS panel with WebSocket updates. |
| **EMG-05** | Simulated dispatch & test drill environment | `PLANNED` | Clear simulation mode for testing response procedures safely. |
| **EMG-06** | Citizen emergency status tracking | `PLANNED` | Live progress tracker for reporting citizen. |

---

## 5. Citizen App & Navigation (Phase 5)

| Feature ID | Description | Status | Verification Notes |
| :--- | :--- | :--- | :--- |
| **NAV-01** | Typed destination autocomplete search | `PLANNED` | Search bar for places/landmarks + pin on map. |
| **NAV-02** | Incident-aware hazard avoidance & alternative routes | `PLANNED` | Routing around active waterlogging and road closures. |
| **NAV-03** | Accurate spoken guidance & accessible UI | `PLANNED` | Synchronized voice prompts matching actual route status. |
| **NAV-04** | Multilingual reporting (English, Marathi, Hindi) | `PLANNED` | Localized submission labels and incident categories. |

---

## 6. Notifications & Automation (Phase 6)

| Feature ID | Description | Status | Verification Notes |
| :--- | :--- | :--- | :--- |
| **NOTIF-01**| Event-driven citizen notifications on status changes | `PLANNED` | Updates on approval, rejection, assignment, and resolution. |
| **NOTIF-02**| SLA tracking & automated escalation for overdue cases | `PLANNED` | Automated overdue detection by category SLA. |
| **NOTIF-03**| Resolution evidence upload & citizen feedback rating | `PLANNED` | After-repair photo notes and 1-5 star citizen rating. |

---

## 7. Flood Intelligence & Analytics (Phase 7)

| Feature ID | Description | Status | Verification Notes |
| :--- | :--- | :--- | :--- |
| **FLD-01** | BMC & IITM rainfall ingestion validation & freshness | `PLANNED` | Defensive parsing, timestamp normalization, stale handling. |
| **FLD-02** | Hybrid rule-based & ML flood-risk prediction | `PLANNED` | Rule engine with ML inference pipeline. |
| **FLD-03** | Automated flood alerts & ward hotspot mapping | `PLANNED` | Alert generation on critical rainfall thresholds. |

---

## 8. Advanced AI Innovations (Phase 8)

| Feature ID | Description | Status | Verification Notes |
| :--- | :--- | :--- | :--- |
| **ADV-01** | AI Admin Copilot for natural language queries | `PLANNED` | Querying live database for operational statistics. |
| **ADV-02** | Predictive maintenance & chronic hotspot detection | `PLANNED` | Identifying recurring civic failure points across Mumbai wards. |
| **ADV-03** | Automated daily and weekly operational summaries | `PLANNED` | Scheduled executive briefing generation. |

---

## 9. Security, Reliability & Readiness (Phase 9)

| Feature ID | Description | Status | Verification Notes |
| :--- | :--- | :--- | :--- |
| **SEC-01** | Role-based authorization & endpoint guardrails | `PLANNED` | Verification that admin actions cannot be invoked by citizens. |
| **SEC-02** | Reporter privacy & PII sanitization | `PLANNED` | Masking citizen contact details in public views. |
| **SEC-03** | End-to-end automated testing suite (Workflows A-F) | `PLANNED` | Comprehensive Pytest suite covering all required workflows. |
| **SEC-04** | Deployment configuration & production runbook | `PLANNED` | Complete setup documentation and `.env` template. |
