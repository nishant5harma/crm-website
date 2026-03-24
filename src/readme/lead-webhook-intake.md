# CRM Backend — Lead Webhook Intake

This document explains how external systems (portals, Google Forms, websites, etc.) should call `POST /api/leads/webhook` to create and update leads inside the CRM.

- **Endpoint:** `/api/leads/webhook`
- **Auth:** HMAC signature (No JWT)
- **Functions:** Creates leads, links duplicates, queues for automatic assignment.

---

## 🎯 What This Endpoint Does

`/api/leads/webhook` is the **only** entry point for external sources to send new leads into the CRM. It is used by Property Portals (99acres, MagicBricks), Google Forms, Website Enquiry Forms, and any custom integrations.

**Processing Steps:**
1. Verify the HMAC signature (security).
2. Normalize & extract fields (`name`, `email`, `phone`, `source`, `externalId`).
3. Compute a dedupe hash based on phone/email/source/externalId.
4. Either **link to an existing lead** or **create a new lead**.
5. Create a `LeadWebhookEvent` row for full audit history.
6. Insert an initial `LeadAssignment` and queue the lead for **automatic assignment**.

---

## 🔐 Security & HMAC Signature

The webhook is **not protected by JWT tokens**. Instead, each integration uses a shared secret key and HMAC.

**How it works:**
1. The sender has a secret key (e.g., `WEBHOOK_SECRET_DEFAULT` or `WEBHOOK_SECRET_GOOGLE_FORMS`).
2. It serializes the JSON body to a string.
3. Computes `HMAC_SHA256(bodyJson, secret)` and encodes as hex.
4. Sends that value in the `x-signature` header.
5. The CRM backend recomputes the HMAC and rejects mismatched requests.

---

## 📡 Endpoint Details

`POST /api/leads/webhook`

### Headers

| Header | Required | Description |
|---|---|---|
| `Content-Type` | Yes | Use `application/json` |
| `x-lead-source` / `x-source`| Recommended | Source identifier (e.g., `magicbricks`, `google_forms`, `website`) |
| `x-idempotency-key` | Optional | Unique key per submission to de-duplicate retries |
| `x-signature` | Yes | HMAC SHA256 signature of the raw JSON body, hex-encoded |

### Recommended Payload Shape

```json
{
  "provider": "google_forms",
  "externalId": "GF-2025-06-01-001",
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "phone": "+919876543210",
  "source": "google_forms",
  "payload": {
    /* original payload from the source */
  }
}
```
*Note: At least `phone` or `email` should be provided for meaningful deduplication.*

### Responses

1. **New lead created (201)**
   ```json
   { "ok": true, "note": "created", "leadId": "cllead1...", "webhookEventId": "clwh1..." }
   ```
2. **Existing lead linked (200)**
   ```json
   { "ok": true, "note": "linked", "leadId": "clleadExisting...", "webhookEventId": "clwh2..." }
   ```
3. **In-flight / Duplicate (200)**
   ```json
   { "ok": true, "note": "processing in-flight", "eventId": "clwh3..." }
   ```
4. **Invalid Signature (401/403)**
   ```json
   { "error": "invalid signature" }
   ```

---

## 💻 Integrations

### Example 1: Google Forms Integration
You can connect a Google Form using an Apps Script triggered on `onFormSubmit`.

```javascript
const WEBHOOK_URL = 'https://your-domain.com/api/leads/webhook';
const SHARED_SECRET = 'YOUR_HMAC_SECRET';

function onFormSubmit(e) {
  const resp = e.namedValues;
  const body = {
    provider: 'google_forms',
    externalId: resp['Timestamp'][0],
    name: resp['Name'][0],
    email: resp['Email'][0],
    phone: resp['Phone'][0],
    source: 'google_forms',
    payload: resp
  };

  const bodyJson = JSON.stringify(body);
  const signature = Utilities.computeHmacSha256Signature(bodyJson, SHARED_SECRET);
  const sigHex = signature.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');

  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: bodyJson,
    headers: {
      'x-lead-source': 'google_forms',
      'x-idempotency-key': resp['Timestamp'][0],
      'x-signature': sigHex
    },
    muteHttpExceptions: true
  });
}
```

### Example 2: Website Backend Integration
For a website (Next.js, Node.js), call the webhook from your backend (never the browser).

```javascript
import crypto from 'crypto';
import fetch from 'node-fetch';

const WEBHOOK_URL = 'https://your-domain.com/api/leads/webhook';
const SECRET = process.env.WEBHOOK_SECRET_DEFAULT;

export async function sendLeadToWebhook(lead) {
  const body = {
    provider: 'website',
    externalId: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: 'website',
    payload: lead
  };

  const bodyJson = JSON.stringify(body);
  const signature = crypto.createHmac('sha256', SECRET).update(bodyJson, 'utf8').digest('hex');

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-lead-source': 'website',
      'x-idempotency-key': lead.id,
      'x-signature': signature
    },
    body: bodyJson
  });

  return { status: res.status, data: await res.json() };
}
```

---

## 🌐 Frontend Integration Guide

**High-level Flow:**
1. User fills frontend form (website / app).
2. Frontend sends data to your own backend (e.g., `/api/contact`).
3. Your backend builds the canonical lead JSON + HMAC.
4. CRM endpoint `POST /api/leads/webhook` receives it.
5. Lead is created/linked and appears in CRM Leads UI.

**Important:** The frontend NEVER calls `/api/leads/webhook` directly!

### Frontend: View Leads (Admin UI)
To display leads in the frontend application, use these protected endpoints (requires JWT + `lead.read` permission):

1. **List Leads:**
   `GET /api/leads?page=1&limit=50&source=google_forms`
2. **Fetch One Lead Detail:**
   `GET /api/leads/:id`

*(Tip: Refresh `GET /api/leads` after submitting a webhook to see the new lead).*

---

## ⚙️ Business Logic

### 1- Deduplication
- Computes a dedupe hash from `phone`, `email`, `source`, and `externalId`.
- First tries finding by `externalId`, then by dedupe hash. If neither exists, creates a new lead.

### 2- Lead Creation
- A new `Lead` record is inserted with normalized fields.
- An initial `LeadAssignment` is created (`assignedTo = null`, `method = auto`).

### 3- Webhook Events & Audit
- Creates a `LeadWebhookEvent` row for every request containing the raw payload and signature metadata.
- Creates an Audit record (`action = "lead.create"`).

### 4- Automatic Assignment
- The system enqueues a job in `assignmentQueue`.
- Background workers handle routing via `SourcePool` config.
- Pick an agent using round-robin + capacity limits.
- Updates `UserCapacity` and sends Socket/Push notifications to the assigned agent.
