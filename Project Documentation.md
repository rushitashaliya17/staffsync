# StaffSync Project Documentation

## Overview

StaffSync is a role-based human resources management system with an employee web client and an API server. The source code is in [`StaffSync`](StaffSync/), split into `client/` and `server/`.

## Repository layout

```text
Project Documentation.md
Phase Wise Documentation.md
StaffSync/
  client/   React, Vite, styling, pages, and browser API client
  server/   Express API, authentication, controllers, routes, seed script, and local data
```

## Run locally

Requirements: Node.js 20 or newer and npm.

Install each app's dependencies once:

```sh
cd StaffSync/client && npm install
cd ../server && npm install
```

Start the API in one terminal:

```sh
cd StaffSync/server
npm run dev
```

Start the web client in a second terminal:

```sh
cd StaffSync/client
npm run dev
```

Open the Vite URL shown in the client terminal (normally `http://localhost:5173`). The client proxies `/api` requests to the API on port 3000. The server creates and seeds `StaffSync/server/data/staffsync.json` on its first run; that local database file is ignored by Git.

## Demo accounts

The initial database seed creates these demo logins:

| Role | Email | Password |
| --- | --- | --- |
| HR | `hr@staffsync.com` | `admin123` |
| Manager | `manager.tech@staffsync.com` | `manager123` |
| Employee | `employee1@staffsync.com` | `employee123` |

Use these accounts only for local demonstration. Change credentials and provide strong JWT secrets before any real deployment.

## Main capabilities

- Sign in, register, role-aware dashboards, and token-based API authentication.
- Employee and department management.
- Attendance, leave requests and balances, announcements, and training enrollment.
- Dashboard summaries, notifications, reports, and audit routes.

## Packages

- `StaffSync/client`: React 19, Vite, Tailwind CSS, and Recharts. Run `npm run build` here to build the client.
- `StaffSync/server`: Express API and JSON-file persistence. Run `npm run seed` to reset and reseed local demo data; this overwrites the local database.

The server accepts `PORT`, `NODE_ENV`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL`, and `REFRESH_TOKEN_TTL` from `StaffSync/server/.env`. Start from `.env.example` and replace the example secrets for deployment.
