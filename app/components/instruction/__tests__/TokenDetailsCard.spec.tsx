import { gen } from '@__fixtures__/gen';
import { InstructionNodeCard } from '@components/instruction/InstructionNodeCard';
import { inspectorSurface, InstructionSurfaceProvider, toInstructionNode } from '@entities/instruction-card';
import { isParsedInstruction } from '@entities/instruction-parser';
import { useMintAccountInfo, useTokenAccountInfo } from '@providers/accounts';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import type { ReadonlyUint8Array } from '@solana/kit';
import { type AccountMeta, type ParsedInstruction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    getCloseAccountInstructionDataEncoder,
    getTransferCheckedInstructionDataEncoder,
    getTransferInstructionDataEncoder,
} from '@solana-program/token';
import {
    getInitializeGroupMemberPointerInstructionDataEncoder,
    getInitializeGroupPointerInstructionDataEncoder,
    getInitializeMetadataPointerInstructionDataEncoder,
    getInitializeTokenGroupInstructionDataEncoder,
    getRemoveTokenMetadataKeyInstructionDataEncoder,
    getUpdateTokenGroupMaxSizeInstructionDataEncoder,
    getUpdateTokenGroupUpdateAuthorityInstructionDataEncoder,
    getUpdateTokenMetadataUpdateAuthorityInstructionDataEncoder,
} from '@solana-program/token-2022';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    type CardRow,
    readAddress,
    readCardRows,
    renderTxCard,
    renderWithProviders,
} from '@/app/__tests__/card-harness';
import { toKitAddress } from '@/app/shared/lib/web3js-compat';
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
const ACCOUNT_HEADER = ['Account Name', 'Address'];
const ARGUMENT_HEADER = ['Argument Name', 'Type', 'Value'];

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

    it('should name the type of a field that it has no row format for', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const info = { decimals: 0, extra: {}, mint: MINT.toBase58(), mintAuthority: AUTHORITY.toBase58() };

        expect(() => renderTxCard(card('initializeMint2', info))).toThrow(
            'Token instruction field extra of type object has no row format',
        );
    });
});

