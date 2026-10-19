import type { RawTransaction } from '@entities/transaction-data';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { readRawInnerInstructions, readRawInstructions } from '../read-raw-instructions';

const UNDECODABLE_RAW: RawTransaction = {
    messageBytes: new Uint8Array([1, 2, 3]),
    meta: {
        innerInstructions: [{ index: 0, instructions: [{ accounts: [0], data: '', programIdIndex: 0 }] }],
        postBalances: [],
        preBalances: [],
    },
    serializedSize: 0,
    signatures: [],
    slot: 0,
    version: 1,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('readRawInstructions', () => {
    it('should log and return undefined when the message cannot be decompiled', () => {
        expect(readRawInstructions(UNDECODABLE_RAW)).toBeUndefined();
        expect(Logger.error).toHaveBeenCalled();
    });
});

describe('readRawInnerInstructions', () => {
    it('should log and return undefined when the inner instructions cannot be resolved', () => {
        expect(readRawInnerInstructions(UNDECODABLE_RAW)).toBeUndefined();
        expect(Logger.error).toHaveBeenCalled();
    });
});
