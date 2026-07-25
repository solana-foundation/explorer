import { createHash } from 'node:crypto';

// osec hashes the deployed executable with trailing zero-padding trimmed — must match to compare against on_chain_hash.
export function hashProgramData(dataBase64: string): string {
    const buffer = Buffer.from(dataBase64, 'base64');
    let truncatedBytes = 0;
    while (truncatedBytes < buffer.length && buffer[buffer.length - 1 - truncatedBytes] === 0) {
        truncatedBytes++;
    }
    const trimmed = buffer.subarray(0, buffer.length - truncatedBytes);
    return createHash('sha256').update(trimmed).digest('hex');
}
