// Streams the response body and aborts as soon as the byte counter exceeds maxSize.
// Replaces node-fetch's non-standard `size` option for the native fetch API.
export async function readBodyWithLimit(response: Response, maxSize: number): Promise<ArrayBuffer> {
    if (!response.body) {
        return new ArrayBuffer(0);
    }
    const reader = response.body.getReader();
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
    const buffer = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return buffer.buffer;
}
