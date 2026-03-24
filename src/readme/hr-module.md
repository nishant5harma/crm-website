# CRM Backend — HR Module

Complete guide for HR module — Attendance, Location Tracking, Device Management, and Consent. All endpoints, permissions, and flows.

- **Base path:** `/api/hr`
- **Auth:** All HR endpoints require JWT (`requireAuth`) + per-route RBAC permission.

---

## 📦 4 Sub-modules

1. **Attendance:** Employee check-in/check-out + admin list. (`/api/hr/attendance`)
2. **Location Requests:** Supervisor requests employee location on-demand (ephemeral, Redis-stored). (`/api/hr/location-requests`)
3. **Device Management:** Register/unregister push notification devices. (`/api/hr/devices`)
4. **Consent:** Create/revoke user consent for location tracking, photo, terms. (`/api/hr/consent`)

---

## 🔑 All HR Permissions

| Permission Key | Module | Who Should Have It | What It Allows |
|---|---|---|---|
| `attendance.self` | Attendance | All employees | Mark own checkin / checkout |
| `attendance.read` | Attendance | Manager / HR / Admin | List all attendance records (with filters) |
| `location.request` | Location | Supervisor / Manager | Create on-demand location request to a user |
| `location.read` | Location | Supervisor / Manager | Read location request result (ephemeral) |
| `location.audit` | Location | Admin / HR | View location access audit records |
| `device.register` | Device | All employees (mobile app) | Register / update push notification device |
| `device.unregister` | Device | All employees | Remove device / push token |
| `device.read` | Device | All employees / Admin | List own registered devices |
| `consent.write` | Consent | All employees | Create or revoke consent entries |
| `consent.read` | Consent | All employees / Admin | Read own consent records |

---

## 📆 Attendance Endpoints

- **Check-In:** `POST /api/hr/attendance/checkin` *(Permission: `attendance.self`)*
  ```json
  {
    "photoRef": "https://storage/selfie.jpg",
    "latitude": 19.076,
    "longitude": 72.877,
    "accuracy": 10,
    "locationTs": "2026-03-18T09:00:00.000Z",
    "note": "On time"
  }
  ```
  *(Creates `Attendance`, `LocationLog`, `LocationAccessAudit` + `AuditLog` in one transaction. Max 1/day)*

- **Check-Out:** `POST /api/hr/attendance/checkout` *(Permission: `attendance.self`)*
- **List Attendance:** `GET /api/hr/attendance?userId=<id>&teamId=<id>&from=...&to=...` *(Permission: `attendance.read`)*

---

## 📍 Location Request Endpoints

**Flow:** Supervisor requests → employee device gets push/socket event → employee app responds with GPS → coords stored in Redis (60s TTL) → Supervisor reads result once.

- **Request Location:** `POST /api/hr/location-requests` *(Permission: `location.request`)*
  ```json
  { "targetUserId": "<employeeId>", "expiresInSeconds": 60, "note": "Client visit" }
  ```
- **Employee Responds:** `POST /api/hr/location-requests/:id/respond` *(Target user only)*
- **Supervisor Reads Result:** `GET /api/hr/location-requests/:id/result` *(Permission: `location.read`)*

---

## 📱 Device Management Endpoints
*Required for push notifications (location fetches, leads, followups).*

- **Register Device:** `POST /api/hr/devices/register` *(Permission: `device.register`)*
  ```json
  { "deviceId": "unique-id", "platform": "android", "pushToken": "ExponentPushToken[xxx]" }
  ```
- **Unregister:** `POST /api/hr/devices/unregister`
- **List Devices:** `GET /api/hr/devices`

---

## 📝 Consent Endpoints
*(Types: `LOCATION`, `PHOTO`, `TERMS`)*

- **Give Consent:** `POST /api/hr/consent`
  ```json
  { "type": "LOCATION", "version": "1.0", "meta": {} }
  ```
- **Revoke Consent:** `POST /api/hr/consent/revoke`
- **List Consents:** `GET /api/hr/consent`

---

## ⚡ Real-time — Socket.IO

Bidirectional real-time communication for location requests and notifications, falling back to FCM/WebPush when offline.

### 1- Connect & Authenticate
```javascript
// Option A (Recommended for Mobile)
const socket = io("https://api.yourcrm.com", { auth: { token: "<JWT>" } });

// Option B (Web Browsers)
const socket = io("https://api.yourcrm.com", { extraHeaders: { Authorization: "Bearer <JWT>" } });
```

### 2- Register (Join User Room)
*Must be emitted immediately after connecting:*
```javascript
socket.emit("register", { userId: currentUser.id });
```

### 3- Events to Listen (Server → Client)
- `location.fetch_request`: Sent to employee when supervisor requests location.
- `location.responded`: Sent to supervisor when employee replies with GPS.
- `push`: Generic in-app notification.
- *(Offline fallback sends push notifications via FCM with same payloads).*

**Example Handlers:**
```javascript
// Employee
socket.on("location.fetch_request", async (data) => {
  const coords = await getCurrentGPS();
  await api.post(`/api/hr/location-requests/${data.requestId}/respond`, coords);
});

// Supervisor
socket.on("location.responded", (data) => showLocationOnMap(data.coords));
```

### 4- Push Notification Fallback
If the socket `userSocketMap` shows the user is offline, backend utilizes `POST /api/hr/devices/register` tokens to send data silently via FCM (Android/iOS) or WebPush.

---

## 📊 Endpoint Summary

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/api/hr/attendance/checkin` | `attendance.self` | Employee marks checkin |
| POST | `/api/hr/attendance/checkout` | `attendance.self` | Employee marks checkout |
| GET | `/api/hr/attendance` | `attendance.read` | Admin/Manager view attendance |
| POST | `/api/hr/location-requests` | `location.request` | Request employee location |
| POST | `/api/hr/location-requests/:id/respond` | Target user only | Employee responds with GPS |
| GET | `/api/hr/location-requests/:id/result` | `location.read` | Read location result |
| POST | `/api/hr/devices/register` | `device.register` | Register push device |
| POST | `/api/hr/devices/unregister` | `device.unregister` | Remove push device |
| GET | `/api/hr/devices` | `device.read` | List own devices |
| POST | `/api/hr/consent` | `consent.write` | Create consent |
| POST | `/api/hr/consent/revoke` | `consent.write` | Revoke consent |
| GET | `/api/hr/consent` | `consent.read` | List consents |
