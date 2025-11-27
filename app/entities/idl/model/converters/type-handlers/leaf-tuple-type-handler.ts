import { assert, coerce, define, literal, object, string, tuple } from 'superstruct';

type Primitive = 'u8';
type AnchorType = Primitive | { array: [Primitive, number] } | { tuple: [Primitive, { array: [Primitive, number] }] };

const U8 = literal('u8');
const NonNegInt = define<number>('NonNegInt', (v: unknown) => Number.isInteger(v) && (v as number) >= 0);

const ArrayOfU8 = object({
    array: tuple([U8, NonNegInt]),
});

const TupleU8_ArrayU8 = object({
    tuple: tuple([U8, ArrayOfU8]),
});

function parseTupleU8ArrayString(input: string): AnchorType {
    const s = input.trim();
    if (!s.startsWith('(') || !s.endsWith(')')) {
        throw new Error(`Expected tuple like "(u8,[u8;N])": got "${input}"`);
    }
    const inner = s.slice(1, -1).trim(); // "u8,[u8;32]"
    const [leftRaw, rightRaw, ...rest] = inner.split(',').map(p => p.trim());
    if (rest.length) throw new Error(`Too many tuple items: "${inner}"`);
    if (leftRaw !== 'u8') throw new Error(`First tuple item must be "u8": "${leftRaw}"`);

    if (!rightRaw.startsWith('[') || !rightRaw.endsWith(']')) {
        throw new Error(`Expected array like "[u8;N]": got "${rightRaw}"`);
    }
    const body = rightRaw.slice(1, -1).trim(); // "u8;32"
    const sep = body.indexOf(';');
    if (sep === -1) throw new Error(`Missing ';' in array body: "${body}"`);

    const elem = body.slice(0, sep).trim();
    const lenStr = body.slice(sep + 1).trim();

    if (elem !== 'u8') throw new Error(`Only "u8" element supported here: "${elem}"`);
    if (lenStr.length === 0) throw new Error(`Missing array length: "${body}"`);

    const len = Number(lenStr);
    if (!Number.isInteger(len) || len < 0) {
        throw new Error(`Array length must be a non-negative integer: "${lenStr}"`);
    }

    return { tuple: ['u8', { array: ['u8', len] }] };
}

export function parseAnchorType_U8_PathTuple(input: string | AnchorType) {
    // NOTE: mask is string(), so transform runs for string inputs
    const Struct = coerce(TupleU8_ArrayU8, string(), v => (typeof v === 'string' ? parseTupleU8ArrayString(v) : v));

    const ast = Struct.create(input as any);
    assert(ast, TupleU8_ArrayU8);
    return ast as { tuple: [Primitive, { array: [Primitive, number] }] };
}

function tupleCheck(input: string): boolean {
    const s = input.trim();
    if (!s.startsWith('(') || !s.endsWith(')')) return false;

    const inner = s.slice(1, -1).trim();
    // must be exactly two items split by a single comma (we don't do nesting here)
    const parts = inner.split(',').map(p => p.trim());
    if (parts.length !== 2) return false;

    const [left, right] = parts;
    if (!left || !right) return false;

    // very lightweight shape expectation for our specific pattern
    if (!right.startsWith('[') || !right.endsWith(']')) return false;

    const body = right.slice(1, -1).trim();
    if (!body.includes(';')) return false; // array form like "u8;N"

    return true;
}

// detect is string might be parsed as tuple
export function isLeafTupleU8String(input: unknown): boolean {
    if (typeof input !== 'string') return false;
    if (!tupleCheck(input)) return false;

    try {
        // strict validation of "(u8,[u8;N])"
        parseTupleU8ArrayString(input);
        return true;
    } catch {
        return false;
    }
}
