import { DEFAULT_RPC_URL } from '@__fixtures__/gen';
import type { KitInstruction } from '@explorer/parsers';
import { FetchStatus } from '@providers/cache';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import type { InstructionFetchResult, InstructionIntentResult } from '../../lib/intent';
import {
    amountToUiAmountInstruction,
    MINT,
    mintAccount,
    mintToInstruction,
    SYSTEM_PROGRAM_ADDRESS,
    SYSTEM_ROOT,
    TOKEN_PROGRAM_ADDRESS,
    TOKEN_ROOT,
    TOKEN_ROOT_WITHOUT_DISPLAY,
    transferSolInstruction,
} from '../../mocks/fixtures';
import { toInstructionFetchResult, useInstructionIntent } from '../use-instruction-intent';

const RPC = { name: 'rpc' };
const SYSTEM_IDLS = { isLoading: false, programMetadataIdl: SYSTEM_ROOT };
const TOKEN_IDLS = { isLoading: false, programMetadataIdl: TOKEN_ROOT };
const LOADING: InstructionFetchResult = { status: 'loading' };

type Parsers = typeof import('@codama/dynamic-parsers');
type Display = typeof import('@codama/dynamic-instructions');

const mocks = vi.hoisted(() => ({
    fetchEncodedAccounts: vi.fn(),
    getInstructionDisplayFromParsedInstruction: vi.fn(),
    getRequiredAccountsForDisplay: vi.fn(),
    parseInstruction: vi.fn(),
    realGetDisplay: undefined as Display['getInstructionDisplayFromParsedInstruction'] | undefined,
    realGetRequiredAccounts: undefined as Display['getRequiredAccountsForDisplay'] | undefined,
    realParseInstruction: undefined as Parsers['parseInstruction'] | undefined,
    useProgramIdls: vi.fn(),
}));

vi.mock('@codama/dynamic-parsers', async importOriginal => {
    const actual = await importOriginal<Parsers>();
    mocks.realParseInstruction = actual.parseInstruction;
    return { ...actual, parseInstruction: mocks.parseInstruction };
});
vi.mock('@codama/dynamic-instructions', async importOriginal => {
    const actual = await importOriginal<Display>();
    mocks.realGetDisplay = actual.getInstructionDisplayFromParsedInstruction;
    mocks.realGetRequiredAccounts = actual.getRequiredAccountsForDisplay;
    return {
        ...actual,
        getInstructionDisplayFromParsedInstruction: mocks.getInstructionDisplayFromParsedInstruction,
        getRequiredAccountsForDisplay: mocks.getRequiredAccountsForDisplay,
    };
});
vi.mock('@solana/kit', async importOriginal => ({
    ...(await importOriginal<typeof import('@solana/kit')>()),
    fetchEncodedAccounts: mocks.fetchEncodedAccounts,
}));
vi.mock('@entities/idl/@x/instruction-intent', () => ({ useProgramIdls: mocks.useProgramIdls }));
vi.mock('@entities/cluster/@x/instruction-intent', () => ({
    useCluster: () => ({ cluster: Cluster.Devnet, url: DEFAULT_RPC_URL }),
    useSolanaRpc: () => RPC,
}));

function wrapper({ children }: { children: ReactNode }) {
    return <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>;
}

function fetched(instruction: KitInstruction): InstructionFetchResult {
    return { instruction, status: 'success' };
}

function renderClosedCardIntent(idls: object, ixFetchResult: InstructionFetchResult) {
    mocks.useProgramIdls.mockReturnValue(idls);
    const { result } = renderHook(
        () => useInstructionIntent({ enabled: false, ixFetchResult, programId: SYSTEM_PROGRAM_ADDRESS }),
        { wrapper },
    );
    return result.current;
}

function renderTwoMintToIntents(firstAmount: bigint, secondAmount: bigint) {
    const first = fetched(mintToInstruction(firstAmount));
    const second = fetched(mintToInstruction(secondAmount));
    return renderHook(
        () => [
            useInstructionIntent({ enabled: true, ixFetchResult: first, programId: TOKEN_PROGRAM_ADDRESS }),
            useInstructionIntent({ enabled: true, ixFetchResult: second, programId: TOKEN_PROGRAM_ADDRESS }),
        ],
        { wrapper },
    );
}

function getSecondCardFetchResult(fetchStatus: FetchStatus | undefined, instructions?: readonly KitInstruction[]) {
    return toInstructionFetchResult({ fetchStatus, index: 1, instructions, programId: TOKEN_PROGRAM_ADDRESS });
}

beforeEach(() => {
    vi.clearAllMocks();
    mocks.parseInstruction.mockImplementation((...args: Parameters<Parsers['parseInstruction']>) =>
        mocks.realParseInstruction?.(...args),
    );
    mocks.getInstructionDisplayFromParsedInstruction.mockImplementation(
        (...args: Parameters<Display['getInstructionDisplayFromParsedInstruction']>) => mocks.realGetDisplay?.(...args),
    );
    mocks.getRequiredAccountsForDisplay.mockImplementation(
        (...args: Parameters<Display['getRequiredAccountsForDisplay']>) => mocks.realGetRequiredAccounts?.(...args),
    );
    mocks.useProgramIdls.mockReturnValue(TOKEN_IDLS);
});

