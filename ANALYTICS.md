# Homepage analytics setup and verification

## Database activation (required)
Run `supabase/migrations/20260906_homepage_analytics.sql` in the project's Supabase SQL Editor. It adds an optional JSON context column and date index. Existing records and policies are unchanged. The app's service role key cannot execute DDL through the REST API.

Until applied, the endpoint attempts to store the existing basic event shape, returns 503, and retains detailed events in the browser queue for retry. Do not consider detailed analytics live until a real write/read check passes. Pending events expire after 24 hours and the queue caps at 200. Browser storage restrictions, blocked requests and abrupt exits can still cause loss.

## Server configuration
Existing `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` are required on the deployment server. Set `ANALYTICS_ADMIN_EMAIL` to the administrator email, or use the existing `NEXT_PUBLIC_ADMIN_EMAIL`. The dashboard API validates the Supabase access token on the server and compares the verified email. The service key stays server-side.

Dashboard: `/admin/analytics`. Sign in with the configured administrator account first. Anonymous requests receive 403. No Meta code or assessment/auth/checkout logic was changed.

## Test traffic
Visit `https://mindmirror3d.com/?internal=1` on each browser/device to mark future events internal. The localStorage key `mindmirror_internal_user` stores `1` across sessions. Visit `https://mindmirror3d.com/?internal=0` to set it to `0`. This does not change browser/session IDs, visit IDs or event deduplication. Existing queued and historical events retain their original labels. Storage is origin-specific; clearing browser storage or using another browser requires activation again. When storage is blocked the flag can only survive in memory for the current page.

All events sent by `trackFunnelEvent`, including its legacy direct database path, store a boolean in `context.internal`. Internal events remain recorded. The homepage report excludes them by default; enable **Include test traffic** to inspect them. Old `?analytics_test=1/0` links still work, and existing `mm_internal=1` flags migrate automatically. When both URL parameters appear, `internal` takes priority. Development-server visits remain internal as before.

### Verify your browser in Supabase
1. Activate the link above, then interact with the homepage and wait at least five seconds.
2. In that browser's developer console, run `localStorage.getItem('mindmirror_internal_user')` (expect `"1"`) and `localStorage.getItem('mm_session_id')`. Copy the latter browser ID.
3. In Supabase SQL Editor, replace the placeholder below with that ID and run:

```sql
select created_at, event_name, page_path, context->>'internal' as internal
from public.funnel_events
where session_id::text = 'PASTE_BROWSER_ID_HERE'
order by created_at desc
limit 30;
```

New rows should show `true`. After visiting `/?internal=0`, new rows should show `false`; older rows are unchanged. The JSON lives in the existing `context` column, so no database migration is needed. Run `node tests/internal-user.cjs` for persistence, clearing, compatibility and transport coverage.

Add campaign parameters to ad links: utm_source, utm_medium, utm_campaign, utm_content and utm_term. These are copied at the beginning of a visit and capped at 120 characters each. Do not put personal information in campaign tags. Full URLs, assessment answers, personal results, emails, and auth IDs are not sent by the new marketing event pipeline.

## Measurement definitions
- Version `homepage-v2.1` identifies this page order and tracking release; change it in the client and server allowlist for the next experiment.
- Browser ID retains the original `mm_session_id`. A separate visit ID expires after 30 minutes without a recorded event. Same-origin navigation preserves it; different devices/browsers are not linked.
- Existing elapsed 10/30-second events retain their original meaning. `homepage_active_time` is a separate visible-tab milestone at 10/30/60/120 seconds accumulated within the same tab and visit (including reloads when session storage is available). It is not proof of attention. Separate tabs do not share the active-time counter.
- Section reach: at least half of the section heading enters the viewport. Card view: at least half the card enters the viewport. Neither proves reading.
- Booklet page views: at least 10% of the page enters the viewport (supports enlarged, pannable pages). A blank printed inside cover is omitted. Preview page numbers are 1–15, not printed PDF numbers.
- Video milestones use played ranges rather than seek position. Completion requires roughly the whole video to have played. Start/resume events can repeat; report deduplicates per visit.
- Main metric: unique visits with both an active-10-second milestone and a preview click / unique visits with an active-10-second milestone. The events may occur in either order. Also report all-visit clicks and profile arrivals.
- Dashboard includes only visits with a homepage view in the selected time window. A visit crossing the beginning of the window may be omitted. It caps at 50,000 events and explicitly warns when truncated. All comparisons are observational, not causal A/B results.

## Verification
`node tests/analytics.cjs` checks validation, sensitive-field exclusion and unique-visit calculations.

In a test browser: visit with synthetic UTM tags, stay 10 seconds with tab visible, click a symbol, turn/enlarge booklet pages, watch video, then click a preview button. Check a single journey click and profile arrival under the same visit ID. Check the same event UUID appears only once after retry. Include test traffic in the dashboard for verification.

`npm run build` now passes with lint enabled after repairing the existing configuration syntax and JSX lint errors. Image-optimization and pre-existing hook warnings remain non-blocking.

## Deployment
Apply the additive migration first, confirm server environment variables, deploy a private staging preview, verify persisted test events and administrator-only reporting, then publish after review. Historical events lack context and are not backfilled or mixed into the V2 dashboard. Rollback the application if necessary; leaving the optional column in place is safe.
