import { blockhash, lamports } from '@solana/kit';

import type { BlockData, BlockTransaction, BlockTransactionMeta } from '../model/types';

type Message = BlockTransaction['message'];
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const BLOCKHASH = blockhash('11111111111111111111111111111111');
const NO_SIGNERS = { numReadonlyNonSignerAccounts: 0, numReadonlySignerAccounts: 0, numSignerAccounts: 0 };

export function makeBlockTransaction({
    index = 0,
    message,
    meta = {},
    signatures = [],
}: {
    index?: number;
    message: DistributiveOmit<Message, 'header' | 'lifetimeToken'> & { header?: Message['header'] };
    meta?: Partial<BlockTransactionMeta> | null;
    signatures?: BlockTransaction['signatures'];
}): BlockTransaction {
    return {
        index,
        message: { header: NO_SIGNERS, ...message, lifetimeToken: BLOCKHASH },
        meta: meta === null ? null : { err: null, fee: lamports(0n), logMessages: [], ...meta },
        signatures,
    };
}

export function makeBlock(transactions: BlockData['transactions']): BlockData {
    return {
        blockTime: null,
        blockhash: BLOCKHASH,
        parentSlot: 0n,
        previousBlockhash: BLOCKHASH,
        rewards: [],
        transactions,
    };
}
