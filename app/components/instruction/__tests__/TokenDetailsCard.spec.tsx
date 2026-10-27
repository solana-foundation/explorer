import { gen } from '@__fixtures__/gen';
import { inspectorSurface } from '@components/inspector/inspector-surface';
import { InstructionSurfaceProvider, toInstructionNode } from '@entities/instruction-card';
import { isParsedInstruction } from '@entities/instruction-parser';
import { useMintAccountInfo, useTokenAccountInfo } from '@providers/accounts';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import type { ReadonlyUint8Array } from '@solana/kit';
import { type ParsedInstruction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    getInitializeGroupMemberPointerInstructionDataEncoder,
    getInitializeGroupPointerInstructionDataEncoder,
    getInitializeMetadataPointerInstructionDataEncoder,
    getInitializeTokenGroupInstructionDataEncoder,
    getUpdateTokenGroupMaxSizeInstructionDataEncoder,
    getUpdateTokenGroupUpdateAuthorityInstructionDataEncoder,
    getUpdateTokenMetadataUpdateAuthorityInstructionDataEncoder,
} from '@solana-program/token-2022';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type CardRow, readCardRows, renderTxCard, renderWithProviders } from '@/app/__tests__/card-harness';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';
import { getTokenInfo } from '@/app/utils/token-info';

import { TokenDetailsCard } from '../token/TokenDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

vi.mock('@providers/accounts', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/accounts')>()),
    useFetchAccountInfo: () => vi.fn(),
    useMintAccountInfo: vi.fn(),
    useTokenAccountInfo: vi.fn(),
}));

vi.mock('@/app/utils/token-info', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/utils/token-info')>()),
    getTokenInfo: vi.fn(),
}));

const [SOURCE, DESTINATION, AUTHORITY, MINT, SIGNER_1, SIGNER_2] = Array.from({ length: 6 }, (_, n) =>
    gen.publicKey(n + 1),
);
const PROGRAM_ROW: CardRow = ['Program', TOKEN_PROGRAM_ID.toBase58()];
const PROGRAM_2022_ROW: CardRow = ['Program', TOKEN_2022_PROGRAM_ID.toBase58()];

