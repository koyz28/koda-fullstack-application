# Client Project Tracker

A small full-stack application that lets agency project managers track client projects, their
status, priority and timelines. Built for the Koda full-stack assessment (see
[REQUIREMENTS.md](./REQUIREMENTS.md)).

| Layer    | Technology                                                  |
| -------- | ----------------------------------------------------------- |
| Frontend | Angular 22 (standalone components, signals), Tailwind CSS 4 |
| Backend  | Laravel 13 (PHP 8.3), Sanctum token auth                    |
| Database | MySQL 8.4                                                   |
| Tooling  | PHPUnit, Pint, Vitest, Prettier, Docker, GitHub Actions     |

## Features Implemented

- Register and log in; projects are isolated to their owner.
- Create, view, edit, and delete client projects with status, priority, and timeline details.
- Validate project data in the frontend and API, with field-specific error messages.
- Search projects; filter by status and priority; sort and paginate results.
- Keep list filters in the URL so views can be bookmarked and shared.
- Highlight overdue projects.

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for design decisions and the implementation plan.

---

## Setup Instructions

### Docker quick start

```bash
cp .env.example .env          # optional: customise ports / credentials / APP_KEY
docker compose up --build
```

Open <http://localhost:8080> and sign in with the demo account **demo@example.com / password**
(seeded when `SEED_DEMO_DATA=true`). The demo account owns the 12 sample projects from
[`test_data.json`](test_data.json), which `ProjectSeeder` imports. Compose mounts the file into the
backend container.

### Local development (without Docker)

Prerequisites: PHP 8.3+, Composer, Node 22+, MySQL 8 (e.g. Laragon).

### Backend

```bash
cd backend
composer install
cp .env.example .env          # set DB_* to your MySQL instance
php artisan key:generate
mysql -uroot -e "CREATE DATABASE project_tracker"
php artisan migrate --seed    # creates demo@example.com / password with the projects from ../test_data.json
php artisan serve             # http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
npm start                     # http://localhost:4200 (proxies /api -> 127.0.0.1:8000)
```

## Assumptions Made

- Each project belongs to one authenticated user, and users can only access their own projects.
- A project must have a start date; its due date is optional but cannot be earlier than its start date.
- Status is one of Planning, In Progress, On Hold, or Completed; priority is Low, Medium, or High.
- Demo data is seeded by default for evaluation and can be disabled with `SEED_DEMO_DATA=false`.
- The default Docker deployment serves the frontend and API on the same origin.

## Tests & quality checks

```bash
# Backend: 51 feature + unit tests (in-memory SQLite by default)
cd backend && php artisan test && vendor/bin/pint --test

# Frontend: 26 Vitest unit/component tests, formatting, production build
cd frontend && npm run test:ci && npm run format:check && npm run build
```

CI ([.github/workflows/ci.yml](./.github/workflows/ci.yml)) runs the backend suite against a real
MySQL service, the frontend checks, and builds the Docker images.

---

## API reference

Base URL: `/api`. All `/projects` endpoints require `Authorization: Bearer <token>`.
Send `Accept: application/json`.

### Auth

| Method | Endpoint             | Body                                                    | Response                    |
| ------ | -------------------- | ------------------------------------------------------- | --------------------------- |
| POST   | `/api/auth/register` | `name`, `email`, `password`, `password_confirmation`    | `201 { token, user }`       |
| POST   | `/api/auth/login`    | `email`, `password`                                     | `200 { token, user }`       |
| GET    | `/api/auth/me`       | –                                                       | `200 { data: user }`        |
| POST   | `/api/auth/logout`   | –                                                       | `204` (revokes the token)   |

Login/registration are rate-limited to 10 requests/minute per IP + email.

### Projects

