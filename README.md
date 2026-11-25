# CityLens AI 

```
backend/                      FastAPI + PostgreSQL (port 8000)
frontend/admin-dashboard/     Admin website (React + Vite, port 5173)
frontend/citizen-App/         Citizen mobile app (Expo / React Native)
```

## 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows   (Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env         # Mac/Linux: cp .env.example .env
```

Open `.env` and fill in: `DATABASE_URL`, `SECRET_KEY`, `TOMTOM_API_KEY`,
and `ADMIN_SIGNUP_CODE` (any secret text – needed to create admin accounts).

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

`--host 0.0.0.0` is important: it lets your phone reach the backend.
API docs: http://127.0.0.1:8000/docs

## 2. Admin website

```bash
cd frontend/admin-dashboard
npm install
copy .env.example .env         # VITE_API_URL=http://127.0.0.1:8000
npm run dev                    # http://localhost:5173
```

Click **Create Admin Account**, enter the `ADMIN_SIGNUP_CODE`, then login.

## 3. Citizen app

```bash
cd frontend/citizen-App
npm install
npx expo start
```

Phone and computer must be on the **same Wi-Fi**. The app finds the computer's
IP automatically. For a deployed backend set `EXPO_PUBLIC_API_URL` (see `.env.example`).
Allow Windows Firewall access for port 8000 if the phone cannot connect.

## What talks to what

| Feature | Citizen app | Backend | Admin website |
|---|---|---|---|
| Register / Login | `/auth/register`, `/auth/login` | JWT | `/auth/register-admin`, `/auth/login` |
| Home cards | `/home/summary` | weather, AQI, traffic, flood | – |
| SOS | `POST /emergencies`, `GET /emergencies/my` | AI resource recommendation + WebSocket broadcast | live feed, status buttons |
| Incident reports | `POST /incidents`, `GET /incidents/my` | AI fake-report check | table, status dropdown |
| Alerts | `GET /alerts`, `PATCH /alerts/{id}/read` | created when admin verifies a report | – |
| Safe route | `GET /routing/analyze` | traffic + flood + incidents | – |
| Flood risk | – | `/flood-risk` | Flood Risk tab |

## Known limits
- Photos in "Report an Incident" are not uploaded (backend has no file upload yet).
- No OTP / forgot-password in the backend, so those screens are not functional.
- Citizen "delete" only hides an item on that phone; records stay on the server.
