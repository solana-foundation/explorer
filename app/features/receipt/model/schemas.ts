import { PublicKey, SystemProgram } from '@solana/web3.js';
import type { Infer } from 'superstruct';
import { assign, instance, literal, min, number, optional, refine, string, type } from 'superstruct';

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

export const SolTransferParsedSchema = type({
    info: type({
        destination: publicKeyString(),
        lamports: optional(number()),
        source: optional(publicKeyString()),
    }),
    type: literal('transfer'),
});

export const SystemTransferInstructionSchema = type({
    parsed: SolTransferParsedSchema,
    programId: instance(PublicKey),
});

export const SystemTransferInstructionRefinedSchema = refine(
    SystemTransferInstructionSchema,
    'SystemTransferInstruction',
    value => SystemProgram.programId.equals(value.programId)
);
