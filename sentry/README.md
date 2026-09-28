# Sentry configuration

Sampling and DSNs resolve in `lib/config.mjs`; every env var below is read through `lib/env.mjs`. Env changes only
apply on the next deployment (`NEXT_PUBLIC_*` values are additionally inlined at build), so every action below ends
with a redeploy.

## Variables and their defaults

| Variable                                        | Unset (the default)                                          | Set to `v`                                                 |
| ----------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN`                        | Browser reporting off                                        | Browser reports here; server/edge fall back to it           |
| `SENTRY_DSN`                                    | Server/edge fall back to the public var, else off            | Server/edge report here                                     |
| `NEXT_PUBLIC_TELEMETRY_VITALS_SAMPLE_RATE`      | Vitals off — the browser sends no traces                     | Pageload/navigation sampled at `0.001 × v`, `v` in (0, 1]  |
| `TELEMETRY_TRACE_SAMPLE_RATE_SERVER`            | Server trace baseline 1e-5 unchanged                         | Server — and edge, unless the EDGE var is set — at `1e-5 × v`; `0` mutes |
| `TELEMETRY_TRACE_SAMPLE_RATE_EDGE`              | Edge follows the SERVER var                                  | Edge-only override; `0` mutes edge alone                    |

Unparsable or negative values read as unset; values above 1 clamp to 1. The multipliers only lower the code-owned
baselines — they can never raise them.

## Under a flood

Identify the flood in Sentry → Stats first: errors or transactions, and which runtime tag. Then set the matching
variable in Vercel and redeploy. Rollback at any point: restore the previous value and redeploy again.

| Flood                        | Set                                                        | Effect                                                    |
| ---------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| Server overloaded by spans   | `TELEMETRY_TRACE_SAMPLE_RATE_SERVER=0.1`                    | Server and edge traces cut 10× (1e-5 → 1e-6)               |
| …still flooding              | `TELEMETRY_TRACE_SAMPLE_RATE_SERVER=0`                      | Server and edge traces stop entirely                       |
| Edge alone floods            | `TELEMETRY_TRACE_SAMPLE_RATE_EDGE=0`                        | Edge traces stop; server keeps its rate                    |
| Vitals transactions flood    | `NEXT_PUBLIC_TELEMETRY_VITALS_SAMPLE_RATE=0.1`              | Pageload rate 0.001 → 1e-4; unset the var to switch vitals off |
| Browser errors flood         | Unset `NEXT_PUBLIC_SENTRY_DSN`                              | Browser reporting stops; server/edge keep `SENTRY_DSN`     |
| Server/edge errors flood     | Unset `SENTRY_DSN` **and** `NEXT_PUBLIC_SENTRY_DSN`         | All reporting stops — the server falls back to the public var, so both must go |

## Where the rates live

Code-owned baselines sit in `lib/config.mjs`: `ERROR_SAMPLE_RATES` (error events, every runtime) and
`TRACE_SAMPLE_RATES` (traces, server and edge only), each with a `TODO(rollout)` ladder describing the next steps.
Client traces come only from the vitals gate; its ceiling is `VITALS_TRACE_SAMPLE_RATE` in `lib/vitals.mjs`.
