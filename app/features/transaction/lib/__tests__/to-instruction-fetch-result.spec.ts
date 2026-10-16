import { gen } from '@__fixtures__/gen';
import type { RawTransaction } from '@entities/transaction-data';
import type { KitInstruction } from '@explorer/parsers';
import { FetchStatus } from '@providers/cache';
import { AccountRole, address } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { readRawInstructions, toInstructionFetchResult } from '../to-instruction-fetch-result';

const FIRST: KitInstruction = { accounts: [], data: new Uint8Array([1]), programAddress: address(gen.address(1)) };
const SECOND: KitInstruction = {
    accounts: [{ address: address(gen.address(2)), role: AccountRole.WRITABLE }],
    data: new Uint8Array([2]),
    programAddress: address(gen.address(3)),
};
function getSecondCardFetchResult(fetchStatus: FetchStatus | undefined, instructions?: readonly KitInstruction[]) {
    return toInstructionFetchResult({ fetchStatus, index: 1, instructions });
}

describe('toInstructionFetchResult', () => {
    it('should report loading when the raw transaction is not requested', () => {
        expect(getSecondCardFetchResult(undefined)).toEqual({ status: 'loading' });
    });

    it('should report loading when the raw transaction is loading', () => {
        expect(getSecondCardFetchResult(FetchStatus.Fetching)).toEqual({ status: 'loading' });
    });

    it('should report success with the instruction at the card index when the raw transaction is fetched', () => {
        expect(getSecondCardFetchResult(FetchStatus.Fetched, [FIRST, SECOND])).toEqual({
            instruction: SECOND,
            status: 'success',
        });
    });

    it('should report failed when the raw fetch fails', () => {
        expect(getSecondCardFetchResult(FetchStatus.FetchFailed)).toEqual({ status: 'failed' });
    });

    it('should report failed when the fetched transaction has no decodable instructions', () => {
        expect(getSecondCardFetchResult(FetchStatus.Fetched)).toEqual({ status: 'failed' });
    });
});

describe('readRawInstructions', () => {
    it('should log and return undefined when the message cannot be decompiled', () => {
        const raw: RawTransaction = {
            messageBytes: new Uint8Array([1, 2, 3]),
            serializedSize: 0,
            signatures: [],
            slot: 0,
            version: 1,
        };

        expect(readRawInstructions(raw)).toBeUndefined();
        expect(Logger.error).toHaveBeenCalled();
    });
});
