import { getBase58Decoder, type Slot } from '@solana/kit';
import { array, bigint, create, integer, max, min, refine, size, type } from 'superstruct';

/** The Alpenglow genesis certificate, reduced to what identifies the migration. */
export type AlpenglowGenesisCert = Readonly<{
    /** Base58 id of the block the certificate covers. */
    blockId: string;
    /** The slot that block sits at — where Alpenglow consensus begins. */
    slot: Slot;
}>;

/** The two states that put a card on screen: the cluster is waiting, or it has migrated. */
export type AlpenglowUpgrade = { kind: 'pending' } | { kind: 'migrated'; cert: AlpenglowGenesisCert };

/** kit types this response but does not check it at runtime, so the check belongs here. */
export function parseGenesisCert(value: unknown): AlpenglowGenesisCert {
    const { block } = create(value, RpcGenesisCert);

    return {
        blockId: BASE58_DECODER.decode(Uint8Array.from(block.blockId)),
        slot: block.slot,
    };
}

const BASE58_DECODER = getBase58Decoder();

const BLOCK_ID_BYTES = 32;

const Byte = min(max(integer(), 255), 0);

// `type()` ignores unknown fields, so the aggregate signature beside `block` cannot fail the
// parse. Every field this does read is checked.
const RpcGenesisCert = type({
    block: type({
        blockId: size(array(Byte), BLOCK_ID_BYTES),
        // kit upcasts every integer outside the byte arrays, so a slot still typed as a number
        // never came from kit.
        slot: refine(bigint(), 'slot', value => value >= 0n),
    }),
});
