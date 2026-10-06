/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import type { AccountInfo } from '@solana/web3.js';
import { generated, PROGRAM_ID } from '@sqds/multisig';
import { screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import useSWR, { type Key } from 'swr';
import { describe, expect, type Mock, test, vi } from 'vitest';

import { readCell, renderWithProviders } from '@/app/__tests__/card-harness';
import * as stubs from '@/app/__tests__/mock-stubs';
import { createV1TransactionBytes } from '@/app/entities/transaction-data/__fixtures__/wire-transactions';
import { toBase64 } from '@/app/shared/lib/bytes';
import { parseTransactionBytes } from '@/app/shared/lib/parse-transaction-bytes';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { ADDRESS_TABLE_LOOKUPS_CARD_TITLE } from '../AddressTableLookupsCard';
import { TransactionInspectorPage, vaultMessageToVersionedMessage } from '../InspectorPage';

vi.mock('swr', () => ({
    __esModule: true,
    default: vi.fn(() => ({ data: undefined })),
}));

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

beforeEach(() => {
    // The page fetches the /api/idl-latest route; an empty payload means no IDL.
    vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(JSON.stringify({}), { headers: { 'Content-Type': 'application/json' } })),
    );
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('TransactionInspectorPage with Squads Transaction', () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        setParam('squadsTx', 'ASwDJP5mzxV1dfov2eQz5WAVEy833nwK17VLcjsrZsZf');
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    test('should render without crashing and load Squads account data', async () => {
        const { renderWithContext, specificAccountKey, squadsAccountInfo } = setup();
        const mockSWR = await import('swr');
        (mockSWR.default as unknown as Mock).mockImplementation((key: Key) => {
            if (Array.isArray(key) && key[0] === specificAccountKey[0] && key[1] === specificAccountKey[1]) {
                return {
                    data: [
                        vaultMessageToVersionedMessage(
                            generated.VaultTransaction.fromAccountInfo(squadsAccountInfo)[0].message,
                        ),
                    ],
                    error: null,
                    isLoading: false,
                };
            }
            return { data: null, error: null, isLoading: true };
        });

        renderWithContext();

        // The Overview card's Fee payer row shows the fee payer address (the address also appears in the
        // Account List, so match all occurrences).
        expect((await screen.findAllByText('F3S4PD17Eo3FyCMropzDLCpBFuQuBmufUVBBdKEHbQFT')).length).toBeGreaterThan(0);
        expect(screen.queryByText(/Inspector Input/i)).toBeNull();

        expect(screen.getByText(/Account List/i)).not.toBeNull();
        // The card title splits programName and "Instruction" into separate spans so the
        // programName can truncate independently on mobile; multiple matches are expected.
        expect(screen.getAllByText(/BPF Upgradeable Loader/i).length).toBeGreaterThan(0);
    });

    test('should render when account loading fails', async () => {
        const { renderWithContext, specificAccountKey } = setup();
        const mockSWR = await import('swr');

        (mockSWR.default as unknown as Mock).mockImplementation((key: Key) => {
            if (Array.isArray(key) && key[0] === specificAccountKey[0] && key[1] === specificAccountKey[1]) {
                return {
                    data: null,
                    error: new Error('Failed to load account'),
                    isLoading: false,
                };
            }
            return { data: null, error: null, isLoading: true };
        });

        renderWithContext();

        expect(await screen.findByText(/Error loading Squads transaction/i)).toBeInTheDocument();
    });

    test('should render Squads transaction with lookup table without crashing', async () => {
        const { renderWithContext, specificAccountKey, squadsLookupTableAccountInfo } = setup();
        const mockSWR = await import('swr');

        (mockSWR.default as unknown as Mock).mockImplementation((key: Key) => {
            if (Array.isArray(key) && key[0] === specificAccountKey[0] && key[1] === specificAccountKey[1]) {
                return {
                    data: [
                        vaultMessageToVersionedMessage(
                            generated.VaultTransaction.fromAccountInfo(squadsLookupTableAccountInfo)[0].message,
                        ),
                    ],
                    error: null,
                    isLoading: false,
                };
            }
            return { data: null, error: null, isLoading: true };
        });

        renderWithContext();

        // The Overview card's Fee payer row shows the fee payer address (also present in the Account List).
        expect((await screen.findAllByText('62gRsAdA6dcbf4Frjp7YRFLpFgdGu8emAACcnnREX3L3')).length).toBeGreaterThan(0);
        expect(screen.queryByText(/Inspector Input/i)).toBeNull();

        // Note: Instructions section may show LoadingCard if lookup tables aren't fully resolved,
        // but the main transaction data is correctly displayed
        expect(screen.getByText(/Account List/i)).not.toBeNull();
    });
});

