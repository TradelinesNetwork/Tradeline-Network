# Lovable disconnect — remaining manual steps

The code-level Lovable dependencies have been removed:

- Deleted `src/integrations/lovable/` (the `@lovable.dev/cloud-auth-js` OAuth
  broker) — it was unused; your Google sign-in already calls Supabase's
  `signInWithOAuth` directly in `public/account.html`.
- Removed `@lovable.dev/cloud-auth-js` and `@lovable.dev/vite-tanstack-config`
  from `package.json`.
- Rewrote `vite.config.ts` to use the underlying Vite/TanStack/Nitro plugins
  directly instead of Lovable's wrapper. **Test this locally with `npm install`
  then `npm run dev` / `npm run build` before deploying** — this is the
  highest-risk change. The old config is saved as `vite.config.ts.lovable-backup`
  if you need to compare or roll back.
- Replaced `src/lib/lovable-error-reporting.ts` with `src/lib/error-reporting.ts`
  (now just logs to the console instead of forwarding to Lovable's dashboard).
- Removed `src/integrations/supabase/previewAuthStorage.ts` and the Lovable
  preview-session-broker logic in `client.ts` (it only mattered on Lovable's
  own preview URLs; on your real domain it already fell back to plain
  `localStorage`, which is now just the default).
- Renamed the cron guard's env vars from `LOVABLE_CRON_SECRET` /
  `LOVABLE_CRON_SECRET_PREVIOUS` to `CRON_SECRET` / `CRON_SECRET_PREVIOUS` in
  `src/integrations/supabase/cron-auth.ts` (currently unused by any route —
  wire it up if/when you add a scheduled job, e.g. via Vercel Cron).
- Deleted `.lovable/project.json` (editor metadata, not needed).
- Fixed leftover error-message text and a hardcoded `*.lovable.app` fallback
  URL in `src/lib/email.server.ts`.

## Still to do once your new Supabase project exists

These reference your **current** (Lovable-managed) Supabase project and need
to be updated to your new project's values once you've migrated the backend:

- [ ] `.env` — update `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
      `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and add
      `SUPABASE_SERVICE_ROLE_KEY` (used by `client.server.ts` /
      `order-client.server.ts`) with your new project's values.
- [ ] `public/assets/js/tlm-auth.js` — this static file has the Supabase URL
      and publishable key **hardcoded** at the top (it can't read `.env` since
      it's plain HTML/JS, not built by Vite). Update the two constants there
      to match your new project.
- [ ] Update the same environment variables in **Vercel → Project Settings →
      Environment Variables**, then redeploy.
- [ ] Recreate Auth settings in the new Supabase project's dashboard: sign-in
      methods (Email, Google), Custom SMTP (Resend), Site URL / Redirect URLs.
- [ ] `npm install` locally to drop the two removed Lovable packages from
      `node_modules` and refresh `package-lock.json`/`bun.lock`, then re-test
      the full build.
