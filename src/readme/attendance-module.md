# CRM Backend — Attendance Module

Complete deep-dive: how attendance works, what happens on checkin/checkout, DB schema, GPS location logging, audit trails, and full frontend integration guide.

- **Base path:** `/api/hr/attendance`
- **Auth required:** JWT (`Authorization: Bearer <token>`) on every request.

---

## 🧭 Full Flow: How Attendance Works

1. **App Launch / Morning:** Employee opens the app. Frontend shows "Checkin" button if not yet checked in today. App may ask for consent permission for location/photo before first checkin.
2. **Checkin Request:** Employee taps "Checkin". App captures current GPS location + optionally takes a selfie. Sends `POST /api/hr/attendance/checkin` with location + `photoRef`.
3. **Backend Processing (Atomic Transaction):** 
   - Checks: user must not have checked in today already.
   - Creates `Attendance` row (`status: ACCEPTED`, `checkinAt` = now).
   - If lat/lng provided → creates `LocationLog` row (`source: "attendance"`).
   - Creates `LocationAccessAudit` (`action: "checkin_created"`).
   - After transaction → calls `logAudit` (action: `"checkin"`).
4. **Working Day:** Employee is marked as "present" for the day. Managers can see this via `GET /api/hr/attendance`. Status is `ACCEPTED`.
5. **Checkout (End of Day):** Employee taps "Checkout". Sends `POST /api/hr/attendance/checkout`. Backend sets `checkoutAt` on today's attendance row. Logs audit (`"checkout"` action). Fails if not checked in or already checked out.

---

## 📊 Attendance Status Values

| Status | Meaning | When set |
|---|---|---|
| `PENDING` | Created but awaiting confirmation | Not currently set by checkin (checkin sets ACCEPTED directly) |
| `ACCEPTED` | Attendance recorded successfully | Set on `POST /checkin` (default) |
| `CONFIRMED` | Manager/admin has confirmed the attendance | Reserved for future admin confirmation flow |
| `FINALIZED` | Attendance locked/finalized for payroll | Reserved for payroll finalization flow |
| `REJECTED` | Attendance was rejected (fraud/invalid) | Reserved for admin rejection flow |

*Current checkin always sets `ACCEPTED`. CONFIRMED/FINALIZED/REJECTED are for future flows.*

---

## 📡 Endpoints — Full Detail

### Checkin
`POST /api/hr/attendance/checkin`
*Permission:* `attendance.self`

**Request Body** *(All optional except none required — bare POST works)*
```json
{
  "photoRef": "https://cdn.example.com/selfie.jpg",
  "latitude": 19.076090,
  "longitude": 72.877426,
  "accuracy": 12.5,
  "locationTs": "2026-03-18T09:00:00.000Z",
  "note": "Reached office on time"
}
```

**Response `201 Created`**
```json
{
  "attendance": {
    "id": "att_abc123",
    "userId": "user_xyz",
    "status": "ACCEPTED",
    "checkinAt": "2026-03-18T09:00:00.000Z",
    "checkoutAt": null,
    "photoRef": "...",
    "latitude": 19.076,
    "longitude": 72.877,
    "accuracy": 12.5,
    "locationTs": "...",
    "note": "Reached office on time"
  }
}
```
Validation: Only 1 checkin per day per user. Duplicate returns `400 You've already checked in today.`  
DB Writes: `Attendance` + `LocationLog` (if lat/lng) + `LocationAccessAudit` + `AuditLog` — all atomic.

---

### Checkout
`POST /api/hr/attendance/checkout`
*Permission:* `attendance.self`

**Request Body**
```json
{} // Empty body — no body needed
```

**Response `200 OK`**
```json
{
  "id": "att_abc123",
  "userId": "user_xyz",
  "status": "ACCEPTED",
  "checkinAt": "2026-03-18T09:00:00.000Z",
  "checkoutAt": "2026-03-18T18:30:00.000Z"
}
```
Errors: `400 You haven't checked in today.` | `400 You've already checked out today.`  
DB writes: Updates `attendance.checkoutAt` + writes `AuditLog` (action: `checkout`).

---

### List Attendance
`GET /api/hr/attendance`
*Permission:* `attendance.read` (Managers/HR/Admins)

**Query Parameters**
```http
GET /api/hr/attendance
  ?userId=user_abc      // filter by user
  &teamId=team_xyz      // filter by team (all team members)
  &from=2026-03-01      // date range start (ISO)
  &to=2026-03-31        // date range end (ISO)
  &page=1               // pagination
  &limit=50             // default 100
```

**Response `200 OK`**
```json
{
  "count": 42,
  "rows": [
    {
      "id": "att_abc123",
      "userId": "user_xyz",
      "status": "ACCEPTED",
      "checkinAt": "2026-03-18T09:00:00.000Z",
      "checkoutAt": "2026-03-18T18:30:00.000Z",
      "latitude": 19.076,
      "longitude": 72.877,
      "photoRef": null,
      "note": null,
      "user": {
        "id": "user_xyz",
        "name": "Ravi Kumar",
        "email": "ravi@company.com",
        "teamMembers": [
          { "team": { "id": "team_abc", "name": "Sales" } }
        ]
      }
    }
  ]
}
```
*Note: Includes user info with their team memberships. Sorted by `checkinAt DESC`.*

---

## 🗄️ Database Schema

### Attendance Table
```prisma
model Attendance {
  id          String           @id @default(cuid())
  userId      String
  status      AttendanceStatus @default(ACCEPTED)
  checkinAt   DateTime
  checkoutAt  DateTime?
  photoRef    String?          // photo URL
  latitude    Float?
  longitude   Float?
  accuracy    Float?
  locationTs  DateTime?        // GPS timestamp
  note        String?
  user        User             @relation(...)
}
```

