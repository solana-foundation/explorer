/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { gen } from '@__fixtures__/gen';
import type { Idl } from '@coral-xyz/anchor';
import anchorLegacyIdl from '@entities/idl/mocks/anchor/anchor-0.29.0-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import codamaFixture from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { Keypair, PublicKey } from '@solana/web3.js';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { vi } from 'vitest';

import {
    type CodamaIdl,
    type CustomIdlRecord,
    IdlVariant,
    type ProgramIdlPair,
    type ProgramIdls,
    type SupportedIdl,
} from '@/app/entities/idl';
import type { CustomIdl } from '@/app/entities/idl/model/custom-idl/types';
import { getOnChainIdls, getSelectedIdls } from '@/app/entities/idl/model/sourced-idl';
import { ClusterProvider } from '@/app/providers/cluster';
import { trackEvent } from '@/app/shared/lib/analytics/track-event';
import { invariant } from '@/app/shared/lib/invariant';
import { Cluster, clusterSlug } from '@/app/utils/cluster';

import { originalIdlSourceAtom, unsetOriginalIdl } from '../../interactive-idl/model/state-atoms';
import { IdlCard } from '../IdlCard';

const mocks = vi.hoisted(() => ({ brokenIdlName: 'broken_program', useProgramIdls: vi.fn() }));

vi.hoisted(() => vi.stubEnv('NEXT_PUBLIC_INTERACTIVE_IDL_ENABLED', 'true'));
vi.mock('../../interactive-idl/ui/InteractWithIdl', async () => {
    const { useState } = await import('react');
    return {
        // The real view keeps its expanded sections in state and adds each expanded instruction to them.
        InteractWithIdl: ({
            data,
            onSectionsExpanded,
        }: {
            data?: { name: string }[];
            onSectionsExpanded?: (programId: string, sections: string[]) => void;
        }) => {
            const [expanded, setExpanded] = useState<string[]>([]);
            const expand = () => {
                const next = [...expanded, data?.[0]?.name ?? ''];
                setExpanded(next);
                onSectionsExpanded?.('mock-program', next);
            };
            return <button onClick={expand}>Interactive IDL</button>;
        },
    };
});

// The card reads its IDLs through `useProgramIdls`; mock that entity hook (the card imports it via
// the `@entities/idl` barrel, which re-exports this module).
vi.mock('@/app/entities/idl/model/use-program-idls', () => ({ useProgramIdls: mocks.useProgramIdls }));
vi.mock('@/app/shared/lib/analytics/track-event', () => ({ trackEvent: vi.fn() }));

vi.mock('../../formatted-idl/ui/CodamaFormattedIdl', async importOriginal => {
    const original = await importOriginal<typeof import('../../formatted-idl/ui/CodamaFormattedIdl')>();
    return {
        CodamaFormattedIdl: (props: Parameters<typeof original.CodamaFormattedIdl>[0]) => {
            if (props.idl?.program?.name === mocks.brokenIdlName) throw new Error('render failed');
            return (
                <div data-testid={`formatted-${props.idl?.program?.name ?? 'codama'}`}>
                    <original.CodamaFormattedIdl {...props} />
                </div>
            );
        },
    };
});

vi.mock('../../formatted-idl/ui/AnchorFormattedIdl', async importOriginal => {
    const original = await importOriginal<typeof import('../../formatted-idl/ui/AnchorFormattedIdl')>();
    return {
        AnchorFormattedIdl: (props: Parameters<typeof original.AnchorFormattedIdl>[0]) => {
            if (props.idl?.metadata?.name === mocks.brokenIdlName) throw new Error('render failed');
            return (
                <div data-testid={`formatted-${props.idl?.metadata?.name}`}>
                    <original.AnchorFormattedIdl {...props} />
                </div>
            );
        },
    };
});

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
}));

const DEFAULT_ADDRESS = PublicKey.default.toBase58();
const PMP_PDA = gen.vanityAddress('PMP');