| Method | Endpoint             | Description                    | Success |
| ------ | -------------------- | ------------------------------ | ------- |
| GET    | `/api/projects`      | List (paginated, filterable)   | `200`   |
| GET    | `/api/projects/{id}` | Get a single project           | `200`   |
| POST   | `/api/projects`      | Create a project               | `201`   |
| PUT    | `/api/projects/{id}` | Replace/update a project       | `200`   |
| DELETE | `/api/projects/{id}` | Delete a project               | `204`   |

**List query parameters**

| Param      | Example          | Notes                                                                                   |
| ---------- | ---------------- | --------------------------------------------------------------------------------------- |
| `search`   | `acme`           | Matches client name, project name or description                                        |
| `status`   | `in_progress`    | `planning` · `in_progress` · `on_hold` · `completed`                                    |
| `priority` | `high`           | `low` · `medium` · `high`                                                               |
| `sort`     | `-due_date`      | `client_name`, `project_name`, `status`, `priority`, `start_date`, `due_date`, `created_at`; `-` prefix = descending. Status/priority sort by business order (Low < Medium < High). Default `-created_at` |
| `page`     | `2`              |                                                                                         |
| `per_page` | `25`             | 1–100, default 10                                                                       |

**Project payload / resource**

```json
{
  "client_name": "Acme Corp",
  "project_name": "Website Redesign",
  "description": "Optional text",
  "status": "in_progress",
  "priority": "high",
  "start_date": "2026-10-01",
  "due_date": "2026-12-15"
}
```

Responses wrap the resource in `data` and add `id`, `status_label`, `priority_label`,
`created_at` and `updated_at`. Lists also include Laravel `links` and `meta` (pagination).

**Validation rules**

| Field          | Rules                                                     |
| -------------- | --------------------------------------------------------- |
| `client_name`  | required, string, max 255 (trimmed)                       |
| `project_name` | required, string, max 255 (trimmed)                       |
| `description`  | optional, string, max 5000                                |
| `status`       | required, one of the status values                        |
| `priority`     | required, one of the priority values                      |
| `start_date`   | required, `YYYY-MM-DD`                                    |
| `due_date`     | optional, `YYYY-MM-DD`, **not earlier than `start_date`** |

**Error format**

| Status | When                                | Body                                                       |
| ------ | ----------------------------------- | ---------------------------------------------------------- |
| 401    | Missing/invalid token               | `{ "message": "Unauthenticated." }`                        |
| 403    | Accessing another user's project    | `{ "message": "This action is unauthorized." }`            |
| 404    | Unknown project                     | `{ "message": "Project not found." }`                      |
| 422    | Validation failed                   | `{ "message": "...", "errors": { "due_date": ["The due date cannot be earlier than the start date."] } }` |
| 429    | Too many auth attempts              | `{ "message": "Too Many Attempts." }`                      |

---

## Deployment

The Docker setup is production-shaped and can be deployed to any VM or container host:

1. Provision a host with Docker (e.g. a small DigitalOcean/Lightsail/EC2 instance).
2. Create `.env` from `.env.example` with a real `APP_KEY`
   (`docker compose run --rm backend php artisan key:generate --show`), strong DB passwords,
   `APP_URL`, and `SEED_DEMO_DATA=false` for real data.
3. `docker compose up -d --build`. Migrations run automatically on container start.
4. Put a TLS-terminating proxy (Caddy, Traefik, or a cloud load balancer) in front of port `8080`.

Because nginx serves the SPA and forwards `/api` to php-fpm on the same origin, no CORS
configuration is needed in this topology. If the frontend and API are hosted separately
(e.g. Vercel + a PaaS for Laravel), configure a rewrite of `/api/*` to the API host, or set
`FRONTEND_URL` on the backend (comma-separated) to allow cross-origin requests.

## Project structure

```
.
├── backend/                 Laravel API (see docs/ARCHITECTURE.md)
├── frontend/                Angular SPA
├── docs/ARCHITECTURE.md     Architecture, decisions, implementation plan
├── docker-compose.yml       MySQL + php-fpm + nginx/SPA
└── .github/workflows/ci.yml CI pipeline
```
