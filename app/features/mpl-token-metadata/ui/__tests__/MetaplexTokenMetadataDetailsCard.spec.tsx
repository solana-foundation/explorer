import { gen } from '@__fixtures__/gen';
import { INSPECTOR_SURFACE } from '@components/inspector/inspector-surface';
import { InstructionSurfaceProvider } from '@entities/instruction-card';
import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import {
    getCreateMasterEditionV3InstructionDataSerializer,
    getCreateMetadataAccountV3InstructionDataSerializer,
    getUpdateMetadataAccountV2InstructionDataSerializer,
    MPL_TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import { none, publicKey as umiPublicKey, some } from '@metaplex-foundation/umi';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type CardRow, readCardRows, renderTxCard, renderWithProviders } from '@/app/__tests__/card-harness';
import { invariant } from '@/app/shared/lib/invariant';
import { Logger } from '@/app/shared/lib/logger';

import { metaplexTokenMetadataInstructionParser } from '../../lib/metaplex-token-metadata-client';
import { MetaplexTokenMetadataDetailsCard } from '../MetaplexTokenMetadataDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const dispatcher = createInstructionParserDispatcher([metaplexTokenMetadataInstructionParser]);
const PROGRAM_ID = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);
const PROGRAM_ROW: CardRow = ['Program', PROGRAM_ID.toBase58()];
const KEYS = [1, 2, 3, 4, 5].map(n => gen.publicKey(n));

const createMetadataV3 = getCreateMetadataAccountV3InstructionDataSerializer();
const updateMetadataV2 = getUpdateMetadataAccountV2InstructionDataSerializer();
const createMasterEditionV3 = getCreateMasterEditionV3InstructionDataSerializer();

