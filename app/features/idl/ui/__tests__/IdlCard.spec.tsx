/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import type { Idl } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { vi } from 'vitest';

import { GENESIS_HASHES } from '@/app/entities/chain-id';
import type { ProgramIdls, SupportedIdl } from '@/app/entities/idl';
import { ClusterProvider } from '@/app/providers/cluster';
import { invariant } from '@/app/shared/lib/invariant';
import { Cluster, clusterSlug } from '@/app/utils/cluster';

import { IdlCard } from '../IdlCard';

const mocks = vi.hoisted(() => ({ useProgramIdls: vi.fn() }));

// The card reads its IDLs through `useProgramIdls`; mock that entity hook (the card imports it via
// the `@entities/idl` barrel, which re-exports this module).
vi.mock('@/app/entities/idl/model/use-program-idls', () => ({ useProgramIdls: mocks.useProgramIdls }));

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
}));

vi.mock('@solana/kit', async importOriginal => ({
    ...(await importOriginal<typeof import('@solana/kit')>()),
    address: vi.fn((addr: string) => addr),
    createSolanaRpc: vi.fn(() => ({
        getEpochInfo: vi.fn(() => ({
            send: vi.fn().mockResolvedValue({
                absoluteSlot: 0n,
                blockHeight: 0n,
                epoch: 0n,
                slotIndex: 0n,
                slotsInEpoch: 432000n,
            }),
        })),
        getEpochSchedule: vi.fn(() => ({
            send: vi.fn().mockResolvedValue({
                firstNormalEpoch: 0n,
                firstNormalSlot: 0n,
                leaderScheduleSlotOffset: 0n,
                slotsPerEpoch: 432000n,
                warmup: false,
            }),
        })),
        getFirstAvailableBlock: vi.fn(() => ({
            send: vi.fn().mockResolvedValue(0n),
        })),
        getGenesisHash: vi.fn(() => ({
            send: vi.fn().mockResolvedValue(GENESIS_HASHES.MAINNET),
        })),
    })),
}));

const DEFAULT_ADDRESS = PublicKey.default.toBase58();

function mockProgramIdls(overrides: Partial<ProgramIdls>): void {
    mocks.useProgramIdls.mockReturnValue({
        anchorIdl: undefined,
        isLoading: false,
        programMetadataIdl: undefined,
        ...overrides,
    });
}

function createMockAnchorIdl(address = DEFAULT_ADDRESS): Idl {
    return {
        accounts: [],
        address,
        constants: [],
        errors: [],
        events: [],
        instructions: [],
        metadata: {
            name: 'anchor_program',
            spec: '0.1.0',
            version: '0.1.0',
        },
        types: [],
    };
}

function createMockProgramMetadataIdl(): SupportedIdl {
    return {
        kind: 'rootNode' as const,
        name: 'metadata_program',
        program: {
            accounts: [],
            definedTypes: [],
            errors: [],
            instructions: [],
            pdas: [],
        },
        standard: 'codama',
        version: '1.2.11',
    } as unknown as SupportedIdl;
}

