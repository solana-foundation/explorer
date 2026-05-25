import { Readable } from 'node:stream';

// Streams the response body and aborts as soon as the byte counter exceeds maxSize.
// Replaces node-fetch's non-standard `size` option for the native fetch API.
//
// The standard `Response.body` is a Web `ReadableStream`, but Next.js dev
// surfaces gzip-encoded upstreams as the raw Node `Readable` (a `zlib.Gunzip`
// stream). Branch on the runtime shape and use each stream's native API so
// the call sites stay properly typed.
export async function readBodyWithLimit(response: Response, maxSize: number): Promise<ArrayBuffer> {
    const body: unknown = response.body;
    if (!body) {
        return new ArrayBuffer(0);
    }
    if (body instanceof ReadableStream) {
        return collectFromReader(body, maxSize);
    }
    if (body instanceof Readable) {
        return collectFromNodeStream(body, maxSize);
    }
    throw new Error('Unsupported response body shape');
}

async function collectFromReader(body: ReadableStream<Uint8Array>, maxSize: number): Promise<ArrayBuffer> {
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > maxSize) {
            await reader.cancel();
            throw new Error(`content size over limit: ${maxSize}`);
        }
        chunks.push(value);
    }
    return concat(chunks, received);
}

async function collectFromNodeStream(body: Readable, maxSize: number): Promise<ArrayBuffer> {
    const chunks: Uint8Array[] = [];
    let received = 0;
    for await (const chunk of body) {
        // `Readable` is typed as `any`; guard against string chunks (object-mode
        // or `setEncoding`-configured streams). `chunk.byteLength` would be
        // `undefined` there, `received` would become `NaN`, and `NaN > maxSize`
        // would silently bypass the size limit. `Buffer` extends `Uint8Array`,
        // so the zlib.Gunzip happy path is unaffected.
        if (!(chunk instanceof Uint8Array)) {
            body.destroy();
            throw new Error('Expected binary chunk in response body');
        }
        received += chunk.byteLength;
        if (received > maxSize) {
            body.destroy();
            throw new Error(`content size over limit: ${maxSize}`);
        }
        chunks.push(chunk);
    }
    return concat(chunks, received);
}

function concat(chunks: Uint8Array[], total: number): ArrayBuffer {
    const buffer = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return buffer.buffer;
}
