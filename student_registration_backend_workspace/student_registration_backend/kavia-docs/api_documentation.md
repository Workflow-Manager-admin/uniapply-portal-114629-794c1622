# Student Registration API Documentation

This documentation outlines the RESTful API exposed by the Student Registration Backend, implemented in FastAPI. It covers endpoints for user sign-up, user authentication (JWT), application submission and status tracking, and database health checks.

---

## Base URL

All endpoints are served from the base URL of the FastAPI application.

---

## Authentication

The API uses JWT Bearer tokens for endpoints requiring authentication (see specific endpoints for details). Obtain a token via `/token` and provide it in the `Authorization: Bearer <token>` HTTP header.

---

## Endpoints

### 1. Health Check

**GET `/health`**

Checks if the API can connect and query the SQLite database.

- **Summary:** Check DB Health
- **Description:** Confirms operational status by attempting a DB connection and test query.
- **Authentication:** Not required
- **Response:**
    - **200 OK**: `{"status": "ok", "db": "connected"}`
    - **503 Service Unavailable**: `{"detail": "Database connection failed"}`

---

### 2. User Registration

**POST `/signup`**

Creates a new student user account.

- **Summary:** User Signup
- **Tags:** auth
- **Authentication:** Not required
- **Request Body (application/json):**
    ```json
    {
      "email": "student@example.com",
      "password": "yourPassword123"
    }
    ```
    - `email` _(string, required)_: User's email for registration and login.
    - `password` _(string, min 6, required)_: User password.

- **Responses:**
    - **200 OK**
        ```json
        {
          "id": 1,
          "email": "student@example.com"
        }
        ```
    - **400 Bad Request:** Email already registered.

---

### 3. User Authentication

**POST `/token`**

Authenticates the user and returns a JWT access token for further requests.

- **Summary:** User Authentication
- **Tags:** auth
- **Authentication:** Not required
- **Request (application/x-www-form-urlencoded):**
    - `username` (user's email)
    - `password` (user's password)

- **Responses:**
    - **200 OK**
        ```json
        {
            "access_token": "<jwt_token>",
            "token_type": "bearer"
        }
        ```
    - **401 Unauthorized:** Incorrect email or password.

---

### 4. Submit Application

**POST `/applications/`**

Submits a student application form.

- **Summary:** Submit Application
- **Tags:** application
- **Authentication:** **Required** (Bearer token)
- **Request Body (application/json):**
    ```json
    {
      "program": "BSc Computer Science",
      "full_name": "Jane Doe",
      "dob": "2004-09-15",
      "additional_info": "Optional notes here"
    }
    ```
    - `program` _(string, required)_: Program the student is applying for.
    - `full_name` _(string, required)_: Student's full legal name.
    - `dob` _(string, required)_: Date of birth in `YYYY-MM-DD` format.
    - `additional_info` _(string, optional)_: Extra information if desired.

- **Responses:**
    - **200 OK**
        ```json
        {
          "id": 5,
          "user_id": 1,
          "program": "BSc Computer Science",
          "full_name": "Jane Doe",
          "dob": "2004-09-15",
          "status": "Submitted",
          "submit_time": "2024-07-01T10:45:23Z",
          "additional_info": "Optional notes here"
        }
        ```
    - **401 Unauthorized:** Invalid or missing token.

---

### 5. List My Applications

**GET `/applications/`**

Retrieves all applications submitted by the authenticated student.

- **Summary:** List My Applications
- **Tags:** application
- **Authentication:** **Required** (Bearer token)
- **Responses:**
    - **200 OK**
        ```json
        [
          {
            "id": 5,
            "user_id": 1,
            "program": "BSc Computer Science",
            "full_name": "Jane Doe",
            "dob": "2004-09-15",
            "status": "Submitted",
            "submit_time": "2024-07-01T10:45:23Z",
            "additional_info": "Optional notes here"
          },
          ...
        ]
        ```
    - **401 Unauthorized:** Invalid or missing token.

---

### 6. Get Application Status

**GET `/applications/{application_id}/status`**

Checks the status of a specific application owned by the user.

- **Summary:** Get Application Status
- **Tags:** application
- **Authentication:** **Required** (Bearer token)
- **Path Parameters:**
    - `application_id` _(integer, required)_: Unique ID of the application.

- **Responses:**
    - **200 OK**
        ```json
        {
          "application_id": 5,
          "status": "Submitted",
          "updated_at": "2024-07-01T10:45:23Z"
        }
        ```
    - **401 Unauthorized:** Invalid or missing token.
    - **404 Not Found:** Application does not belong to the authenticated user or does not exist.

---

## Models and Schema

### UserCreate

| Field    | Type   | Description                         | Required |
|----------|--------|-------------------------------------|----------|
| email    | Email  | User email                          | Yes      |
| password | String | User password (min 6 characters)    | Yes      |

### UserInDB

| Field | Type  | Description   |
|-------|-------|---------------|
| id    | int   | User ID       |
| email | Email | User email    |

### Token

| Field        | Type   | Description        |
|--------------|--------|--------------------|
| access_token | String | Bearer JWT token   |
| token_type   | String | Always "bearer"    |

### ApplicationSubmit

| Field           | Type   | Description                                  | Required |
|-----------------|--------|----------------------------------------------|----------|
| program         | String | Program applied for                          | Yes      |
| full_name       | String | Applicant's full name                        | Yes      |
| dob             | String | Date of birth (YYYY-MM-DD)                   | Yes      |
| additional_info | String | Extra info (optional)                        | No       |

### ApplicationOut

| Field          | Type    | Description                |
|----------------|---------|----------------------------|
| id             | int     | Application ID             |
| user_id        | int     | Owner User ID              |
| program        | String  | Program applied for        |
| full_name      | String  | Applicant's name           |
| dob            | String  | Date of birth              |
| status         | String  | Current status             |
| submit_time    | String  | Submission timestamp       |
| additional_info| String  | Extra info (optional)      |

### ApplicationStatusOut

| Field          | Type   | Description                    |
|----------------|--------|--------------------------------|
| application_id | int    | Application ID                 |
| status         | String | Application status             |
| updated_at     | String | Last status update timestamp   |

---

## Authentication Flow

1. **Signup:** `POST /signup` with user email and password.
2. **Login & Token:** `POST /token` with credentials, receive `access_token`.
3. **Authenticated Requests:** For endpoints needing authentication, send header:  
   ```
   Authorization: Bearer <access_token>
   ```

---

## Error Responses

- `401 Unauthorized` if the token is missing or invalid for protected endpoints.
- `404 Not Found` if accessing an application that does not belong to user or does not exist.
- `400 Bad Request` if attempting to register with an email that already exists.

---

## Notes

- All authenticated endpoints require a valid JWT Bearer token.
- All fields must follow the model format; date strings use `YYYY-MM-DD`.
- Additional documentation including OpenAPI/Swagger UI is available at `/docs` when the backend is running.

---

## Mermaid Diagram: Major API Endpoints

```mermaid
graph TD
    A([Client]) -- GET /health --> B([Health Check])
    A -- POST /signup --> C([User Registration])
    A -- POST /token --> D([Token (Login)])
    A -- POST /applications/ --> E([Submit Application])
    A -- GET /applications/ --> F([List Applications])
    A -- GET /applications/{application_id}/status --> G([Application Status])

    E -- requires --> D
    F -- requires --> D
    G -- requires --> D
```

---

For further API details, consult the live OpenAPI docs at `/docs`.