describe('TokenDetailsCard', () => {
    beforeEach(() => {
        vi.mocked(useTokenAccountInfo).mockReturnValue(undefined);
        vi.mocked(useMintAccountInfo).mockReturnValue(undefined);
        vi.mocked(getTokenInfo).mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it.each([
        { render: renderTxCard, surface: 'tx page' },
        { render: renderInspectorCard, surface: 'inspector' },
    ])('should render the Transfer Checked rows on the $surface surface', async ({ render }) => {
        render(
            card('transferChecked', {
                authority: AUTHORITY.toBase58(),
                destination: DESTINATION.toBase58(),
                mint: MINT.toBase58(),
                source: SOURCE.toBase58(),
                tokenAmount: { amount: '1500000', decimals: 6, uiAmountString: '1.5' },
            }),
        );

        await waitFor(() => {
            expect(readCardRows()).toEqual([
                PROGRAM_ROW,
                ['Authority', AUTHORITY.toBase58()],
                ['Destination', DESTINATION.toBase58()],
                ['Mint', MINT.toBase58()],
                ['Source', SOURCE.toBase58()],
                ['Amount', '1.500000'],
            ]);
        });
        expect(screen.getByText('Token Program: Transfer (Checked)')).toBeInTheDocument();
    });

    it('should show the amount with the decimals and symbol of the mint behind the source account', async () => {
        vi.mocked(useTokenAccountInfo).mockImplementation(account =>
            account === SOURCE.toBase58() ? ({ mint: MINT } as ReturnType<typeof useTokenAccountInfo>) : undefined,
        );
        vi.mocked(useMintAccountInfo).mockImplementation(mint =>
            mint === MINT.toBase58() ? ({ decimals: 6 } as ReturnType<typeof useMintAccountInfo>) : undefined,
        );
        vi.mocked(getTokenInfo).mockImplementation(async mint =>
            mint.equals(MINT) ? ({ symbol: 'USDC' } as Awaited<ReturnType<typeof getTokenInfo>>) : undefined,
        );

        renderTxCard(transfer('1500000'));

        await waitFor(() => {
            expect(readCardRows()).toEqual([
                PROGRAM_ROW,
                ['Token', MINT.toBase58()],
                ['Amount', '1.500000 USDC'],
                ['Authority', AUTHORITY.toBase58()],
                ['Destination', DESTINATION.toBase58()],
                ['Source', SOURCE.toBase58()],
            ]);
        });
        expect(useTokenAccountInfo).toHaveBeenCalledWith(SOURCE.toBase58());
    });

    it('should show the raw amount while the mint decimals are unknown', async () => {
        renderTxCard(transfer('1500000'));

        await waitFor(() => {
            expect(readCardRows()).toContainEqual(['Amount (raw)', '1,500,000']);
        });
    });

    it('should keep every digit of a raw amount above the safe integer range', async () => {
        renderTxCard(transfer('18446744073709551615'));

        await waitFor(() => {
            expect(readCardRows()).toContainEqual(['Amount (raw)', '18,446,744,073,709,551,615']);
        });
    });

    it('should give each multisig signer its own row', async () => {
        renderTxCard(
            card('transfer', {
                amount: '1',
                destination: DESTINATION.toBase58(),
                multisigAuthority: AUTHORITY.toBase58(),
                signers: [SIGNER_1.toBase58(), SIGNER_2.toBase58()],
                source: SOURCE.toBase58(),
            }),
        );

        await waitFor(() => {
            expect(readCardRows()).toEqual(
                expect.arrayContaining([
                    ['MultisigAuthority', AUTHORITY.toBase58()],
                    ['Signers - #1', SIGNER_1.toBase58()],
                    ['Signers - #2', SIGNER_2.toBase58()],
                ]),
            );
        });
    });

    it('should show (none) for an authority that the instruction removes', async () => {
        renderTxCard(
            card('setAuthority', {
                authority: AUTHORITY.toBase58(),
                authorityType: 'freezeAccount',
                mint: MINT.toBase58(),
                newAuthority: null,
            }),
        );

        await waitFor(() => {
            expect(readCardRows()).toEqual([
                PROGRAM_ROW,
                ['Authority', AUTHORITY.toBase58()],
                ['AuthorityType', 'freezeAccount'],
                ['Mint', MINT.toBase58()],
                ['NewAuthority', '(none)'],
            ]);
        });
    });

    it('should render an Initialize Token Group from the RPC without an update authority', async () => {
        renderTxCard(
            card(
                'initializeTokenGroup',
                {
                    group: SOURCE.toBase58(),
                    maxSize: 300,
                    mint: MINT.toBase58(),
                    mintAuthority: AUTHORITY.toBase58(),
                    updateAuthority: null,
                },
                TOKEN_2022_PROGRAM_ID,
            ),
        );

        await waitFor(() => {
            expect(readCardRows()).toEqual([
                PROGRAM_2022_ROW,
                ['Group', SOURCE.toBase58()],
                ['MaxSize', '300'],
                ['Mint', MINT.toBase58()],
                ['MintAuthority', AUTHORITY.toBase58()],
                ['UpdateAuthority', '(none)'],
            ]);
        });
    });

    it('should render an Update Token Metadata Authority from the RPC without a new authority', async () => {
        renderTxCard(
            card(
                'updateTokenMetadataAuthority',
                {
                    metadata: MINT.toBase58(),
                    newAuthority: null,
                    updateAuthority: AUTHORITY.toBase58(),
                },
                TOKEN_2022_PROGRAM_ID,
            ),
        );

        await waitFor(() => {
            expect(readCardRows()).toEqual([
                PROGRAM_2022_ROW,
                ['Metadata', MINT.toBase58()],
                ['NewAuthority', '(none)'],
                ['UpdateAuthority', AUTHORITY.toBase58()],
            ]);
        });
    });

    it('should show a number as text', async () => {
        renderTxCard(
            card('initializeMint2', {
                decimals: 0,
                mint: MINT.toBase58(),
                mintAuthority: AUTHORITY.toBase58(),
            }),
        );

        await waitFor(() => {
            expect(readCardRows()).toContainEqual(['Decimals', '0']);
        });
    });

    it('should show a boolean as true or false', async () => {
        renderTxCard(
            card(
                'removeTokenMetadataKey',
                {
                    idempotent: true,
                    key: 'color',
                    metadata: MINT.toBase58(),
                    updateAuthority: AUTHORITY.toBase58(),
                },
                TOKEN_2022_PROGRAM_ID,
            ),
        );

        await waitFor(() => {
            expect(readCardRows()).toContainEqual(['Idempotent', 'true']);
        });
    });

    it('should show each extension type of a list on its own line', async () => {
        renderTxCard(
            card(
                'getAccountDataSize',
                { extensionTypes: ['transferFeeAmount', 'memoTransfer'], mint: MINT.toBase58() },
                TOKEN_2022_PROGRAM_ID,
            ),
        );

        await waitFor(() => {
            expect(screen.getByText('Token-2022 Program: Get Account Data Size')).toBeInTheDocument();
        });
        // eslint-disable-next-line testing-library/no-node-access -- a preformatted value has no role to query by
        expect(document.querySelector('pre')?.textContent).toBe('transferFeeAmount\nmemoTransfer');
    });

    it('should throw on an instruction type it does not know, for the section to show the unknown card', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(() => renderTxCard(card('notAnInstruction', {}))).toThrow();
    });
});

describe('TokenDetailsCard with a Token-2022 instruction in byte form', () => {
    beforeEach(() => {
        vi.mocked(useTokenAccountInfo).mockReturnValue(undefined);
        vi.mocked(useMintAccountInfo).mockReturnValue(undefined);
    });

    it.each([
        {
            accounts: [SOURCE, MINT, AUTHORITY],
            data: getInitializeTokenGroupInstructionDataEncoder().encode({ maxSize: 100n, updateAuthority: null }),
            rows: [
                PROGRAM_2022_ROW,
                ['Group', SOURCE.toBase58()],
                ['MaxSize', '100'],
                ['Mint', MINT.toBase58()],
                ['MintAuthority', AUTHORITY.toBase58()],
            ],
            title: 'Initialize Token Group',
        },
        {
            accounts: [SOURCE, AUTHORITY],
            data: getUpdateTokenGroupMaxSizeInstructionDataEncoder().encode({ maxSize: 7n }),
            rows: [
                PROGRAM_2022_ROW,
                ['Group', SOURCE.toBase58()],
                ['MaxSize', '7'],
                ['UpdateAuthority', AUTHORITY.toBase58()],
            ],
            title: 'Update Token Group Max Size',
        },
        {
            accounts: [SOURCE, AUTHORITY],
            data: getUpdateTokenGroupUpdateAuthorityInstructionDataEncoder().encode({ newUpdateAuthority: null }),
            rows: [PROGRAM_2022_ROW, ['Group', SOURCE.toBase58()], ['UpdateAuthority', AUTHORITY.toBase58()]],
            title: 'Update Token Group Update Authority',
        },
        {
            accounts: [SOURCE, AUTHORITY],
            data: getUpdateTokenMetadataUpdateAuthorityInstructionDataEncoder().encode({ newUpdateAuthority: null }),
            rows: [PROGRAM_2022_ROW, ['Metadata', SOURCE.toBase58()], ['UpdateAuthority', AUTHORITY.toBase58()]],
            title: 'Update Token Metadata Update Authority',
        },
        {
            accounts: [MINT],
            data: getInitializeMetadataPointerInstructionDataEncoder().encode({
                authority: null,
                metadataAddress: null,
            }),
            rows: [PROGRAM_2022_ROW, ['Mint', MINT.toBase58()]],
            title: 'Initialize Metadata Pointer',
        },
        {
            accounts: [MINT],
            data: getInitializeGroupPointerInstructionDataEncoder().encode({ authority: null, groupAddress: null }),
            rows: [PROGRAM_2022_ROW, ['Mint', MINT.toBase58()]],
            title: 'Initialize Group Pointer',
        },
        {
            accounts: [MINT],
            data: getInitializeGroupMemberPointerInstructionDataEncoder().encode({
                authority: null,
                memberAddress: null,
            }),
            rows: [PROGRAM_2022_ROW, ['Mint', MINT.toBase58()]],
            title: 'Initialize Group Member Pointer',
        },
    ])('should render $title as the parser slice decodes it', async ({ accounts, data, rows, title }) => {
        renderTxCard(byteFormCard(data, accounts));

        await waitFor(() => {
            expect(readCardRows()).toEqual(rows);
        });
        expect(screen.getByText(`Token-2022 Program: ${title}`)).toBeInTheDocument();
    });

    it('should show the accounts of the raw instruction in the inspector Raw view', async () => {
        const data = getInitializeMetadataPointerInstructionDataEncoder().encode({
            authority: null,
            metadataAddress: null,
        });
        renderInspectorCard(byteFormCard(data, [MINT]));

        await userEvent.click(await screen.findByRole('button', { name: 'Raw' }));

        expect(readCardRows()).toContainEqual(['Account #1', MINT.toBase58()]);
    });
});

function transfer(amount: string) {
    return card('transfer', {
        amount,
        authority: AUTHORITY.toBase58(),
        destination: DESTINATION.toBase58(),
        source: SOURCE.toBase58(),
    });
}

function card(type: string, info: Record<string, unknown>, programId: PublicKey = TOKEN_PROGRAM_ID) {
    const ix: ParsedInstruction = {
        parsed: { info, type },
        program: programId.equals(TOKEN_PROGRAM_ID) ? 'spl-token' : 'spl-token-2022',
        programId,
    };
    return <TokenDetailsCard node={toInstructionNode({ index: 0, ix })} ix={ix} />;
}

function byteFormCard(data: ReadonlyUint8Array, accounts: PublicKey[]) {
    const raw = new TransactionInstruction({
        data: Buffer.from(data),
        keys: accounts.map(pubkey => ({ isSigner: false, isWritable: false, pubkey })),
        programId: TOKEN_2022_PROGRAM_ID,
    });
    const ix = instructionParserDispatcher.fromTransactionInstruction(raw);
    if (!isParsedInstruction(ix)) throw new Error('The Token-2022 slice did not decode the fixture');
    return <TokenDetailsCard node={toInstructionNode({ index: 0, ix, raw })} ix={ix} />;
}

function renderInspectorCard(ui: JSX.Element) {
    return renderWithProviders(
        <InstructionSurfaceProvider surface={inspectorSurface(() => undefined)}>{ui}</InstructionSurfaceProvider>,
    );
}
