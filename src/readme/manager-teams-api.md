# CRM Backend — Manager & Team Management API

Complete reference for all Team and HR endpoints. A manager is any user whose RBAC role carries the `team.write` permission. Managers can own and operate multiple teams simultaneously.

- **Base path:** `/api`
- **Auth:** `Bearer <token>`

---

## 👔 Manager Role Concept

There is no separate *Manager* database model. A manager is simply a **CRM User** whose assigned RBAC role carries the `team.write` permission. This grants full authority to create teams, add/remove members, approve requests, and track attendance.

- **Multi-Team:** A user can be a member of multiple teams simultaneously.
- **Dual-Path Writes:** Users with `team.write` act directly. Team `LEAD`s (without `team.write`) create `TeamRequest` records that require manager approval.
- **Audit Trail:** Every create / update / delete / assign operation writes to the `AuditLog` automatically.

---

## 🔐 Permissions Reference

| Permission Key | Who Needs It | What It Unlocks |
|---|---|---|
| `team.write` | Manager / HR Admin | Create/update/delete teams; assign/remove members directly; approve requests |
| `team.read` | Manager, Lead, Member | List/get teams, members, requests |
| `team.assignLead` | Manager / HR Admin | Assign or change the Team Lead |
| `user.write` | Manager / HR Admin | Create new users |
| `user.read` | Manager, Lead | List/get user profiles and team memberships |
| `attendance.self` | Any user | Check in / check out |
| `attendance.read` | Manager, Lead | View attendance records across team/users |
| `location.request` | Manager, Lead | Send location request to a team member |
| `location.read` | Manager, Lead | Read location request result |
| `device.register` | Any user | Register push-notification device |
| `consent.write` | Any user | Grant / revoke consent |

---

## 🏢 Teams API
**Base path:** `/api/teams`

- `POST /api/teams` — Create team *(team.write)*
- `GET /api/teams` — List all teams *(team.read)*
- `GET /api/teams/:id` — Get team with all members *(team.read)*
- `PATCH /api/teams/:id` — Update team name or lead *(team.write)*
- `DELETE /api/teams/:id` — Delete team (cascades members) *(team.write)*
- `POST /api/teams/:id/assign-lead` — Assign team lead *(team.assignLead)*

---

## 👥 Team Members API
**Base path:** `/api/teams/:teamId/members`

**Dual-path Logic:** If caller has `team.write`, assignment/removal is immediate. If caller is just `LEAD`, a `TeamRequest` (pending) is created for manager approval.

- `GET /api/teams/:teamId/members` — List members *(team.read)*
- `POST /api/teams/:teamId/members` — Assign member(s) *(team.write or LEAD)*
- `POST /api/teams/:teamId/members/bulk` — Bulk assign *(team.write)*
- `DELETE /api/teams/:teamId/members/:memberId` — Remove member by user ID *(team.write or LEAD)*
- `POST /api/teams/:teamId/members/bulk-remove` — Bulk remove *(team.write)*
- `GET /api/teams/:id/users` — List team users in flat structure *(team.read)*

---

## 📝 Team Requests API
**Base path:** `/api/teams`

- `POST /api/teams/:teamId/members/:memberId/transfer-request` — Create transfer request *(LEAD only)*
- `POST /api/teams/:teamId/join-request` — Create join request *(LEAD or target user)*
- `GET /api/teams/requests` — List all requests (filter by `status=/type=`) *(team.read)*
- `POST /api/teams/requests/:requestId/respond` — Manager approves or rejects request *(team.write)*
  - `{"approve": true}` triggers backend actions: creates/deletes/transfers `TeamMember`.

---

## 🎟 Users & Assignment
**Base path:** `/api/users`

- `POST /api/users` — Create user (with optional `teamId` to instantly assign) *(user.write)*
- `GET /api/users` — List users with team memberships *(user.read)*
- `GET /api/users/:id` — Get specific user profile *(user.read)*

---

## 📅 HR — Attendance
**Base path:** `/api/hr/attendance`

- `POST /api/hr/attendance/checkin` — Check in (once per day). Accepts coordinates/photo. *(attendance.self)*
- `POST /api/hr/attendance/checkout` — Check out. *(attendance.self)*
- `GET /api/hr/attendance` — Manager view of attendance. Paginated, filter by `userId`, `teamId`, `from`, `to`. *(attendance.read)*

---

## 📍 HR — Location Requests
**Base path:** `/api/hr/location-requests`
*(Privacy: User must actively respond. App cannot pull GPS silently.)*

- `POST /api/hr/location-requests` — Manager requests location from member. Sets TTL. *(location.request)*
- `POST /api/hr/location-requests/:id/respond` — Target user submits coordinates. *(requireAuth: target only)*
- `GET /api/hr/location-requests/:id/result` — Manager views submitted coordinates. *(location.read: requester only)*

---

## 📱 HR — Devices & Consent
**Devices:** `/api/hr/devices` | **Consent:** `/api/hr/consent`

- `POST /api/hr/devices/register` — Register device for push notifications (on login). *(device.register)*
- `POST /api/hr/devices/unregister` — Unregister device (e.g., logout). *(device.unregister)*
- `GET /api/hr/devices` — List user's devices. *(device.read)*
- `POST /api/hr/consent` — Grant consent (LOCATION | PHOTO | TERMS). *(consent.write)*
- `POST /api/hr/consent/revoke` — Revoke consent. *(consent.write)*
- `GET /api/hr/consent` — List user's consents. *(consent.read)*

---

## ⚙️ Enums

### TeamMemberRole
- `MEMBER` — Regular team member.
- `ASSISTANT_LEAD` — Elevated member.
- `LEAD` — Top level for team, can submit `TeamRequest` for team management.

### TeamRequest.type
- `assign` — Add user.
- `remove` — Remove user.
- `transfer` — Move user to another team.
- `join` — User asks to join.

### ConsentType
- `LOCATION` — Location sharing.
- `PHOTO` — Camera / photo capture.
- `TERMS` — Terms & conditions acceptance.
