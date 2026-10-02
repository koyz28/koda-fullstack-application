# Architecture & Implementation Plan

## 1. Overview

```
 Browser ──► Angular SPA ──(/api, Bearer token)──► Laravel API ──► MySQL
              (nginx)            FastCGI              (php-fpm)
```

- **Single origin.** In Docker, nginx serves the SPA and forwards `/api/*` to php-fpm. In
  development, the Angular dev-server proxies `/api` to `php artisan serve`. The frontend
  therefore always calls a relative `/api`, with no environment-specific builds and no CORS in the
  default topology.
- **Stateless auth.** Sanctum personal access tokens (`Authorization: Bearer …`). This is simple
  for an SPA on any host and easy to test. Every project belongs to a user and is only visible to
  that user.

## 2. Domain model

| Column         | Type                | Notes                                                |
| -------------- | ------------------- | ---------------------------------------------------- |
| `id`           | bigint PK           |                                                      |
| `user_id`      | FK → users, cascade | owner                                                |
| `client_name`  | varchar(255)        | required                                             |
| `project_name` | varchar(255)        | required                                             |
| `description`  | text, nullable      |                                                      |
| `status`       | varchar(20)         | `planning` / `in_progress` / `on_hold` / `completed` |
| `priority`     | varchar(20)         | `low` / `medium` / `high`                            |
| `start_date`   | date                | required                                             |
| `due_date`     | date, nullable      | ≥ `start_date`                                       |
| timestamps     |                     |                                                      |

Composite indexes `(user_id, status)`, `(user_id, priority)` and `(user_id, due_date)` back the
most common list queries.

**Decisions**

- Status and priority are **PHP backed enums** (`App\Enums`) cast on the model. They're stored as
  strings rather than DB `ENUM`, so adding a value is a code change and not a schema migration.
- `start_date` is required (every project has a planned start); `due_date` is optional (ongoing
  retainers), but when present it must not be earlier than the start date.
- Enum case order encodes business order. Sorting by priority uses a portable
  `CASE … WHEN` expression, so High > Medium > Low rather than alphabetical order.

## 3. Backend (Laravel)

```
app/
├── Enums/                    ProjectStatus, ProjectPriority (+ HasOptions trait)
├── Http/
│   ├── Controllers/Api/      AuthController, ProjectController (thin)
│   ├── Requests/
│   │   ├── Auth/             LoginRequest, RegisterRequest
│   │   └── Projects/         SaveProjectRequest (POST+PUT), ListProjectsRequest (query)
│   └── Resources/            ProjectResource, UserResource (API contract)
├── Models/                   Project (scopes: search, withStatus, withPriority, sortBy), User
└── Policies/                 ProjectPolicy (ownership)
bootstrap/app.php             JSON error rendering, friendly 404 messages
routes/api.php                /auth/*, apiResource('projects')
```

**Request lifecycle:** route → `auth:sanctum` → FormRequest (validate and normalise) →
controller → policy (`Gate::authorize`) → Eloquent → API Resource.

**Responsibilities**

- _FormRequests_ own input validation and normalisation, such as trimming names and turning
  blank descriptions into `null`. Custom messages make 422 responses readable for end users.
  Only `validated()` data reaches the model, which prevents mass-assignment of `user_id`.
- _Model scopes_ own query composition, so the controller reads as a pipeline:
  `projects()->search()->withStatus()->withPriority()->sortBy()->paginate()`.
  Search escapes `%`/`_` wildcards. Sorting is whitelisted (`Project::SORTABLE`) and uses `id`
  as a tie-breaker so pagination stays stable.
- _Resources_ decouple the DB schema from the API contract: ISO dates, enum values plus labels.
- _Policy_ enforces per-user ownership for show/update/delete (403). Listing is scoped through
  the `user->projects()` relation.
- _Exceptions_: `api/*` always renders JSON. Model-not-found becomes `{"message":"Project not found."}`.
- _Security_: auth routes are rate-limited, `/api/*` CORS origins are restricted via
  `FRONTEND_URL`, and passwords are hashed through a model cast.

**PUT vs PATCH:** `PUT` is a full replacement validated by the same rules as `POST`
(`SaveProjectRequest`), which keeps the validation logic in one place. `apiResource` also
registers `PATCH` for the same action, so `PATCH` currently behaves as an alias of `PUT` and
expects the full payload.

## 4. Frontend (Angular)