### LocationLog Table
```prisma
model LocationLog {
  id          String   @id @default(cuid())
  userId      String
  latitude    Float
  longitude   Float
  accuracy    Float?
  recordedAt  DateTime
  source      String   // "attendance" | "location_request"
}
```

### LocationAccessAudit Table
```prisma
model LocationAccessAudit {
  id        String   @id @default(cuid())
  actorId   String
  targetId  String
  action    String   // "checkin_created" | "request_created" | "request_responded" | "result_read"
  meta      Json?
  createdAt DateTime @default(now())
}
```

---

## 📝 Audit Logs Generated
View all attendance audit logs via `GET /api/audit-logs?resource=attendance`

| Action | Resource | When | Payload |
|---|---|---|---|
| `checkin` | `attendance` | On checkin | `{ latitude, longitude }` |
| `checkout` | `attendance` | On checkout | No extra payload |
| `location.request.create` | `locationRequest` | Supervisor creates location request | `{ targetUserId, expiresAt, note }` |
| `location.request.respond` | `locationRequest` | Employee responds with coords | `{ latitude, longitude, accuracy, recordedAt }` |
| `location.request.read` | `locationRequest` | Supervisor reads result from Redis | `{ ephemeral: true }` |

---

## 💻 Frontend Integration Guide

**Step 1 — Consent (First Launch)**
Before checkin with GPS, check if user has given `LOCATION` consent. If not, show dialog:
```http
POST /api/hr/consent
{ "type": "LOCATION", "version": "1.0" }
```

**Step 2 — Device Registration (Login)**
On every login, register the device to enable location push notifications:
```json
POST /api/hr/devices/register
{
  "deviceId": "expo-device-id",
  "platform": "android",
  "pushToken": "ExponentPushToken[xxx]"
}
```

**Step 3 — Check Today's Attendance Status**
Query to know if employee already checked in/out today:
```http
GET /api/hr/attendance?userId=<myUserId>&from=<todayISO>&to=<todayISO>
```
- If `checkoutAt` parsed → show "Checked out at HH:MM"
- If NOT `checkoutAt` → show "Checked in at HH:MM, Checkout now"
- If empty → show "Checkin" button

**Step 4 — Checkin Button implementation**
```javascript
// Get GPS location first
const location = await Location.getCurrentPositionAsync({});

// Take selfie (optional)
const photo = await ImagePicker.launchCameraAsync({});

// Call checkin
const res = await fetch('/api/hr/attendance/checkin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    locationTs: new Date().toISOString(),
    photoRef: photo?.uri ?? undefined,
    note: "On time"
  })
});
```

**Step 5 — Checkout Button implementation**
```javascript
const res = await fetch('/api/hr/attendance/checkout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Manager Dashboard — View Team Attendance**
```javascript
// Show attendance for "Sales" team for today
GET /api/hr/attendance?teamId=team_sales_id&from=2026-03-18T00...&to=2026-03-18T23...

// Show all team attendance for this month
GET /api/hr/attendance?teamId=team_sales_id&from=2026-03-01&to=2026-03-31&page=1&limit=200
```

**Location Request Flow (Manager checking employee)**
```javascript
// STEP 1: Manager creates request
const { requestId } = await fetch('/api/hr/location-requests', {
  method: 'POST',
  body: JSON.stringify({ targetUserId: "emp_id", expiresInSeconds: 60 })
}).then(r => r.json());

// STEP 2: Employee device receives: Socket event "location.fetch_request" or Silent Push.

// STEP 3: Employee app auto-responds background/foreground
await fetch(`/api/hr/location-requests/${requestId}/respond`, {
  method: 'POST',
  body: JSON.stringify({ latitude: 19.076, longitude: 72.877, accuracy: 8 })
});

// STEP 4: Manager polls for result
const { coords } = await fetch(`/api/hr/location-requests/${requestId}/result`).then(r => r.json());
// coords: { latitude, longitude, accuracy, recordedAt }
```

---

## ❌ Common Errors

| Error | Status | Cause | Fix |
|---|---|---|---|
| `You've already checked in today.` | 400 | Duplicate checkin for same day | Check today's attendance first; show checkout instead |
| `You haven't checked in today.` | 400 | Checkout called without checkin | Show checkin button, not checkout |
| `You've already checked out today.` | 400 | Double checkout | Hide checkout button after successful checkout |
| `Missing permission: attendance.self` | 403 | User role lacks permission | Assign `attendance.self` permission via RBAC |
| `Missing permission: attendance.read` | 403 | Non-manager trying to list all attendance | Only give `attendance.read` to Manager/Admin roles |
| `Request is expired` | 400 | Location request TTL exceeded | Create a new location request |
| `Only target user can respond` | 403 | Wrong user trying to respond | Ensure correct employee responds |

---

## 👥 Permissions Role Mapping

| Role | Permissions to assign |
|---|---|
| **Super Admin** | All — already seeded |
| **HR Manager** | `attendance.read`, `attendance.self`, `location.request`, `location.read`, `location.audit`, `consent.read` |
| **Team Manager** | `attendance.self`, `attendance.read`, `location.request`, `location.read` |
| **Employee / Sales Agent** | `attendance.self`, `device.register`, `device.unregister`, `device.read`, `consent.write`, `consent.read` |

*(Manage permissions via: `POST /api/rbac/roles/:roleId/permissions` or `PATCH /api/rbac/users/:userId/roles`)*
