# Proposal: Drain Vercel logs to Grafana Cloud and alert from Loki

## Context

Explorer had error tracking (Sentry) and no request-level monitoring. Nothing counted 5xx responses, nothing recorded which paths failed, nothing showed what the firewall was blocking, and no alert fired when the site returned errors. Vercel's dashboard shows these figures but keeps them inside Vercel, with no alert routing and no history beyond the plan's retention.

## Why

Three options were considered.

**Vercel Observability Plus.** Already in the product, and the external team can see it. Priced per project on top of the plan, and its alerts route only to Vercel's own notification channels. The Foundation's other projects (Frontier, Portfolio, Microscope, Breeze) already alert from one Grafana Cloud stack, so a second alerting system for one project is a second place to look during an incident.

**Sentry only.** Sentry sees exceptions the code throws. A 5xx that Next.js renders without an exception, a 429 the firewall answered, or a route that stopped receiving traffic never reach it. It stays for what it does well: stack traces and per-error context.

**A log drain into Grafana Cloud Loki.** Chosen. Vercel already emits every request and function log as NDJSON to a log drain. One route in this repository forwards them to the Loki tenant the other Foundation projects use, so the same stack holds the dashboard, the alert rules and the routing to Slack. Frontier (`trading-solana-com`) runs this shape in production; the route, workflow and rule files here are that pattern with Explorer's names, which is why the alert thresholds start where Frontier's did rather than being tuned from Explorer traffic.

Two choices inside the chosen option:

- Rules route themselves through `notification_settings.receiver` and never touch the stack's notification-policy tree. The tree is shared with other teams and the provisioning API has no compare-and-swap, so a push from this repository could overwrite another team's routing.
- Spike detectors (`5xx-responses`, `server-errors`) treat no-data as healthy. A Loki selector on `level=~"error|fatal"` that matches zero streams returns an empty result, which Grafana reports as NoData; with `noDataState: Alerting` such a rule pages precisely when there are no errors. Only `logs-absent` alerts on no-data and on query errors, because for that rule silence is the failure.

## What Changes

- `app/api/log-drain/route.ts`: authenticates Vercel with `x-vercel-drain-secret`, answers every response with the team's `x-vercel-verify` key, groups events into one Loki stream per `(source, level)` and pushes them as JSON lines. A failed push is reported to Sentry, the one channel left when the drain is broken.
- `observability/`: one dashboard, three alert rules, one Slack contact point, as Grafana provisioning JSON.
- `.github/workflows/grafana-push.yml`: pushes `observability/` to the `explorer` folder on merge to `master`.
- `docs/observability.md`: data flow, secrets, drain setup, verification. `docs/firewall.md`: a twelfth rule, because Bot Filter at `challenge` would otherwise answer Vercel's delivery requests with 429.

## Impact

- One new API route with no client JS; `bench/BUILD.md` gains a row.
- Five runtime environment variables and two GitHub secrets, listed in `docs/observability.md`. Until they exist the route answers 502 on delivery and the workflow fails on push; nothing else in the site depends on either.
- The Vercel drain and the firewall rule are dashboard configuration, not code, and are created after this merges.
- Accepted: alert thresholds are inherited from Frontier and will need tuning against Explorer's traffic; the `logs-absent` rule ships paused for that reason and is unpaused once the drain is verified.
