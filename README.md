# Dayflow HRMS

## Setup

### Server
```
cd server
cp .env.example .env
npm install
npm run dev
```
Runs on http://localhost:5000. Check http://localhost:5000/api/health to confirm it's up.

### Client
```
cd client
npm install
npm run dev
```
Runs on http://localhost:5173 (Vite proxies /api calls to the server automatically).

## Team / Ownership
- **Person A** — Auth, Employee model/routes, Dashboard, Profile, Login/Signup pages
- **Person B** — Attendance routes + page
- **Person C** — Leave routes + page
- **Person D** — Salary routes + page, final integration

## Branching
- `main` = always working
- Branch per person: `feature/auth`, `feature/attendance`, `feature/leave`, `feature/payroll`
- Commit small, push often, merge to `main` every 1-2 hrs to avoid conflicts
- `git pull origin main` after every merge to stay in sync

See `SCHEMA_API_AGREEMENT.md` for the shared data models and API contract everyone builds against.
