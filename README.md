# VYNQ

VYNQ — Vendor Yield, Negotiation & Quotation Platform — is a free, local-first CDMO / Pharma procurement repository and workflow accelerator. It helps procurement teams create RFQs, RFPs, PRs, POs, contracts, quotations, and vendor interactions faster by searching material codes, auto-capturing material details, recommending manufacturers/vendors, cloning previous requirements, and reusing master data.

All materials, manufacturers, vendors, prices, addresses, and transactions are generated dummy CDMO / Pharma procurement data for demo purposes only.

## CDMO / Pharma Demo Focus

The seeded demo is intentionally limited to CDMO / Pharma procurement. It does not create FMCG, aeronautics, aviation, automotive, electronics, generic industrial, medical-device, or non-pharma material data.

## Key Repository Modules

- Material Master: exactly 3,000 CDMO / Pharma materials from `1000000001` to `1000003000`.
- Manufacturer Master: pharma/CDMO manufacturer records with compliance, certification, lead time, and rating.
- Vendor Supply Network: material -> manufacturer -> vendor mappings with price, MOQ, lead time, last purchase price, compliance, and recommendation score.
- Material Intelligence: dashboard for material coverage, single-source risk, vendor compliance risk, lead time, and price variance.
- Data Connectors: free local/mock API connector configuration and sync logs.
- Material Code Autocomplete: server-side smart lookup for transaction line items.
- Auto-Capture Material Details: selected material fills category, subcategory, UOM, HSN, regulatory category, grade, storage condition, and shelf life.
- Recommended Manufacturers/Vendors: ranked panels based on linkage, vendor rating, delivery, quality, compliance, and price competitiveness.
- Clone Requirement: clones old requirements into new editable drafts without copying RFQ number, quotations, PO, GRN, invoice, payment, or QCS records.

## Large Dummy Dataset

Run `npm run seed:pharma` to generate:

- 3,000 CDMO / Pharma materials
- 15,000 material-manufacturer mappings
- 3,000 unique pharma vendors
- 52,500 vendor supply mappings
- 1,000 RFQs
- 3,000 quotations
- 500 POs
- 300 contracts
- 600 invoices
- 400 GRNs
- 250 payments
- 300 three-way matching records

## Procurement Workflow

Material Repository -> Manufacturer Repository -> Vendor Supply Network -> Requirement -> RFQ/RFP -> Quotation -> QCS -> PO -> GRN -> Invoice -> Payment -> Three-Way Match

## Tech Stack

- Frontend: React, TypeScript, Vite
- Styling: Tailwind CSS and local shadcn/ui-style source components
- Icons: Lucide React
- Tables: TanStack Table
- Server state: TanStack Query/local fetch helpers
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

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run seed:pharma
npm run dev
```

Web app: `http://localhost:5173`  
API: `http://localhost:4000/api`

## Docker Setup

```bash
docker-compose up --build
npm run seed:pharma
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
| Buyer | `buyer@demo.com` | `Buyer@123` |
| Vendor | `vendor@demo.com` | `Vendor@123` |
| Finance | `finance@demo.com` | `Finance@123` |
| Warehouse | `warehouse@demo.com` | `Warehouse@123` |
| Viewer | `viewer@demo.com` | `Viewer@123` |

## Free-Only Architecture

This application is intentionally local-first and cost-free. The full application runs on your machine with npm or Docker. GitHub Pages is only used for the static landing page in `docs/index.html`; it does not host the backend.

No credit card is required. No paid API, paid pharma database, paid company/vendor database, paid procurement data provider, paid backend, paid managed database, paid auth provider, paid email/SMS service, paid analytics, paid file storage, paid UI kit, paid template, paid icon set, or paid font is integrated.

## Security Note

This is a demo app with dummy data only. No real company, vendor, manufacturer, employee, email, phone number, internal code, screenshot, or confidential business data is included.

Do not commit `.env`, local databases, uploads, logs, private screenshots, or confidential documents.

## GitHub Pages Demo Page

The shareable static landing page is:

```text
docs/index.html
```

To share the static demo page with the team using GitHub Pages:
Go to GitHub repository -> Settings -> Pages -> Build and deployment -> Deploy from branch -> main -> /docs.

GitHub Pages hosts only this static demo landing page. The full backend-enabled application runs locally for free using npm or Docker.

## Known Limitations

- GitHub Pages is static and cannot run the Express/Prisma backend.
- Data Connectors run in local/mock mode only.
- Email/SMS notifications are intentionally mocked as in-app notifications.
- File uploads use local placeholder storage only.
- SQLite is the default local demo database; PostgreSQL is available only through local Docker setup.
- This is a demo application and should be security-reviewed before production use.
