# Changelog — Maintenance mode

## Added
- `src/lib/maintenance.ts` — `isMaintenanceMode()` (true when `MAINTAIN=1`) and `MAINTENANCE_PATH`.
- `src/app/maintenance/page.tsx` — static, noindex maintenance page (glass card, logo, status pill).
- `src/components/maintenance/MaintenanceCard.tsx` — card with the illustration and upgrade message.
- `src/components/maintenance/RetryButton.tsx` — "Check again" client button (reload).
- `public/maintenance.svg` — the undraw maintenance illustration.
- `.env.example` — documents the `MAINTAIN` variable.

## Changed
- `src/proxy.ts`
  - When `MAINTAIN=1`, every page request is redirected (307) to `/maintenance`; this check runs first, before any cookie/JWT work, so it adds no auth cost.
  - When maintenance is off, `/maintenance` redirects back to `/`.
  - Matcher widened to all pages (excluding `/api`, `_next` assets and files with extensions). The previous route list is now `SESSION_GATED_PREFIXES` in code, so existing auth behaviour for those routes is unchanged and other routes (e.g. `/`) are untouched when maintenance is off.

## Notes
- `/api/*` is intentionally excluded so cron jobs and payment/upload webhooks keep working during maintenance.
- Static files (sw.js, manifest, images) are never redirected.
