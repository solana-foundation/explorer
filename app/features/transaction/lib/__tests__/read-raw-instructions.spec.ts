import type { RawTransaction } from '@entities/transaction-data';
import { describe, expect, it } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { readRawInstructions } from '../read-raw-instructions';

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
