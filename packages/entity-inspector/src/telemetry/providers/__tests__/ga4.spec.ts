import { afterEach, describe, expect, it, vi } from 'vitest';

import { createGa4Provider } from '../ga4.js';

const OPTIONS = { apiSecret: 'secret&value', measurementId: 'G-TEST123' };
const EVENT = { name: 'mcp_tool_call', params: { status: 'success', tool: 'ping' } };
const CONTEXT = { clientId: 'client-1' };

describe('createGa4Provider', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should post the event to the Measurement Protocol collect endpoint', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
        vi.stubGlobal('fetch', fetchMock);
        const provider = createGa4Provider(OPTIONS);

        await provider.send(EVENT, CONTEXT);

        expect(provider.name).toBe('ga4');
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(
            'https://www.google-analytics.com/mp/collect?api_secret=secret%26value&measurement_id=G-TEST123',
        );
        expect(init.method).toBe('POST');
        expect(init.headers).toEqual({ 'content-type': 'application/json' });
        expect(JSON.parse(init.body)).toEqual({
            client_id: 'client-1',
            events: [{ name: 'mcp_tool_call', params: { status: 'success', tool: 'ping' } }],
        });
    });

    it('should reject when the collect endpoint responds with a non-ok status', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
        const provider = createGa4Provider(OPTIONS);

        await expect(provider.send(EVENT, CONTEXT)).rejects.toThrow('GA4 collect responded with HTTP 403');
    });
});
