import { gen } from '@__fixtures__/gen';
import { type InstructionNode, type InstructionSurface, InstructionSurfaceProvider } from '@entities/instruction-card';
import { PriceType, PYTH_INSTRUCTIONS, PYTH_ORACLE_PROGRAM_IDS, TradingStatus } from '@explorer/decoder-pyth';
import { address } from '@solana/kit';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { type CardRow, readCardRows, renderTxCard } from '@/app/__tests__/card-harness';

import { AddMappingDetailsCard } from '../instructions/AddMappingDetailsCard';
import { AddPriceDetailsCard } from '../instructions/AddPriceDetailsCard';
import { AddProductDetailsCard } from '../instructions/AddProductDetailsCard';
import { AggregatePriceDetailsCard } from '../instructions/AggregatePriceDetailsCard';
import { InitMappingDetailsCard } from '../instructions/InitMappingDetailsCard';
import { InitPriceDetailsCard } from '../instructions/InitPriceDetailsCard';
import { AddPublisherDetailsCard, DeletePublisherDetailsCard } from '../instructions/PublisherDetailsCards';
import { SetMinPublishersDetailsCard } from '../instructions/SetMinPublishersDetailsCard';
import { UpdatePriceDetailsCard, UpdatePriceNoFailOnErrorDetailsCard } from '../instructions/UpdatePriceDetailsCards';
import { UpdateProductDetailsCard } from '../instructions/UpdateProductDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const A = {
    funding: gen.address(1),
    mapping: gen.address(2),
    nextMapping: gen.address(3),
    price: gen.address(4),
    product: gen.address(5),
    publisher: gen.address(6),
    signer: gen.address(7),
} as const;

const key = (base58: string) => address(base58);

const PROGRAM_ID = new PublicKey(PYTH_ORACLE_PROGRAM_IDS.mainnet);
const PROGRAM: string = PYTH_ORACLE_PROGRAM_IDS.mainnet;

const node: InstructionNode = {
    index: 0,
    // The shell only reads `ix` for the Raw view, which these cards never open.
    ix: new TransactionInstruction({ data: Buffer.alloc(0), keys: [], programId: PROGRAM_ID }),
    programId: PROGRAM_ID,
};

const PUBLISHER_INFO = {
    pricePubkey: key(A.price),
    publisherPubkey: key(A.publisher),
    signerPubkey: key(A.signer),
};

const PRICE_UPDATE_INFO = {
    conf: 678,
    price: -12345,
    pricePubkey: key(A.price),
    publishSlot: 170_640_000,
    publisherPubkey: key(A.publisher),
    status: TradingStatus.Trading,
};

const PROGRAM_ROW: CardRow = ['Program', PROGRAM];

const ATTRIBUTES_JSON = '{\n  "asset_type": "Crypto",\n  "symbol": "BTC/USD"\n}';

/** Publisher and price-update rows repeat across the pairs of cards that share a payload. */
const PUBLISHER_ROWS: CardRow[] = [PROGRAM_ROW, ['Price Account', A.price], ['Publisher', A.publisher]];

const PRICE_UPDATE_ROWS: CardRow[] = [
    PROGRAM_ROW,
    ['Publisher', A.publisher],
    ['Price Account', A.price],
    ['Status', 'Trading'],
    ['Price', '-12345'],
    ['Conf', '678'],
    ['Publish Slot', '170640000'],
];

