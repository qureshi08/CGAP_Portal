# CGAP Portal — Tech Stack (Free Tier Only)

> Chosen to mirror the sibling **CBT Recruitment Portal** exactly — proven in production, zero new cost, zero new learning curve for whoever maintains both apps.

## Summary Table

| Layer | Choice | Why | Cost |
|---|---|---|---|
| Framework | **Next.js** (App Router, Server Actions) | Same as Recruitment Portal; one codebase mental model for both apps; server actions avoid a separate API layer | Free, open source |
| Language | **TypeScript** | Type safety across a data model with many entities (fellows, phases, modules, rubrics) | Free |
| Styling | **Tailwind CSS 4** | Brand kit ships a drop-in `tailwind.config.fragment.js` and `tokens.css` — zero setup cost | Free |
| Database | **Supabase (PostgreSQL)** | Free tier: 500MB DB, 1GB storage, 50k monthly active users — comfortably covers a few hundred fellows/batches | Free tier |
| Auth | **Supabase Auth** | Built into the same free project; same RBAC pattern (`users`/`roles`/`user_roles`) as Recruitment Portal | Free tier |
| File storage | **Supabase Storage** | Resumes/transcripts/submission files — same bucket pattern as Recruitment Portal's `resumes` bucket | Free tier (1GB) |
| Email | **Nodemailer** (SMTP — Gmail or any free SMTP relay) | Same as Recruitment Portal — no separate email service to pay for | Free (existing CBT mailbox) |
| Hosting | **Vercel** | Free Hobby tier covers a low-traffic internal tool comfortably; same deploy flow as Recruitment Portal | Free tier |
| Icons | **lucide-react** | Same icon set as Recruitment Portal for visual consistency | Free, open source |
| Animation | **Framer Motion** | Matches existing product feel | Free, open source |
| Charts | **Recharts** | Batch/phase progress dashboards | Free, open source |
| Exports | **xlsx** (SheetJS) | CSV/Excel rollup exports for reporting, matching `excelExport.ts` pattern | Free, open source |

## Explicitly NOT Used (and why)

- **No paid AI screening tier** — CGAP doesn't need resume AI-scoring (that already happened in Recruitment Portal); if module-submission auto-analysis is ever wanted, Gemini's free tier could be reused later, but it's not part of v1.
- **No dedicated email service (SendGrid/Postmark/etc.)** — adds a paid tier and a new account; Nodemailer + existing SMTP is free and already proven.
- **No separate CMS/no-code backend** — Supabase already covers DB+Auth+Storage in one free project; adding another service would just add operational surface area for no benefit.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EMAIL_USER=
EMAIL_PASS=
NEXT_PUBLIC_APP_URL=
```

A **new, separate Supabase project** should be created for CGAP Portal (do not reuse the Recruitment Portal's project) — keeps the two apps' data and access fully isolated, and both stay well within their own free-tier limits. Same reasoning applies to hosting: a separate free Vercel project.

## Scaling Note

If CGAP ever needs to run many batches concurrently with heavy file uploads (video submissions especially), Supabase Storage's 1GB free limit is the first thing likely to be outgrown — video-heavy submissions (the CS50 explainer video, live-demo recordings) are the main risk. Recommended mitigation when that happens: store large video files externally (e.g. a free-tier YouTube "unlisted" upload or Google Drive link) and only store the *link* in Supabase, rather than the raw file — keeps storage cost at zero indefinitely. This is called out explicitly because it's the one place "free forever" could break if not planned for.
