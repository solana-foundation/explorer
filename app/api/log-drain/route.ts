import { NextResponse } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';

// Receives Vercel's log-drain NDJSON and forwards every event to Grafana Cloud Loki as one JSON line, so
// dashboards and alert rules can `| json` for proxy_statusCode, path, requestId and message. Streams are
// labelled {service, env, source, level}; see docs/observability.md.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const SERVICE = 'explorer';

// Vercel's own severity values. Anything else collapses to `info` so the `level` label stays bounded.
const LEVELS = new Set(['info', 'warning', 'error', 'fatal']);

const PUSH_TIMEOUT_MS = 10_000;

type LokiStream = {
    stream: Record<string, string>;
    values: [string, string][];
};

export async function POST(request: Request) {
    const headers = verifyHeaders();
    const drainSecret = process.env.VERCEL_DRAIN_SECRET;
    if (!drainSecret) {
        return new NextResponse('server misconfigured', { headers, status: 500 });
    }
    if (request.headers.get('x-vercel-drain-secret') !== drainSecret) {
        return new NextResponse('forbidden', { headers, status: 403 });
    }

    const body = await request.text();
    if (!body.trim()) {
        return new NextResponse(undefined, { headers, status: 204 });
    }

    const streams = toLokiStreams(body);
    const ok = await pushToLoki(streams);
    return new NextResponse(undefined, { headers, status: ok ? 204 : 502 });
}

export function GET() {
    return NextResponse.json({ ok: true, service: SERVICE }, { headers: verifyHeaders() });
}

// Vercel validates a drain URL by requesting it and expecting the team's fixed key in `x-vercel-verify`.
// The key is not echoed from the request, so every response carries it.
function verifyHeaders(): Record<string, string> {
    const key = process.env.VERCEL_LOG_DRAIN_VERIFY;
    return key ? { 'x-vercel-verify': key } : {};
}

function envLabel() {
    const vercelEnv = process.env.VERCEL_ENV;
    return vercelEnv === 'production' ? 'prd' : (vercelEnv ?? 'dev');
}

function levelOf(evt: Record<string, unknown>) {
    const level = typeof evt.level === 'string' ? evt.level.toLowerCase() : 'info';
    return LEVELS.has(level) ? level : 'info';
}

function tsNs(ms: number) {
    return `${Math.floor(Number.isFinite(ms) ? ms : Date.now())}000000`;
}

// One Loki stream per (source, level) pair; the whole event stays the line so nothing is lost to a schema.
function toLokiStreams(body: string): LokiStream[] {
    const env = envLabel();
    const byStream = new Map<string, [string, string][]>();
    for (const line of body.split('\n')) {
        if (!line.trim()) {
            continue;
        }
        let evt: Record<string, unknown>;
        try {
            evt = JSON.parse(line);
        } catch {
            continue;
        }
        const tsMs = Number(evt.timestamp ?? evt.timestampInMs ?? Date.now());
        const source = typeof evt.source === 'string' ? evt.source : 'unknown';
        const key = `${source}|${levelOf(evt)}`;
        const bucket = byStream.get(key) ?? [];
        bucket.push([tsNs(tsMs), line]);
        byStream.set(key, bucket);
    }
    return Array.from(byStream.entries()).map(([key, values]) => {
        const [source, level] = key.split('|');
        return { stream: { env, level, service: SERVICE, source }, values };
    });
}

async function pushToLoki(streams: LokiStream[]) {
    const base = process.env.GRAFANA_LOKI_URL;
    const user = process.env.GRAFANA_LOKI_USER;
    const token = process.env.GRAFANA_LOKI_TOKEN;
    if (!base || !user || !token) {
        Logger.error(new Error('[log-drain] GRAFANA_LOKI_URL, GRAFANA_LOKI_USER or GRAFANA_LOKI_TOKEN unset'), {
            sentry: true,
        });
        return false;
    }
    if (streams.every(s => s.values.length === 0)) {
        return true;
    }
    const origin = base.endsWith('/') ? base.slice(0, -1) : base;
    let response: Response;
    try {
        response = await fetch(`${origin}/loki/api/v1/push`, {
            body: JSON.stringify({ streams }),
            headers: {
                Authorization: `Basic ${Buffer.from(`${user}:${token}`).toString('base64')}`,
                'Content-Type': 'application/json',
            },
            method: 'POST',
            // A stalled Loki connection would otherwise hold the delivery until the function itself times out.
            signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
        });
    } catch (error) {
        Logger.error(new Error('[log-drain] Loki push failed: transport', { cause: error }), { sentry: true });
        return false;
    }
    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        // Sentry is the only channel left when the drain itself is broken: every log-based alert is blind.
        Logger.error(new Error(`[log-drain] Loki push failed: ${response.status}`), {
            detail: detail.slice(0, 300),
            sentry: true,
        });
        return false;
    }
    return true;
}
