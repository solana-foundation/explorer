import { type Lamports, lamports } from '@solana/kit';
import { assert, type Infer, refine, string, type } from 'superstruct';

export type Supply = Readonly<{
    circulating: Lamports;
    total: Lamports;
}>;

type SupplyPayload = Infer<typeof SupplyPayloadStruct>;

/** Builds the pair on the way out, so a node's impossible figures fail here rather than in every client. */
export function toSupplyPayload(supply: { circulating?: unknown; total?: unknown }): SupplyPayload {
    const { circulating, total } = toSupply(supply);

    return {
        circulating: circulating.toString(),
        total: total.toString(),
    };
}

/**
 * The boundary constructor. Every figure a node reports comes through here, on the route path and the
 * direct one alike, so one set of checks holds for both: the counts are integers at all, they fit in a
 * u64, and the pair is possible — a swap, or a circulating figure out of thin air, clears any per-field
 * check on its own.
 */
export function toSupply({ circulating, total }: { circulating?: unknown; total?: unknown }): Supply {
    // `lamports` compares rather than parses: a string, an absent field or a `NaN` clears its range check
    // untouched and reaches the card as a plausible figure. Kit types these `bigint` without checking.
    if (typeof circulating !== 'bigint' || typeof total !== 'bigint') {
        throw new Error(`[supply] counts must be bigints, got ${typeof circulating} and ${typeof total}`);
    }
    if (circulating > total) {
        throw new Error(`[supply] circulating ${circulating} exceeds total ${total}`);
    }
    return { circulating: lamports(circulating), total: lamports(total) };
}

/** Throws rather than reporting a figure it cannot vouch for. */
export function parseSupplyPayload(body: unknown): Supply {
    assert(body, SupplyPayloadStruct);
    return toSupply({ circulating: BigInt(body.circulating), total: BigInt(body.total) });
}

const DECIMAL_DIGITS = '0123456789';

// Digits only: `BigInt` reads hex and binary quietly, and takes an empty string for zero.
const LamportString = refine(string(), 'lamports', value => {
    return value.length > 0 && [...value].every(character => DECIMAL_DIGITS.includes(character));
});

// Strings, because JSON cannot carry a bigint and a number would round these.
const SupplyPayloadStruct = type({
    circulating: LamportString,
    total: LamportString,
});
