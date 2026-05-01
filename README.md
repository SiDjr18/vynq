# VYNQ

VYNQ is a free, local-first enterprise procurement demo application for vendor onboarding, RFQ/RFP creation, PR management, PO management, contract tracking, GRN/ASN workflows, invoice and payment tracking, reports, audit logs, and role-based access control.

The project is built with dummy data only and is safe to share as a portfolio or internal demo. It does not use paid APIs, paid hosting, paid databases, paid authentication providers, paid email/SMS services, paid analytics, paid UI kits, paid fonts, paid icons, paid templates, or paid file storage.

## Key Features

- Executive dashboard with KPI cards, charts, alerts, approvals, and recent activity.
- Vendor management with onboarding, compliance placeholders, approval/block/inactive states, and CSV export.
- Requirement and RFQ/RFP workflows with seeded procurement statuses and audit logging.
- PR creation and PR-to-RFQ conversion.
- PO list, PO generation, approval status, vendor acknowledgement, and delivery tracking.
- Contract list, expiry alerts, renewal status, utilization fields, and amendment history.
- Catalogue item master with vendor links and price history.
- QCS approval workflow and comparison data.
- GRN, ASN, invoice, payment, and three-way matching models/endpoints in the local backend.
- Reports with CSV, Excel-compatible, and PDF export paths generated locally.
- In-app mock notifications, comments, and audit log.
- JWT/session authentication with role-based permissions.

## Screens and Modules

- Dashboard Analytics
- My Accounts / Profile
- PR Management
- PR Management V2 / RFQ Management
- PO Management
- Create Requirement
- Vendor Management
- Catalogue
- Contract Management
- Requirements List
- Communications
- Reports
- Settings
- Password Management

## Procurement Workflow

Requirement -> RFQ/RFP -> Vendor Selection -> Quotation -> QCS -> PO -> GRN -> Invoice -> Payment -> Three-Way Match

## Tech Stack

- Frontend: React, TypeScript, Vite
- Styling: Tailwind CSS and local shadcn/ui-style source components
- Icons: Lucide React
- Tables: TanStack Table
- Server state: TanStack Query
- Client state: Zustand
- Charts: Recharts
- Backend: Node.js and Express
- ORM: Prisma
- Database: SQLite for local demo
- Optional production-like database: PostgreSQL through local Docker only
- Auth: custom JWT/session authentication
- Exports: CSV, Excel-compatible local export, PDFKit
- Deployment: local npm or Docker Compose
- Static share page: GitHub Pages from `/docs`

## Free-Only Architecture

This application is intentionally local-first and cost-free. The full application runs on your machine with npm or Docker. GitHub Pages is only used for the static landing page in `docs/index.html`; it does not host the backend.

No credit card is required for local use. No paid backend, managed database, paid auth provider, paid email/SMS service, paid analytics, paid file storage, or paid UI/template/icon/font is integrated.

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:bootstrap
npm run db:seed
npm run dev
```

Web app: `http://localhost:5173`  
API: `http://localhost:4000/api`

If your Windows security software allows Prisma schema engine execution, `npm run db:push` can be used instead of `npm run db:bootstrap`.

## Docker Setup

```bash
docker-compose up --build
```

The production server serves the built React app and API from:

```text
http://localhost:4000
```

## Test Login Credentials

All credentials are dummy demo users.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@demo.com` | `Admin@123` |
| Procurement Head | `head@demo.com` | `Head@123` |
| Procurement Manager | `manager@demo.com` | `Manager@123` |
| Buyer | `buyer@demo.com` | `Buyer@123` |
| Vendor | `vendor@demo.com` | `Vendor@123` |
| Finance | `finance@demo.com` | `Finance@123` |
| Legal | `legal@demo.com` | `Legal@123` |
| QCS Approver | `qcs@demo.com` | `Qcs@123` |
| Warehouse | `warehouse@demo.com` | `Warehouse@123` |
| Viewer | `viewer@demo.com` | `Viewer@123` |

## GitHub Pages Demo Page

The shareable static landing page is:

```text
docs/index.html
```

To share the static demo page with the team using GitHub Pages:
Go to GitHub repository -> Settings -> Pages -> Build and deployment -> Deploy from branch -> main -> /docs.

GitHub Pages hosts only this static demo landing page. The full backend-enabled application runs locally for free using npm or Docker.

## Folder Structure

```text
.
|-- docs/                 # Static GitHub Pages landing page
|-- prisma/               # Prisma schema, bootstrap, and seed data
|-- server/               # Express API, auth, audit, validation, query helpers
|-- src/                  # React app source
|   |-- components/       # Layout, table, and UI primitives
|   |-- hooks/            # Query/debounce hooks
|   |-- lib/              # API and formatting utilities
|   |-- pages/            # App screens and modules
|   `-- store/            # Zustand auth store
|-- Dockerfile
|-- docker-compose.yml
|-- COST_FREE.md
`-- TEST_USERS.md
```

## Known Limitations

- GitHub Pages is static and cannot run the Express/Prisma backend.
- Email/SMS notifications are intentionally mocked as in-app notifications.
- File uploads use local placeholder storage only.
- SQLite is the default local demo database; PostgreSQL is available only through local Docker setup.
- This is a demo application and should be security-reviewed before production use.

## Security Note

This is a demo app with dummy data only. No real company, vendor, employee, email, phone number, internal code, or confidential business data is included.

Do not commit `.env`, local databases, uploads, logs, private screenshots, or confidential documents.

## Cost-Free Confirmation

- No paid service is used.
- No credit card is required.
- No paid API is integrated.
- No paid database is used.
- No paid hosting is used.
- No paid authentication provider is used.
- No paid email/SMS service is used.
- No paid UI library, paid template, paid icon set, or paid font is used.
- The app can run locally for free.
