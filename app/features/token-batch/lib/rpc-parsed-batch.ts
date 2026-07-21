// Parsing for Token / Token-2022 batch instructions that the RPC has already
// decoded into structured JSON — a ParsedInstruction whose `parsed.type` is
// "batch" — as opposed to the raw-bytes form handled by batch-parser.ts.

import { isAddress } from '@solana/kit';
import type { ParsedInstruction } from '@solana/web3.js';
import { capitalCase } from 'change-case';

import { Logger } from '@/app/shared/lib/logger';

import type { DecodedParams } from './types';

export const RPC_PARSED_BATCH_TYPE = 'batch';

type RpcSubInstruction = { type?: unknown; info?: unknown };

export type RpcSubInstructionView = { typeName: string; decoded: DecodedParams };

export function isRpcParsedBatchInstruction(parsed: unknown): boolean {
    return (
        typeof parsed === 'object' && parsed !== null && (parsed as { type?: unknown }).type === RPC_PARSED_BATCH_TYPE
    );
}

// Turns an RPC-parsed batch instruction into per-sub-instruction view models.
// Every value is derived defensively — the shape is RPC-provided and untyped.
export function decodeRpcBatchInstructions(ix: ParsedInstruction): RpcSubInstructionView[] {
    return extractSubInstructions(ix).map(sub => ({
        decoded: rpcInfoToDecodedParams(isRecord(sub.info) ? sub.info : {}),
        typeName: safeLabel(sub.type, 'Unknown'),
    }));
}

// ix.parsed is `string | ParsedInfo`; for a batch it carries the sub-instructions
// under info.instructions.
export function extractSubInstructions(ix: ParsedInstruction): RpcSubInstruction[] {
    const parsed = ix.parsed as unknown;
    const info = typeof parsed !== 'string' && isRecord(parsed) ? parsed.info : undefined;
    const instructions = isRecord(info) ? info.instructions : undefined;
    if (instructions === undefined) return [];
    if (!Array.isArray(instructions)) {
        Logger.error(new Error('[token-batch:rpc-parsed-batch] batch info.instructions is not an array'), {
            parsed,
        });
        return [];
    }
    return instructions.filter((sub): sub is RpcSubInstruction => isRecord(sub));
}

// capitalCase throws on non-strings; RPC JSON is untyped, so guard before use.
export function safeLabel(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.length > 0 ? capitalCase(value) : fallback;
}

export function rpcInfoToDecodedParams(info: Record<string, unknown>): DecodedParams {
    return {
        accounts: [],
        fields: Object.entries(info).map(([key, value]) => {
            const str = stringifyValue(value);
            return { isAddress: isAddress(str), label: safeLabel(key, key), value: str };
        }),
    };
}

export function stringifyValue(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(stringifyValue).join(', ');
    // RPC nests token amounts as { amount, decimals, uiAmount, uiAmountString }.
    if (isRecord(value)) {
        const amount = value.uiAmountString ?? value.amount;
        if (typeof amount === 'string' || typeof amount === 'number') return String(amount);
        return JSON.stringify(value) ?? '';
    }
    return value === null || value === undefined ? '' : String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