function mockProgramIdls({
    customIdlRecord,
    stored = { record: customIdlRecord, status: 'ready' },
    ...onChainOverrides
}: Partial<ProgramIdlPair> & {
    customIdlRecord?: CustomIdlRecord;
    stored?: ProgramIdls['stored'];
}): void {
    const onChain: ProgramIdlPair = {
        anchorIdl: undefined,
        anchorIdlAddress: undefined,
        programMetadataIdl: undefined,
        programMetadataIdlAddress: undefined,
        ...onChainOverrides,
    };
    const onChainIdls = getOnChainIdls(onChain);
    mocks.useProgramIdls.mockReturnValue({
        idls:
            stored.status === 'loading'
                ? undefined
                : getSelectedIdls(onChainIdls, stored.status === 'ready' ? stored.record : undefined),
        onChainIdls,
        stored,
    } satisfies ProgramIdls);
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
            version: '0.4.2',
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

    const renderCard = () =>
        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>,
        );

    beforeEach(() => {
        vi.clearAllMocks();
        getDefaultStore().set(unsetOriginalIdl);

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

        renderCard();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
        });
        // Standard + version badge, not the fallback-source marker; and no per-source tabs.
        expect(screen.getByText('Codama (version 1.2.11)')).toBeInTheDocument();
        expect(screen.queryByLabelText('Fallback IDL source')).not.toBeInTheDocument();
        expectNoSourceTabs();

        const castawayUrl = openCastawayUrl();
        expect(castawayUrl.origin).toBe('https://www.castaway.lol');
        expect(castawayUrl.searchParams.get('program')).toBe(programId);
        expect(castawayUrl.searchParams.get('idlSource')).toBe('program-metadata');
        expect(castawayUrl.searchParams.get('network')).toBe('mainnet-beta');
    });

    test('should show the IDL metadata (address, source, program version) under the badge', async () => {
        mockProgramIdls({
            programMetadataIdl: createMockProgramMetadataIdl(),
            programMetadataIdlAddress: PMP_PDA,
        });

        renderCard();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
        });

        // Source row reflects the displayed IDL's origin.
        expect(screen.getByText('Source')).toBeInTheDocument();
        expect(screen.getByText('PMP')).toBeInTheDocument();
        // Address row links the storage-account PDA to its account page (via the shared AddressLink,
        // whose accessible name is "Open address <addr>" and whose visible text is mid-truncated).
        const addressLink = screen.getByRole('link', { name: `Open address ${PMP_PDA}` });
        expect(addressLink.getAttribute('href')).toContain(`/address/${PMP_PDA}`);
        // Program version is the program's own semver (program.version), not the spec/standard label.
        expect(screen.getByText('Program Version')).toBeInTheDocument();
        expect(screen.getByText('0.4.2')).toBeInTheDocument();
    });

    test('should show the program name (title-cased) under the badge when the IDL names the program', async () => {
        const idl = createMockProgramMetadataIdl();
        (idl as unknown as { program: { name: string } }).program.name = 'crypto_primitives';
        mockProgramIdls({ programMetadataIdl: idl, programMetadataIdlAddress: PMP_PDA });

        renderCard();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
        });
        // Scope to the info-block <dt>; the rendered instruction table also has a "Name" column header.
        expect(screen.getByText('Name', { selector: 'dt' })).toBeInTheDocument();
        expect(screen.getByText('Crypto Primitives')).toBeInTheDocument();
    });

    test('should label the source as Anchor when falling back to the Anchor IDL', async () => {
        mockProgramIdls({ anchorIdl: createMockAnchorIdl(), anchorIdlAddress: DEFAULT_ADDRESS });

        renderCard();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
        });
        // The Source <dd> is exactly "Anchor"; the badge element reads "Anchor: 0.30.1 (spec: 0.1.0)",
        // so an exact-text query matches only the Source row.
        expect(screen.getByText('Anchor')).toBeInTheDocument();
    });

    test('should fall back to the Anchor IDL with a warning badge + tooltip when no PMP IDL exists', async () => {
        mockProgramIdls({ anchorIdl: createMockAnchorIdl() });

        renderCard();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
        });
        // Single badge: standard + era + spec version; the fallback info icon sits alongside.
        expect(screen.getByText('Anchor 0.30.1 (version 0.1.0)')).toBeInTheDocument();
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

        renderCard();

        await waitFor(() => {
            expect(screen.getByText('Codama (version 1.2.11)')).toBeInTheDocument();
        });
        // No fallback marker and no Anchor tab — the Anchor source is not reachable from the card.
        expect(screen.queryByLabelText('Fallback IDL source')).not.toBeInTheDocument();
        expectNoSourceTabs();

        const castawayUrl = openCastawayUrl();
        expect(castawayUrl.searchParams.get('idlSource')).toBe('program-metadata');
    });

    test('should show the PMP IDL when both sources are Anchor IDLs', async () => {
        const pmpIdl = createMockAnchorIdl();
        mockProgramIdls({
            anchorIdl: createMockAnchorIdl(),
            programMetadataIdl: { ...pmpIdl, metadata: { ...pmpIdl.metadata, name: 'pmp_program' } },
            programMetadataIdlAddress: PMP_PDA,
        });

        renderCard();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
        });
        expect(screen.getByText('PMP')).toBeInTheDocument();
        expect(screen.getByText('Pmp Program')).toBeInTheDocument();
        expect(screen.queryByLabelText('Fallback IDL source')).not.toBeInTheDocument();

        const castawayUrl = openCastawayUrl();
        expect(castawayUrl.searchParams.get('idlSource')).toBe('program-metadata');
    });

    test('should render the mismatch warning when the displayed IDL program id does not match', async () => {
        mockProgramIdls({
            // Imitate a malicious IDL whose address differs from the program being viewed.
            anchorIdl: createMockAnchorIdl(Keypair.generate().publicKey.toBase58()),
        });

        renderCard();

        await waitFor(() => {
            expect(screen.getByText('IDL Program ID Mismatch')).toBeInTheDocument();
        });
        expect(screen.getByText(/does not match the program being viewed/)).toBeInTheDocument();
        // The IDL content (and its tooling) is hidden behind the warning.
        expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
    });

    test('should render the empty upload state when no IDL exists', async () => {
        mockProgramIdls({});

        renderCard();

        await waitFor(() => {
            expect(screen.getByText('Upload IDL')).toBeInTheDocument();
        });
        expect(screen.getByText(/doesn't have an IDL yet/)).toBeInTheDocument();
        expect(screen.queryByRole('tab')).not.toBeInTheDocument();
        // The IDL history link lives in the header, so it's offered even when the card has no IDL.
        expect(screen.getByRole('link', { name: /IDL history/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /MCP & API/i })).toBeInTheDocument();
    });

    test('should offer to add a custom IDL in the empty upload state', async () => {
        mockProgramIdls({});

        renderCard();

        expect(await screen.findByRole('button', { name: 'Add custom IDL' })).toBeInTheDocument();
    });

    test('should keep the selector in the empty upload state after the user picks the on-chain IDL', async () => {
        mockProgramIdls({ customIdlRecord: customIdlRecord('onChain') });

        renderCard();

        expect(await screen.findByText(/doesn't have an IDL yet/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'IDL: None' })).toBeInTheDocument();
    });

    test('should link to the idl.solana.com history view for the program', async () => {
        mockProgramIdls({ programMetadataIdl: createMockProgramMetadataIdl() });

        renderCard();

        const link = await screen.findByRole('link', { name: /IDL history/i });
        const url = new URL(link.getAttribute('href') as string);
        expect(url.origin).toBe('https://idl.solana.com');
        expect(url.searchParams.get('programId')).toBe(programId);
        expect(url.searchParams.get('mode')).toBe('history');
        expect(url.searchParams.get('cluster')).toBe('mainnet-beta');
    });

    test('should open the Orquestra project page behind the leaving-Explorer interstitial', async () => {
        mockProgramIdls({ programMetadataIdl: createMockProgramMetadataIdl() });

        renderCard();

        const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
        fireEvent.click(await screen.findByRole('button', { name: /MCP & API/i }));

        // The interstitial names the destination and shows the full URL before anything opens.
        expect(screen.getByText('Leaving Solana Explorer')).toBeInTheDocument();
        expect(screen.getByText(/going to Orquestra/)).toBeInTheDocument();
        expect(windowOpenSpy).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

        expect(windowOpenSpy).toHaveBeenCalledWith(
            `https://orquestra.dev/project/${programId}`,
            '_blank',
            'noopener,noreferrer',
        );
        windowOpenSpy.mockRestore();
    });

    test('should not open Orquestra when the interstitial is cancelled', async () => {
        mockProgramIdls({ programMetadataIdl: createMockProgramMetadataIdl() });

        renderCard();

        const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
        fireEvent.click(await screen.findByRole('button', { name: /MCP & API/i }));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        await waitFor(() => {
            expect(screen.queryByText('Leaving Solana Explorer')).not.toBeInTheDocument();
        });
        expect(windowOpenSpy).not.toHaveBeenCalled();
        windowOpenSpy.mockRestore();
    });

    test('should offer no custom IDL action when the store cannot read the browser storage', async () => {
        mockProgramIdls({ programMetadataIdl: createMockProgramMetadataIdl(), stored: { status: 'failed' } });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>,
        );

        expect(await screen.findByText('Codama (version 1.2.11)')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Add custom IDL' })).not.toBeInTheDocument();
    });

    test('should offer to add a custom IDL when the program has none', async () => {
        mockProgramIdls({ programMetadataIdl: createMockProgramMetadataIdl() });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>,
        );

        fireEvent.click(await screen.findByRole('button', { name: 'Add custom IDL' }));
        expect(await screen.findByRole('dialog', { name: 'Add a custom IDL' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^IDL:/ })).not.toBeInTheDocument();
    });

    test('should render a selected custom IDL with its source and file, and no SDK generator', async () => {
        mockProgramIdls({
            customIdlRecord: customIdlRecord('custom'),
            programMetadataIdl: createMockProgramMetadataIdl(),
        });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>,
        );

        expect(await screen.findByRole('button', { name: 'IDL: Custom' })).toBeInTheDocument();
        expect(screen.getByText('Anchor 0.30.1 (version 0.1.0)')).toBeInTheDocument();
        expect(screen.getByText('Custom', { selector: 'dd' })).toBeInTheDocument();
        expect(screen.getByText('my-idl.json')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Add custom IDL' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Download' }));
        expect(screen.getByRole('button', { name: 'Download IDL' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Generate SDK' })).not.toBeInTheDocument();
    });

    test('should render the custom IDL of a program with no on-chain IDL and set its source for Interactive IDL', async () => {
        mockProgramIdls({ customIdlRecord: customIdlRecord('custom') });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>,
        );

        expect(await screen.findByRole('button', { name: 'IDL: Custom' })).toBeInTheDocument();
        expect(screen.getByText('Custom', { selector: 'dd' })).toBeInTheDocument();
        await waitFor(() => expect(getDefaultStore().get(originalIdlSourceAtom)).toBe('custom'));
    });

    test('should track the IDL view with its source, again when the user leaves the custom IDL', async () => {
        const card = () => (
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>
        );
        mockProgramIdls({ anchorIdl: createMockAnchorIdl(), customIdlRecord: customIdlRecord('custom') });
        const { rerender } = render(card());
        await waitFor(() =>
            expect(trackEvent).toHaveBeenCalledWith('iidl_anchor_idl_viewed', {
                idl_source: 'custom',
                program_id: programId,
            }),
        );

        mockProgramIdls({ anchorIdl: createMockAnchorIdl(), customIdlRecord: customIdlRecord('onChain') });
        rerender(card());

        await waitFor(() =>
            expect(trackEvent).toHaveBeenCalledWith('iidl_anchor_idl_viewed', {
                idl_source: 'anchor',
                program_id: programId,
            }),
        );
    });

    test('should set the on-chain source for Interactive IDL after the user leaves the custom IDL', async () => {
        const card = () => (
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>
        );
        mockProgramIdls({
            customIdlRecord: customIdlRecord('custom'),
            programMetadataIdl: createMockProgramMetadataIdl(),
        });
        const { rerender } = render(card());
        await waitFor(() => expect(getDefaultStore().get(originalIdlSourceAtom)).toBe('custom'));

        mockProgramIdls({
            customIdlRecord: customIdlRecord('onChain'),
            programMetadataIdl: createMockProgramMetadataIdl(),
        });
        rerender(card());

        await waitFor(() => expect(getDefaultStore().get(originalIdlSourceAtom)).toBe(IdlVariant.ProgramMetadata));
    });

    test('should render the selected on-chain IDL while the program keeps a custom IDL', async () => {
        mockProgramIdls({
            customIdlRecord: customIdlRecord('onChain'),
            programMetadataIdl: createMockProgramMetadataIdl(),
        });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>,
        );

        expect(await screen.findByRole('button', { name: 'IDL: PMP' })).toBeInTheDocument();
        expect(screen.getByText('Codama (version 1.2.11)')).toBeInTheDocument();
    });

    test('should render the on-chain IDL after the user leaves a custom IDL that failed to render', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const brokenIdl = {
            ...createMockAnchorIdl(),
            metadata: { ...createMockAnchorIdl().metadata, name: mocks.brokenIdlName },
        };
        mockProgramIdls({ anchorIdl: createMockAnchorIdl(), customIdlRecord: customIdlRecord('custom', brokenIdl) });
        const card = () => (
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>
        );
        const { rerender } = render(card());
        expect(await screen.findByText(/Error rendering Anchor IDL/)).toBeInTheDocument();

        mockProgramIdls({ anchorIdl: createMockAnchorIdl(), customIdlRecord: customIdlRecord('onChain', brokenIdl) });
        rerender(card());

        expect(await screen.findByTestId('formatted-anchor_program')).toBeInTheDocument();
        expect(screen.queryByText(/Error rendering Anchor IDL/)).not.toBeInTheDocument();
        consoleError.mockRestore();
    });

    test('should render the on-chain IDL after the user leaves a custom IDL on its Interact tab', async () => {
        const modernIdl = { ...anchorModernIdl, address: programId } as Idl;
        const legacyIdl = {
            ...anchorLegacyIdl,
            metadata: { ...anchorLegacyIdl.metadata, address: programId },
        } as unknown as SupportedIdl;
        const card = () => (
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>
        );
        mockProgramIdls({ anchorIdl: legacyIdl, customIdlRecord: customIdlRecord('custom', modernIdl) });
        const { rerender } = render(card());
        fireEvent.click(await screen.findByText('Interact'));
        expect(screen.getByText('Interactive IDL')).toBeInTheDocument();

        mockProgramIdls({ anchorIdl: legacyIdl, customIdlRecord: customIdlRecord('onChain', modernIdl) });
        rerender(card());

        expect(await screen.findByRole('button', { name: 'IDL: Anchor' })).toBeInTheDocument();
        expect(screen.getByTestId('formatted-amm_v3')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /^Instructions/ })).toHaveAttribute('aria-selected', 'true');
        expect(screen.queryByText(/Error rendering Anchor IDL/)).not.toBeInTheDocument();
    });

    test('should open the first tab after the user leaves a custom IDL on a tab that the on-chain IDL lacks', async () => {
        const customIdl = { ...anchorModernIdl, address: programId } as Idl;
        const onChainIdl = { ...customIdl, events: [] };
        const card = () => (
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>
        );
        mockProgramIdls({ anchorIdl: onChainIdl, customIdlRecord: customIdlRecord('custom', customIdl) });
        const { rerender } = render(card());
        fireEvent.click(await screen.findByRole('tab', { name: /^Events/ }));
        expect(screen.getByRole('tab', { name: /^Events/ })).toHaveAttribute('aria-selected', 'true');

        mockProgramIdls({ anchorIdl: onChainIdl, customIdlRecord: customIdlRecord('onChain', customIdl) });
        rerender(card());

        expect(await screen.findByRole('button', { name: 'IDL: Anchor' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /^Instructions/ })).toHaveAttribute('aria-selected', 'true');
    });

    test('should keep the first tab when the user searches after leaving a tab that the on-chain IDL lacks', async () => {
        const customIdl = { ...anchorModernIdl, address: programId } as Idl;
        const onChainIdl = { ...customIdl, events: [] };
        const card = () => (
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>
        );
        mockProgramIdls({ anchorIdl: onChainIdl, customIdlRecord: customIdlRecord('custom', customIdl) });
        const { rerender } = render(card());
        fireEvent.click(await screen.findByRole('tab', { name: /^Events/ }));
        mockProgramIdls({ anchorIdl: onChainIdl, customIdlRecord: customIdlRecord('onChain', customIdl) });
        rerender(card());
        expect(await screen.findByRole('button', { name: 'IDL: Anchor' })).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'swap' } });

        expect(screen.getByRole('tab', { name: /^Instructions/ })).toHaveAttribute('aria-selected', 'true');
    });

    test('should keep the open tab while a search matches nothing on it', async () => {
        mockProgramIdls({ anchorIdl: { ...anchorModernIdl, address: programId } as Idl });
        renderCard();
        fireEvent.click(await screen.findByRole('tab', { name: /^Events/ }));

        fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'TickArrayBitmapExtension' } });

        expect(screen.getByRole('tab', { name: /^Events/ })).toBeDisabled();
        expect(screen.getByRole('tab', { name: /^Events/ })).toHaveAttribute('aria-selected', 'true');
    });

    test('should render a custom Codama IDL after the on-chain Codama IDL failed to render', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const onChainIdl = createMockProgramMetadataIdl() as CodamaIdl;
        const brokenIdl = { ...onChainIdl, program: { ...onChainIdl.program, name: mocks.brokenIdlName } } as CodamaIdl;
        const card = () => (
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>
        );
        mockProgramIdls({ programMetadataIdl: brokenIdl });
        const { rerender } = render(card());
        expect(await screen.findByText(/Error rendering Codama IDL/)).toBeInTheDocument();

        const customIdl = {
            ...codamaFixture,
            program: { ...codamaFixture.program, publicKey: programId },
        } as unknown as CodamaIdl;
        mockProgramIdls({
            customIdlRecord: {
                customIdl: { idl: customIdl, programAddress: programId, standard: 'Codama' } as CustomIdl,
                origin: { kind: 'pasted' },
                selected: 'custom',
            },
            programMetadataIdl: brokenIdl,
        });
        rerender(card());

        expect(await screen.findByTestId('formatted-programMetadata')).toBeInTheDocument();
        expect(screen.queryByText(/Error rendering Codama IDL/)).not.toBeInTheDocument();
        consoleError.mockRestore();
    });

    test('should show the loading card instead of an on-chain IDL while the store reads the selection', async () => {
        mockProgramIdls({ programMetadataIdl: createMockProgramMetadataIdl(), stored: { status: 'loading' } });

        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>,
        );

        expect(await screen.findByText('Loading program IDL')).toBeInTheDocument();
        expect(screen.queryByText('Codama (version 1.2.11)')).not.toBeInTheDocument();
    });

    test('should send no section name from a custom IDL when the user expands an instruction on its Interact tab', async () => {
        const modernIdl = { ...anchorModernIdl, address: programId } as Idl;
        mockProgramIdls({ customIdlRecord: customIdlRecord('custom', modernIdl) });
        render(
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>,
        );
        fireEvent.click(await screen.findByText('Interact'));
        vi.mocked(trackEvent).mockClear();

        fireEvent.click(screen.getByRole('button', { name: 'Interactive IDL' }));

        expect(vi.mocked(trackEvent).mock.calls).toEqual([
            [
                'iidl_anchor_sections_expanded',
                { expanded_sections_count: 1, idl_source: 'custom', program_id: 'mock-program' },
            ],
        ]);
    });

    test('should send no section name from a custom IDL after the user selects the on-chain IDL on the Interact tab', async () => {
        const modernIdl = { ...anchorModernIdl, address: programId } as Idl;
        const onChainIdl = { ...modernIdl, instructions: modernIdl.instructions.slice(1) };
        const card = () => (
            <ClusterProvider>
                <IdlCard programId={programId} />
            </ClusterProvider>
        );
        mockProgramIdls({ anchorIdl: onChainIdl, customIdlRecord: customIdlRecord('custom', modernIdl) });
        const { rerender } = render(card());
        fireEvent.click(await screen.findByText('Interact'));
        fireEvent.click(screen.getByRole('button', { name: 'Interactive IDL' }));

        mockProgramIdls({ anchorIdl: onChainIdl, customIdlRecord: customIdlRecord('onChain', modernIdl) });
        rerender(card());
        expect(await screen.findByRole('button', { name: 'IDL: Anchor' })).toBeInTheDocument();
        vi.mocked(trackEvent).mockClear();
        fireEvent.click(screen.getByRole('button', { name: 'Interactive IDL' }));

        expect(trackEvent).toHaveBeenCalledWith(
            'iidl_anchor_sections_expanded',
            expect.objectContaining({ expanded_sections_count: 1, idl_source: 'anchor' }),
        );
    });

    function customIdlRecord(selected: CustomIdlRecord['selected'], idl: Idl = createMockAnchorIdl()): CustomIdlRecord {
        return {
            customIdl: { idl, programAddress: programId, standard: 'Anchor' } as CustomIdl,
            origin: { fileName: 'my-idl.json', kind: 'file' },
            selected,
        };
    }
});
