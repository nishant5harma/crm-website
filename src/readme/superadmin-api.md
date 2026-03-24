# CRM Backend API — Super Admin Reference

Complete endpoint reference for Auth, Users, Roles, and Permissions — scoped to the **superadmin** role.

- **Base URL:** `/api`
- **Auth:** `Bearer <token>`
- **Format:** `application/json`

---

## 🔑 Auth

### Login
`POST /api/auth/login` | *No auth required*

**Request Body**
```json
{
  "email": "superadmin@example.com",
  "password": "SuperSecurePassword123!"
}
```
- `email` (string, required): valid email
- `password` (string, required)

**Response `200`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "uuid",
    "name": "Super Admin",
    "email": "superadmin@example.com",
    "roles": [{ "name": "superadmin" }]
  }
}
```
*(Refresh token is set as an `HttpOnly` cookie.)*

---

### Get Me
`GET /api/auth/me` | *🔒 requireAuth*

**Headers**
```http
Authorization: Bearer <accessToken>
```

**Response `200`**
```json
{
  "user": {
    "id": "uuid",
    "name": "Super Admin",
    "email": "superadmin@example.com",
    "roles": [{ "id": "uuid", "name": "superadmin" }],
    "permissions": ["user.read", "role.write", "..."]
  }
}
```

---

### Refresh Token
`POST /api/auth/refresh` | *🔒 requireAuth*

**Request Body** (optional)
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```
*(Or pass via `refreshToken` cookie.)*

**Response `200`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1..."
}
```

---

### Logout
`POST /api/auth/logout` | *🔒 requireAuth*

**Request Body** (optional)
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

**Response `200`**
```json
{
  "message": "Logged out successfully"
}
```

---

## 👤 Users
*Permission required: `user.write` / `user.read`*

### Create User
`POST /api/users` | *🔒 requireAuth* | *Permission: `user.write`*

**Request Body**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "roleIds": ["<role-uuid>"],
  "teamId": "<team-uuid>"
}
```

**Response `201`**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "roles": [{ "id": "uuid", "name": "manager", "description": "..." }],
    "teamMembers": [{ "teamId": "uuid", "teamName": "Sales Team", "role": "MEMBER", "joinedAt": "..." }]
  }
}
```

---

### List Users
`GET /api/users` | *🔒 requireAuth* | *Permission: `user.read`*

**Response `200`**
*(Returns up to 100 users ordered by creation date)*
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "roles": [{ "id": "uuid", "name": "manager" }],
      "teamMembers": [...]
    }
  ]
}
```

---

### Get User by ID
`GET /api/users/:id` | *🔒 requireAuth* | *Permission: `user.read`*

**Path Parameters:**
- `:id` - UUID of the user

**Response `200`**
Returns user object similar to user creation response.

---

## 👑 Roles
*Base URL: `/api/rbac/roles`*

### Create Role
`POST /api/rbac/roles` | *Permission: `role.write`*

**Request Body**
```json
{
  "name": "sales_manager",
  "description": "Manages sales team"
}
```

**Response `201`**
```json
{
  "id": "uuid",
  "name": "sales_manager",
  "description": "Manages sales team",
  "createdAt": "2026-03-13T..."
}
```

---

### List Roles
`GET /api/rbac/roles` | *Permission: `role.read`*

**Response `200`**
```json
[
  {
    "id": "uuid",
    "name": "superadmin",
    "description": "Full access",
    "createdAt": "2026-03-13T..."
  }
]
```

---

### Get, Update, Delete Role
- **Get Role:** `GET /api/rbac/roles/:id` *(Permission: `role.read`)*
- **Update Role:** `PUT /api/rbac/roles/:id` *(Permission: `role.write`)*
- **Delete Role:** `DELETE /api/rbac/roles/:id` *(Permission: `role.delete`)* - Returns `204 No Content`

---

### Role & Permission Mapping
- **Assign Permission to Role:** `POST /api/rbac/roles/:id/permissions`
  - Body: `{ "permissionId": "<permission-uuid>" }`
- **Remove Permission from Role:** `DELETE /api/rbac/roles/:id/permissions/:permId`
- **Get Role Permissions:** `GET /api/rbac/roles/:id/permissions`

---

### Role & User Mapping
- **Assign Role to User:** `POST /api/rbac/roles/assign-to-user`
  - Body: `{ "userId": "<user-uuid>", "roleId": "<role-uuid>" }`
- **Remove Role from User:** `DELETE /api/rbac/roles/user/:userId/role/:roleId`

---

## 🔐 Permissions
*Base URL: `/api/rbac/permissions`*

### Endpoint Summary
- **Create Permission:** `POST /api/rbac/permissions` *(Permission: `permission.write`)*
  - Body: `{ "key": "report.read", "description": "View reports", "module": "Report" }`
- **List Permissions:** `GET /api/rbac/permissions` *(Permission: `permission.read`)*
- **Get Permission by ID:** `GET /api/rbac/permissions/:id` *(Permission: `permission.read`)*
- **Update Permission:** `PUT /api/rbac/permissions/:id` *(Permission: `permission.write`)*
- **Delete Permission:** `DELETE /api/rbac/permissions/:id` *(Permission: `permission.delete`)*

---

## 📋 All Seeded Permissions
These 45 permissions are created by the super-admin seed and assigned to the `superadmin` role.

### User
- `user.read`: View user data
- `user.create`: Create users
- `user.write`: Write users
- `user.update`: Update user data
- `user.delete`: Delete users

### Role
- `role.read`: View roles
- `role.create`: Create roles
- `role.write`: Write roles
- `role.update`: Update roles
- `role.delete`: Delete roles

### Permission
- `permission.read`: View permissions
- `permission.assign`: Assign permissions to roles
- `permission.write`: Write permissions
- `permission.delete`: Delete permissions

### Team
- `team.read`: View teams
- `team.create`: Create teams
- `team.update`: Update teams
- `team.delete`: Delete teams
- `team.write`: Write teams (approve assignments/removals)
- `team.assignLead`: Assign team lead
- `team.request`: Create team membership requests
- `team.approve`: Approve team requests

### System / AuditLog
- `auditlog.read`: View audit logs
- `system.config`: Access system configuration
- `admin.view`: Access to the Admin Dashboard

### HR — Attendance · Location · Device · Consent
- `attendance.self`: Perform own attendance check-in
- `attendance.read`: Read attendance records
- `location.request`: Create on-demand location requests
- `location.read`: Read location request results
- `location.audit`: View location access audit records
- `device.register`: Register/update a device (push token)
- `device.unregister`: Unregister device / remove push token
- `device.read`: List devices for a user
- `consent.write`: Create or revoke consent entries
- `consent.read`: Read consents for a user

### Lead
- `lead.read`: Read leads
- `lead.write`: Create/update leads
- `lead.assign`: Assign leads
- `lead.note`: Add notes to leads
- `lead.followup`: Manage lead follow-ups
- `lead.webhook`: View raw webhook events

### Inventory
- `inventory.read`: Read inventory data
- `inventory.write`: Create/update inventory
- `inventory.delete`: Delete inventory entities
- `inventory.manage`: Manage advanced inventory states (BLOCK, SOLD, BOOKING…)

---

## ⚠️ Common Error Responses

- **`400` Bad Request:** Validation failed (ZodError) or invalid input
- **`401` Unauthorized:** Missing or invalid JWT access token
- **`403` Forbidden:** Authenticated but missing required permission
- **`404` Not Found:** Resource does not exist
- **`500` Internal Server Error:** Unexpected server failure
