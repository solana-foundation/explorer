export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
    const totalLen = arrays.reduce((sum, a) => sum + a.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const a of arrays) {
        result.set(a, offset);
        offset += a.length;
    }
    return result;
}

export function writeU64LE(value: bigint): Uint8Array {
    const buf = new Uint8Array(8);
    const view = new DataView(buf.buffer);
    view.setBigUint64(0, value, true);
    return buf;
}

export function readU64LE(data: Uint8Array, offset: number): bigint {
    if (offset + 8 > data.length)
        throw new RangeError(`readU64LE: offset ${offset} out of bounds (length ${data.length})`);
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    return view.getBigUint64(offset, true);
}

export function readU8(data: Uint8Array, offset: number): number {
    if (offset >= data.length) throw new RangeError(`readU8: offset ${offset} out of bounds (length ${data.length})`);
    return data[offset];
}