describe('useInstructionIntent', () => {
    it('should report idle when the card is closed and the IDL is loading', () => {
        expect(renderClosedCardIntent({ isLoading: true }, fetched(transferSolInstruction()))).toEqual({
            status: 'idle',
        });
    });

    it('should report idle when the card is closed and the instruction is loading', () => {
        expect(renderClosedCardIntent(SYSTEM_IDLS, LOADING)).toEqual({ status: 'idle' });
    });

    it('should report idle without fetching accounts when the card is closed and the instruction has an intent', () => {
        expect(renderClosedCardIntent(SYSTEM_IDLS, fetched(transferSolInstruction()))).toEqual({ status: 'idle' });
        expect(mocks.getRequiredAccountsForDisplay).not.toHaveBeenCalled();
        expect(mocks.fetchEncodedAccounts).not.toHaveBeenCalled();
        expect(mocks.getInstructionDisplayFromParsedInstruction).not.toHaveBeenCalled();
    });

    it('should report idl-failed when the card is closed and the IDL fetch fails', () => {
        const idls = { error: new Error('502'), isLoading: false };

        expect(renderClosedCardIntent(idls, fetched(transferSolInstruction()))).toEqual({
            reason: 'idl-failed',
            status: 'unavailable',
        });
    });

    it('should report no-metadata when the card is closed and the IDL has no intent templates', () => {
        const idls = { isLoading: false, programMetadataIdl: TOKEN_ROOT_WITHOUT_DISPLAY };

        expect(renderClosedCardIntent(idls, fetched(mintToInstruction()))).toEqual({
            reason: 'no-metadata',
            status: 'unavailable',
        });
    });

    it('should report malformed-metadata when the card is closed and the IDL version is unsupported', () => {
        const idls = { isLoading: false, programMetadataIdl: { ...SYSTEM_ROOT, version: '2.0.0' } };

        expect(renderClosedCardIntent(idls, fetched(transferSolInstruction()))).toEqual({
            reason: 'malformed-metadata',
            status: 'unavailable',
        });
    });

    it('should report failed when the card is closed and the instruction fetch failed', () => {
        expect(renderClosedCardIntent(SYSTEM_IDLS, { status: 'failed' })).toEqual({ status: 'failed' });
    });

    it('should report no-instruction-intent when the card is closed and the instruction has no template', () => {
        expect(renderClosedCardIntent(TOKEN_IDLS, fetched(amountToUiAmountInstruction()))).toEqual({
            reason: 'no-instruction-intent',
            status: 'unavailable',
        });
    });

    it('should not fetch accounts when the intent plans none', async () => {
        mocks.useProgramIdls.mockReturnValue(SYSTEM_IDLS);
        const ixFetchResult = fetched(transferSolInstruction());

        const { result } = renderHook(
            () => useInstructionIntent({ enabled: true, ixFetchResult, programId: SYSTEM_PROGRAM_ADDRESS }),
            { wrapper },
        );

        await waitFor(() => expect(result.current.status).toBe('ready'));
        expect(mocks.fetchEncodedAccounts).not.toHaveBeenCalled();
    });

    it('should read the planned mint when the amount needs its decimals', async () => {
        mocks.fetchEncodedAccounts.mockResolvedValue([mintAccount(6)]);
        const ixFetchResult = fetched(mintToInstruction());

        const { result } = renderHook(
            () => useInstructionIntent({ enabled: true, ixFetchResult, programId: TOKEN_PROGRAM_ADDRESS }),
            { wrapper },
        );

        await waitFor(() => expect(result.current.status).toBe('ready'));
        expect(mocks.fetchEncodedAccounts).toHaveBeenCalledWith(RPC, [MINT]);
        expect(result.current.status === 'ready' && result.current.result.usedAccountData).toBe(true);
    });

    it('should share one account fetch when two instructions require one mint', async () => {
        mocks.fetchEncodedAccounts.mockResolvedValue([mintAccount(6)]);

        const { result } = renderTwoMintToIntents(1_500_000n, 2_500_000n);

        await waitFor(() => expect(result.current.map(intent => intent.status)).toEqual(['ready', 'ready']));
        expect(mocks.fetchEncodedAccounts).toHaveBeenCalledTimes(1);
        expect(mocks.getInstructionDisplayFromParsedInstruction).toHaveBeenCalledTimes(2);
    });

    it('should share one computation when two instructions are equal', async () => {
        mocks.fetchEncodedAccounts.mockResolvedValue([mintAccount(6)]);

        const { result } = renderTwoMintToIntents(1_500_000n, 1_500_000n);

        await waitFor(() => expect(result.current.map(intent => intent.status)).toEqual(['ready', 'ready']));
        expect(mocks.getInstructionDisplayFromParsedInstruction).toHaveBeenCalledTimes(1);
    });

    it('should report loading when a failed account fetch is retried', async () => {
        mocks.fetchEncodedAccounts.mockRejectedValueOnce(new Error('429')).mockResolvedValueOnce([mintAccount(6)]);
        const ixFetchResult = fetched(mintToInstruction());
        const statuses: InstructionIntentResult['status'][] = [];

        const { result } = renderHook(
            () => {
                const intent = useInstructionIntent({
                    enabled: true,
                    ixFetchResult,
                    programId: TOKEN_PROGRAM_ADDRESS,
                });
                statuses.push(intent.status);
                return intent;
            },
            { wrapper },
        );

        await waitFor(() => expect(result.current.status).toBe('failed'));
        const failedAt = statuses.length;
        const failed = result.current;
        if (failed.status !== 'failed' || !failed.retry) throw new Error('Expected a failed result with a retry');
        const retryAccounts = failed.retry;

        await act(async () => retryAccounts());

        await waitFor(() => expect(result.current.status).toBe('ready'));
        expect(statuses.slice(failedAt)).toContain('loading');
        expect(mocks.fetchEncodedAccounts).toHaveBeenCalledTimes(2);
    });

    it('should report malformed-metadata when the computation throws', async () => {
        mocks.useProgramIdls.mockReturnValue(SYSTEM_IDLS);
        mocks.getInstructionDisplayFromParsedInstruction.mockRejectedValueOnce(new Error('bad metadata'));
        const ixFetchResult = fetched(transferSolInstruction());

        const { result } = renderHook(
            () => useInstructionIntent({ enabled: true, ixFetchResult, programId: SYSTEM_PROGRAM_ADDRESS }),
            { wrapper },
        );

        await waitFor(() => expect(result.current).toEqual({ reason: 'malformed-metadata', status: 'unavailable' }));
    });

    it('should report idle when the card is closed and the account plan would throw', () => {
        mocks.getRequiredAccountsForDisplay.mockImplementation(() => {
            throw new Error('broken IDL');
        });

        expect(renderClosedCardIntent(SYSTEM_IDLS, fetched(transferSolInstruction()))).toEqual({ status: 'idle' });
    });

    it('should report malformed-metadata when the card opens and the account plan throws', async () => {
        mocks.useProgramIdls.mockReturnValue(SYSTEM_IDLS);
        mocks.getRequiredAccountsForDisplay.mockImplementation(() => {
            throw new Error('broken IDL');
        });
        const ixFetchResult = fetched(transferSolInstruction());

        const { result } = renderHook(
            () => useInstructionIntent({ enabled: true, ixFetchResult, programId: SYSTEM_PROGRAM_ADDRESS }),
            { wrapper },
        );

        await waitFor(() => expect(result.current).toEqual({ reason: 'malformed-metadata', status: 'unavailable' }));
        expect(mocks.fetchEncodedAccounts).not.toHaveBeenCalled();
    });

    it('should parse once when the caller rebuilds the fetch result object', () => {
        mocks.useProgramIdls.mockReturnValue(SYSTEM_IDLS);
        const instruction = transferSolInstruction();

        const { rerender } = renderHook(
            ({ fetchResult }: { fetchResult: InstructionFetchResult }) =>
                useInstructionIntent({
                    enabled: false,
                    ixFetchResult: fetchResult,
                    programId: SYSTEM_PROGRAM_ADDRESS,
                }),
            { initialProps: { fetchResult: fetched(instruction) }, wrapper },
        );
        rerender({ fetchResult: fetched(instruction) });

        expect(mocks.parseInstruction).toHaveBeenCalledTimes(1);
    });
});

describe('toInstructionFetchResult', () => {
    it('should report loading when the raw transaction is not requested', () => {
        expect(getSecondCardFetchResult(undefined)).toEqual({ status: 'loading' });
    });

    it('should report loading when the raw transaction is loading', () => {
        expect(getSecondCardFetchResult(FetchStatus.Fetching)).toEqual({ status: 'loading' });
    });

    it('should report success with the instruction at the card index when the raw transaction is fetched', () => {
        const second = mintToInstruction();

        expect(getSecondCardFetchResult(FetchStatus.Fetched, [transferSolInstruction(), second])).toEqual({
            instruction: second,
            status: 'success',
        });
    });

    it('should report failed when the instruction at the card index belongs to another program', () => {
        expect(
            getSecondCardFetchResult(FetchStatus.Fetched, [transferSolInstruction(), transferSolInstruction()]),
        ).toEqual({ status: 'failed' });
    });

    it('should report failed when the raw fetch fails', () => {
        expect(getSecondCardFetchResult(FetchStatus.FetchFailed)).toEqual({ status: 'failed' });
    });

    it('should report failed when the fetched transaction has no decodable instructions', () => {
        expect(getSecondCardFetchResult(FetchStatus.Fetched)).toEqual({ status: 'failed' });
    });
});