describe('TokenDetailsCard with an instruction in byte form', () => {
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
                ACCOUNT_HEADER,
                ['Group', SOURCE.toBase58()],
                ['Mint', MINT.toBase58()],
                ['MintAuthority', AUTHORITY.toBase58()],
                ARGUMENT_HEADER,
                ['maxSize', 'string', '100'],
            ],
            title: 'Initialize Token Group',
        },
        {
            accounts: [SOURCE, AUTHORITY],
            data: getUpdateTokenGroupMaxSizeInstructionDataEncoder().encode({ maxSize: 7n }),
            rows: [
                PROGRAM_2022_ROW,
                ACCOUNT_HEADER,
                ['Group', SOURCE.toBase58()],
                ['UpdateAuthority', AUTHORITY.toBase58()],
                ARGUMENT_HEADER,
                ['maxSize', 'string', '7'],
            ],
            title: 'Update Token Group Max Size',
        },
        {
            accounts: [SOURCE, AUTHORITY],
            data: getUpdateTokenGroupUpdateAuthorityInstructionDataEncoder().encode({ newUpdateAuthority: null }),
            rows: [
                PROGRAM_2022_ROW,
                ACCOUNT_HEADER,
                ['Group', SOURCE.toBase58()],
                ['UpdateAuthority', AUTHORITY.toBase58()],
            ],
            title: 'Update Token Group Update Authority',
        },
        {
            accounts: [SOURCE, AUTHORITY],
            data: getRemoveTokenMetadataKeyInstructionDataEncoder().encode({ idempotent: false, key: 'color' }),
            rows: [
                PROGRAM_2022_ROW,
                ACCOUNT_HEADER,
                ['Metadata', SOURCE.toBase58()],
                ['UpdateAuthority', AUTHORITY.toBase58()],
                ARGUMENT_HEADER,
                ['idempotent', 'boolean', 'false'],
                ['key', 'string', 'color'],
            ],
            title: 'Remove Token Metadata Key',
        },
        {
            accounts: [SOURCE, AUTHORITY],
            data: getUpdateTokenMetadataUpdateAuthorityInstructionDataEncoder().encode({ newUpdateAuthority: null }),
            rows: [
                PROGRAM_2022_ROW,
                ACCOUNT_HEADER,
                ['Metadata', SOURCE.toBase58()],
                ['UpdateAuthority', AUTHORITY.toBase58()],
            ],
            title: 'Update Token Metadata Update Authority',
        },
        {
            accounts: [MINT],
            data: getInitializeMetadataPointerInstructionDataEncoder().encode({
                authority: null,
                metadataAddress: null,
            }),
            rows: [PROGRAM_2022_ROW, ACCOUNT_HEADER, ['Mint', MINT.toBase58()]],
            title: 'Initialize Metadata Pointer',
        },
        {
            accounts: [MINT],
            data: getInitializeGroupPointerInstructionDataEncoder().encode({ authority: null, groupAddress: null }),
            rows: [PROGRAM_2022_ROW, ACCOUNT_HEADER, ['Mint', MINT.toBase58()]],
            title: 'Initialize Group Pointer',
        },
        {
            accounts: [MINT],
            data: getInitializeGroupMemberPointerInstructionDataEncoder().encode({
                authority: null,
                memberAddress: null,
            }),
            rows: [PROGRAM_2022_ROW, ACCOUNT_HEADER, ['Mint', MINT.toBase58()]],
            title: 'Initialize Group Member Pointer',
        },
    ])('should render $title as the parser slice decodes it', async ({ accounts, data, rows, title }) => {
        renderTxCard(byteFormCard(data, accounts.map(readonlyKey)));

        await waitFor(() => {
            expect(readRowCells()).toEqual(rows);
        });
        expect(screen.getByText(`Token-2022 Program: ${title}`)).toBeInTheDocument();
    });

    it('should show a string argument as copyable code', async () => {
        const data = getRemoveTokenMetadataKeyInstructionDataEncoder().encode({ idempotent: false, key: 'color' });
        renderTxCard(byteFormCard(data, [SOURCE, AUTHORITY].map(readonlyKey)));

        expect((await screen.findByText('color')).tagName).toBe('CODE');
    });

    it('should show a numeric argument as plain text', async () => {
        const data = getUpdateTokenGroupMaxSizeInstructionDataEncoder().encode({ maxSize: 7n });
        renderTxCard(byteFormCard(data, [SOURCE, AUTHORITY].map(readonlyKey)));

        expect((await screen.findByText('7')).tagName).not.toBe('CODE');
    });

    it('should show the role badges of each account', async () => {
        const data = getTransferCheckedInstructionDataEncoder().encode({ amount: 1_500_000n, decimals: 6 });
        renderTxCard(
            byteFormCard(
                data,
                [
                    { isSigner: false, isWritable: true, pubkey: SOURCE },
                    readonlyKey(MINT),
                    { isSigner: false, isWritable: true, pubkey: DESTINATION },
                    { isSigner: true, isWritable: false, pubkey: AUTHORITY },
                ],
                TOKEN_PROGRAM_ID,
            ),
        );

        await waitFor(() => {
            expect(readRowCells()).toEqual([
                PROGRAM_ROW,
                ACCOUNT_HEADER,
                ['SourceWritable', SOURCE.toBase58()],
                ['Mint', MINT.toBase58()],
                ['DestinationWritable', DESTINATION.toBase58()],
                ['AuthoritySigner', AUTHORITY.toBase58()],
                ARGUMENT_HEADER,
                ['amount', 'string', '1,500,000'],
                ['decimals', 'number', '6'],
            ]);
        });
        expect(within(screen.getByTestId('account-row-3')).getByText('Signer')).toBeInTheDocument();
    });

    it.each([
        { amount: 1000n, shown: '1,000' },
        { amount: 18446744073709551615n, shown: '18,446,744,073,709,551,615' },
    ])('should show the amount argument $amount as the instruction holds it', async ({ amount, shown }) => {
        vi.mocked(useTokenAccountInfo).mockReturnValue({ mint: MINT } as ReturnType<typeof useTokenAccountInfo>);
        vi.mocked(useMintAccountInfo).mockReturnValue({ decimals: 6 } as ReturnType<typeof useMintAccountInfo>);
        vi.mocked(getTokenInfo).mockResolvedValue({ symbol: 'USDC' } as Awaited<ReturnType<typeof getTokenInfo>>);
        const data = getTransferInstructionDataEncoder().encode({ amount });
        renderTxCard(byteFormCard(data, [SOURCE, DESTINATION, AUTHORITY].map(readonlyKey), TOKEN_PROGRAM_ID));

        await waitFor(() => {
            expect(readRowCells()).toContainEqual(['Token', MINT.toBase58()]);
        });
        expect(readRowCells()).toContainEqual(['amount', 'string', shown]);
    });

    it.each([
        {
            accounts: [MINT],
            data: getInitializeMetadataPointerInstructionDataEncoder().encode({
                authority: null,
                metadataAddress: toKitAddress(MINT),
            }),
            name: 'a metadata pointer to its own mint',
            programId: TOKEN_2022_PROGRAM_ID,
            rows: [PROGRAM_2022_ROW, ['MetadataAddress', MINT.toBase58()], ['Mint', MINT.toBase58()]],
        },
        {
            accounts: [SOURCE, AUTHORITY, AUTHORITY],
            data: getCloseAccountInstructionDataEncoder().encode({}),
            name: 'a close to the owner',
            programId: TOKEN_PROGRAM_ID,
            rows: [
                PROGRAM_ROW,
                ['Account', SOURCE.toBase58()],
                ['Destination', AUTHORITY.toBase58()],
                ['Owner', AUTHORITY.toBase58()],
            ],
        },
        {
            accounts: [SOURCE, SOURCE, AUTHORITY],
            data: getTransferInstructionDataEncoder().encode({ amount: 1000n }),
            name: 'a transfer to its own source',
            programId: TOKEN_PROGRAM_ID,
            rows: [
                PROGRAM_ROW,
                ['Amount (raw)', '1,000'],
                ['Authority', AUTHORITY.toBase58()],
                ['Destination', SOURCE.toBase58()],
                ['Source', SOURCE.toBase58()],
            ],
        },
    ])('should show one row for each field of $name', async ({ accounts, data, programId, rows }) => {
        renderTxCard(byteFormCard(data, accounts.map(readonlyKey), programId));

        await waitFor(() => {
            expect(readRowCells()).toEqual(rows);
        });
    });

    it('should label a multisig signer that no field names by its position', async () => {
        const data = getTransferInstructionDataEncoder().encode({ amount: 1000n });
        renderTxCard(byteFormCard(data, [SOURCE, DESTINATION, AUTHORITY, SIGNER_1].map(readonlyKey), TOKEN_PROGRAM_ID));

        await waitFor(() => {
            expect(readRowCells()).toContainEqual(['Account #4', SIGNER_1.toBase58()]);
        });
    });

    it('should show the accounts of the raw instruction in the inspector Raw view', async () => {
        const data = getInitializeMetadataPointerInstructionDataEncoder().encode({
            authority: null,
            metadataAddress: null,
        });
        renderInspectorCard(byteFormCard(data, [readonlyKey(MINT)]));

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
    return <TokenDetailsCard node={toInstructionNode({ index: 0, ix })} parsed={ix.parsed} />;
}

function byteFormCard(data: ReadonlyUint8Array, keys: AccountMeta[], programId: PublicKey = TOKEN_2022_PROGRAM_ID) {
    const raw = new TransactionInstruction({ data: Buffer.from(data), keys, programId });
    const ix = instructionParserDispatcher.fromTransactionInstruction(raw);
    if (!isParsedInstruction(ix)) throw new Error('The Token slice did not decode the fixture');
    return <TokenDetailsCard node={toInstructionNode({ index: 0, ix, raw })} parsed={ix.parsed} />;
}

function readonlyKey(pubkey: PublicKey): AccountMeta {
    return { isSigner: false, isWritable: false, pubkey };
}

/** Every cell of each row, so an argument row reads as its name, type and value. */
function readRowCells(): string[][] {
    return screen.getAllByRole('row').map(row =>
        within(row)
            .getAllByRole('cell')
            .map(cell => readAddress(cell) ?? cell.textContent ?? ''),
    );
}

function renderInspectorCard(ui: JSX.Element) {
    return renderWithProviders(
        <InstructionSurfaceProvider
            surface={inspectorSurface({ Card: InstructionNodeCard, instructionData: () => undefined })}
        >
            {ui}
        </InstructionSurfaceProvider>,
    );
}
