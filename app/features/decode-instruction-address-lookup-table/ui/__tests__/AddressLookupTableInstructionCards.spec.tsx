import { gen } from '@__fixtures__/gen';
import { type InstructionNode, type InstructionSurface, InstructionSurfaceProvider } from '@entities/instruction-card';
import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { AddressLookupTableProgram, type ParsedInstruction, PublicKey } from '@solana/web3.js';
import { render, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';

import { type CardRow, readAddress, readCardRows, renderTxCard } from '@/app/__tests__/card-harness';
import { Logger } from '@/app/shared/lib/logger';

import { addressLookupTableInstructionParser } from '../../lib/address-lookup-table-client';
import {
    AddressLookupTableDetailsCard,
    ExtendLookupTableDetailsCard,
    FreezeLookupTableDetailsCard,
} from '../AddressLookupTableDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const dispatcher = createInstructionParserDispatcher([addressLookupTableInstructionParser]);

const A = {
    authority: gen.address(1),
    entryOne: gen.address(2),
    entryTwo: gen.address(3),
    payer: gen.address(4),
    recipient: gen.address(5),
    table: gen.address(6),
} as const;

const key = (base58: string) => new PublicKey(base58);

const PROGRAM_ID = AddressLookupTableProgram.programId;
const PROGRAM: string = PROGRAM_ID.toBase58();

const RECENT_SLOT = 123_456_789;
const BUMP_SEED = 255;

const node: InstructionNode = {
    index: 0,
    // The shell only reads `ix` for the Raw view, which these cards never open.
    ix: { parsed: {}, program: 'address-lookup-table', programId: PROGRAM_ID } as unknown as ParsedInstruction,
    programId: PROGRAM_ID,
};

/** The RPC view of a lookup table and its authority, which every type carries. */
const TABLE = { lookupTableAccount: A.table, lookupTableAuthority: A.authority };

/** The same table as the slice hands it to a card, for the tests that render one directly. */
const KEYED_TABLE = { lookupTableAccount: key(A.table), lookupTableAuthority: key(A.authority) };

const CREATE = {
    ...TABLE,
    bumpSeed: BUMP_SEED,
    payerAccount: A.payer,
    recentSlot: RECENT_SLOT,
    // Validated but unrendered, as on master.
    systemProgram: '11111111111111111111111111111111',
};

const EXTEND = { ...TABLE, newAddresses: [A.entryOne, A.entryTwo] };

const LOOKUP_TABLE_ROWS: CardRow[] = [
    ['Program', PROGRAM],
    ['Lookup Table', A.table],
    ['Lookup Table Authority', A.authority],
];

/** Freeze, Deactivate and Close render identical rows, so only the title tells them apart. */
const CASES: Array<{ info: object; rows: CardRow[]; title: string; type: string }> = [
    {
        info: TABLE,
        rows: LOOKUP_TABLE_ROWS,
        title: 'Address Lookup Table: Freeze Lookup Table',
        type: 'freezeLookupTable',
    },
    {
        info: TABLE,
        rows: LOOKUP_TABLE_ROWS,
        title: 'Address Lookup Table: Deactivate Lookup Table',
        type: 'deactivateLookupTable',
    },
    {
        // `recipient` is validated but deliberately unrendered, as on master.
        info: { ...TABLE, recipient: A.recipient },
        rows: LOOKUP_TABLE_ROWS,
        title: 'Address Lookup Table: Close Lookup Table',
        type: 'closeLookupTable',
    },
    {
        info: CREATE,
        rows: [
            ...LOOKUP_TABLE_ROWS,
            ['Payer Account', A.payer],
            ['Recent Slot', RECENT_SLOT.toLocaleString('en-US')],
            ['Bump Seed', String(BUMP_SEED)],
        ],
        title: 'Address Lookup Table: Create Lookup Table',
        type: 'createLookupTable',
    },
    {
        info: EXTEND,
        rows: [...LOOKUP_TABLE_ROWS, ['New Addresses', [A.entryOne, A.entryTwo].join(',')]],
        title: 'Address Lookup Table: Extend Lookup Table',
        type: 'extendLookupTable',
    },
];

describe('address-lookup-table cards', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /** Pins each card's rows: label, order, count, and the value every row resolves to. */
    it.each(CASES)('should render the rows of $title', async ({ info, rows, title, type }) => {
        renderCard(info, type);

        // The cluster provider finishes an async fetch after mount, so assert inside waitFor.
        await waitFor(() => {
            expect(readCardRows()).toEqual(rows);
        });

        expect(screen.getByText(title)).toBeInTheDocument();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should number the new addresses in extend order', async () => {
        renderCard(EXTEND, 'extendLookupTable');

        await waitFor(() => {
            expect(readNewAddresses()).toEqual([
                ['0', A.entryOne],
                ['1', A.entryTwo],
            ]);
        });
    });

    it('should link the recent slot to its block', async () => {
        renderCard(CREATE, 'createLookupTable');

        await waitFor(() => {
            expect(screen.getByRole('link', { name: RECENT_SLOT.toLocaleString('en-US') })).toHaveAttribute(
                'href',
                expect.stringContaining(`/block/${RECENT_SLOT}`),
            );
        });
    });

    // Extend draws its own nested markup, so nothing but this stops it from
    // hardcoding the transaction page's address renderer for the entries.
    it('should draw every address with the surface address renderer', () => {
        render(
            <InstructionSurfaceProvider surface={STUB_SURFACE}>
                <ExtendLookupTableDetailsCard
                    node={node}
                    info={{ ...KEYED_TABLE, newAddresses: [key(A.entryOne), key(A.entryTwo)] }}
                />
            </InstructionSurfaceProvider>,
        );

        expect(screen.getAllByTestId('surface-address').map(el => el.textContent)).toEqual([
            A.table,
            A.authority,
            A.entryOne,
            A.entryTwo,
        ]);
    });

    // A foreign program id proves the row reads the node rather than an ALT-program constant.
    it('should render the program row from the node', async () => {
        renderTxCard(
            <FreezeLookupTableDetailsCard node={{ ...node, programId: key(A.authority) }} info={KEYED_TABLE} />,
        );

        await waitFor(() => {
            expect(readCardRows()[0]).toEqual(['Program', A.authority]);
        });
    });

    it('should fall back to the unknown card for an unrecognized type', async () => {
        renderCard(TABLE, 'resizeLookupTable');

        await waitFor(() => {
            expect(screen.getByText('Address Lookup Table Program: Unknown Instruction')).toBeInTheDocument();
        });
    });

    // A payload missing a field its type requires is rejected by the slice and reported.
    it('should fall back and report when a payload misses a required field', async () => {
        renderCard(TABLE, 'closeLookupTable');

        await waitFor(() => {
            expect(screen.getByText('Address Lookup Table Program: Unknown Instruction')).toBeInTheDocument();
        });
        expect(Logger.error).toHaveBeenCalled();
    });
});

/** A surface that renders nothing of its own, so only what a card asks of it shows up. */
const STUB_SURFACE: InstructionSurface = {
    Address: ({ pubkey }) => <span data-testid="surface-address">{pubkey.toBase58()}</span>,
    Shell: ({ children }) => <table>{children}</table>,
    result: { err: null },
    showProgramField: false,
};

function renderCard(info: object, type: string) {
    const ix = {
        parsed: { info, type },
        program: 'address-lookup-table',
        programId: PROGRAM_ID,
    } as unknown as ParsedInstruction;

    return renderTxCard(<AddressLookupTableDetailsCard ix={dispatcher.fromParsedInstruction(ix)} index={0} />);
}

/** The nested table Extend draws, as `[index, address]` pairs. */
function readNewAddresses(): CardRow[] {
    const [, nested] = screen.getAllByRole('table');
    return within(nested)
        .getAllByRole('row')
        .map(row => {
            const cells = within(row).getAllByRole('cell');
            return [cells[0].textContent ?? '', readAddress(cells[1]) ?? ''];
        });
}
