import { ComputeBudgetProgram, PublicKey, type VersionedMessage } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { useProgramIdlNames, warn, error } = vi.hoisted(() => ({
    error: vi.fn(),
    useProgramIdlNames: vi.fn(),
    warn: vi.fn(),
}));
// The `@x` path: `useResolvedInstructionNames` reaches the fetch through the cross-entity API.
vi.mock('@entities/idl/@x/transaction-data', () => ({ useProgramIdlNames }));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error, warn } }));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: Cluster.MainnetBeta, url: MAINNET_URL }) }));

import { useSimulationInstructionNames } from '../use-simulation-instruction-names';

const MAINNET_URL = 'https://api.mainnet-beta.solana.com';
const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const JUPITER_PROGRAM = new PublicKey('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4');

// transferChecked; Jupiter route; setComputeUnitPrice.
const TRANSFER_CHECKED = new Uint8Array([12, 0, 0, 0, 0, 0, 0, 0, 0, 6]);
const JUPITER_ROUTE = new Uint8Array([229, 23, 203, 151, 122, 227, 173, 42]);
const SET_CU_PRICE = new Uint8Array([3, 0x90, 0x06, 0, 0, 0, 0, 0, 0]);

// No IDLs by default; the tests that need them override this.
beforeEach(() => useProgramIdlNames.mockReturnValue(new Map()));
afterEach(() => vi.clearAllMocks());

