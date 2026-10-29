# Sentry configuration

Sampling and DSNs resolve in `lib/config.mjs`; every env var below is read through `lib/env.mjs`. Env changes only
apply on the next deployment (`NEXT_PUBLIC_*` values are additionally inlined at build), so every action below ends
with a redeploy.

## Variables and their defaults

| Variable | Unset (the default) | Set to `v` |
| ------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser reporting off | Browser reports here; server/edge fall back to it |
| `SENTRY_DSN` | Server/edge fall back to the public var, else off | Server/edge report here |
| `NEXT_PUBLIC_SENTRY_CLIENT_ERRORS` | Browser error events off | `true` lets browser error events send, still sampled at `ERROR_SAMPLE_RATES.client`; any other value turns them off |
| `NEXT_PUBLIC_TELEMETRY_VITALS_SAMPLE_RATE` | Vitals off: the browser sends no traces | Pageload/navigation sampled at `VITALS_TRACE_SAMPLE_RATE × v`, `v` in (0, 1] |
| `TELEMETRY_TRACE_SAMPLE_RATE_SERVER` | Server and edge traces sample at `TRACE_SAMPLE_RATES` | Server, and edge unless the EDGE var is set, at `TRACE_SAMPLE_RATES × v`; `0` mutes |
| `TELEMETRY_TRACE_SAMPLE_RATE_EDGE` | Edge follows the SERVER var | Edge-only override; `0` mutes edge alone |

Unparsable or negative values read as unset; values above 1 clamp to 1. The multipliers only lower the code-owned
baselines and can never raise them.

## When event volume spikes

Identify the spike in Sentry → Stats first: errors or transactions, and which runtime tag. Then set the matching
variable in Vercel and redeploy. To roll back, restore the previous value and redeploy again.

| Spike | Set | Effect |
| ------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Server spans | `TELEMETRY_TRACE_SAMPLE_RATE_SERVER=0.1` | Server and edge traces cut 10× |
| Server spans, still high | `TELEMETRY_TRACE_SAMPLE_RATE_SERVER=0` | Server and edge traces stop entirely |
| Edge spans alone | `TELEMETRY_TRACE_SAMPLE_RATE_EDGE=0` | Edge traces stop; server keeps its rate |
| Vitals transactions | `NEXT_PUBLIC_TELEMETRY_VITALS_SAMPLE_RATE=0.1` | Pageload rate cut 10×; unset the var to switch vitals off |
| Browser errors | `NEXT_PUBLIC_SENTRY_CLIENT_ERRORS=false` | Browser error events stop; server/edge reporting continues |
| Server/edge errors | Unset `SENTRY_DSN` **and** `NEXT_PUBLIC_SENTRY_DSN` | All reporting stops; the server falls back to the public var, so both must go |

## Where the rates live

Code-owned baselines sit in `lib/config.mjs`: `ERROR_SAMPLE_RATES` (error events, every runtime) and
`TRACE_SAMPLE_RATES` (traces, server and edge only, both set from `SERVER_TRACE_SAMPLE_RATE`), each with a comment
stating the step for raising it. `NEXT_PUBLIC_SENTRY_CLIENT_ERRORS` is an off switch, not a volume control: raising
browser error volume means raising `ERROR_SAMPLE_RATES.client`.
Client traces come only from the vitals gate; its ceiling is `VITALS_TRACE_SAMPLE_RATE` in `lib/vitals.mjs`.
