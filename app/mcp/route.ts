import { timingSafeEqual } from 'node:crypto';

import { isEnvEnabled } from '@utils/env';

import { Logger } from '@/app/shared/lib/logger';

import { getMcpRequestHandler } from './dependencies';

export const maxDuration = 60;

const CORS_HEADERS = {
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, mcp-session-id, mcp-protocol-version, Last-Event-ID',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': 'mcp-session-id, mcp-protocol-version',
};

// Both lists are deploy-time configuration — parsed once at module scope.
const blockedIps = parseCsvList(process.env.MCP_BLOCKED_IPS);
const accessKeys = parseCsvList(process.env.MCP_ACCESS_KEYS);

if (isEnvEnabled(process.env.MCP_ENDPOINT_ENABLED) && accessKeys.length === 0) {
    Logger.warn('[mcp] MCP_ACCESS_KEYS is unset — /mcp is enabled without authentication');
}

async function handleMcpRequest(request: Request): Promise<Response> {
    const clientIp = resolveClientIp(request);
    if (clientIp !== undefined && blockedIps.includes(clientIp)) {
        Logger.warn('[mcp] rejected request from blocked ip', { clientIp });
        return jsonError(403, 'Forbidden');
    }
    if (!isEnvEnabled(process.env.MCP_ENDPOINT_ENABLED)) {
        return jsonError(503, 'MCP endpoint is disabled');
    }
    if (!isAuthorized(request)) {
        return jsonError(401, 'Unauthorized');
    }
    try {
        const handler = await getMcpRequestHandler();
        return withCorsHeaders(await handler(request));
    } catch (error) {
        // Controlled, CORS-consistent 500 (Next's default 500 omits CORS); also reports to Sentry.
        Logger.error(error, { sentry: true });
        return jsonError(500, 'Internal error');
    }
}

export { handleMcpRequest as DELETE, handleMcpRequest as GET, handleMcpRequest as POST };

export function OPTIONS(): Response {
    return new Response(undefined, { headers: CORS_HEADERS, status: 204 });
}

function parseCsvList(value: string | undefined): string[] {
    return (value ?? '')
        .split(',')
        .map(entry => entry.trim())
        .filter(entry => entry.length > 0);
}

// On Vercel the first x-forwarded-for entry is the platform-set client IP.
function resolveClientIp(request: Request): string | undefined {
    const [firstEntry = ''] = (request.headers.get('x-forwarded-for') ?? '').split(',');
    const clientIp = firstEntry.trim();
    return clientIp.length > 0 ? clientIp : undefined;
}

// Unset MCP_ACCESS_KEYS deliberately means open access (see the module-scope warning above).
function isAuthorized(request: Request): boolean {
    if (accessKeys.length === 0) return true;
    const authorization = request.headers.get('authorization') ?? '';
    if (!authorization.startsWith('Bearer ')) return false;
    const presentedKey = authorization.slice('Bearer '.length);
    return accessKeys.some(key => isEqualConstantTime(key, presentedKey));
}

function isEqualConstantTime(expected: string, presented: string): boolean {
    const expectedBytes = Buffer.from(expected);
    const presentedBytes = Buffer.from(presented);
    return expectedBytes.length === presentedBytes.length && timingSafeEqual(expectedBytes, presentedBytes);
}

function jsonError(status: number, error: string): Response {
    return Response.json({ error }, { headers: CORS_HEADERS, status });
}

function withCorsHeaders(response: Response): Response {
    const headers = new Headers(response.headers);
    Object.entries(CORS_HEADERS).forEach(([name, value]) => headers.set(name, value));
    return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
}
