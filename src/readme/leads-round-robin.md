# CRM Backend — Leads Round Robin Flow

A frontend-facing explanation of how leads enter the CRM, get assigned automatically via round-robin (with capacity checks), and then move through follow-ups and status updates.

- **Base path:** `/api`
- **Intake:** `POST /api/leads/webhook` (HMAC secured)
- **View:** `GET /api/leads` (JWT secured)

---

## 🔄 End-to-End Flow

1. **External source sends a lead:** Website form / Google Form / Portals call `POST /api/leads/webhook`.
2. **Intake service normalizes & dedupes:** Computes `dedupeHash`, creates `LeadWebhookEvent`, and creates or links the `Lead`.
3. **Assignment job enqueued:** Creates a `LeadAssignment` row (`method: "auto"`, `assignedTo: null`).
4. **Worker assigns to Agent:**
   - Determines team via `SourcePool` mapping.
   - Chooses next eligible member via round-robin.
   - Enforces capacity (`used < maxOpen`).
   - Updates `Lead.assignedToId`.
5. **Escalation (Fallback):** If no agent is available, status becomes `UNASSIGNED_ESCALATED` and managers assign manually.
6. **Agent Actions:** Create follow-ups, update stage/status, view history.

### Who Receives Leads Automatically?
Leads are auto-assigned ONLY to employees/agents who are members of the assigned team (`TeamMember` table). Managers typically handle escalations and do not receive auto-assignments unless they are specifically in the team member pool.

---

## ⚙️ Setup Guide (Teams, Pools, Employees)

For round-robin assignment to work perfectly, 4 things must be set up:

### 1. Create a Team (Manager)
`POST /api/teams` *(Permission: `team.write`)*
```json
{ "name": "Website Team", "leadId": null }
```

### 2. Add Employees to the Team
`POST /api/teams/<teamId>/members/bulk` *(Permission: `team.write`)*
```json
{
  "userIds": ["<empUserId1>", "<empUserId2>"],
  "role": "MEMBER"
}
```

### 3. Decide `source` values
Send a distinct `source` value consistently in webhook calls (e.g., `website`, `google_forms`, `facebook`).

### 4. Create SourcePool Mapping (source → team)
There is **no HTTP endpoint** to manage this initially. Run this via Prisma seed/script:
```js
await prisma.sourcePool.upsert({
  where: { source: "website" },
  update: { teamId: "clteamWebsite...", active: true },
  create: { source: "website", teamId: "clteamWebsite...", strategy: "round_robin", active: true },
});
```
*(Frontend admins can manage this later via `POST /api/leads/source-pools` using `lead.assign` permission).*

### 5. Capacity Tuning
Each user needs a `UserCapacity` row (e.g., `maxOpen = 25`, `used = 0`).

---

## 🎯 Assignment Engine Logic

### Deduplication
- **Inputs:** `phone`, `email`, `source`, `externalId`.
- **Logic:** Lookup by `externalId` first, then by `dedupeHash`.

### Round-Robin Selection
- Uses a Redis pointer per team (`lead:rr:team:<teamId>`).
- Pointer increments to select the next agent based on `joinedAt` order.

### Capacity (`UserCapacity`)
- If the selected agent's `used` is `maxOpen`, auto-assignment skips them and tries the next person.
- When lead status becomes WON/LOST/UNQUALIFIED, `used` is decremented.

### Escalation & Manual Assignment
If no agent is available:
- **List Escalated:** `GET /api/leads/assignment/admin/escalated` *(Permission: `lead.escalation`)*
- **Manual Assign:** `POST /api/leads/assignment/<leadId>` *(Permission: `lead.assign`)*
  ```json
  { "userId": "<assigneeUserId>" }
  ```

---

## 📞 Agent Follow-ups Workflow

### 1. Create a Follow-up
`POST /api/leads/followup/<leadId>/followups` *(Permission: `lead.write`)*
```json
{
  "dueAt": "2026-03-17T10:00:00.000Z",
  "note": "Call customer",
  "disposition": "Interested",
  "rating": 4,
  "status": "pending"
}
```

### 2. Update Status/Stage
`PATCH /api/leads/followup/<leadId>/status` *(Permission: `lead.write`)*
```json
{
  "status": "WON",
  "stage": "CLOSED",
  "priority": "HIGH"
}
```
*(This releases capacity if moving to a terminal status).*

### 3. List Follow-ups
`GET /api/leads/followup/<leadId>/followups` *(Permission: `lead.read`)*

---

## 🖥️ Frontend API: View Leads & Source Pools

### Mapping `source` to `team`
- **List Mappings:** `GET /api/leads/source-pools`
- **List Unmapped Sources:** `GET /api/leads/source-pools/unmapped-sources`
- **Create/Update Mapping:** `POST /api/leads/source-pools`
- **Disable/Edit Mapping:** `PATCH /api/leads/source-pools/:source`

### Viewing Leads
1. **Get Token:** `POST /api/auth/login`
2. **List Leads:** `GET /api/leads?source=website&status=NEW`
3. **Lead Details:** `GET /api/leads/<leadId>`
4. **List Users:** `GET /api/users` *(To map `assignedToId` to employee names in the frontend table).*

---

## ✅ Testing Checklist

To verify lead receiving works end-to-end:
1. **Webhook Submits:** Hit `POST /api/leads/webhook` with valid HMAC. (Expect `201` or `200`).
2. **Lead appears:** Call `GET /api/leads` to confirm the lead exists with correct data.
3. **Auto-Assignment works:** Fetch `GET /api/leads/:id` after a few seconds. `assignedToId` should be filled, and assignee's capacity `used` increased.
4. **Follow-ups:** Test `POST /api/leads/followup/:id/followups`.
5. **Capacity releases:** Patch status to `WON` or `LOST` and ensure assignee's capacity `used` decreases.
