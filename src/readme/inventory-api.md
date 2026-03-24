# CRM Backend — Inventory Management API

**Base URL:** `/api/inventory`
**Auth:** Every endpoint requires a valid JWT `Authorization: Bearer <token>` and the corresponding RBAC permission.

Complete reference for all Inventory endpoints — Projects, Towers, Units, Listings, and Reservations.

## Authentication & Permissions
All inventory endpoints are protected by two middleware layers:
- `requireAuth` — validates the JWT.
- `requirePermission("inventory", action)` — checks the user's RBAC role for the specific action.

| Action | Description |
| :--- | :--- |
| `inventory:read` | List or fetch resources |
| `inventory:write` | Create or update resources |
| `inventory:delete` | Delete resources and images |
| `inventory:manage` | High-impact actions (sell unit, close listing) |

---

## Projects
Base path: `/api/inventory/projects`

### List Projects
- **Method:** `GET /api/inventory/projects`
- **Permission:** `inventory:read`
- **Description:** Returns a list of all projects.
- **Response 200:**
  ```json
  {
    "items": [
      {
        "id": "clxyz...",
        "name": "Skyline Heights",
        "developer": "ICB Developers",
        "city": "Mumbai",
        "locality": "Andheri West",
        "address": "Plot 12, Versova Road",
        "meta": {},
        "active": true,
        "createdAt": "2025-01-10T09:00:00.000Z",
        "updatedAt": "2025-06-01T12:00:00.000Z"
      }
    ]
  }
  ```

### Create Project
- **Method:** `POST /api/inventory/projects`
- **Permission:** `inventory:write`
- **Description:** Creates a new project.
- **Request Body (application/json):**
  ```json
  {
    "name": "Skyline Heights",          // required — string
    "developer": "ICB Developers",      // optional
    "city": "Mumbai",                   // optional
    "locality": "Andheri West",         // optional
    "address": "Plot 12, Versova Road", // optional
    "meta": {}                          // optional — any JSON
  }
  ```

### Update Project
- **Method:** `PUT /api/inventory/projects/:id`
- **Permission:** `inventory:write`
- **Description:** Updates an existing project. All fields are optional (partial update).
- **Request Body:**
  ```json
  {
    "name": "Updated Name",   // optional
    "city": "Pune",           // optional
    "locality": "Koregaon",   // optional
    "address": "...",         // optional
    "developer": "...",       // optional
    "meta": {}                // optional
  }
  ```

### Delete Project
- **Method:** `DELETE /api/inventory/projects/:id`
- **Permission:** `inventory:delete`
- **Description:** Deletes a project by ID.
- **Response 200:** Returns the deleted Project object.

---

## Towers
Base path: `/api/inventory/towers`

### List Towers
- **Method:** `GET /api/inventory/towers`
- **Permission:** `inventory:read`
- **Query Params:** `projectId` (string, optional)
- **Description:** Returns all towers, optionally filtered by project.

### Create Tower
- **Method:** `POST /api/inventory/towers`
- **Permission:** `inventory:write`
- **Request Body:**
  ```json
  {
    "projectId": "clpqr...",  // required — string
    "name": "Tower B",        // optional — max 200 chars
    "floors": 25,             // optional — integer >= 0
    "meta": {}                // optional — any JSON
  }
  ```

### Get Tower
- **Method:** `GET /api/inventory/towers/:id`
- **Permission:** `inventory:read`

### Update Tower
- **Method:** `PUT /api/inventory/towers/:id`
- **Permission:** `inventory:write`

### Delete Tower
- **Method:** `DELETE /api/inventory/towers/:id`
- **Permission:** `inventory:delete`

---

## Units
Base path: `/api/inventory/units`

### List Units
- **Method:** `GET /api/inventory/units`
- **Permission:** `inventory:read`
- **Query Parameters:** `page`, `limit`, `projectId`, `towerId`, `status` (AVAILABLE | BLOCKED | BOOKED | SOLD), `bedrooms`, `bathrooms`, `priceMin`, `priceMax`, `sizeMin`, `sizeMax`, `q` (Search by unitNumber or facing), `sort`.
- **Description:** Returns a paginated, filterable list of units.