describe('TransactionInspectorPage with a ?message= param', () => {
    beforeEach(() => {
        vi.mocked(useSWR).mockReturnValue({ data: undefined } as ReturnType<typeof useSWR>);
    });

    test('should render a v1 message in the overview', async () => {
        const { messageBytes } = parseTransactionBytes(
            createV1TransactionBytes({ computeUnitLimit: 300_000, priorityFeeLamports: 50n }),
        );
        setParam('message', encodeURIComponent(toBase64(messageBytes)));

        renderPage({ transactions: false });

        expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument();
        expect(screen.queryByText('Inspector Input')).toBeNull();
        expect(screen.getByText('v1')).toBeInTheDocument();
        expect(screen.getByText('Compute unit limit')).toBeInTheDocument();
        expect(screen.getByText('300,000')).toBeInTheDocument();
        expect(screen.getByText('Priority fee (total)')).toBeInTheDocument();
        expect(screen.getByText('Account List')).toBeInTheDocument();
        // v1 messages carry static accounts only, so neither the lookups card nor the
        // lookup-derived account badges appear.
        expect(screen.queryByText(ADDRESS_TABLE_LOOKUPS_CARD_TITLE)).toBeNull();
        expect(screen.queryByText('Address Table Lookup')).toBeNull();
    });

    test('should render a SystemProgram::CreateAccount instruction', async () => {
        setParam('message', decodeURIComponent(stubs.systemProgramCreateAccountQueryParam));

        renderPage();

        await waitFor(() => {
            expect(screen.queryByText(/Inspector Input/i)).toBeNull();
        });
        await waitFor(() => {
            expect(screen.queryByText(/Loading/i)).toBeNull();
        });
        expect(screen.getByText(/System Program: Create Account/i)).toBeInTheDocument();
        await waitFor(() => {
            expect(readCell('Program')).toMatch(/System Program/);
        });
        expect(readCell('From Address')).toMatch(/paykgcZ547qCd1sm3kBn83t9Fnr2hxM6anLBXhV7Fhn/);
        expect(readCell('New Address')).toMatch(/recvKuUhe9nsQ4QzrW68rTnzFT2S2dGmBKFNRfQB4Lp/);
        expect(readCell('Transfer Amount (SOL)')).toMatch(/0.001/);
        expect(readCell('Allocated Data Size')).toMatch(/100 byte\(s\)/);
        expect(readCell('Assigned Program Id')).toMatch(/Associated Token Program/);
    });
});

function setParam(name: string, value: string) {
    vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams({ [name]: value }) as unknown as ReturnType<typeof useSearchParams>,
    );
}

function renderPage(options: { transactions?: boolean } = {}) {
    return renderWithProviders(<TransactionInspectorPage showTokenBalanceChanges={false} />, {
        dispatcher: instructionParserDispatcher,
        ...options,
    });
}

function setup() {
    const renderWithContext = () => renderPage({ transactions: false });
    const specificAccountKey = [
        'squads-proposal',
        'ASwDJP5mzxV1dfov2eQz5WAVEy833nwK17VLcjsrZsZf',
        'https://api.mainnet-beta.solana.com',
    ];

    // From Squads transaction ASwDJP5mzxV1dfov2eQz5WAVEy833nwK17VLcjsrZsZf
    const squadsAccountInfo: AccountInfo<Buffer> = {
        data: Buffer.from(
            'qPqiZFEOos+fErS/xkrbJRCvXG3UbwrUsJlVxCt0e4xgzjQyewfzMULyaPFkYPsCiNMe9FN//udpL5PwKAM/1qdskrvY+9nLCAAAAAAAAAD/AP8AAAAAAQEECAAAANCjHLRKvgiq2AoZK5QSGOfYj5bTGybeyAspA1+XDrVyM90v0fImaE0NQYcSinPuk++6GJEe5cKJZ4w9p0mAYgkJKhPulcQcugimf1rGfo334doRYl4dZBN/j08jgwN/FDCuVi3sTsjyvqU+oP8oI/e92Q78flUtkwuKGo3ug/s7V4efG9ifzqH+b9ldMvB714n0oZVW1d6xudyfhcoWP+0CqPaRToihsOIQFT73Y64rAMK5PRbBJNLAU3oQBIAAAAan1RcZLFxRIYzJTD1K8X9Y2u4Im6H9ROPb2YoAAAAABqfVFxjHdMkoVmOYaR1etoteuKObS21cc1VbIQAAAAABAAAABQcAAAABAgMEBgcABAAAAAMAAAAAAAAA',
            'base64',
        ),
        executable: false,
        lamports: 1000000,
        owner: PROGRAM_ID,
    };

    // From Squads transaction D6zTKhuJdvU4aPcgnJrXhaL3AP54AGQKVaiQkikH7fwH
    const squadsLookupTableAccountInfo: AccountInfo<Buffer> = {
        data: Buffer.from(
            'qPqiZFEOos8bpNmzOFnIgq7HtFDkjs0zoH+RjHiREtlTMLrrxCnOoOcFvY3L4K/GkofeZWEMwteLWwiE+IC8lnd8Ck5flvyb3QQAAAAAAAD+AP8AAAAAAQEFBgAAAEq4mP2n8jYC4uvQ/2riMoE0PhxgqIF66HAqkgBn4/7YWvNmtUiOi7IxoG9Yg+DNwzaHxoGjbIgVzFpOmwEZBmf9dPjWz8/N7PpjzVI1TulkO4Egf8ZYe7WLo0OjhhrzoYQzUnBMSyxrGPE/4v6Xp81WeB65mgEPCx6Nm2doqmmMmJEqbWg9L9Do0t/Tr7QiU2rSPiAV6W0bNxo4qIu+aRNLpsNxnQkq2EAyNB4e5Vx8/7kaTXVN+Y+DEOMrcIenQgEAAAAGCgAAAAABAgMEBQcICQowAAAA9r57/qtrEp4AZc0dAAAAAL9A3h92lHzal8AhXk0xQ6drSpPcsjemGX1gSwpnAfeuAQAAAC2j9Rh4Ufp3UyACH6zJgVGpNk7XhltxlBh5LvHTkFE+AAAAAAUAAAA4LwgHBQ==',
            'base64',
        ),
        executable: false,
        lamports: 1000000,
        owner: PROGRAM_ID,
    };

    return {
        renderWithContext,
        specificAccountKey,
        squadsAccountInfo,
        squadsLookupTableAccountInfo,
    };
}
