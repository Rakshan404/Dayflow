# HRMS - Schema & API Agreement (v1)

Agree on this in 15 min, then everyone builds independently against it.

## Models

### Employee
```
{
  _id,
  loginId,        // e.g. HR20SO2026001 (auto-generated)
  name,
  email,
  password,       // hashed
  role,           // "admin" | "employee"
  phone,
  department,
  designation,
  manager,        // Employee _id
  dateOfJoining,
  profilePicture, // url
  address,
  about,
  skills: [String],
  createdAt
}
```

### Attendance
```
{
  _id,
  employeeId,
  date,
  checkIn,   // time
  checkOut,  // time
  workHours,
  extraHours,
  status     // "present" | "absent" | "half-day" | "leave"
}
```

### Leave (TimeOff)
```
{
  _id,
  employeeId,
  type,          // "paid" | "sick" | "unpaid"
  startDate,
  endDate,
  allocationDays,
  remarks,
  attachment,    // optional, for sick leave
  status,        // "pending" | "approved" | "rejected"
  createdAt
}
```

### Salary
```
{
  _id,
  employeeId,
  monthlyWage,
  compensationType,   // "fixed" | "percentage"
  basicPercent,
  hraPercent,
  standardAllowance,
  travelAllowance,
  foodAllowance,
  pfContribution,
  professionalTax
}
```

## API Routes (agree on these now, build later)

| Route | Method | Who | Owner |
|---|---|---|---|
| /api/auth/signup | POST | Public | Person A |
| /api/auth/login | POST | Public | Person A |
| /api/employees | GET | Admin | Person A |
| /api/employees/:id | GET/PUT | Both | Person A |
| /api/attendance/:employeeId | GET | Both | Person B |
| /api/attendance/checkin | POST | Employee | Person B |
| /api/attendance/checkout | POST | Employee | Person B |
| /api/leave | GET/POST | Both | Person C |
| /api/leave/:id/approve | PUT | Admin | Person C |
| /api/leave/:id/reject | PUT | Admin | Person C |
| /api/salary/:employeeId | GET | Both | Person D |
| /api/salary/:employeeId | PUT | Admin | Person D |

## Auth convention
- JWT stored in localStorage, sent as `Authorization: Bearer <token>`
- Token payload: `{ id, role }`
- Frontend checks `role` to show/hide admin-only UI (e.g. Salary Info tab)

## Ground rule
Until Person A's auth is live, everyone else builds their page against **hardcoded mock JSON** matching the schema above, then swaps in real `fetch`/`axios` calls once the API exists. This is how we avoid blocking each other.
