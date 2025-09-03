# 🍲 All Those Recipes – Backend Server

This is the backend server for **All Those Recipes**, a recipe web application. It supports image uploads, recipe/tag validation, and secure user authentication using JWTs.

---

## Features

- REST API for recipes, tags, and uploads
- JSON schema validation for recipes and tags
- Image and file uploads with resizing/compression
- User authentication (JWT-based)
- Simple user management (create, list, delete, change password)
- Auto-creates a fallback `admin` user on first startup
- Secures all endpoints except login and health check

---

## Setup

### 1. Install dependencies

```bash
npm install
````

### 2. Run locally (with Docker or Node)

#### Option A: Node.js

```bash
node server.js
```

#### Option B: Docker

Make sure your Docker setup binds volumes if needed.

---

## Authentication

* The server uses **JWT tokens** for securing endpoints.

* On first run (if no users exist), a default user is created:

  ```
  Username: admin
  Password: password
  ```

* This user is **removed** automatically when the first new user is created.

---

## API Endpoints

### Health Check

```http
GET /health
→ 200 OK
```

---

### Auth

#### Login

```http
POST /login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}

→ 200 OK
{
  "token": "<JWT>"
}
```

#### Get Current User

```http
GET /me
Authorization: Bearer <token>

→ 200 OK
{
  "username": "..."
}
```

#### Change Password

```http
POST /changePassword
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "old123",
  "newPassword": "new456"
}
```

---

### User Management

#### List Users

```http
GET /users
Authorization: Bearer <token>

→ 200 OK
[
  { "username": "admin" },
  ...
]
```

#### Create User

```http
POST /createUser
Content-Type: application/json
Authorization: Bearer <token>

{
  "username": "john",
  "password": "secret"
}
```

* Automatically removes default `admin` user if a real user is created.

#### Delete User

```http
DELETE /users/:username
Authorization: Bearer <token>
```

* If the **last user** is deleted, a default `admin/password` is re-created.

---

### Recipes & Tags (secured)

#### Recipes

* `GET /recipes`
* `POST /recipes`
* `PUT /recipes/:id`
* `DELETE /recipes/:id`

#### Tags

* `GET /tags`
* `POST /tags`
* `PUT /tags/:id`
* `DELETE /tags/:id`

> Requests are validated against JSON Schemas

---

### Uploads

#### Upload Image

```http
POST /uploadImage
FormData: image=<file>
Authorization: Bearer <token>
```

* Images are resized to 800px width, compressed to JPEG

#### Upload File

```http
POST /uploadFile
FormData: file=<file>
Authorization: Bearer <token>
```

---

## Secured Routes

All routes **except** the following require a valid JWT:

* `/login`
* `/health`

Use the `Authorization: Bearer <token>` header for all other endpoints.

---