### Create Unit
- **Method:** `POST /api/inventory/units`
- **Permission:** `inventory:write`
- **Request Body:**
  ```json
  {
    "projectId": "clpqr...",  // required — string
    "towerId": "cltow1...",   // optional — null or string
    "floor": 5,               // optional — integer or null
    "unitNumber": "501",      // optional — string or null
    "sizeSqFt": 1200.0,       // optional — number or null
    "bedrooms": 3,            // optional — integer or null
    "bathrooms": 2,           // optional — integer or null
    "facing": "North",        // optional — string or null
    "price": 8500000,         // optional — number/bigint or null
    "status": "AVAILABLE",    // optional — defaults to AVAILABLE
    "meta": {}                // optional — any JSON
  }
  ```

### Get Unit
- **Method:** `GET /api/inventory/units/:id`
- **Permission:** `inventory:read`
- **Description:** Fetches a single unit with its related data (images, active reservations, listings, and tower).

### Update Unit
- **Method:** `PUT /api/inventory/units/:id`
- **Permission:** `inventory:write`
- **Description:** Updates a unit. **Blocked if unit status is SOLD.** Uses Redis lock to prevent concurrent updates.

### Delete Unit
- **Method:** `DELETE /api/inventory/units/:id`
- **Permission:** `inventory:delete`

### Sell Unit
- **Method:** `POST /api/inventory/units/:id/sell`
- **Permission:** `inventory:manage`
- **Description:** Marks a unit as **SOLD**, cancels all active reservations on it, and closes any linked listings. Irreversible action.
- **Request Body:**
  ```json
  {
    "price": 9000000,   // optional — final sale price
    "note": "Sold to Mr. X"  // optional
  }
  ```

### Unit Images
- **Upload Images:** `POST /api/inventory/units/:id/images` (multipart/form-data with `images` file[])
- **List Images:** `GET /api/inventory/units/:id/images`
- **Delete Image:** `DELETE /api/inventory/units/images/:imageId`
- **Reorder Images:** `POST /api/inventory/units/:id/images/reorder` (Provide an `order` array of image IDs).

---

## Listings
Base path: `/api/inventory/listings`

### List Listings
- **Method:** `GET /api/inventory/listings`
- **Permission:** `inventory:read`
- **Query Parameters:** `page`, `limit`, `city`, `locality`, `type` (SALE | RENT | BOTH), `status` (AVAILABLE | UNDER_OFFER | CLOSED), `projectId`, `unitId`, `bedrooms`, `bathrooms`, `priceMin`, `priceMax`, `sqftMin`, `sqftMax`, `q`, `sort`.

### Create Listing
- **Method:** `POST /api/inventory/listings`
- **Permission:** `inventory:write`
- **Request Body:**
  ```json
  {
    "title": "Spacious 3BHK in Andheri",  // required — string
    "type": "SALE",                         // required — "SALE" | "RENT" | "BOTH"
    "ownerName": "Rahul Mehta",            // optional
    "ownerPhone": "+919876543210",         // optional
    "ownerEmail": "rahul@example.com",     // optional
    "projectId": "clpqr...",              // optional
    "unitId": "clunit1...",               // optional
    "city": "Mumbai",                      // optional
    "locality": "Andheri West",           // optional
    "price": 8500000,                      // optional — number/bigint
    "bedrooms": 3,                         // optional — integer
    "bathrooms": 2,                        // optional — integer
    "sqft": 1200.0,                        // optional — number
    "status": "AVAILABLE",                 // optional — defaults to AVAILABLE
    "meta": {}                             // optional — any JSON
  }
  ```

### Get Listing
- **Method:** `GET /api/inventory/listings/:id`
- **Permission:** `inventory:read`

### Update Listing
- **Method:** `PUT /api/inventory/listings/:id`
- **Permission:** `inventory:write`
- **Description:** Updates a listing. **Blocked if status is CLOSED or SOLD.** Uses Redis lock.

