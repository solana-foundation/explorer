import { createHash } from 'node:crypto';

import type { EntityInspectorConfig } from '@explorer/entity-inspector';
import { createGa4Provider } from '@explorer/entity-inspector/telemetry/providers/ga4';
import { createTelemetry, type Telemetry } from '@explorer/entity-inspector/telemetry/server';
import { headers } from 'next/headers';
import { after } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';

function buildTelemetry(): Telemetry {
    // Prefer a dedicated server id; the NEXT_PUBLIC_ fallback keeps single-id setups working, but server telemetry shouldn't depend on a client var.
    const measurementId = process.env.MCP_GA_MEASUREMENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
    const apiSecret = process.env.MCP_GA_API_SECRET;
    // Missing GA credentials → empty provider list → telemetry is a no-op, call sites stay unconditional.
    const providers = measurementId && apiSecret ? [createGa4Provider({ apiSecret, measurementId })] : [];
    if (providers.length === 0) {
        // Once per cold start (same pattern as the MCP_ACCESS_KEYS warning in route.ts) — a silently
        // disabled pipeline is otherwise indistinguishable from a broken one.
        Logger.warn(
            '[mcp] MCP_GA_MEASUREMENT_ID (or NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) or MCP_GA_API_SECRET unset — usage analytics disabled',
        );
    }
    return createTelemetry(providers, {
        logger: {
            debug: (message, context) => Logger.debug(message, context),
            error: (message, context) => Logger.error(new Error(message), context),
            info: (message, context) => Logger.info(message, context),
            warn: (message, context) => Logger.warn(message, context),
        },
    });
}

const pseudonymize = (value: string) => createHash('sha256').update(value).digest('hex');

// GA4 needs a stable-ish client_id: the MCP session when present, else the IP — both hashed so no
// caller-supplied identifier (session token or raw IP) ever leaves verbatim to Google Analytics.
// The prefix keeps the provenance readable: only an `ip_` value can be matched back to an address (hash a
// suspect IP and compare) and therefore blocked; a `sid_` value says nothing about where the caller is.
async function resolveClientId(): Promise<string> {
    const requestHeaders = await headers();
    const sessionId = requestHeaders.get('mcp-session-id');
    if (sessionId) return `sid_${pseudonymize(sessionId)}`;
    const [firstEntry = ''] = (requestHeaders.get('x-forwarded-for') ?? '').split(',');
    const clientIp = firstEntry.trim();
    if (clientIp.length === 0) return 'anon';
    return `ip_${pseudonymize(clientIp)}`;
}

/** Usage-event sink for `EntityInspectorConfig.track` — sends after the response via `after()`. */
export function createMcpTrack(): NonNullable<EntityInspectorConfig['track']> {
    const telemetry = buildTelemetry();
    return event => {
        after(async () => {
            try {
                // Awaited so the serverless runtime keeps the function alive until delivery settles.
                await telemetry.track(event, { clientId: await resolveClientId() });
            } catch (error) {
                Logger.debug('[mcp] telemetry emission failed', { error });
            }
        });
    };
}
