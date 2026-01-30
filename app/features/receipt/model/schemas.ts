import type { Infer } from 'superstruct';
import { assign, min, number, string, type } from 'superstruct';

import { publicKeyString } from '../lib/structs';

const positiveNumber = min(number(), 0, { exclusive: true });

export const BaseTransferPayload = type({
    date: number(),
    fee: number(),
    receiver: publicKeyString(),
    sender: publicKeyString(),
    total: positiveNumber,
});

export type ValidatedTransferPayload = Infer<typeof BaseTransferPayload>;

export type BaseRawTransferPayload = Partial<ValidatedTransferPayload>;

export const SolTransferPayload = assign(BaseTransferPayload, type({}));

export const TokenTransferPayload = assign(
    BaseTransferPayload,
    type({
        mint: string(),
    })
);
