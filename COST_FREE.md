# Cost-Free Compliance

This project is designed to be 100% free to run locally. It avoids paid APIs, paid hosting, paid databases, paid authentication providers, paid email/SMS services, paid analytics, paid monitoring tools, paid UI kits, paid templates, paid icons, paid fonts, paid file storage, paid AI APIs, and services requiring mandatory credit card activation.

## Technology Table

| Technology | Purpose | Free Reason | Local Without Payment | Paid Alternative Avoided |
| --- | --- | --- | --- | --- |
| React | Frontend UI | Open-source MIT library | Yes | Paid UI application builders |
| TypeScript | Type-safe development | Free open-source compiler | Yes | Paid proprietary IDE/runtime tooling |
| Vite | Frontend dev/build tool | Free open-source build tool | Yes | Paid frontend build platforms |
| Tailwind CSS | Utility styling | Free open-source CSS framework | Yes | Paid CSS/UI kits |
| shadcn/ui-style local components | UI primitives | Components are local source code | Yes | Paid component libraries/templates |
| Lucide React | Icons | Free open-source icon set | Yes | Premium icon packs |
| TanStack Table | Data table engine | Free open-source package | Yes | Paid enterprise table grids |
| TanStack Query | Server-state caching | Free open-source package | Yes | Paid data-sync SDKs |
| Zustand | Client state | Free open-source package | Yes | Paid frontend state services |
| Recharts | Charts | Free open-source chart library | Yes | Paid BI/chart libraries |
| Node.js | Backend runtime | Free open-source runtime | Yes | Paid server runtimes |
| Express | API framework | Free open-source package | Yes | Paid backend platforms |
| Prisma | ORM and schema tooling | Free ORM tooling used locally | Yes | Paid managed ORM/data platforms |
| SQLite | Local demo database | Free embedded database | Yes | Paid managed databases |
| PostgreSQL via Docker | Optional local database | Free local container image | Yes | Paid hosted PostgreSQL |
| Docker / Docker Compose | Local deployment | Free local development workflow | Yes | Paid cloud deployment |
| JSON Web Tokens | Authentication sessions | Implemented locally with open-source libraries | Yes | Auth0, Clerk, Okta, Firebase Auth paid tiers |
| Local file storage | Upload placeholder | Uses local disk only | Yes | S3, Cloudinary, Uploadcare, paid storage |
| In-app notifications | Notification mock | Stored locally in database | Yes | Paid email, SMS, push, WhatsApp APIs |
| CSV export | Reports | Generated locally as text | Yes | Paid reporting platforms |
| Excel-compatible local export | Spreadsheet export | Generated locally as an Excel-readable HTML table, with no paid service | Yes | Paid spreadsheet/reporting SDKs |
| PDFKit | PDF export | Open-source package used locally | Yes | Paid PDF/reporting services |
| GitHub repository | Source hosting | GitHub free account can host repos | Yes for source | Paid Git hosting |
| GitHub Pages | Static demo page | Free static page hosting for repo content | Yes for static page | Paid hosting providers |

## Paid Alternatives Intentionally Avoided

- Paid authentication providers such as Auth0, Clerk, Okta, Cognito, and hosted Firebase Auth.
- Paid databases and managed database services.
- Paid email, SMS, WhatsApp, push, or transactional messaging APIs.
- Stripe or any payment gateway.
- Paid cloud file storage, image storage, CDN storage, and upload SaaS tools.
- Paid analytics, monitoring, error tracking, APM, or session replay services.
- Paid AI APIs or paid AI runtime features.
- Paid Figma templates, design kits, licensed stock media, paid fonts, and premium icon packs.
- Paid deployment services or services requiring mandatory credit card activation.

## Local/Mock Substitutions

- Email/SMS alerts are mocked as in-app notifications.
- File uploads use local placeholder storage.
- Audit logs are stored in the local database.
- Authentication is custom JWT/session auth.
- Reports are generated from local data using free libraries.
- GitHub Pages hosts only the static landing page; the full app runs locally with npm or Docker.

## Final Cost-Free Confirmation

- No paid service/API/asset is used.
- No credit card is required.
- No paid hosting is required.
- No paid database is used.
- No paid authentication provider is used.
- No paid email/SMS/analytics/monitoring service is used.
- The full backend-enabled app can run locally for free.
