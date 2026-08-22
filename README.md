# Dayflow HRMS

A full-stack Human Resource Management System — authentication, employee directory, attendance tracking, leave/time-off management, and payroll, built by a team of four.

## Tech Stack

- **Frontend:** React + Vite, Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose), with a local JSON-file fallback (`server/data/employees.json`) when MongoDB isn't connected
- **Auth:** JWT (`Authorization: Bearer <token>`), bcrypt-hashed passwords

## Setup

### Server
```bash
cd server
cp .env.example .env
# fill in your own MONGO_URI and JWT_SECRET in .env — never commit this file
npm install
npm run dev
```
Runs on `http://localhost:5000`. Check `http://localhost:5000/api/health` to confirm it's up.

### Client
```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:5173` (Vite proxies `/api` calls to the server automatically).

### Seeding test data
`server/seed-dev.js` creates a persistent dev employee for local testing without needing to sign up manually:
```bash
cd server
node seed-dev.js
```
Run `node clean-db.js` (if present) to clear out leftover test/scratch accounts before a demo or PR — test scripts create throwaway employees during runs and should not be left in the shared database.

## Project Structure

```
client/
  src/
    api/            # one file per resource (axios wrappers) — axios.js holds the shared instance + auth interceptor
    components/      # shared UI (Navbar, etc.)
    pages/           # one page per route
server/
  config/db.js       # MongoDB connection
  middleware/auth.js  # verifyToken, requireAdmin
  models/            # Mongoose schemas
  routes/            # one router per resource
  services/dbStore.js # hybrid Mongo/local-JSON fallback for Employee
  data/employees.json # local fallback data store (gitignored in spirit, avoid committing real data here)
  test-*.js          # integration tests — run these against a live local server before opening a PR that touches routes
  seed-dev.js         # creates a persistent dev employee (does not self-delete)
```

## Team / Ownership

*(as originally agreed — see note below on current drift)*

| Person | Owns |
|---|---|
| Person A | Auth, Employee model/routes, Dashboard, Profile, Login/Signup pages |
| Person B | Attendance routes + page |
| Person C | Leave routes + page |
| Person D | Salary routes + page, final integration |

> **Note on current state:** Several files outside their original owner (Dashboard, Profile, Navbar, Employee/Attendance routes) have had significant work done by Person C while building Leave, because Time Off needed pieces of them (employee directory for admin allocation, salary display in profile, etc.). This table reflects the *original agreement*, not necessarily who last touched each file. If the team confirms a permanent reassignment, update this table to match — don't let it silently drift out of sync with reality.

## Branching

- `main` = always working
- One branch per person: `feature/auth_and_employee`, `feature/attendance`, `feature/leave`, `feature/payroll`
- Commit small, push often, merge to `main` regularly to avoid conflicts
- `git pull origin main` after every merge to stay in sync
- **Known issue:** the repo has no `.gitattributes`, so line-ending differences (CRLF/LF) between contributors' editors can make every file show as "modified" even with no real content change. Add `* text=auto eol=lf` to a `.gitattributes` file at the repo root to fix this — it's been a recurring source of noisy, hard-to-read diffs across branches.

## Data Models

### Employee
```
{
  _id, loginId, name, email, password (hashed), role ("admin" | "employee", case-insensitive checks),
  phone, department, designation, manager (Employee _id), dateOfJoining,
  profilePicture, address, about, skills: [String],
  leaveBalances: { paid: Number (default 24), sick: Number (default 7) },
  createdAt
}
```

### Attendance
```
{ _id, employeeId, date, checkIn, checkOut, workHours, extraHours, status ("present" | "absent" | "half-day" | "leave") }
```

### Leave (Time Off)
```
{
  _id, employeeId, type ("paid" | "sick" | "unpaid"), startDate, endDate,
  allocationDays (server-computed, inclusive day count, holidays excluded — see server/utils/holidays.js),
  remarks, attachment (optional, unused for now), status ("pending" | "approved" | "rejected"),
  adminComment, createdAt
}
```

### Salary
```
{
  _id, employeeId, monthlyWage, compensationType ("fixed" | "percentage"),
  basicPercent, hraPercent, standardAllowance, travelAllowance, foodAllowance,
  pfContribution, professionalTax
}
```

## API Routes

| Route | Method | Who | Owner |
|---|---|---|---|
| /api/auth/signup | POST | Public | Person A |
| /api/auth/login | POST | Public | Person A |
| /api/employees | GET | Admin | Person A |
| /api/employees/:id | GET / PUT | Both | Person A |
| /api/employees/:id/leave-balance | PUT | Admin | Person C (built on Person A's route file — flag for reassignment) |
| /api/attendance/:employeeId | GET | Both | Person B |
| /api/attendance/checkin | POST | Employee | Person B |
| /api/attendance/checkout | POST | Employee | Person B |
| /api/leave | GET / POST | Both | Person C |
| /api/leave/balance | GET | Both | Person C |
| /api/leave/:id/approve | PUT | Admin | Person C |
| /api/leave/:id/reject | PUT | Admin | Person C |
| /api/salary/:employeeId | GET | Both | Person D |
| /api/salary/:employeeId | PUT | Admin | Person D |

## Auth Convention

- JWT stored in `localStorage` under the key set by `Login.jsx`, sent as `Authorization: Bearer <token>` (handled automatically by the interceptor in `client/src/api/axios.js`)
- Token payload: `{ id, role }`
- `role` is checked case-insensitively (`"Admin"`/`"admin"`) — match this pattern in any new role checks rather than assuming one casing
- Frontend checks `role` to show/hide admin-only UI (e.g. Salary Info tab, allocation UI, approve/reject buttons)

## Testing

Each feature area has integration test scripts that hit the real running server over HTTP (not just internal logic) — run these against your local server before opening or updating a PR that touches routes you didn't write tests for yourself:
```bash
cd server
node test-balance.js
node test-leave-http.js
node test-allocation-http.js
```
These scripts create and clean up their own test data. If a script is interrupted mid-run, check the database for orphaned test accounts (patterns like `HTTP Test *`, `Alloc *`, `UI Employee/Admin`) and remove them — they can end up cluttering the real employee directory otherwise.

## Ground Rule

Until a route owner's real API is live, everyone else builds their page against hardcoded mock JSON matching the schema above, then swaps in real `fetch`/`axios` calls once the API exists. This avoids blocking each other. Once real auth exists, retire any mock tokens — don't leave hardcoded JWTs in tracked source files, even temporarily; keep them in a gitignored `.env.local` at most, with a short expiry.