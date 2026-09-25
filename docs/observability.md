# Observability

Explorer's request-level monitoring lives on the Solana Foundation Grafana Cloud stack,
[solanafoundation.grafana.net](https://solanafoundation.grafana.net), in the **Explorer** folder (uid `explorer`),
next to the Frontier and Portfolio folders other Foundation projects use. Sentry keeps stack traces and per-error
context; Loki keeps every Vercel request and function log line, which is what 5xx rates, top failing paths and
firewall actions are counted from.

## Data flow

```
Vercel (explorer, production) → /api/log-drain → Grafana Cloud Loki (logs-prod-042, tenant 1651405)
                                                     │
                            ┌────────────────────────┴────────────────────┐
                            ▼                                             ▼
                  Explorer — Overview dashboard             alert rules (folder explorer)
                                                                          │
                                                          notification_settings.receiver
                                                                          │
                                                                    explorer-slack
```

[`app/api/log-drain/route.ts`](../app/api/log-drain/route.ts) receives Vercel's log-drain NDJSON and pushes each
event to Loki as one JSON line, so dashboards and alerts can `| json` for `proxy_statusCode`, `proxy_path`,
`proxy_wafAction`, `requestId` and `message`. Streams are labelled `{service="explorer", env=<prd|preview|dev>,
source=<vercel source>, level=<info|warning|error|fatal>}`. `level` is Vercel's own severity, collapsed to those
four values so label cardinality stays bounded.

## Provisioned objects

Everything under [`observability/`](../observability/) is pushed by
[`grafana-push.yml`](../.github/workflows/grafana-push.yml) on merge to `master`, dashboards first, then contact
points, then alert rules.

| Object                                    | What it is                                                                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `dashboards/explorer-overview.json`       | Requests by status class, log lines by level and source, 5xx and error counts, firewall actions, top failing paths, recent errors |
| `alert-rules/explorer-5xx-responses.json` | More than 20 requests with a 5xx proxy status in 5m, for 5m. Counts responses, not log lines                                      |
| `alert-rules/explorer-server-errors.json` | error/fatal log lines above 0.1/s for 5m                                                                                          |
| `alert-rules/explorer-logs-absent.json`   | No production log lines for 30m, or the Loki query errors. Ships paused; unpause once the drain is verified                       |
| `contact-points/explorer-slack.json`      | The one receiver. Slack webhook from `SLACK_ALERT_WEBHOOK_URL`                                                                    |

The stack's notification-policy tree is shared with other Foundation projects and the provisioning API has no
compare-and-swap, so this repository never writes it. Every rule routes itself through
`notification_settings.receiver`, and the workflow refuses a rule without one. To page instead of post, add a
PagerDuty contact point file with the same `name` as the Slack one; Grafana treats same-named integrations as one
receiver.

## Secrets

Runtime (Vercel project environment, Production):

| Variable                  | Value                                                                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GRAFANA_LOKI_URL`        | `https://logs-prod-042.grafana.net`                                                                                                                                                                                 |
| `GRAFANA_LOKI_USER`       | `1651405`, the stack's Loki tenant                                                                                                                                                                                  |
| `GRAFANA_LOKI_TOKEN`      | Grafana Cloud access-policy token with scope `logs:write` on the `solanafoundation` stack (grafana.com → Security → Access Policies). A stack service-account token fails with `invalid authentication credentials` |
| `VERCEL_DRAIN_SECRET`     | `openssl rand -hex 32`; the drain sends it as `x-vercel-drain-secret`                                                                                                                                               |
| `VERCEL_LOG_DRAIN_VERIFY` | The team's fixed verification key, shown in the drain-creation error and in the integration settings                                                                                                                |

GitHub repository secrets, read by the workflow:

| Secret                    | Value                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `GRAFANA_API_TOKEN`       | Stack service-account token with Editor on the Explorer folder and alerting provisioning |
| `SLACK_ALERT_WEBHOOK_URL` | Incoming webhook for the channel that should receive Explorer alerts                     |

## Vercel log drain

Vercel Team → Log Drains → Add, or `POST /v1/log-drains` with the team id:

- **Delivery format:** NDJSON
- **Endpoint:** `https://explorer.solana.com/api/log-drain`
- **Custom header:** `x-vercel-drain-secret: <VERCEL_DRAIN_SECRET>`
- **Projects:** explorer. **Environments:** Production. **Sources:** static, lambda, edge

Vercel validates the endpoint by requesting it and expecting `x-vercel-verify` in the response, so
`VERCEL_LOG_DRAIN_VERIFY` must be deployed before the drain can be created. Bot Filter runs at `challenge` on this
project and Vercel's delivery requests are not browsers, so the `Bypass log drain endpoint` rule in
[`firewall.md`](firewall.md) must exist first as well.

## Verifying

Grafana → Explore → Logs, `{service="explorer"}`: lines appear within about 30 s of any production request.
`{service="explorer", level="error"}` is what `explorer-server-errors` counts, and
`{service="explorer"} | json | proxy_statusCode=~"5.."` is what `explorer-5xx-responses` counts. A push failure
from the route is reported to Sentry as `[log-drain] Loki push failed`.

## Adding an alert

Add a JSON file under `observability/alert-rules/` with a top-level `uid`, `folderUID: "explorer"`,
`noDataState: "OK"` for a spike detector (a selector that matches zero streams returns no data, which is a healthy
state for such a rule and pages falsely if set to `Alerting`), and `notification_settings.receiver` set to an
existing receiver. Merge to `master`.