describe('useSimulationInstructionNames', () => {
    describe('names resolvable without an IDL', () => {
        it('should name a Token instruction from its discriminator', () => {
            const { result } = renderNames({
                accountKeys: [TOKEN_PROGRAM],
                instructions: [{ data: TRANSFER_CHECKED, programIdIndex: 0 }],
            });

            expect(result.current.instructions[0]).toMatchObject({
                name: 'Transfer Checked',
                programName: 'Token Program',
            });
        });

        it('should name a Compute Budget instruction', () => {
            const { result } = renderNames({
                accountKeys: [ComputeBudgetProgram.programId],
                instructions: [{ data: SET_CU_PRICE, programIdIndex: 0 }],
            });

            expect(result.current.instructions[0]).toMatchObject({
                name: 'Set Compute Unit Price',
                programName: 'Compute Budget Program',
            });
        });
    });

    /**
     * The reason `accountKeys` exists on SimulationResult at all. A program id sourced from an address
     * lookup table sits past the end of `staticAccountKeys`, so reading the program from the message
     * alone would name a different program or crash.
     */
    describe('lookup-table-resolved program ids', () => {
        it('should read the program from an index past the static keys', () => {
            const { result } = renderNames({
                // Index 2 exists only in the resolved keys; staticAccountKeys holds the first two.
                accountKeys: [PublicKey.default, PublicKey.default, TOKEN_PROGRAM],
                instructions: [{ data: TRANSFER_CHECKED, programIdIndex: 2 }],
                staticAccountKeys: [PublicKey.default, PublicKey.default],
            });

            expect(result.current.instructions[0]).toMatchObject({
                name: 'Transfer Checked',
                programName: 'Token Program',
            });
        });

        it('should produce no rows until the simulation resolves the keys', () => {
            const { result } = renderNames({
                accountKeys: undefined,
                instructions: [{ data: TRANSFER_CHECKED, programIdIndex: 0 }],
            });

            expect(result.current.instructions).toEqual([]);
        });

        // The keys simply have not arrived. The card must stay silent rather than blame a fine message.
        it('should not call a message unresolvable before the simulation runs', () => {
            const { result } = renderNames({
                accountKeys: undefined,
                instructions: [{ data: TRANSFER_CHECKED, programIdIndex: 0 }],
            });

            expect(result.current.unresolvable).toBe(false);
        });

        /**
         * The whole list goes, not just the offending row. `formatInstructionLogs` pairs row `i` with
         * `instructionLogs[i]`, so dropping one row shifts every later instruction onto another
         * instruction's CU figure — a chart of confidently wrong numbers. The mixed case below is what
         * distinguishes bailing from dropping; a single-instruction case passes either way.
         */
        it('should discard every row when one program index is out of range', () => {
            const { result } = renderNames({
                accountKeys: [TOKEN_PROGRAM, ComputeBudgetProgram.programId],
                instructions: [
                    { data: TRANSFER_CHECKED, programIdIndex: 0 },
                    { data: TRANSFER_CHECKED, programIdIndex: 7 },
                    { data: SET_CU_PRICE, programIdIndex: 1 },
                ],
            });

            expect(result.current.instructions).toEqual([]);
        });

        // Empty rows alone read the same as "not simulated yet", so the caller needs this flag to know it
        // owes the user a reason.
        it('should mark the message unresolvable when it bails', () => {
            const { result } = renderNames({
                accountKeys: [TOKEN_PROGRAM],
                instructions: [{ data: TRANSFER_CHECKED, programIdIndex: 7 }],
            });

            expect(result.current.unresolvable).toBe(true);
        });

        // A real Error, not a string: Logger.error replaces a non-Error with a sentinel titled
        // "Unrecognized error", and context outside sentryExtras never reaches Sentry — so a string here
        // would report an event with no message and no data.
        it('should report the mismatch to Sentry with both indexes attached', () => {
            renderNames({
                accountKeys: [TOKEN_PROGRAM],
                instructions: [{ data: TRANSFER_CHECKED, programIdIndex: 7 }],
            });

            expect(error).toHaveBeenCalledTimes(1);
            expect(error).toHaveBeenCalledWith(
                expect.any(Error),
                expect.objectContaining({
                    sentry: true,
                    sentryExtras: { accountKeyCount: 1, programIdIndex: 7 },
                }),
            );
        });
    });

    describe('names resolvable only from an IDL', () => {
        it('should apply an IDL name once the fetch lands', () => {
            useProgramIdlNames.mockReturnValue(
                new Map([
                    [JUPITER_PROGRAM.toBase58(), { programName: 'Jupiter', resolveInstructionName: () => 'Route V2' }],
                ]),
            );

            const { result } = renderNames({
                accountKeys: [JUPITER_PROGRAM],
                instructions: [{ data: JUPITER_ROUTE, programIdIndex: 0 }],
            });

            expect(result.current.instructions[0]).toMatchObject({ name: 'Route V2', programName: 'Jupiter' });
        });

        it('should leave the name unset while the IDL fetch is in flight', () => {
            const { result } = renderNames({
                accountKeys: [JUPITER_PROGRAM],
                instructions: [{ data: JUPITER_ROUTE, programIdIndex: 0 }],
            });

            expect(result.current.instructions[0].name).toBeUndefined();
        });

        // NAME_SOURCES runs after this list is built, so every row is looked up;
        // `NON_ANCHOR_PROGRAMS` is what stops these becoming fetches.
        it('should look up every program, leaving the fetch filter to the IDL hook', () => {
            renderNames({
                accountKeys: [ComputeBudgetProgram.programId, JUPITER_PROGRAM, TOKEN_PROGRAM],
                instructions: [
                    { data: SET_CU_PRICE, programIdIndex: 0 },
                    { data: JUPITER_ROUTE, programIdIndex: 1 },
                    { data: TRANSFER_CHECKED, programIdIndex: 2 },
                ],
            });

            expect(useProgramIdlNames).toHaveBeenCalledWith(
                [ComputeBudgetProgram.programId.toBase58(), JUPITER_PROGRAM.toBase58(), TOKEN_PROGRAM.toBase58()],
                Cluster.MainnetBeta,
                MAINNET_URL,
            );
        });

        /**
         * One mount, two renders — the transition a pair of separate renderHook calls cannot cover. Row
         * order and count must survive the IDL landing, and only the names may change: the CU chart pairs
         * these rows with log entries by index.
         */
        it('should fill in names across a rerender without disturbing row order', () => {
            const { result, rerender } = renderNames({
                accountKeys: [TOKEN_PROGRAM, JUPITER_PROGRAM],
                instructions: [
                    { data: TRANSFER_CHECKED, programIdIndex: 0 },
                    { data: JUPITER_ROUTE, programIdIndex: 1 },
                ],
            });

            expect(result.current.instructions.map(row => row.name)).toEqual(['Transfer Checked', undefined]);

            useProgramIdlNames.mockReturnValue(
                new Map([
                    [JUPITER_PROGRAM.toBase58(), { programName: 'Jupiter', resolveInstructionName: () => 'Route V2' }],
                ]),
            );
            rerender();

            expect(result.current.instructions.map(row => row.name)).toEqual(['Transfer Checked', 'Route V2']);
            expect(result.current.instructions.map(row => row.programId.toBase58())).toEqual([
                TOKEN_PROGRAM.toBase58(),
                JUPITER_PROGRAM.toBase58(),
            ]);
        });

        // nameLookup is consumed by resolution, so a resolved row must not carry one — a consumer that
        // re-resolved it would flip a real name back to the sentinel on a slow or failed fetch.
        it('should not carry the lookup through to a resolved row', () => {
            useProgramIdlNames.mockReturnValue(
                new Map([
                    [JUPITER_PROGRAM.toBase58(), { programName: 'Jupiter', resolveInstructionName: () => 'Route V2' }],
                ]),
            );

            const { result } = renderNames({
                accountKeys: [JUPITER_PROGRAM],
                instructions: [{ data: JUPITER_ROUTE, programIdIndex: 0 }],
            });

            expect(result.current.instructions[0]).not.toHaveProperty('nameLookup');
        });
    });
});

function renderNames({
    instructions,
    accountKeys,
    staticAccountKeys,
}: {
    instructions: { data: Uint8Array; programIdIndex: number }[];
    accountKeys: PublicKey[] | undefined;
    staticAccountKeys?: PublicKey[];
}) {
    const message = {
        compiledInstructions: instructions.map(ix => ({ accountKeyIndexes: [], ...ix })),
        staticAccountKeys: staticAccountKeys ?? accountKeys ?? [],
    } as unknown as VersionedMessage;

    return renderHook(() => useSimulationInstructionNames({ accountKeys, message }));
}
