import { DEFAULT_RPC_URL } from '@__fixtures__/gen';
import type { KitInstruction } from '@explorer/parsers';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import type { InstructionIntentAvailability, InstructionIntentResult } from '../../lib/intent';
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
import { useInstructionIntent } from '../use-instruction-intent';

const RPC = { name: 'rpc' };
const SYSTEM_IDLS = { isLoading: false, programMetadataIdl: SYSTEM_ROOT };
const TOKEN_IDLS = { isLoading: false, programMetadataIdl: TOKEN_ROOT };
const PENDING: InstructionIntentAvailability = { status: 'pending' };
const retry = vi.fn();

type Parsers = typeof import('@codama/dynamic-parsers');
type Display = typeof import('@codama/dynamic-instructions');

const mocks = vi.hoisted(() => ({
    fetchEncodedAccounts: vi.fn(),
    getInstructionDisplayFromParsedInstruction: vi.fn(),
    parseInstruction: vi.fn(),
    realGetDisplay: undefined as Display['getInstructionDisplayFromParsedInstruction'] | undefined,
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
    return { ...actual, getInstructionDisplayFromParsedInstruction: mocks.getInstructionDisplayFromParsedInstruction };
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

function present(instruction: KitInstruction): InstructionIntentAvailability {
    return { instruction, status: 'present' };
}

function renderClosedCardIntent(idls: object, ixIntentAvailability: InstructionIntentAvailability) {
    mocks.useProgramIdls.mockReturnValue(idls);
    const { result } = renderHook(
        () => useInstructionIntent({ enabled: false, ixIntentAvailability, programId: SYSTEM_PROGRAM_ADDRESS }),
        { wrapper },
    );
    return result.current;
}

function renderTwoMintToIntents(firstAmount: bigint, secondAmount: bigint) {
    const first = present(mintToInstruction(firstAmount));
    const second = present(mintToInstruction(secondAmount));
    return renderHook(
        () => [
            useInstructionIntent({ enabled: true, ixIntentAvailability: first, programId: TOKEN_PROGRAM_ADDRESS }),
            useInstructionIntent({ enabled: true, ixIntentAvailability: second, programId: TOKEN_PROGRAM_ADDRESS }),
        ],
        { wrapper },
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    mocks.parseInstruction.mockImplementation((...args: Parameters<Parsers['parseInstruction']>) =>
        mocks.realParseInstruction?.(...args),
    );
    mocks.getInstructionDisplayFromParsedInstruction.mockImplementation(
        (...args: Parameters<Display['getInstructionDisplayFromParsedInstruction']>) => mocks.realGetDisplay?.(...args),
    );
    mocks.useProgramIdls.mockReturnValue(TOKEN_IDLS);
});

describe('useInstructionIntent', () => {
    it('should report idle when the card is closed and the IDL is loading', () => {
        expect(renderClosedCardIntent({ isLoading: true }, present(transferSolInstruction()))).toEqual({
            status: 'idle',
        });
    });

    it('should report idle when the card is closed and the instruction is pending', () => {
        expect(renderClosedCardIntent(SYSTEM_IDLS, PENDING)).toEqual({ status: 'idle' });
    });

    it('should report idle without reading accounts when the card is closed and the instruction has an intent', () => {
        expect(renderClosedCardIntent(SYSTEM_IDLS, present(transferSolInstruction()))).toEqual({ status: 'idle' });
        expect(mocks.fetchEncodedAccounts).not.toHaveBeenCalled();
        expect(mocks.getInstructionDisplayFromParsedInstruction).not.toHaveBeenCalled();
    });

    it('should report idl-failed when the card is closed and the IDL fetch fails', () => {
        const idls = { error: new Error('502'), isLoading: false };

        expect(renderClosedCardIntent(idls, present(transferSolInstruction()))).toEqual({
            reason: 'idl-failed',
            status: 'unavailable',
        });
    });

    it('should report no-metadata when the card is closed and the IDL has no intent templates', () => {
        const idls = { isLoading: false, programMetadataIdl: TOKEN_ROOT_WITHOUT_DISPLAY };

        expect(renderClosedCardIntent(idls, present(mintToInstruction()))).toEqual({
            reason: 'no-metadata',
            status: 'unavailable',
        });
    });

    it('should report malformed-metadata when the card is closed and the IDL version is unsupported', () => {
        const idls = { isLoading: false, programMetadataIdl: { ...SYSTEM_ROOT, version: '2.0.0' } };

        expect(renderClosedCardIntent(idls, present(transferSolInstruction()))).toEqual({
            reason: 'malformed-metadata',
            status: 'unavailable',
        });
    });

    it('should report failed with the retry when the card is closed and the instruction is absent', () => {
        expect(renderClosedCardIntent(SYSTEM_IDLS, { retry, status: 'absent' })).toEqual({ retry, status: 'failed' });
    });

    it('should report no-instruction-intent when the card is closed and the instruction has no template', () => {
        expect(renderClosedCardIntent(TOKEN_IDLS, present(amountToUiAmountInstruction()))).toEqual({
            reason: 'no-instruction-intent',
            status: 'unavailable',
        });
    });

    it('should not read accounts when the intent plans none', async () => {
        mocks.useProgramIdls.mockReturnValue(SYSTEM_IDLS);
        const ixIntentAvailability = present(transferSolInstruction());

        const { result } = renderHook(
            () => useInstructionIntent({ enabled: true, ixIntentAvailability, programId: SYSTEM_PROGRAM_ADDRESS }),
            { wrapper },
        );

        await waitFor(() => expect(result.current.status).toBe('ready'));
        expect(mocks.fetchEncodedAccounts).not.toHaveBeenCalled();
    });

    it('should read the planned mint when the amount needs its decimals', async () => {
        mocks.fetchEncodedAccounts.mockResolvedValue([mintAccount(6)]);
        const ixIntentAvailability = present(mintToInstruction());

        const { result } = renderHook(
            () => useInstructionIntent({ enabled: true, ixIntentAvailability, programId: TOKEN_PROGRAM_ADDRESS }),
            { wrapper },
        );

        await waitFor(() => expect(result.current.status).toBe('ready'));
        expect(mocks.fetchEncodedAccounts).toHaveBeenCalledWith(RPC, [MINT]);
        expect(result.current.status === 'ready' && result.current.result.usedAccountData).toBe(true);
    });

    it('should share one account read when two instructions read one mint', async () => {
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

    it('should report loading when a failed account read is retried', async () => {
        mocks.fetchEncodedAccounts.mockRejectedValueOnce(new Error('429')).mockResolvedValueOnce([mintAccount(6)]);
        const ixIntentAvailability = present(mintToInstruction());
        const statuses: InstructionIntentResult['status'][] = [];

        const { result } = renderHook(
            () => {
                const intent = useInstructionIntent({
                    enabled: true,
                    ixIntentAvailability,
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
        const ixIntentAvailability = present(transferSolInstruction());

        const { result } = renderHook(
            () => useInstructionIntent({ enabled: true, ixIntentAvailability, programId: SYSTEM_PROGRAM_ADDRESS }),
            { wrapper },
        );

        await waitFor(() => expect(result.current).toEqual({ reason: 'malformed-metadata', status: 'unavailable' }));
    });

    it('should parse once when the caller rebuilds the status object', () => {
        mocks.useProgramIdls.mockReturnValue(SYSTEM_IDLS);
        const instruction = transferSolInstruction();

        const { rerender } = renderHook(
            ({ status }: { status: InstructionIntentAvailability }) =>
                useInstructionIntent({
                    enabled: false,
                    ixIntentAvailability: status,
                    programId: SYSTEM_PROGRAM_ADDRESS,
                }),
            { initialProps: { status: present(instruction) }, wrapper },
        );
        rerender({ status: present(instruction) });

        expect(mocks.parseInstruction).toHaveBeenCalledTimes(1);
    });
});
