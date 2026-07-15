# Kairo Landing Page

A Next.js (App Router) landing page for **Kairo**, a native API client built with Rust/Tauri.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
npm run start
```

## Notes

- Fonts (Inter, JetBrains Mono) are loaded via `next/font/google` — an internet
  connection is required at build time to fetch them.
- SEO: metadata, Open Graph, Twitter cards, JSON-LD (`SoftwareApplication`),
  `sitemap.xml`, `robots.txt`, and a dynamic OG image (`/opengraph-image`) are
  all wired up in `src/app`. Update `siteUrl` in `src/app/layout.tsx` (and the
  urls in `sitemap.ts` / `robots.ts`) once you have a real domain.
- Download buttons currently point to `#download` / `#` placeholders — swap in
  real release URLs once builds are published.
- Replace `public/logo.svg` with your real mark whenever you have one.
