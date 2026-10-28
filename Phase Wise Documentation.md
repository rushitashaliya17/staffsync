# StaffSync Phase Wise Documentation

## Phase 1 — Requirements and system design

Defined the HRM roles (HR, manager, and employee), core employee lifecycle workflows, and the client/API split. The system uses a React single-page client and an Express REST API with role-aware authentication.

## Phase 2 — Client foundation

Built the landing, login, and registration experiences, shared authentication and notification contexts, responsive navigation, and separate dashboards for employees, managers, and HR. Added reusable API calls and charts for operational summaries.

## Phase 3 — Server and data model

Implemented authentication middleware, model helpers, JSON-backed persistence, seed data, and API routes/controllers for employees, departments, attendance, leave, announcements, training, notifications, dashboards, reports, and audit logs.

## Phase 4 — Workflow integration

Connected client actions to the API for account access, employee operations, check-in/out, leave workflows, and training. The Vite development server forwards `/api` requests to the local Express server.

## Phase 5 — Local validation and deployment preparation

Separated the repository into `StaffSync/client` and `StaffSync/server`, added independent package manifests, and documented local startup. Build the client with `npm run build` from `StaffSync/client`; run the API from `StaffSync/server`. Configure deployment secrets and deploy the API and client with a matching API origin before public release.

## Current implementation notes

- Local persistence lives in `StaffSync/server/data/staffsync.json`; Git ignores this file so personal/test accounts are not committed.
- The server creates and seeds a fresh local database when no users exist.
- Demo credentials are documented in `Project Documentation.md` and should not be used for production.
