import { getBase58Decoder, type Slot } from '@solana/kit';
import { array, create, integer, max, min, size, type } from 'superstruct';

/** The Alpenglow genesis certificate, reduced to what identifies the migration. */
export type AlpenglowGenesisCert = Readonly<{
    /** Base58 id of the block the certificate covers. */
    blockId: string;
    /** The slot that block sits at — where Alpenglow consensus begins. */
    slot: Slot;
}>;

/** The two states that put a card on screen: the cluster is waiting, or it has migrated. */
export type AlpenglowUpgrade = { kind: 'pending' } | { kind: 'migrated'; cert: AlpenglowGenesisCert };

/**
 * The one door. A node's answer becomes a certificate here or not at all, so the card never
 * renders a slot or a block id the node did not actually report.
 */
export function parseGenesisCert(value: unknown): AlpenglowGenesisCert {
    const { block } = create(value, RpcGenesisCert);

    return {
        blockId: BASE58_DECODER.decode(Uint8Array.from(block.blockId)),
        slot: BigInt(block.slot),
    };
}

const BASE58_DECODER = getBase58Decoder();

const BLOCK_ID_BYTES = 32;

const Byte = min(max(integer(), 255), 0);

// Loose `type()`, and the aggregate signature beside `block` is left unread: the certificate
// exists to say where the migration happened, and a field nothing displays must not be able to
// cost the card its answer. What is read is checked — a short block id decodes to a plausible
// base58 string that names no block.
const RpcGenesisCert = type({
    block: type({
        blockId: size(array(Byte), BLOCK_ID_BYTES),
        // A slot arrives as a JSON number; every one the ledger will reach is exact as a double.
        slot: min(integer(), 0),
    }),
});
