import { Readable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { readBodyWithLimit } from '../feature/read-body-with-limit';

function streamFromChunks(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
        start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(chunk);
            }
            controller.close();
        },
    });
}

// Wraps a Node `Readable` as a `Response`-shaped object so the Node-Readable
// branch of `readBodyWithLimit` is exercisable in tests. The real `Response`
// constructor would coerce the stream into a Web `ReadableStream`, masking
// the divergent shape Next.js dev produces for gzip-encoded upstreams.
function nodeStreamResponse(body: Readable): Response {
    return { body } as unknown as Response;
}

describe('readBodyWithLimit', () => {
    it('should return empty buffer when body is null', async () => {
        const result = await readBodyWithLimit(new Response(null), 100);
        expect(result.byteLength).toBe(0);
    });

    it('should concatenate streamed chunks in order', async () => {
        const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5]), new Uint8Array([6])];
        const result = await readBodyWithLimit(new Response(streamFromChunks(chunks)), 100);

        expect(new Uint8Array(result)).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
    });

    it('should throw when accumulated bytes exceed limit even without Content-Length', async () => {
        // Chunked stream where each chunk fits but the total exceeds the limit.
        // No Content-Length is set, so only the streaming counter can catch this.
        const chunks = [new Uint8Array(40), new Uint8Array(40), new Uint8Array(40)];

        await expect(readBodyWithLimit(new Response(streamFromChunks(chunks)), 100)).rejects.toThrow(
            'content size over limit: 100',
        );
    });

    it('should cancel the underlying stream when limit is exceeded', async () => {
        let cancelled = false;
        // Stream is left open (no controller.close) so cancellation is observable —
        // an already-closed stream short-circuits the cancel callback.
        const stream = new ReadableStream<Uint8Array>({
            cancel() {
                cancelled = true;
            },
            start(controller) {
                controller.enqueue(new Uint8Array(60));
                controller.enqueue(new Uint8Array(60));
            },
        });

        await expect(readBodyWithLimit(new Response(stream), 100)).rejects.toThrow('content size over limit: 100');
        expect(cancelled).toBe(true);
    });

    it('should accept payload exactly at the limit', async () => {
        const chunk = new Uint8Array(100);
        const result = await readBodyWithLimit(new Response(streamFromChunks([chunk])), 100);

        expect(result.byteLength).toBe(100);
    });

    // Next.js dev surfaces gzip-decoded upstreams as a raw Node `Readable`
    // (zlib.Gunzip) instead of a Web `ReadableStream`. These tests pin the
    // fallback path so a regression would show up at the unit level rather
    // than only surfacing against a live gzip upstream in the dev server.
    describe('Node Readable body (Next.js dev with gzip upstream)', () => {
        it('should concatenate streamed chunks in order', async () => {
            const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5]), new Uint8Array([6])];
            const result = await readBodyWithLimit(nodeStreamResponse(Readable.from(chunks)), 100);

            expect(new Uint8Array(result)).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
        });

        it('should throw when accumulated bytes exceed limit', async () => {
            const chunks = [new Uint8Array(40), new Uint8Array(40), new Uint8Array(40)];

            await expect(readBodyWithLimit(nodeStreamResponse(Readable.from(chunks)), 100)).rejects.toThrow(
                'content size over limit: 100',
            );
        });

        it('should destroy the underlying stream when limit is exceeded', async () => {
            const stream = Readable.from([new Uint8Array(60), new Uint8Array(60)]);

            await expect(readBodyWithLimit(nodeStreamResponse(stream), 100)).rejects.toThrow(
                'content size over limit: 100',
            );
            expect(stream.destroyed).toBe(true);
        });

        it('should accept payload exactly at the limit', async () => {
            const stream = Readable.from([new Uint8Array(100)]);
            const result = await readBodyWithLimit(nodeStreamResponse(stream), 100);

            expect(result.byteLength).toBe(100);
        });
    });
});