// Drive the "Generate SDK" flow and return the Castaway URL it opens, so a test can assert the
// `idlSource` forwarded for the displayed IDL.
function openCastawayUrl(): URL {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate SDK' }));

    expect(screen.getByText('Leaving Solana Explorer')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
    const firstCall = windowOpenSpy.mock.calls[0];
    invariant(firstCall, 'expected window.open to have been called');
    const [openedUrl, target, features] = firstCall;
    expect(target).toBe('_blank');
    expect(features).toBe('noopener,noreferrer');
    windowOpenSpy.mockRestore();
    return new URL(openedUrl as string);
}

// The reworked card has no per-source tabs. Assert the former Anchor / Program Metadata source tabs
// are gone — scoped by name so unrelated tablists the rendered IDL may contain are ignored.
function expectNoSourceTabs(): void {
    expect(screen.queryByRole('tab', { name: 'Program Metadata' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Anchor' })).not.toBeInTheDocument();
}

describe('IdlCard', () => {
    const programId = DEFAULT_ADDRESS;

    beforeEach(() => {
        vi.clearAllMocks();

        (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
            get: () => clusterSlug(Cluster.MainnetBeta),
            has: (_query?: string) => false,
            toString: () => '',
        });

        (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/');

        (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
            push: vi.fn(),
            refresh: vi.fn(),
            replace: vi.fn(),
        });
    });

    test('should render the PMP IDL (no source tabs) when a program-metadata IDL exists', async () => {
        mockProgramIdls({ programMetadataIdl: createMockProgramMetadataIdl() });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>,
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
        });
        // Standard + version badge, not the fallback-source marker; and no per-source tabs.
        expect(screen.getByText(/Codama:\s*1\.2\.11/)).toBeInTheDocument();
        expect(screen.queryByLabelText('Fallback IDL source')).not.toBeInTheDocument();
        expectNoSourceTabs();

        const castawayUrl = openCastawayUrl();
        expect(castawayUrl.origin).toBe('https://www.castaway.lol');
        expect(castawayUrl.searchParams.get('program')).toBe(programId);
        expect(castawayUrl.searchParams.get('idlSource')).toBe('program-metadata');
        expect(castawayUrl.searchParams.get('network')).toBe('mainnet-beta');
    });

    test('should fall back to the Anchor IDL with a warning badge + tooltip when no PMP IDL exists', async () => {
        mockProgramIdls({ anchorIdl: createMockAnchorIdl() });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>,
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
        });
        // The version badge stays (standard + version); the fallback info icon is added alongside it.
        expect(screen.getByText(/Anchor:\s*0\.30\.1/)).toBeInTheDocument();
        expect(screen.getByLabelText('Fallback IDL source')).toBeInTheDocument();
        expectNoSourceTabs();

        const castawayUrl = openCastawayUrl();
        expect(castawayUrl.searchParams.get('idlSource')).toBe('anchor');
    });

    test('should show only the PMP IDL when both sources exist (Anchor not surfaced)', async () => {
        mockProgramIdls({
            anchorIdl: createMockAnchorIdl(),
            programMetadataIdl: createMockProgramMetadataIdl(),
        });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>,
        );

        await waitFor(() => {
            expect(screen.getByText(/Codama:\s*1\.2\.11/)).toBeInTheDocument();
        });
        // No fallback marker and no Anchor tab — the Anchor source is not reachable from the card.
        expect(screen.queryByLabelText('Fallback IDL source')).not.toBeInTheDocument();
        expectNoSourceTabs();

        const castawayUrl = openCastawayUrl();
        expect(castawayUrl.searchParams.get('idlSource')).toBe('program-metadata');
    });

    test('should render the mismatch warning when the displayed IDL program id does not match', async () => {
        mockProgramIdls({
            // Imitate a malicious IDL whose address differs from the program being viewed.
            anchorIdl: createMockAnchorIdl(Keypair.generate().publicKey.toBase58()),
        });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>,
        );

        await waitFor(() => {
            expect(screen.getByText('IDL Program ID Mismatch')).toBeInTheDocument();
        });
        expect(screen.getByText(/does not match the program being viewed/)).toBeInTheDocument();
        // The IDL content (and its tooling) is hidden behind the warning.
        expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
    });

    test('should render the empty upload state when no IDL exists', async () => {
        mockProgramIdls({});

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>,
        );

        await waitFor(() => {
            expect(screen.getByText('Upload IDL')).toBeInTheDocument();
        });
        expect(screen.getByText(/doesn't have an IDL yet/)).toBeInTheDocument();
        expect(screen.queryByRole('tab')).not.toBeInTheDocument();
        // The IDL history link lives in the header, so it's offered even when the card has no IDL.
        expect(screen.getByRole('link', { name: /IDL history/i })).toBeInTheDocument();
    });

    test('should link to the idl.solana.com history view for the program', async () => {
        mockProgramIdls({ programMetadataIdl: createMockProgramMetadataIdl() });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>,
        );

        const link = await screen.findByRole('link', { name: /IDL history/i });
        const url = new URL(link.getAttribute('href') as string);
        expect(url.origin).toBe('https://idl.solana.com');
        expect(url.searchParams.get('programId')).toBe(programId);
        expect(url.searchParams.get('mode')).toBe('history');
        expect(url.searchParams.get('cluster')).toBe('mainnet-beta');
    });
});
