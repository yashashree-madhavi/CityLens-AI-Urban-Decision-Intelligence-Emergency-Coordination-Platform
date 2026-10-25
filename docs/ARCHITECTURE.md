# CityLens AI — System Architecture & Data Flow

This document details the software architecture, data pipelines, network boundaries, and database design of CityLens AI.

---

## 1. System Overview & Component Diagram

```mermaid
flowchart TD
    subgraph Frontend["Frontend Client Layer"]
        CitizenApp["Citizen Mobile App\n(React Native / Expo 57)"]
        AdminWeb["Admin Web Dashboard\n(React 19 / Vite 8)"]
    end

    subgraph Gateway["API & Communication Gateway"]
        FastAPI["FastAPI ASGI Server\n(Port 8000)"]
        WSServer["WebSocket Connection Manager\n(/ws/admin)"]
        AuthMiddleware["JWT Authentication & RBAC Middleware"]
    end

    subgraph Services["Core Application Services"]
        IncidentSvc["Incident & Evidence Service"]
        EmergencySvc["Emergency SOS & Dispatch Service"]
        RoutingSvc["Hazard-Aware Routing Engine"]
        FloodSvc["Flood Risk & ML Prediction Engine"]
        NotifSvc["Event & Notification Engine"]
        CopilotSvc["AI Admin Copilot Service"]
    end

    subgraph DataStore["Data & Persistence Layer"]
        PostgresDB[("PostgreSQL Database\n(CityLens Schema)")]
        SQLiteMem[("SQLite In-Memory / Test Store")]
        FileStorage["File Store\n(uploads/incident_evidence)"]
    end

    subgraph ExternalAPIs["External Intelligence APIs"]
        TomTom["TomTom Traffic & Routing API"]
        OpenMeteo["Open-Meteo Weather & AQI"]
        BMC["BMC Disaster Management AWS"]
        IITM["IITM Tropmet Rain Sensors"]
    end

    CitizenApp -->|REST API Calls| FastAPI
    AdminWeb -->|REST API Calls| FastAPI
    AdminWeb <-->|Live SOS Stream| WSServer

    FastAPI --> AuthMiddleware
    AuthMiddleware --> Services

    IncidentSvc --> PostgresDB
    IncidentSvc --> FileStorage
    EmergencySvc --> PostgresDB
    EmergencySvc --> WSServer
    RoutingSvc --> TomTom
    RoutingSvc --> PostgresDB
    FloodSvc --> BMC
    FloodSvc --> IITM
    FloodSvc --> PostgresDB
    NotifSvc --> PostgresDB
    CopilotSvc --> PostgresDB
```

---

## 2. Database Entity-Relationship Model

```mermaid
erDiagram
    USERS ||--o{ INCIDENT_REPORTS : "submits"
    USERS ||--o{ EMERGENCIES : "triggers"
    USERS ||--o{ ALERTS : "receives"
    INCIDENT_REPORTS ||--o| EMERGENCIES : "escalates to"
    INCIDENT_REPORTS ||--o{ INCIDENT_AUDIT_LOGS : "tracks"
    INCIDENT_REPORTS }o--|| DEPARTMENTS : "assigned to"

    USERS {
        int id PK
        string name
        string email
        string password_hash
        string role
        float latitude
        float longitude
        datetime created_at
    }

    INCIDENT_REPORTS {
        int id PK
        int user_id FK
        string incident_type
        text description
        float latitude
        float longitude
        string status
        string ai_classification
        float ai_suspicion_score
        text ai_reason
        string evidence_image_path
        string verification_status
        string verification_method
        float verification_confidence
        text verification_reason
        datetime verified_at
        int verified_by FK
        string emergency_priority
        datetime escalated_at
        int assigned_department_id FK
        int assigned_staff_id FK
        datetime sla_due_at
        int citizen_rating
        text resolution_notes
        string resolution_image_path
        datetime resolved_at
        datetime created_at
    }

    EMERGENCIES {
        int id PK
        int user_id FK
        int incident_report_id FK
        string emergency_type
        string description
        float latitude
        float longitude
        string status
        string dispatch_stage
        string assigned_agency
        datetime acknowledged_at
        datetime dispatched_at
        datetime resolved_at
        datetime created_at
    }

    ALERTS {
        int id PK
        int user_id FK
        string alert_type
        string title
        text message
        string severity
        int is_read
        datetime created_at
    }

    BMC_WEATHER {
        int id PK
        int bmc_location_id
        string station_name
        float latitude
        float longitude
        datetime timestamp
        float temperature
        float humidity
        float rain_15min
        float rain_1hr
        float rain_3hr
        float rain_24hr
    }
```

---

## 3. Incident Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Reported: Citizen Submission
    Reported --> UnderReview: Evidence Uploaded
    UnderReview --> Verified: Admin Approval
    UnderReview --> Rejected: Admin Rejection (Mandatory Reason)
    Verified --> Assigned: Municipal Dept Assigned
    Assigned --> InProgress: Field Team Dispatched
    InProgress --> Resolved: Repair Completed + Evidence
    Resolved --> Closed: Citizen Acknowledgment
    Resolved --> UnderReview: Reopened within 7 days
    Rejected --> [*]
    Closed --> [*]
```

---

## 4. Emergency SOS Event & Broadcast Flow

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen User
    participant App as Mobile App
    participant API as FastAPI Backend
    participant WS as WebSocket Hub
    actor Dispatcher as Admin / Dispatcher
    participant Agency as Response Agency (Simulated/Real)

    Citizen->>App: Tap SOS / Emergency
    App->>API: POST /emergencies (Coords, Type)
    API->>API: Calculate nearest agency & flood/traffic risks
    API->>API: Persist Emergency record (Status: Active)
    API-->>App: Return Emergency ID & Service Recommendation
    API->>WS: Broadcast new_emergency event
    WS-->>Dispatcher: Instant audio/visual alert on Admin Console
    Dispatcher->>API: PATCH /emergencies/{id}/dispatch (Agency selected)
    API->>API: Update status: Dispatched + Log timestamp
    API->>WS: Broadcast emergency_dispatched event
    WS-->>Dispatcher: Update Live Feed & Map Marker
    WS-->>App: Push notification / SOS status update: Dispatched
    Dispatcher->>API: PATCH /emergencies/{id}/status (Resolved)
    API->>API: Archive incident with resolution audit
```
