# CRM Backend — Audit Logs

Backend activity tracking for security + debugging. This document explains what is logged, and how frontend/admin can fetch logs.

---

## 🔍 What is an AuditLog?

Every audit row is stored in the DB table `AuditLog` containing the following fields:

- **`userId`**: who did it (null for system/webhook)
- **`action`**: what happened (e.g., `lead.assign`)
- **`resource`**: which module/entity (e.g., `lead`)
- **`resourceId`**: entity id (lead id, sourcepool id, …)
- **`payload`**: extra JSON details (old/new values, target user, etc.)
- **`createdAt`**: timestamp

*Access is protected via RBAC permission `auditlog.read`.*

---

## 📝 Currently Logged Actions

### Leads (Webhook + Assignment + Followups)
- `lead.create`: webhook created a new lead
- `webhook.link`: webhook event linked to an existing lead (dedupe)
- `lead.assign`: auto-assignment worker assigned lead to a user
- `lead.assign.manual`: manager/admin manually assigned lead to a user
- `lead.followup.create`: follow-up created on a lead
- `lead.status.update`: lead status/stage/priority updated (also creates follow-up)

### Source Mapping
- `sourcepool.upsert`: create/update mapping for a source
- `sourcepool.update`: patch mapping by source key
- `sourcepool.delete`: delete mapping

---

## 📡 Audit APIs (Fetch Logs)

### 1. Fetch Multiple Logs
`GET /api/audit-logs`
*Auth: JWT + `auditlog.read` permission*

**Example Request:**
```http
GET /api/audit-logs?page=1&limit=50&resource=lead&actionPrefix=lead.&resourceId=<leadId>
Authorization: Bearer <token>
```

**Supported Filters:**
`page`, `limit`, `userId`, `roleName`, `action`, `actionPrefix`, `resource`, `resourceId`, `from`, `to`, `q` (search query).

### 2. Fetch Single Log by ID
`GET /api/audit-logs/:id`
*Auth: JWT + `auditlog.read` permission*

**Example Request:**
```http
GET /api/audit-logs/<auditLogId>
Authorization: Bearer <token>
```

---

## 💻 Frontend Usage Examples

### Example 1: Audit trail for a single Lead
To see all actions that happened to a specific lead:
```http
GET /api/audit-logs?resource=lead&resourceId=<leadId>&limit=100
Authorization: Bearer <token>
```

### Example 2: Only assignments (auto + manual)
To see only the assignment activities for leads:
```http
GET /api/audit-logs?resource=lead&actionPrefix=lead.assign&limit=50
Authorization: Bearer <token>
```

### Example 3: What changed today?
To see all changes across the system for a specific date range:
```http
GET /api/audit-logs?from=2026-03-17T00:00:00.000Z&to=2026-03-17T23:59:59.999Z&limit=200
Authorization: Bearer <token>
```

---

**Note:** The webhook endpoint itself is HMAC based; but to fetch audits you must provide a valid JWT and the user must have the RBAC permission `auditlog.read`.
