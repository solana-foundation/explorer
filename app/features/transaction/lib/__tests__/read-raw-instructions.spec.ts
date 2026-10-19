import { DEFAULT_SIGNATURE } from '@__fixtures__/gen';
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
    signatures: [DEFAULT_SIGNATURE],
    slot: 0,
    version: 1,
};

beforeEach(() => {
    vi.clearAllMocks();
});

const BROWSER_REPORT = { sentry: 'always', sentryExtras: { signature: DEFAULT_SIGNATURE, version: 1 } };

describe('readRawInstructions', () => {
    it('should report to Sentry from the browser and return undefined when the message cannot be decompiled', () => {
        expect(readRawInstructions(UNDECODABLE_RAW)).toBeUndefined();
        expect(Logger.error).toHaveBeenCalledWith(expect.any(Error), BROWSER_REPORT);
    });
});

describe('readRawInnerInstructions', () => {
    it('should report to Sentry from the browser and return undefined when inner instructions do not resolve', () => {
        expect(readRawInnerInstructions(UNDECODABLE_RAW)).toBeUndefined();
        expect(Logger.error).toHaveBeenCalledWith(expect.any(Error), BROWSER_REPORT);
    });
});
