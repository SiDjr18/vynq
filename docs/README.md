# VYNQ Setup

This GitHub Pages folder is a static landing page only. The full backend-enabled procurement portal runs locally for free.

```bash
npm install
cp .env.example .env
npm run db:bootstrap
npm run db:seed
npm run dev
```

Docker option:

```bash
docker-compose up --build
```

Open the app at `http://localhost:5173`.
