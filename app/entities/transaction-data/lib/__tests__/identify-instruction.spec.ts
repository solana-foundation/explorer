import { identifyStakeInstruction } from '@solana-program/stake';
import { identifySystemInstruction } from '@solana-program/system';
import { identifyToken2022Instruction } from '@solana-program/token-2022';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { warn } = vi.hoisted(() => ({ warn: vi.fn() }));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn(), warn } }));

import { identifyInstruction } from '../identify-instruction';

const PROGRAM_ID = 'Stake11111111111111111111111111111111111111';
const UNRECOGNIZED = new Uint8Array([250]);

afterEach(() => vi.clearAllMocks());

describe('identifyInstruction', () => {
    it('should return the index the client read from the discriminator', () => {
        expect(identifyInstruction(() => 7, { data: UNRECOGNIZED, programId: PROGRAM_ID })).toBe(7);
        expect(warn).not.toHaveBeenCalled();
    });

    /**
     * Every generated client now raises `SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_INSTRUCTION`
     * for a discriminator it does not know — `stake` and `token-2022` threw a plain `Error` before kit 7
     * normalized it. This is the ordinary case for an explorer, so it must degrade to undefined whichever
     * client is asked, and it must say nothing at all: not Sentry, not even a console line.
     */
    describe('an unrecognized discriminator', () => {
        const clients: ReadonlyArray<[string, (data: Uint8Array) => number]> = [
            ['stake', identifyStakeInstruction],
            ['token-2022', identifyToken2022Instruction],
            ['system', identifySystemInstruction],
        ];

        it.each(clients)('should return undefined for %s', (_label, identify) => {
            expect(identifyInstruction(identify, { data: UNRECOGNIZED, programId: PROGRAM_ID })).toBeUndefined();
        });

        // Pinned across all three because the branch that stays silent is keyed on the error shape. A
        // client that regresses to a plain `Error` starts logging a routine miss again, and shows up here.
        it.each(clients)('should report nothing at all for %s', (_label, identify) => {
            identifyInstruction(identify, { data: UNRECOGNIZED, programId: PROGRAM_ID });

            expect(warn).not.toHaveBeenCalled();
        });
    });

    /** A defect in the client or in the call — still must not escape, since most callers run in render. */
    describe('an unexpected throw', () => {
        const identify = () => {
            throw new TypeError('data.subarray is not a function');
        };

        it('should still return undefined', () => {
            expect(identifyInstruction(identify, { data: UNRECOGNIZED, programId: PROGRAM_ID })).toBeUndefined();
        });

        it('should report it with the program and the offending bytes', () => {
            identifyInstruction(identify, { data: UNRECOGNIZED, programId: PROGRAM_ID });

            expect(warn).toHaveBeenCalledWith(
                expect.stringContaining('non-standard identify error'),
                expect.objectContaining({
                    data: 'fa',
                    error: expect.stringContaining('data.subarray is not a function'),
                    programId: PROGRAM_ID,
                }),
            );
        });

        // Naming runs during render, so a capture would re-fire on every recompute rather than once per
        // defect. No routine miss reaches this branch — every configured client raises the standard error.
        it('should not send the report to Sentry', () => {
            identifyInstruction(identify, { data: UNRECOGNIZED, programId: PROGRAM_ID });

            expect(warn).toHaveBeenCalledWith(
                expect.any(String),
                expect.not.objectContaining({ sentry: expect.anything() }),
            );
        });
    });
});
