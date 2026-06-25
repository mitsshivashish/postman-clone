# PostmanX — API Client Platform

A full-featured Postman clone built with Next.js (TypeScript) + FastAPI (Python) + SQLite.

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Zustand, Sonner |
| Backend   | Python 3.x, FastAPI, SQLAlchemy, SQLite, HTTPX |
| Database  | SQLite (`backend/postman_clone.db`) |

---

## Project Structure

```
postman_clone/
├── backend/
│   ├── main.py          # FastAPI app, all routes, seed data
│   ├── database.py      # SQLAlchemy models + DB setup
│   ├── schemas.py       # Pydantic schemas
│   ├── runner.py        # HTTP request proxy/runner
│   ├── requirements.txt
│   └── start.py         # Convenience startup script
└── frontend/
    ├── app/             # Next.js App Router pages
    ├── components/
    │   ├── layout/      # Workspace, TopBar, TabBar, Sidebar, ModalManager
    │   ├── request/     # RequestBuilder, ResponseViewer, MethodSelector, tabs/
    │   ├── sidebar/     # CollectionsSidebar, HistorySidebar
    │   ├── modals/      # All modal dialogs
    │   └── ui/          # KeyValueEditor, Modal
    └── lib/
        ├── types.ts     # Shared TypeScript types
        ├── store.ts     # Zustand global state
        ├── api.ts       # Backend API client
        └── utils.ts     # Formatting helpers
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.10+

### Backend

```bash
cd backend
pip install -r requirements.txt
python start.py
# API runs at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:3000
```

The backend auto-seeds sample collections, environments, and history on first run.

---

## Database Schema

### `collections`
| Column       | Type      | Notes               |
|--------------|-----------|---------------------|
| id           | INTEGER PK|                     |
| name         | TEXT      | Required            |
| description  | TEXT      |                     |
| created_at   | DATETIME  |                     |
| updated_at   | DATETIME  |                     |

### `saved_requests`
| Column         | Type    | Notes                                    |
|----------------|---------|------------------------------------------|
| id             | INT PK  |                                          |
| collection_id  | INT FK  | → collections.id (cascade delete)        |
| name           | TEXT    |                                          |
| method         | TEXT    | GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS   |
| url            | TEXT    |                                          |
| headers        | TEXT    | JSON serialised KeyValue[]               |
| params         | TEXT    | JSON serialised KeyValue[]               |
| body_type      | TEXT    | none/raw/form-data/x-www-form-urlencoded |
| body_content   | TEXT    |                                          |
| body_raw_type  | TEXT    | JSON/Text                                |
| auth_type      | TEXT    | none/bearer/basic                        |
| auth_data      | TEXT    | JSON serialised {token,username,password}|
| created_at     | DATETIME|                                          |
| updated_at     | DATETIME|                                          |

### `environments`
| Column     | Type    | Notes           |
|------------|---------|-----------------|
| id         | INT PK  |                 |
| name       | TEXT    |                 |
| is_active  | BOOLEAN | One active at a time |
| created_at | DATETIME|                 |
| updated_at | DATETIME|                 |

### `environment_variables`
| Column         | Type    | Notes               |
|----------------|---------|---------------------|
| id             | INT PK  |                     |
| environment_id | INT FK  | → environments.id   |
| key            | TEXT    |                     |
| value          | TEXT    |                     |
| is_enabled     | BOOLEAN |                     |

### `history`
| Column           | Type    | Notes                        |
|------------------|---------|------------------------------|
| id               | INT PK  |                              |
| method           | TEXT    |                              |
| url              | TEXT    |                              |
| headers          | TEXT    | JSON                         |
| params           | TEXT    | JSON                         |
| body_type        | TEXT    |                              |
| body_content     | TEXT    |                              |
| body_raw_type    | TEXT    |                              |
| auth_type        | TEXT    |                              |
| auth_data        | TEXT    | JSON                         |
| response_status  | INT     | HTTP status code             |
| response_time    | FLOAT   | ms                           |
| response_size    | INT     | bytes                        |
| response_headers | TEXT    | JSON                         |
| response_body    | TEXT    | Capped at 500KB              |
| response_error   | TEXT    | Error message if failed      |
| sent_at          | DATETIME|                              |

---

## API Overview

| Method | Endpoint                              | Description                      |
|--------|---------------------------------------|----------------------------------|
| GET    | /api/collections                      | List all collections             |
| POST   | /api/collections                      | Create collection                |
| PUT    | /api/collections/{id}                 | Update collection                |
| DELETE | /api/collections/{id}                 | Delete collection (cascade)      |
| GET    | /api/collections/{id}/requests        | List requests in collection      |
| POST   | /api/requests                         | Create saved request             |
| PUT    | /api/requests/{id}                    | Update saved request             |
| DELETE | /api/requests/{id}                    | Delete saved request             |
| GET    | /api/environments                     | List environments                |
| POST   | /api/environments                     | Create environment               |
| PUT    | /api/environments/{id}               | Update environment + variables   |
| DELETE | /api/environments/{id}               | Delete environment               |
| POST   | /api/environments/{id}/activate       | Set as active environment        |
| POST   | /api/environments/deactivate          | Deactivate all environments      |
| GET    | /api/history                          | List request history             |
| DELETE | /api/history                          | Clear all history                |
| DELETE | /api/history/{id}                     | Delete history item              |
| POST   | /api/run                              | Execute HTTP request (proxy)     |

Interactive Swagger docs: http://localhost:8000/docs

---

## Core Features

- **Request Builder** — Method selector, URL bar, Params/Headers/Body/Auth tabs
- **Response Viewer** — Pretty (JSON highlighted) / Raw / Headers view, status/time/size
- **Collections** — Full CRUD, context menus, collapsible tree
- **History** — Auto-recorded, grouped by date, click to reopen
- **Environments** — Variables with `{{variable}}` syntax, resolved at send time
- **Tabbed Interface** — Multi-tab, dirty indicators, resizable sidebar
- **Real Requests** — Backend proxy handles CORS, auth injection, variable substitution

## Placeholder Sections (UI present, marked "Coming Soon")
- Team workspaces / sharing
- Mock servers
- API documentation generation
- Monitors / scheduled runs
- Real authentication

## Assumptions
- Single-user workspace (no auth required)
- SQLite is sufficient for single-user local use
- All times are UTC
- Response bodies capped at 500KB in history storage
