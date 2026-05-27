// @vitest-environment node
//
// Real undici path: a tiny HTTP server in-process, no `fetch` global stub.
// Locks in the dispatcher-lifecycle invariant Greptile flagged on PR #1013 —
// closing the per-hop undici `Agent` must happen *after* `processResponse`
// drains the body, otherwise large bodies could be truncated mid-stream.
//
// Must run in the `node` environment, not jsdom (the default for this
// workspace). JSDOM ships its own `AbortSignal` class; undici's webidl
// converter does an `instanceof` check against Node's `AbortSignal`, and
// the mismatch makes the request fail with
// `RequestInit: Expected signal ("AbortSignal {}") to be an instance of AbortSignal`.
import { createServer, type Server } from 'http';
import type { AddressInfo } from 'net';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchResource } from '../feature';
import { lookupHostnameSafely } from '../feature/ip';
vi.mock('../feature/ip', async () => {
    const actual = await vi.importActual('../feature/ip');
    return {
        ...actual,
        lookupHostnameSafely: vi.fn(),
    };
});

let server: Server;
let port: number;
const LARGE_BODY_SIZE = 256 * 1024; // 256 KB — large enough to span many TCP frames
const LARGE_BODY = JSON.stringify({ payload: 'x'.repeat(LARGE_BODY_SIZE) });

beforeAll(async () => {
    server = createServer((req, res) => {
        if (req.url === '/large.json') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            // Write in many small chunks so the test would notice if the
            // dispatcher was torn down mid-stream.
            const chunkSize = 4096;
            let offset = 0;
            const send = () => {
                if (offset >= LARGE_BODY.length) {
                    res.end();
                    return;
                }
                const piece = LARGE_BODY.slice(offset, offset + chunkSize);
                offset += chunkSize;
                if (res.write(piece)) setImmediate(send);
                else res.once('drain', send);
            };
            send();
            return;
        }
        if (req.url === '/small.json') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ small: true }));
            return;
        }
        res.writeHead(404).end();
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    port = (server.address() as AddressInfo).port;
});

afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close(err => (err ? reject(err) : resolve())));
});

beforeEach(() => {
    // Stub only the validation decision: report 127.0.0.1 as public so the
    // private-IP guard is bypassed, and return a pinned lookup matching the
    // shape the production helper produces so undici can connect to loopback.
    vi.mocked(lookupHostnameSafely).mockReset();
    const addresses = [{ address: '127.0.0.1', family: 4 }];
    vi.mocked(lookupHostnameSafely).mockResolvedValue({
        addresses,
        kind: 'public',
        lookup: (_h, options, cb) => {
            // Undici calls lookup with `{ all: true }`; honour both shapes
            // so this mock matches the production helper.
            if (options.all) cb(null, addresses);
            else cb(null, addresses[0].address, addresses[0].family);
        },
    });
});

describe('fetchResource — real undici path', () => {
    it('should deliver a large streamed body in full (dispatcher closes after body drains)', async () => {
        const result = await fetchResource(
            `http://localhost.test:${port}/large.json`,
            new Headers({ 'User-Agent': 'test' }),
            5_000,
            LARGE_BODY_SIZE * 2,
        );

        // If `dispatcher.close()` ran before processResponse drained the
        // body, the parsed object would be truncated or invalid JSON.
        expect(result.data).toEqual({ payload: 'x'.repeat(LARGE_BODY_SIZE) });
    });

    it('should deliver a small body without issue', async () => {
        const result = await fetchResource(
            `http://localhost.test:${port}/small.json`,
            new Headers({ 'User-Agent': 'test' }),
            5_000,
            1_000_000,
        );

        expect(result.data).toEqual({ small: true });
    });
});
