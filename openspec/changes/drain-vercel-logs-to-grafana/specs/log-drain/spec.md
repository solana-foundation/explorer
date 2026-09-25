# log-drain

## Purpose

Forwarding Vercel's production request and function logs to Grafana Cloud Loki, where the Explorer dashboard and alert rules read them.

## ADDED Requirements

### Requirement: Only Vercel's drain can write

`POST /api/log-drain` SHALL accept a body only when `x-vercel-drain-secret` equals `VERCEL_DRAIN_SECRET`, and MUST answer `403` otherwise. The endpoint is exempt from Bot Filter, so the secret is the only thing between the public internet and the Loki tenant.

#### Scenario: A request without the secret

- **WHEN** the header is missing or differs from the configured value
- **THEN** the route MUST answer `403` and MUST NOT contact Loki

#### Scenario: The secret is not configured

- **WHEN** `VERCEL_DRAIN_SECRET` is unset
- **THEN** the route MUST answer `500` and MUST NOT contact Loki, so a misconfigured deployment cannot become an open write path

### Requirement: Every response carries the verification key

Every response from the route, whatever its status, SHALL include `x-vercel-verify` set to `VERCEL_LOG_DRAIN_VERIFY`. Vercel validates a drain by requesting the URL and reading that header; a route that only sent it on success could never be registered.

#### Scenario: Validation request

- **WHEN** Vercel requests the route with `GET`, or with `POST` and no secret
- **THEN** the response MUST carry the key

### Requirement: One event, one line, bounded labels

Each NDJSON event SHALL be pushed to Loki as one JSON line in a stream labelled `service="explorer"`, `env`, `source` and `level`, where `level` MUST be one of `info`, `warning`, `error`, `fatal`. Any other severity collapses to `info`. Malformed lines are skipped rather than failing the batch.

#### Scenario: A batch with mixed sources and levels

- **WHEN** a body carries events from several sources at several levels
- **THEN** the push MUST contain one stream per distinct `(source, level)` pair with every event of that pair in it

#### Scenario: A line that is not JSON

- **WHEN** a line does not parse
- **THEN** it MUST be dropped and the rest of the batch MUST still be pushed

### Requirement: A failed push is visible somewhere

When Loki refuses the push or its credentials are unset, the route SHALL answer `502` and MUST report the failure to Sentry. Every log-based alert is blind while the drain is broken, so the drain cannot rely on logs to report its own failure.

#### Scenario: Loki rejects the credentials

- **WHEN** the push returns a non-2xx status
- **THEN** the route MUST answer `502` and an error MUST reach Sentry