```
src/app/
├── core/                         app-wide singletons
│   ├── api/                      API_BASE_URL token, error helpers (message / 422 extraction)
│   ├── auth/                     AuthService (signals), TokenStorage, interceptor, guards
│   └── notifications/            ToastService + container
├── shared/                       reusable, feature-agnostic
│   ├── forms/                    validators (requiredTrimmed, dateRange), server-error mapping
│   ├── models/                   Paginated<T>
│   └── ui/                       ConfirmDialog, Pagination
├── layout/shell.ts               authenticated chrome (header + outlet)
└── features/                     lazy-loaded feature areas
    ├── auth/                     LoginPage, RegisterPage, safe returnUrl
    └── projects/
        ├── data/                 models (mirror backend enums), ProjectsService
        ├── components/           StatusBadge, PriorityBadge
        ├── pages/project-list/   search, filters, sortable table, pagination, delete
        └── pages/project-form/   create + edit (one component, route-driven)
```

**Patterns**

- Standalone components, `OnPush`, the new control flow (`@if`/`@for`), and signal inputs/outputs.
- **State with signals.** The list page keeps a single `query` signal as its source of truth. An
  `rxResource` reloads whenever the query changes, which also cancels stale requests. The query
  is mirrored to the URL, so filtered views can be bookmarked and shared. Search input is
  debounced, and a `linkedSignal` keeps the previous page on screen while the next one loads,
  so there's no flicker.
- **Typed reactive forms** with client validation that mirrors the server rules, including the
  cross-field date-range rule. Server 422 errors are mapped back onto the matching controls, so
  the server stays the source of truth.
- **HTTP concerns in one interceptor.** It attaches the token only to API URLs, so the token is
  never sent to third-party hosts. A 401 on an active session clears it and redirects to login
  with a safe `returnUrl`, which blocks open redirects.
- The session is restored before the first navigation (`provideAppInitializer`), so guards make
  the right decision on page refresh.
- **UX states:** loading, empty (with and without filters), error with retry, a delete
  confirmation dialog, toasts, and overdue highlighting. Accessibility details include
  `aria-sort`, `aria-invalid`, `role="alert"`, and labelled controls.
- Tailwind v4 with a handful of `@layer components` primitives (`.btn`, `.input`, `.card`,
  `.badge`) in `styles.css` to keep templates readable.

## 5. Testing strategy

| Layer    | Tooling          | Coverage                                                                                                                                                                                                   |
| -------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend  | PHPUnit          | Auth flows; CRUD; every validation rule via data providers (create + update); human-readable messages; ownership (403); 404 format; search/filter/sort/pagination; invalid query params; enum unit tests |
| Frontend | Vitest (ng test) | Validators; API error helpers; ProjectsService params/requests; interceptor (token scoping, 401 handling); form component (client validation, trimmed payload, server-error mapping); returnUrl safety    |
| CI       | GitHub Actions   | Backend against **MySQL 8.4**, Pint, Prettier, frontend tests + build, Docker image build                                                                                                                  |

## 6. Implementation plan (as executed)

1. **Scaffold.** Laravel 13 with `install:api` (Sanctum), and Angular 22 with Tailwind 4 through PostCSS.
2. **Domain.** Enums, migration, model with casts and scopes, and a factory (used by tests). An
   idempotent seeder imports the assessment's `test_data.json` (mapping labels such as
   "In Progress" to enum values) for a demo account.
3. **API.** FormRequests, Resource, Policy, controllers, routes, and JSON error handling.
4. **Auth.** Register/login/logout/me with token issuance and rate limiting.
5. **Backend tests.** Feature and unit tests, run against SQLite and MySQL.
6. **Frontend core.** API config, auth service/interceptor/guards, toasts, and the shell layout.
7. **Projects feature.** Service and models, list page (search/filter/sort/paginate/delete), and form page.
8. **Frontend tests.** Units plus a component test for the form.
9. **DevOps.** Dockerfiles, compose, nginx, CI workflow.
10. **Docs.** README (setup, API reference, deployment) and this document.

## 7. Possible next steps

- Soft deletes with an "archive" view, plus an activity log per project.
- Team/organisation sharing (replace the owner policy with team membership).
- `PATCH` partial updates (for example, quick status changes from the list).
- An OpenAPI spec generated from FormRequests/Resources.
- E2E tests (Playwright) running against the Docker stack in CI.