### Close Listing
- **Method:** `POST /api/inventory/listings/:id/close`
- **Permission:** `inventory:manage`
- **Description:** Closes a listing, cancels all active reservations, and optionally marks the linked unit as SOLD.
- **Request Body:**
  ```json
  {
    "note": "Deal finalized with buyer"  // optional
  }
  ```

### Delete Listing
- **Method:** `DELETE /api/inventory/listings/:id`
- **Permission:** `inventory:delete`

### Listing Images
- **Upload Images:** `POST /api/inventory/listings/:id/images` (multipart/form-data)
- **List Images:** `GET /api/inventory/listings/:id/images`
- **Delete Image:** `DELETE /api/inventory/listings/images/:imageId`
- **Reorder Images:** `POST /api/inventory/listings/:id/images/reorder` (Provide an `order` array of image IDs).

---

## Reservations
Base path: `/api/inventory/reservations`

**Business rules:** Exactly one of `unitId` or `listingId` must be provided per reservation. Creating a reservation sets the linked unit to `BLOCKED` or listing to `UNDER_OFFER`. Default TTL is **15 minutes** (configurable via `DEFAULT_RESERVATION_TTL_MS` env var). Cancelling a reservation restores the unit/listing status back to `AVAILABLE`.

### List Reservations
- **Method:** `GET /api/inventory/reservations`
- **Permission:** `inventory:read`
- **Query Params:** `userId` (string), `status` (ACTIVE | EXPIRED | CONFIRMED | CANCELLED).

### Create Reservation
- **Method:** `POST /api/inventory/reservations`
- **Permission:** `inventory:write`
- **Request Body:**
  ```json
  {
    // Provide EXACTLY ONE of unitId or listingId
    "unitId": "clunit1...",        // required if no listingId
    "listingId": null,             // required if no unitId (set to null)

    "leadId": "cllead1...",        // optional — link to a lead
    "userId": "cluser1...",        // optional — assign to a user
    "expiresAt": "2025-06-01T12:15:00.000Z", // optional ISO string — defaults to now + 15 min
    "note": "Hold for client walkthrough",   // optional
    "meta": {}                     // optional
  }
  ```

### Get Reservation
- **Method:** `GET /api/inventory/reservations/:id`
- **Permission:** `inventory:read`

### Update Reservation
- **Method:** `PATCH /api/inventory/reservations/:id`
- **Permission:** `inventory:write`
- **Description:** Partially updates a reservation's status or note fields.
- **Request Body:**
  ```json
  {
    "status": "CONFIRMED",                  // "ACTIVE" | "EXPIRED" | "CONFIRMED" | "CANCELLED"
    "confirmedAt": "2025-06-01T13:00:00.000Z",  // ISO string
    "cancelledAt": null,                    // ISO string or null
    "note": "Confirmed after site visit"
  }
  ```

### Cancel Reservation
- **Method:** `POST /api/inventory/reservations/:id/cancel`
- **Permission:** `inventory:write`
- **Description:** Cancels an **ACTIVE** reservation. Restores the linked unit status to `AVAILABLE` or listing to `AVAILABLE`. Only `ACTIVE` reservations can be cancelled.

---

## Enums & Statuses

### UnitStatus
| Status | Description |
| :--- | :--- |
| `AVAILABLE` | Unit is open for reservation or sale |
| `BLOCKED` | Temporarily held by an active reservation |
| `BOOKED` | Formally booked |
| `SOLD` | Sold — no further modifications allowed |

### ListingStatus
| Status | Description |
| :--- | :--- |
| `AVAILABLE` | Listing is open |
| `UNDER_OFFER` | Active reservation placed against listing |
| `CLOSED` | Deal closed — no modifications allowed |

### ListingType
| Type | Description |
| :--- | :--- |
| `SALE` | Property for sale |
| `RENT` | Property for rent |
| `BOTH` | Available for sale or rent |

### ReservationStatus
| Status | Description |
| :--- | :--- |
| `ACTIVE` | Reservation is live; unit/listing is held |
| `EXPIRED` | TTL passed without confirmation |
| `CONFIRMED` | Reservation manually confirmed |
| `CANCELLED` | Manually cancelled; unit/listing freed |
