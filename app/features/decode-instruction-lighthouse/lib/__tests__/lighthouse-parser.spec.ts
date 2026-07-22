import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import { EquatableOperator, IntegerOperator } from 'lighthouse-sdk';
import { describe, expect, test } from 'vitest';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { LIGHTHOUSE_ADDRESS } from '../constants';
import { parseLighthouseInstruction } from '../lighthouse-parser';

const LIGHTHOUSE = new PublicKey(LIGHTHOUSE_ADDRESS);

describe('parseLighthouseInstruction', () => {
    test('should decode Assert Sysvar Clock keeping the raw operator enum', () => {
        // logLevel=0, assertion=Slot, value=310832806, op=LessThan
        const parsed = parse([15, 0, 0, 166, 238, 134, 18, 0, 0, 0, 0, 3]);
        expect(parsed?.type).toBe('Assert Sysvar Clock');
        const assertion = parsed?.info.data.assertion as { __kind: string; operator: number };
        expect(assertion.__kind).toBe('Slot');
        // Faithful decode: the operator stays a raw enum; the card formats it.
        expect(assertion.operator).toBe(IntegerOperator.LessThan);
    });

    test('should decode Assert Account Info keeping the raw operator enum', () => {
        const parsed = parse([5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ['AUuYypaXez7kXWWWYecmsb89prMCnba6g2tBWm3BxKQV']);
        expect(parsed?.type).toBe('Assert Account Info');
        expect((parsed?.info.data.assertion as { operator: number }).operator).toBe(IntegerOperator.Equal);
        // Named accounts are surfaced for the table.
        expect(parsed?.info.accounts).toBeDefined();
    });

    test('should decode every assertion in a Multi instruction', () => {
        // Assert Account Info Multi — three assertions with ops >=, <=, =.
        const parsed = parse(
            [6, 5, 3, 0, 112, 1, 103, 2, 0, 0, 0, 0, 4, 0, 100, 2, 1, 4, 0, 0, 0, 0, 5, 3, 0, 0],
            ['FZLY576gVwyD6rEosP72pRUC9TAe7LhgvoSepk3F63PY'],
        );
        expect(parsed?.type).toBe('Assert Account Info Multi');
        const assertions = parsed?.info.data.assertions as Array<{ operator: number }>;
        expect(assertions.map(a => a.operator)).toEqual([
            IntegerOperator.GreaterThanOrEqual,
            IntegerOperator.LessThanOrEqual,
            EquatableOperator.Equal,
        ]);
    });

    test('should return undefined for an unrecognized discriminator', () => {
        expect(parse([255, 255, 255, 255])).toBeUndefined();
    });
});

function parse(data: number[], accounts: string[] = []) {
    const keys = accounts.map(pubkey => ({ isSigner: false, isWritable: false, pubkey: new PublicKey(pubkey) }));
    const raw = { data: Buffer.from(data), keys, programId: LIGHTHOUSE };
    return parseLighthouseInstruction(toKitInstruction(raw as unknown as TransactionInstruction));
}