const CASES: Array<{ card: React.ReactElement; rows: CardRow[]; title: string }> = [
    {
        card: (
            <InitMappingDetailsCard
                node={node}
                info={{ fundingPubkey: key(A.funding), mappingPubkey: key(A.mapping) }}
            />
        ),
        rows: [PROGRAM_ROW, ['Funding Account', A.funding], ['Mapping Account', A.mapping]],
        title: `Pyth: ${PYTH_INSTRUCTIONS.InitMapping.name}`,
    },
    {
        card: (
            <AddMappingDetailsCard
                node={node}
                info={{
                    fundingPubkey: key(A.funding),
                    mappingPubkey: key(A.mapping),
                    nextMappingPubkey: key(A.nextMapping),
                }}
            />
        ),
        rows: [
            PROGRAM_ROW,
            ['Funding Account', A.funding],
            ['Mapping Account', A.mapping],
            ['Next Mapping Account', A.nextMapping],
        ],
        title: `Pyth: ${PYTH_INSTRUCTIONS.AddMapping.name}`,
    },
    {
        card: (
            <AddProductDetailsCard
                node={node}
                info={{
                    fundingPubkey: key(A.funding),
                    mappingPubkey: key(A.mapping),
                    productPubkey: key(A.product),
                }}
            />
        ),
        rows: [
            PROGRAM_ROW,
            ['Funding Account', A.funding],
            ['Mapping Account', A.mapping],
            ['Product Account', A.product],
        ],
        title: `Pyth: ${PYTH_INSTRUCTIONS.AddProduct.name}`,
    },
    {
        card: (
            <AddPriceDetailsCard
                node={node}
                info={{
                    exponent: -9,
                    fundingPubkey: key(A.funding),
                    pricePubkey: key(A.price),
                    priceType: PriceType.Price,
                    productPubkey: key(A.product),
                }}
            />
        ),
        rows: [
            PROGRAM_ROW,
            ['Funding Account', A.funding],
            ['Product Account', A.product],
            ['Price Account', A.price],
            ['Exponent', '-9'],
            ['Price Type', 'Price'],
        ],
        title: `Pyth: ${PYTH_INSTRUCTIONS.AddPrice.name}`,
    },
    {
        // `signerPubkey` is decoded but deliberately unrendered.
        card: <AddPublisherDetailsCard node={node} info={PUBLISHER_INFO} />,
        rows: PUBLISHER_ROWS,
        title: `Pyth: ${PYTH_INSTRUCTIONS.AddPublisher.name}`,
    },
    {
        card: <DeletePublisherDetailsCard node={node} info={PUBLISHER_INFO} />,
        rows: PUBLISHER_ROWS,
        title: `Pyth: ${PYTH_INSTRUCTIONS.DeletePublisher.name}`,
    },
    {
        card: <UpdatePriceDetailsCard node={node} info={PRICE_UPDATE_INFO} />,
        rows: PRICE_UPDATE_ROWS,
        title: `Pyth: ${PYTH_INSTRUCTIONS.UpdatePrice.name}`,
    },
    {
        card: <UpdatePriceNoFailOnErrorDetailsCard node={node} info={PRICE_UPDATE_INFO} />,
        rows: PRICE_UPDATE_ROWS,
        title: `Pyth: ${PYTH_INSTRUCTIONS.UpdatePriceNoFailOnError.name}`,
    },
    {
        card: (
            <AggregatePriceDetailsCard
                node={node}
                info={{ fundingPubkey: key(A.funding), pricePubkey: key(A.price) }}
            />
        ),
        rows: [PROGRAM_ROW, ['Funding Account', A.funding], ['Price Account', A.price]],
        title: `Pyth: ${PYTH_INSTRUCTIONS.AggregatePrice.name}`,
    },
    {
        card: (
            <InitPriceDetailsCard
                node={node}
                info={{
                    exponent: -8,
                    fundingPubkey: key(A.funding),
                    pricePubkey: key(A.price),
                    priceType: PriceType.Price,
                }}
            />
        ),
        rows: [
            PROGRAM_ROW,
            ['Funding Account', A.funding],
            ['Price Account', A.price],
            ['Exponent', '-8'],
            ['Price Type', 'Price'],
        ],
        title: `Pyth: ${PYTH_INSTRUCTIONS.InitPrice.name}`,
    },
    {
        card: (
            <SetMinPublishersDetailsCard
                node={node}
                info={{ fundingPubkey: key(A.funding), minPublishers: 3, pricePubkey: key(A.price) }}
            />
        ),
        rows: [PROGRAM_ROW, ['Funding Account', A.funding], ['Price Account', A.price], ['Min Publishers', '3']],
        title: `Pyth: ${PYTH_INSTRUCTIONS.SetMinPublishers.name}`,
    },
    {
        card: (
            <UpdateProductDetailsCard
                node={node}
                info={{
                    attributes: { asset_type: 'Crypto', symbol: 'BTC/USD' },
                    fundingPubkey: key(A.funding),
                    productPubkey: key(A.product),
                }}
            />
        ),
        rows: [
            PROGRAM_ROW,
            ['Funding Account', A.funding],
            ['Product Account', A.product],
            // Attributes keep decode order, and the cell draws them twice — once per responsive alignment.
            ['Attributes (JSON)', ATTRIBUTES_JSON + ATTRIBUTES_JSON],
        ],
        title: `Pyth: ${PYTH_INSTRUCTIONS.UpdateProduct.name}`,
    },
];

describe('instruction-program-pyth cards', () => {
    /** Pins each card's rows: label, order, count, and the value every row resolves to. */
    it.each(CASES)('should render the rows of $title', async ({ card, rows, title }) => {
        renderTxCard(card);

        // The cluster provider finishes an async fetch after mount, so assert inside waitFor.
        await waitFor(() => {
            expect(readCardRows()).toEqual(rows);
        });

        expect(screen.getByText(title)).toBeInTheDocument();
    });

    // Distinct titles, so a card cannot be mistaken for its same-payload twin.
    it('should title Aggregate Price and the two price updates apart', () => {
        const titles = CASES.map(({ title }) => title);
        expect(new Set(titles).size).toBe(titles.length);
    });

    // A foreign program id proves the row reads the node rather than a Pyth constant.
    it('should render the program row from the node', async () => {
        renderTxCard(
            <AggregatePriceDetailsCard
                node={{ ...node, programId: new PublicKey(A.funding) }}
                info={{ fundingPubkey: key(A.funding), pricePubkey: key(A.price) }}
            />,
        );

        await waitFor(() => {
            expect(readCardRows()[0]).toEqual(['Program', A.funding]);
        });
    });

    it('should draw every address with the surface address renderer', () => {
        render(
            <InstructionSurfaceProvider surface={STUB_SURFACE}>
                <UpdatePriceDetailsCard node={node} info={PRICE_UPDATE_INFO} />
            </InstructionSurfaceProvider>,
        );

        expect(screen.getAllByTestId('surface-address').map(el => el.textContent)).toEqual([A.publisher, A.price]);
    });
});

/** A surface that renders nothing of its own, so only what a card asks of it shows up. */
const STUB_SURFACE: InstructionSurface = {
    Address: ({ pubkey }) => <span data-testid="surface-address">{pubkey.toBase58()}</span>,
    Shell: ({ children }) => <table>{children}</table>,
    result: { err: null },
    showProgramField: false,
};
