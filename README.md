# CRM Web - Cold Call Module

This project is a React web application built with Vite and Tailwind CSS. This documentation focuses on the **Cold Call** module, its API endpoints, and implementation details.

## Project Setup

- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS 4
- **API Base URL**: Configured in `.env` (e.g., `VITE_BASE_APP_URL=https://emshare.in/api`)

---

# Cold Call Module - API Endpoints & Working

This section lists all Cold Call module endpoints, required permissions, and how they are implemented in the app UI (`src/pages/ColdCallPage.jsx`).

> [!IMPORTANT]
> **Base URL Note**: The Base URL already includes `/api` in the environment (`VITE_BASE_APP_URL`). API calls in the code should be relative to this (e.g., `/coldcall/...`, not `/api/coldcall/...`).

## 1. Upload / Batches

| Endpoint | Permission | Purpose | Implemented in UI |
| :--- | :--- | :--- | :--- |
| `POST /coldcall/upload` | `coldcall.upload` | Upload CSV/XLS/XLSX and create batch entries | Batches tab -> Upload New Batch card (`uploadBatch()`) |
| `GET /coldcall/batches/:id/preview` | `coldcall.read` | Preview distribution for batch | Batches tab -> Selected Batch -> Preview (`loadPreview()`) |
| `POST /coldcall/batches/:id/distribute` | `coldcall.distribute` | Distribute batch to teams/agents (query: `dryRun`, `force`) | Batches tab -> Selected Batch -> Distribute (`distribute()`) |
| `GET /coldcall/report/batches/:id/summary` | `coldcall.read` | Batch summary totals | Batches tab -> Selected Batch details (`loadBatchSummary()`) |
| `GET /coldcall/report/entries?batchId=...` | `coldcall.read` | Leads/entries inside selected batch | Batches tab -> "Leads in this batch" list (`loadBatchEntries()`) |

> [!NOTE]
> There is no dedicated `GET /coldcall/batches` list endpoint. The batch list is derived by grouping `report/entries` by `batchId`.

## 2. Calling Flow (Agent)

| Endpoint | Permission | Purpose | Implemented in UI |
| :--- | :--- | :--- | :--- |
| `GET /coldcall/pull/my-tasks` | `coldcall.call` | Get locked tasks + pending count | Agent tab -> My tasks (`loadMyTasks()`) |
| `POST /coldcall/pull` | `coldcall.call` | Pull next lead entry | Agent tab -> Pull button (`pullNext()`) |
| `POST /coldcall/pull/entries/:id/refresh-lock` | `coldcall.call` | Extend lock duration | Agent tab -> Refresh lock (`refreshLock()`) |
| `POST /coldcall/pull/entries/:id/release` | `coldcall.call` | Release current lock | Agent tab -> Release (`releaseLock()`) |
| `POST /coldcall/pull/entries/:id/attempt` | `coldcall.call` | Save call attempt | Agent tab -> Attempt form (`saveAttempt()`) |
| `POST /coldcall/pull/entries/:id/complete` | `coldcall.call` | Complete lead call cycle | Agent tab -> Complete form (`completeEntry()`) |
| `POST /coldcall/pull/entries/:id/reassign` | `coldcall.assign` | Reassign entry to another user/team | *Not currently exposed in UI* |

## 3. Reports

| Endpoint | Permission | Purpose | Implemented in UI |
| :--- | :--- | :--- | :--- |
| `GET /coldcall/report/entries` | `coldcall.read` | List all cold-call entries/leads (filters: `batchId`, `teamId`, `userId`, etc.) | Reports tab main list (`loadReportEntries()`) |
| `GET /coldcall/report/teams` | `coldcall.read` | Team-level report aggregation | *Endpoint available; not separately rendered* |
| `GET /coldcall/report/agents` | `coldcall.read` | Agent-level report aggregation | *Endpoint available; not separately rendered* |

## 4. Analytics

| Endpoint | Permission | Purpose | Implemented in UI |
| :--- | :--- | :--- | :--- |
| `GET /coldcall/analytics/leaderboard` | `coldcall.read` | Ranking by metric and period | Analytics tab -> Leaderboard cards (`loadLeaderboard()`) |
| `GET /coldcall/analytics/teams/:teamId` | `coldcall.read` | Team analytics totals + rows | Analytics tab -> Team dropdown + stats (`loadTeamAnalytics()`) |
| `GET /coldcall/analytics/agents/:userId` | `coldcall.read` | Agent analytics totals + rows | Analytics tab -> Agent dropdown + stats (`loadAgentAnalytics()`) |

## 5. Quota

| Endpoint | Permission | Purpose | Implemented in UI |
| :--- | :--- | :--- | :--- |
| `POST /coldcall/quota` | `coldcall.admin` | Create/update quota target | Quota tab -> Set Quota form (`saveQuota()`) |
| `GET /coldcall/quota/:teamId` | `coldcall.read` | Fetch quotas for selected team | Quota tab -> Active Quotas list (`loadQuota()`) |
| `GET /coldcall/quota/:teamId/progress` | `coldcall.read` | Fetch quota progress (query: `period`) | Quota tab -> Progress bars (`loadQuota()`) |

---

## Implementation Notes

- **Axios Base URL**: Configured in `src/api/axios.js` using `import.meta.env.VITE_BASE_APP_URL`.
- **Authentication**: JWT token is stored in `localStorage` and attached to requests via an Axios interceptor (`Authorization: Bearer ...`).
- **Response Handling**: API responses are typically wrapped in an envelope like `{ ok: true, data: [...] }`.
- **UI Architecture**: Single screen with tab-based navigation: **Agent**, **Batches**, **Reports**, **Analytics**, and **Quota**.
