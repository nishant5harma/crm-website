# CRM Backend — Lead Management API

Complete reference for all Lead endpoints — intake via webhooks, automatic & manual assignment, escalations, follow-ups, status, stage history, and analytics (funnel & ratings).

- **Base path:** `/api/leads`
- **Auth:** JWT `Bearer <token>` (except Webhook, which uses HMAC)

---

## 🔄 Lead Lifecycle Overview

1. **Intake:** External portals (99acres, MagicBricks, website) call `/api/leads/webhook`. The payload is normalized and queued for assignment.
2. **Automatic Assignment:** Background workers pick up the lead and assign it to an agent based on round-robin, capacity, and source pool rules.
3. **Manual Overrides & Escalation:** Managers can manually reassign leads. If a lead exceeds thresholds without action, it escalates to the `/assignment/admin/escalated` queue.
4. **Follow-ups & Status:** Agents log calls, notes, and change status. Terminal states (WON/LOST/UNQUALIFIED) release the agent's capacity.
5. **Analytics:** Admins track follow-ups, funnel conversions by stage, and agent ratings.

---

## 🔑 Permissions

| Permission | Scope | Used By |
|---|---|---|
| `lead.read` | Read lead data, follow-ups, stage history, analytics | Agents, Team Leads, Managers |
| `lead.write` | Create follow-ups, update status/stage/priority | Agents, Team Leads |
| `lead.assign` | Manual (re)assignment of leads | Managers / Supervisors |
| `lead.escalation` | View escalated leads queue | Managers / Supervisors |
| `lead.read (admin)` | Admin follow-up list, funnel, ratings | Super Admin / Reporting Roles |

---

## 📥 Webhook Intake

`POST /api/leads/webhook`  
*(HMAC only - No JWT)*

Receives raw lead payloads from external portals.

**Headers:**
- `x-lead-source` / `x-source`: Recommended (e.g. `magicbricks`, `website`)
- `x-idempotency-key`: Optional dedupe key
- **HMAC Header(s):** Required for signature verification against the raw body.

**Request Body (Normalized internally):**
```json
{
  "provider": "magicbricks",
  "externalId": "MB-1234567890",
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "phone": "+919876543210",
  "source": "magicbricks",
  "payload": { /* full raw provider payload */ }
}
```

*Note: Deduplication uses a hash of phone, email, source, and externalId. Existing leads are linked instead of duplicated.*

---

## 🧑‍💼 Assignment & Escalation

### 1. Manual Assign
`POST /api/leads/assignment/:id` *(Permission: `lead.assign`)*
```json
{ "userId": "clusr123..." }
```
*Cancels pending auto-assignment jobs, updates capacity (new assignee +1, previous assignee -1).*

### 2. List Escalated Leads
`GET /api/leads/assignment/admin/escalated?page=1&limit=50` *(Permission: `lead.escalation`)*

### 3. Assign Escalated Lead
`POST /api/leads/assignment/admin/escalated/:id/assign` *(Permission: `lead.assign`)*
```json
{ "userId": "clusr123..." }
```

---

## 📞 Follow-ups & Status

### 1. Create Follow-up
`POST /api/leads/followup/:id/followups` *(Permission: `lead.write`)*
```json
{
  "assignedTo": "clusr123...", 
  "dueAt": "2025-06-02T10:00:00.000Z",
  "note": "Call the client after site visit",
  "disposition": "Interested, needs approval",
  "rating": 4,
  "status": "pending"
}
```
*If `assignedTo` is set, a socket/push notification is sent.*

### 2. List Follow-ups
`GET /api/leads/followup/:id/followups?page=1&limit=50` *(Permission: `lead.read`)*

### 3. Update Status / Stage
`PATCH /api/leads/followup/:id/status` *(Permission: `lead.write`)*
```json
{
  "status": "WON",
  "stage": "CLOSURE",
  "priority": "HOT",
  "disposition": "Booked a 3BHK unit",
  "note": "Deal closed after 2nd visit",
  "rating": 5
}
```
*Moving to a terminal status (WON, LOST, UNQUALIFIED) frees up agent capacity. Creates stage history and emits a webhook/push notification.*

### 4. Stage History
`GET /api/leads/followup/:id/stage-history` *(Permission: `lead.read`)*

---

## 📈 Admin Analytics

1. **Admin Follow-ups (All System):**  
   `GET /api/leads/followup/admin` *(Filters: `disposition`, `assignedTo`, `from`, `to`)*
2. **Stage Funnel:**  
   `GET /api/leads/followup/admin/funnel` *(Filters: `teamId`, `userId`)*  
   *Returns lead counts grouped by stage.*
3. **Ratings Analytics:**  
   `GET /api/leads/followup/admin/ratings` *(Filters: `groupBy=stage`)*  
   *Returns average ratings and counts by stage.*

---

## 🔖 Enums & Statuses

### Lead Status
- `NEW`: Freshly created
- `CONTACTED`: Agent has spoken
- `IN_PROGRESS`: Active follow-ups
- `WON`: Converted (Terminal)
- `LOST`: Not proceeding (Terminal)
- `UNQUALIFIED`: Spam/not a fit (Terminal)
- `UNASSIGNED_ESCALATED`: Escalated for manual routing

### Lead Stage
- `NEW` → `CONTACTED` → `SITE_VISIT` → `CLOSURE`

### Lead Priority
- `HOT` (urgent) → `WARM` → `COLD` (nurture)

### Follow-up Status
- `pending` (upcoming) → `done` → `skipped`

---

## 📋 Endpoint Summary Table

| # | Method | Path | Permission | Description |
|---|---|---|---|---|
| 1 | POST | `/api/leads/webhook` | `HMAC only` | Webhook intake & dedupe |
| 2 | POST | `/api/leads/assignment/:id` | `lead.assign` | Manually assign lead |
| 3 | GET | `/api/leads/assignment/admin/escalated` | `lead.escalation` | List escalated leads |
| 4 | POST | `/api/leads/assignment/admin/escalated/:id/assign`| `lead.assign` | Assign escalated lead |
| 5 | POST | `/api/leads/followup/:id/followups` | `lead.write` | Create follow-up |
| 6 | GET | `/api/leads/followup/:id/followups` | `lead.read` | List follow-ups |
| 7 | PATCH | `/api/leads/followup/:id/status` | `lead.write` | Update lead status/stage |
| 8 | GET | `/api/leads/followup/:id/stage-history` | `lead.read` | Get stage-change history |
| 9 | GET | `/api/leads/followup/admin` | `lead.read` | Admin list of all follow-ups |
| 10 | GET | `/api/leads/followup/admin/funnel` | `lead.read` | Stage funnel analytics |
| 11 | GET | `/api/leads/followup/admin/ratings` | `lead.read` | Ratings analytics by stage |
