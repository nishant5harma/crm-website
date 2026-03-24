# CRM Backend — Cold Call Module

End-to-end flow + all endpoints for uploading cold call data, distributing to teams, agent calling workflow (pull/lock/attempt/complete), retries & auto-unlock, reports, analytics, and quotas.

- **Base path:** `/api/coldcall`
- **Auth:** All endpoints are behind JWT (`Authorization: Bearer <token>`).
- **RBAC:** Routes require specific permissions (`coldcall.upload`, `coldcall.call`, etc.).

---

## 🔄 Flow Overview (How It Works)

**ColdCall Assignment = 2 Steps:**
1. **Team Assignment:** Happens at `distribute` time (`assignedTeamId`).
2. **Employee Assignment:** Happens at `pull` time via lock (`lockUserId` + `lockExpiresAt`).

### The 9-Step Process
1. **Upload File:** Upload Excel/CSV. Backend creates `ColdCallBatch` + many `ColdCallEntry` rows. Deduplicates based on policy.
2. **Distribute Batch:** Entries get `assignedTeamId` using routing logic. A preview endpoint exists for dry-runs.
3. **Agent Calling Loop:** Agent hits `pull` to claim the next entry. Backend uses Postgres row-locking (`FOR UPDATE SKIP LOCKED`) to prevent double assignment.
4. **Lock + TTL:** Claimed entries move to `in_progress` status and get `lockUserId` + `lockExpiresAt`. Lock can be refreshed or released.
5. **Attempts:** Agents log multiple attempts per entry. This does not finalize the entry.
6. **Complete:** Finalizes the entry as `done` with a disposition/summary. Optionally creates a CRM `Lead` (`source=cold_call`) + follow-up.
7. **Retry:** Backend evaluates BullMQ retry rules. If matched, it schedules the entry to return to `pending` later.
8. **Auto-Unlock:** A repeating BullMQ job clears expired locks to return stuck entries back to `pending`.
9. **Reports & Analytics:** Endpoints summarize batches, provide team/agent performance metrics, and leaderboard.

---

## 📁 Upload

**Note on Team IDs:**
- If using `mode=manual` + `teamIds[]`, entries are pre-filled with `assignedTeamId = teamIds[0]`.
- Otherwise, they wait for the `distribute` step.

**Supported Formats:** `.xlsx`, `.xls`, `.csv` *(XML not supported)*
**Expected Columns:** `phone` (or mobile/contact), `email`, `name`. Extra columns are saved in the `payload` JSON.

### Bulk Upload API
`POST /api/coldcall/upload`
*Permission:* `coldcall.upload`
*(Multipart Form Data)*
```http
file: <xlsx/csv file>
mode: manual | decorator
dedupePolicy: keep | skip
teamIds: ["<teamId>"]  (optional)
routingConfig: {...}   (optional JSON string)
```

**Note on Lead Creation:** Upload creates `ColdCallEntry` rows, NOT Leads. Leads are created when the agent completes the call using `POST .../complete` with `createLead=true`.

---

## 🚦 Batch Distribution

### Routing Logic
1. **Target Entries:** Entries with `assignedTeamId = null`. (Use `force=true` to redistribute all).
2. **Rules:** Can route based on `location` or `budget`.
3. **Fallback:** If no rule matches, uses Redis weighted round-robin.

### Endpoints
- **Dry-run Preview:** `GET /api/coldcall/batches/:id/preview` *(Permission: `coldcall.read`)*
- **Distribute:** `POST /api/coldcall/batches/:id/distribute?dryRun=false` *(Permission: `coldcall.distribute`)*

---

## 📞 Agent Workflow

- **Team vs Employee Matrix:**
  - Team = `entry.assignedTeamId`
  - Agent holding it = `entry.lockUserId` (while `status=in_progress`)

### 1. Pull Next Call
`POST /api/coldcall/pull`
*Permission:* `coldcall.call`
```json
{ "preferredTeamIds": ["<teamId>"] } // optional
```

### 2. Lock Management
- **Extend TTL:** `POST /api/coldcall/pull/entries/:id/refresh-lock`
- **Release:** `POST /api/coldcall/pull/entries/:id/release`

### 3. Log Attempt
`POST /api/coldcall/pull/entries/:id/attempt`
```json
{ "result": "interested", "notes": "Asked to call back tomorrow" }
```

### 4. Complete & Finalize
`POST /api/coldcall/pull/entries/:id/complete`
```json
{
  "response": "interested",
  "disposition": "call_back",
  "summary": "Wants 2BHK. Budget 50L.",
  "leadConversion": {
    "createLead": true,
    "leadFields": { "name": "Ravi", "phone": "9999222334" },
    "createFollowUp": true,
    "followUpDueAt": "2026-03-18T10:00:00.000Z",
    "followUpNote": "Call back re: site visit"
  }
}
```

### 5. Utilities
- **Agent Dashboard Feed:** `GET /api/coldcall/pull/my-tasks`
- **Reassign Entry:** `POST /api/coldcall/pull/entries/:id/reassign` *(Body: `{ "toUserId": "...", "reason": "..." }`)*

---

## 📈 Reports & Analytics

### Tracking Data
- Team-wise distribution: `GET /batches/:id/preview`
- Active agents & calls: Filter `/report/entries` by `status=in_progress`.

### Report Endpoints
- **Batch Summary:** `GET /api/coldcall/report/batches/:id/summary`
- **Filtered Entries:** `GET /api/coldcall/report/entries?batchId=...&status=pending`
- **Teams Report:** `GET /api/coldcall/report/teams?batchId=...`
- **Agents Report:** `GET /api/coldcall/report/agents?teamId=...`

### Analytics Endpoints
- **Agent Performance:** `GET /api/coldcall/analytics/agents/:userId?from=...`
- **Team Performance:** `GET /api/coldcall/analytics/teams/:teamId?from=...`
- **Leaderboard:** `GET /api/coldcall/analytics/leaderboard?metric=conversions&days=7&top=10`

---

## 🎯 Admin Quotas
- **Set Quota:** `POST /api/coldcall/quota` (Body: `{ "teamId": "...", "target": 10, ... }`)
- **List Quotas:** `GET /api/coldcall/quota/:teamId`
- **Quota Progress:** `GET /api/coldcall/quota/:teamId/progress?period=daily`

---

## ⚙️ Background Workers (BullMQ)
*Ensure Redis is configured and reachable for queues to work.*

1. **Auto-Unlock:** Clears expired locks (`auto-unlock.queue.ts` & `auto-unlock.worker.ts`).
2. **Retry System:** Schedules retries based on disposition rules (`retry.queue.ts` & `retry.worker.ts`).
3. **Daily Aggregation:** Generates analytics at midnight (`aggregate.queue.ts` & `aggregate.worker.ts`).

---

## 🔑 RBAC Permissions List

*Provide Checkboxes in the Admin panel to assign these keys to Roles:*
- `coldcall.upload`: Upload Excel/CSV → create batches
- `coldcall.distribute`: Distribute batch entries to teams
- `coldcall.call`: Agent workflow (pull/attempt/complete)
- `coldcall.read`: Reports + analytics read
- `coldcall.assign`: Reassign entries
- `coldcall.admin`: Quota admin actions

---

## ❌ Common Errors

| Error | Cause | Fix |
|---|---|---|
| `Missing permission: coldcall.call` | Role lacks permission | Assign permission in Admin Panel (RBAC). |
| `no-team-membership` (400) | User not in any team | Add user to a Team (`TeamMember`). |
| `no-available-entry` | No pending entries for agent's team | Ensure batch is distributed to agent's team, and entries are `pending`. |