describe('MetaplexTokenMetadataDetailsCard', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each([
        { render: renderTxCard, surface: 'tx page' },
        { render: renderInspectorCard, surface: 'inspector' },
    ])('should render the Create Metadata Account V3 rows on the $surface surface', async ({ render }) => {
        render(card(createMetadataAccountV3Data(500), KEYS));

        await waitFor(() => {
            expect(readCardRows()).toEqual([
                PROGRAM_ROW,
                ['Metadata', KEYS[0].toBase58()],
                ['Mint', KEYS[1].toBase58()],
                ['Mint Authority', KEYS[2].toBase58()],
                ['Payer', KEYS[3].toBase58()],
                ['Update Authority', KEYS[4].toBase58()],
                ['Name', 'My NFT'],
                ['Symbol', 'MNFT'],
                ['URI', 'https://example.com/nft.json'],
                ['Royalty', '5%'],
                ['Mutable', 'true'],
            ]);
        });
        expect(screen.getByText('Token Metadata Program: Create Metadata Account V3')).toBeInTheDocument();
    });

    it.each([
        { basisPoints: 0, royalty: '0%' },
        { basisPoints: 250, royalty: '2.50%' },
        { basisPoints: 1234, royalty: '12.34%' },
    ])('should show $basisPoints basis points as a $royalty royalty', async ({ basisPoints, royalty }) => {
        renderTxCard(card(createMetadataAccountV3Data(basisPoints), KEYS));

        await waitFor(() => {
            expect(readCardRows()).toContainEqual(['Royalty', royalty]);
        });
    });

    it('should omit the rows of options the instruction does not set', async () => {
        const data = updateMetadataV2.serialize({
            data: none(),
            isMutable: none(),
            newUpdateAuthority: none(),
            primarySaleHappened: none(),
        });
        renderTxCard(card(data, KEYS.slice(0, 2)));

        await waitFor(() => {
            expect(readCardRows()).toEqual([
                PROGRAM_ROW,
                ['Metadata', KEYS[0].toBase58()],
                ['Update Authority', KEYS[1].toBase58()],
            ]);
        });
    });

    it('should show a false flag and a new update authority', async () => {
        const data = updateMetadataV2.serialize({
            data: none(),
            isMutable: some(false),
            newUpdateAuthority: some(umiPublicKey(KEYS[2].toBase58())),
            primarySaleHappened: some(false),
        });
        renderTxCard(card(data, KEYS.slice(0, 2)));

        await waitFor(() => {
            expect(readCardRows()).toEqual([
                PROGRAM_ROW,
                ['Metadata', KEYS[0].toBase58()],
                ['Update Authority', KEYS[1].toBase58()],
                ['New Update Authority', KEYS[2].toBase58()],
                ['Primary Sale Happened', 'false'],
                ['Mutable', 'false'],
            ]);
        });
    });

    it.each([
        { maxSupply: some(100n), shown: '100' },
        { maxSupply: none<bigint>(), shown: 'Unlimited' },
    ])('should show a max supply of $shown', async ({ maxSupply, shown }) => {
        renderTxCard(card(createMasterEditionV3.serialize({ maxSupply }), KEYS));

        await waitFor(() => {
            expect(readCardRows()).toContainEqual(['Max Supply', shown]);
        });
    });

    it('should omit the rows of accounts the instruction does not have', async () => {
        renderTxCard(card([7], KEYS.slice(0, 1)));

        await waitFor(() => {
            expect(readCardRows()).toEqual([PROGRAM_ROW, ['Metadata', KEYS[0].toBase58()]]);
        });
        expect(screen.getByText('Token Metadata Program: Sign Metadata')).toBeInTheDocument();
    });

    it('should keep the title when the instruction data fails to decode', async () => {
        vi.spyOn(Logger, 'warn').mockImplementation(() => undefined);

        renderTxCard(card([33], KEYS));

        await waitFor(() => {
            expect(readCardRows()).toEqual([PROGRAM_ROW]);
        });
        expect(screen.getByText('Token Metadata Program: Create Metadata Account V3')).toBeInTheDocument();
    });

    it.each([
        { data: [44, 1], title: 'Token Metadata Program: Delegate Sale' },
        { data: [45, 7], title: 'Token Metadata Program: Revoke Locked Transfer' },
        { data: [55, 1], title: 'Token Metadata Program: Print V2' },
        { data: [0xff], title: 'Token Metadata Program: Unknown Instruction' },
    ])('should open $title in the raw view', async ({ data, title }) => {
        renderTxCard(card(data, KEYS.slice(0, 2)));

        expect(await screen.findByText(title)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Raw' })).toBeDisabled();
        expect(screen.getByText('Account #2')).toBeInTheDocument();
    });

    it('should render one Program row in the inspector raw view', async () => {
        renderInspectorCard(card([7], KEYS.slice(0, 2)));

        await userEvent.click(await screen.findByRole('button', { name: 'Raw' }));

        expect(await screen.findByText('Account #2')).toBeInTheDocument();
        expect(screen.getAllByText('Program')).toHaveLength(1);
    });
});

function card(data: Uint8Array | number[], keys: PublicKey[]) {
    const raw = new TransactionInstruction({
        data: Buffer.from(data),
        keys: keys.map(pubkey => ({ isSigner: false, isWritable: false, pubkey })),
        programId: PROGRAM_ID,
    });
    const dispatched = dispatcher.fromTransactionInstruction(raw);
    invariant(dispatched, 'the token metadata program is registered');

    return <MetaplexTokenMetadataDetailsCard ix={dispatched} raw={raw} index={0} />;
}

function renderInspectorCard(ui: JSX.Element) {
    return renderWithProviders(
        <InstructionSurfaceProvider surface={INSPECTOR_SURFACE}>{ui}</InstructionSurfaceProvider>,
    );
}

function createMetadataAccountV3Data(sellerFeeBasisPoints: number) {
    return createMetadataV3.serialize({
        collectionDetails: none(),
        data: {
            collection: none(),
            creators: none(),
            name: 'My NFT',
            sellerFeeBasisPoints,
            symbol: 'MNFT',
            uri: 'https://example.com/nft.json',
            uses: none(),
        },
        isMutable: true,
    });
}
