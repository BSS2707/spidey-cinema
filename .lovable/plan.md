
# Spidey Cinema — Implementation Plan

A full cinema booking platform built on Lovable's native stack. The features you listed are preserved; the runtime is the platform's (TanStack Start + Lovable Cloud), not Express + Prisma.

## Stack mapping (your spec → what I'll actually use)

| Your spec | What I'll build with | Why |
|---|---|---|
| React + Vite + Tailwind + Zustand + React Query | TanStack Start (React 19 + Vite) + Tailwind v4 + Zustand + TanStack Query v5 | Native Lovable stack |
| Express + Prisma + Postgres | Lovable Cloud (Postgres + RLS) + `createServerFn` RPCs | No separate server needed |
| JWT access + refresh in httpOnly cookies | Supabase Auth sessions (managed) | Built-in, secure, refresh handled |
| PDFKit ticket | `pdf-lib` (Worker-compatible) | PDFKit needs Node fs/streams; pdf-lib runs on edge |
| Nodemailer SMTP | Lovable Emails (React Email templates) | Native, branded, queued + retried |
| `upi-payment-qrcode` | `qrcode` lib generating UPI deep-link QR | Same outcome, edge-compatible |
| Recharts, Zod, json2csv, GSAP, Three.js | Same packages, work as-is | ✅ |
| Cron job (every 2 min) | pg_cron in Lovable Cloud calling `/api/public/cron/release-seats` | Built-in scheduler |

## Design direction

Dark cinema lobby aesthetic — pure black + charcoal, red `#E50914` primary, fiery orange `#FF6F00` accent, metallic silver text. Three.js hero with floating film reel + ticket particles. GSAP scroll reveals. Custom magnetic cursor.

## Database schema (Postgres + RLS)

```
profiles(id→auth.users, full_name, phone, created_at)
user_roles(id, user_id, role: 'user'|'admin')  -- separate table, has_role() SECURITY DEFINER
movies(id, title, slug, synopsis, poster_url, backdrop_url, duration_min, genre[], language, rating, release_date, trailer_url, is_active)
shows(id, movie_id, screen_name, starts_at, base_price_silver, base_price_gold, base_price_platinum, total_seats_per_row, rows_config jsonb)
seats(id, show_id, row_label, seat_number, seat_type, status: available|locked|booked, locked_by, locked_until)
bookings(id, user_id, show_id, status: pending|confirmed|cancelled, subtotal, gst, total, upi_utr, payment_status, qr_token, created_at)
booking_seats(id, booking_id, seat_id, price)
```

All tables RLS-enabled. Users see only their own bookings; admins see all via `has_role(auth.uid(),'admin')`.

## Features in build order

### Phase 1 — Foundation (this turn)
1. Enable Lovable Cloud
2. Set up email domain + UPI secrets
3. Schema + RLS + seed admin role
4. Design system (colors, fonts, cursor styles, motion tokens)
5. Three.js hero scene, custom cursor, GSAP scroll wrapper
6. Auth pages (sign up / sign in / forgot / reset) using Supabase Auth + Google OAuth optional

### Phase 2 — User flow
7. Home (hero + now showing + coming soon)
8. Movies list + filters
9. Movie detail with showtime picker
10. Seat selection grid (10-min lock via `locked_until`)
11. Payment screen — UPI QR (deep link `upi://pay?pa=9998106880@fam&...`) + UTR submit
12. Booking confirmation + PDF ticket download (pdf-lib) + email with PDF link
13. User dashboard (upcoming + past bookings)

### Phase 3 — Admin
14. `/admin` gated by `has_role`
15. Overview (revenue, bookings, occupancy — Recharts)
16. Movies CRUD, Shows CRUD with seat-grid config
17. Bookings table + cancel/refund
18. Users + role management
19. Reports + CSV export (json2csv)

### Phase 4 — Ops
20. pg_cron job every 2 min → release expired seat locks + delete pending unpaid bookings
21. SEO: sitemap.xml + robots.txt + per-route metadata
22. Error/notFound boundaries on every route

## Realistic scope note

This is genuinely 15–25 hours of build. I'll ship Phase 1 + auth + home in this turn so you can verify the look and feel, then iterate phase by phase. After each phase you can review, request changes, and we move on. Trying to one-shot all 22 items will produce shallow, bug-prone work — the iterative path gets you a real product.

## What I need from you after approving

- SMTP: I'll set up Lovable Emails (managed). I'll prompt for an email domain when needed — no SMTP credentials required.
- UPI VPA `9998106880@fam` and name "Spidey Cinema" → I'll hardcode as defaults; you can change in admin later.
- Seed admin: I'll ask for your admin email after first sign-up, then grant the admin role.
