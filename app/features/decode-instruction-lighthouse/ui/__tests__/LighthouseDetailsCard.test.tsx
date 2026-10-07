import { toParsedInstruction } from '@entities/instruction-parser';
import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { invariant } from '@/app/shared/lib/invariant';
import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { LIGHTHOUSE_ADDRESS, LIGHTHOUSE_PROGRAM_LABEL } from '../../lib/constants';
import { parseLighthouseInstruction } from '../../lib/lighthouse-parser';
import { LighthouseDetailsCard } from '../LighthouseDetailsCard';

vi.mock('react-feather', () => ({
    CornerDownRight: () => <div data-testid="corner-down-right" />,
}));

vi.mock('@/app/components/instruction/InstructionCard', () => ({
    InstructionCard: ({ children, title }: { children: React.ReactNode; title: string }) => (
        <div data-testid="instruction-card" className="card">
            <div className="card-header">
                <div>{title}</div>
            </div>
            <div className="table-responsive mb-0">
                <table className="table-sm table-nowrap card-table table">
                    <tbody>{children}</tbody>
                </table>
            </div>
        </div>
    ),
}));

vi.mock('@/app/components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: PublicKey }) => <div data-testid="address">{pubkey.toBase58()}</div>,
}));

vi.mock('@/app/components/common/Copyable', () => ({
    Copyable: ({ text, children }: { text: string; children: React.ReactNode }) => (
        <div data-testid="copyable" data-text={text}>
            {children}
        </div>
    ),
}));

vi.mock('@/app/utils/anchor', () => ({
    ExpandableRow: ({
        fieldName,
        fieldType,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        nestingLevel,
        children,
        ...props
    }: {
        children: React.ReactNode;
        fieldName: string;
        fieldType: string;
        nestingLevel: number;
    } & React.HTMLAttributes<HTMLTableRowElement>) => (
        <>
            <tr {...props}>
                <td>{fieldName}</td>
                <td>{fieldType}</td>
            </tr>
            {children}
        </>
    ),
}));

const LIGHTHOUSE = LIGHTHOUSE_ADDRESS;
const SYSTEM = '11111111111111111111111111111111';
const ACCOUNT_A = '14gyJnETr2upBHRoCVFfvqcaGGEZuJT1vYXzWCJGJ45h';
const ACCOUNT_B = '6Le7uLy8Y2JvCq5x5huvF3pSQBvP1Y6W325wNpFz4s4u';
const MULTI_TARGET = 'FZLY576gVwyD6rEosP72pRUC9TAe7LhgvoSepk3F63PY';
const ACCOUNT_INFO_DATA = [5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const ACCOUNT_INFO_TARGET = 'AUuYypaXez7kXWWWYecmsb89prMCnba6g2tBWm3BxKQV';

// Several assertion rows share one data-testid, so a row after them is found as the next sibling of the row above.
const NEXT = 'next-sibling';

/** A row's data-testid, or NEXT, then the texts the row must contain. */
type Row = [testId: string, ...texts: string[]];

const CASES: Array<{ data: number[]; keys: string[]; rows: Row[]; title: string }> = [
    {
        // 5dakXwp5QTySbvc6P1Wp9MLZubnnG4R1Dh6cWSgNv6w1xt2JMsTp7EZvWEUxk9YLbJZHG97TT3jMVJ4yMTXKjM2L
        data: [15, 0, 0, 166, 238, 134, 18, 0, 0, 0, 0, 3],
        keys: [],
        rows: [
            ['ix-args-0-1', 'logLevel', 'number', '0'],
            ['ix-args-0-2', 'assertion', 'Slot'],
            ['ix-args-1-1', 'value', 'bignum', '310832806'],
            ['ix-args-1-2', 'operator', 'string', '<'],
        ],
        title: 'Lighthouse: Assert Sysvar Clock',
    },
    {
        // 43PnzYerXr5b4LNf8A1j8kqztt8Voa7oiL9pzDTmWwSKCeLdZbLLJRd9A2XebiJvRP6kjNW6pF4mnGYnbSsRNXoU
        data: ACCOUNT_INFO_DATA,
        keys: [ACCOUNT_INFO_TARGET],
        rows: [
            ['account-row-0', 'Target Account', ACCOUNT_INFO_TARGET],
            ['ix-args-0-1', 'logLevel', 'number', '4'],
            ['ix-args-0-2', 'assertion', 'Lamports'],
            ['ix-args-1-1', 'value', 'bignum', '0'],
            ['ix-args-1-2', 'operator', 'string', '='],
        ],
        title: 'Lighthouse: Assert Account Info',
    },
    {
        // 5ZtLCLaUGDVXyCZhKLiiNTFqasqUAwahpEeFNHM86amL2awLDByWkuWAdz6C7gdt1GRmfDbjUooh8ozL6a5LUyeZ
        data: [9, 0, 2, 102, 198, 105, 197, 1, 0, 0, 0, 2],
        keys: ['5bjPLjnXeCfVPa3khXYzdiHaUYrW6zwveZywNJydaumJ'],
        rows: [
            ['account-row-0', 'Target Account', '5bjPLjnXeCfVPa3khXYzdiHaUYrW6zwveZywNJydaumJ'],
            ['ix-args-0-1', 'logLevel', 'number', '0'],
            ['ix-args-0-2', 'assertion', 'Amount'],
            ['ix-args-1-1', 'value', 'bignum', '7607010918'],
            ['ix-args-1-2', 'operator', 'string', '>'],
        ],
        title: 'Lighthouse: Assert Token Account',
    },
    {
        // 5WA6DR6vBbyk6wsyxfFAQcsyFLLFamPFKWwgYMSpWbFdUBCCP2WweVggGKtrnJmUa8yyZE5ykqeaQe97daxpPMKZ
        data: [
            17, 4, 1, 2, 134, 9, 147, 82, 122, 185, 62, 253, 58, 44, 51, 49, 20, 153, 54, 6, 230, 246, 131, 112, 125,
            179, 20, 217, 213, 24, 172, 55, 152, 38, 45, 0,
        ],
        keys: ['FMPNEcpSDsAskMHGtB6b6vh4CipN9NNdhWtHKTDqZ9oS'],
        rows: [
            ['account-row-0', 'Target Account', 'FMPNEcpSDsAskMHGtB6b6vh4CipN9NNdhWtHKTDqZ9oS'],
            ['ix-args-0-1', 'logLevel', 'number', '4'],
            ['ix-args-0-2', 'assertion', 'TreeDelegate'],
            ['ix-args-1-1', 'value', 'pubkey', 'ArMorTp7EVn3SVVo8SJ92BiJAKETEczng6fyN743W3e'],
            ['ix-args-1-2', 'operator', 'string', '='],
        ],
        title: 'Lighthouse: Assert Bubblegum Tree Config Account',
    },
    {
        // 2PmrAtG26M6g8YiokmgbqrJYT4Rhe3kRN3AY3WCcu7NPuX4Jc4aiXoNb5aZuFK48vYhm8pDmwZhVZ9sP6KMAdsKw
        data: [
            13, 4, 3, 0, 1, 22, 81, 71, 137, 179, 144, 181, 85, 107, 85, 94, 131, 115, 192, 111, 181, 1, 164, 59, 203,
            113, 59, 100, 131, 63, 109, 1, 41, 231, 66, 35, 227, 0,
        ],
        keys: ['DatucYgNGQn1qtsAJ7LDzt3n2mZstbTuLqyXDGbEwZDP'],
        rows: [
            ['account-row-0', 'Target Account', 'DatucYgNGQn1qtsAJ7LDzt3n2mZstbTuLqyXDGbEwZDP'],
            ['ix-args-0-1', 'logLevel', 'number', '4'],
            ['ix-args-0-2', 'assertion', 'ProgramData'],
            ['ix-args-1-1', 'fields', 'Array[1]'],
            ['ix-args-2-0', '#0', 'UpgradeAuthority'],
            ['ix-args-3-1', 'value', 'Option(Some)'],
            ['ix-args-4-1', 'value', 'pubkey', '2W7rVWpiRMzex7sGBnww6sozQp94xFBzCGYUzUKZw2X4'],
            ['ix-args-3-2', 'operator', 'string', '='],
        ],
        title: 'Lighthouse: Assert Upgradeable Loader Account',
    },
    {
        // 66hhUzJEyouUj6Zge5kK8UQxKncTbmntXCPeHAL9pLEQQKeAAVKoyTwSRuF59EuMAhJcwgwEgyY6X3svHdSgHZzL
        data: [4, 1, 0, 0, 0, 0, 31, 10, 250, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 4],
        keys: [ACCOUNT_A, ACCOUNT_B],
        rows: [
            ['account-row-0', 'Account A', ACCOUNT_A],
            ['account-row-1', 'Account B', ACCOUNT_B],
            ['ix-args-0-1', 'logLevel', 'number', '1'],
            ['ix-args-0-2', 'assertion', 'AccountInfo'],
            ['ix-args-1-1', 'aOffset', '0'],
            ['ix-args-1-2', 'assertion', 'Lamports'],
            ['ix-args-2-1', 'value', 'bignum', '-100000000'],
            ['ix-args-2-2', 'operator', 'string', '>='],
        ],
        title: 'Lighthouse: Assert Account Delta',
    },
    {
        // 66hhUzJEyouUj6Zge5kK8UQxKncTbmntXCPeHAL9pLEQQKeAAVKoyTwSRuF59EuMAhJcwgwEgyY6X3svHdSgHZzL
        data: [0, 0, 254, 0, 1, 1],
        keys: [LIGHTHOUSE, SYSTEM, ACCOUNT_B, ACCOUNT_A, ACCOUNT_B],
        rows: [
            ['account-row-0', 'Program Id', LIGHTHOUSE],
            ['account-row-1', 'System Program', SYSTEM],
            // payer and sourceAccount share this address; each row must still
            // get its own positional name (not a single address-collapsed label).
            ['account-row-2', 'Payer', ACCOUNT_B],
            ['account-row-3', 'Memory', ACCOUNT_A],
            ['account-row-4', 'Source Account', ACCOUNT_B],
            ['ix-args-0-1', 'memoryId', 'number', '0'],
            ['ix-args-0-2', 'memoryBump', 'number', '254'],
            ['ix-args-0-3', 'writeOffset', 'number', '0'],
            ['ix-args-0-4', 'writeType', 'AccountInfoField'],
            ['ix-args-1-1', 'fields', 'Array[1]'],
            ['ix-args-2-0', '#0', 'number', '1'],
        ],
        title: 'Lighthouse: Memory Write',
    },
    {
        // 4L7Bfjj8P5GyChqaVmVFbxxgzrhzAkBJU6Tk3DtsL75m35GYTS35q9mQbUUcpffDj2g14xxWRARWFtMUGpeEDxnG
        data: [1, 0, 254],
        keys: [LIGHTHOUSE, ACCOUNT_B, ACCOUNT_A],
        rows: [
            ['account-row-0', 'Program Id', LIGHTHOUSE],
            ['account-row-1', 'Payer', ACCOUNT_B],
            ['account-row-2', 'Memory', ACCOUNT_A],
            ['ix-args-0-1', 'memoryId', 'number', '0'],
            ['ix-args-0-2', 'memoryBump', 'number', '254'],
        ],
        title: 'Lighthouse: Memory Close',
    },
    {
        data: [
            10, 5, 6, 8, 2, 204, 80, 128, 133, 6, 0, 0, 0, 4, 2, 168, 134, 128, 222, 10, 0, 0, 0, 5, 3, 0, 0, 6, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 1, 238, 1, 64, 143, 245, 9, 77, 0, 80, 251, 252, 27, 68, 110, 244, 105, 249, 207, 89,
            9, 156, 201, 247, 154, 75, 187, 221, 13, 238, 195, 38, 246, 0,
        ],
        keys: ['BasxJXmna7VWFdcrBSgmkPnfGaRmxU5iVQpRUoyNpX5Y'],
        rows: [],
        title: 'Lighthouse: Assert Token Account Multi',
    },
    {
        // 6LHBhFVLwuqiH93znCkyzMBZCkye5eHSBBeNZsz7m7M4SmJny9PQkiWtzdquEQvPfHVmn6bT6AeMa4pjNCVbefA
        data: [6, 5, 3, 0, 112, 1, 103, 2, 0, 0, 0, 0, 4, 0, 100, 2, 1, 4, 0, 0, 0, 0, 5, 3, 0, 0],
        keys: [MULTI_TARGET],
        rows: [
            ['account-row-0', 'Target Account', MULTI_TARGET],
            ['ix-args-0-1', 'logLevel', 'number', '5'],
            ['ix-args-0-2', 'assertions', 'Array[3]'],
            [NEXT, '#0', 'Lamports'],
            [NEXT, 'value', 'bignum', '40305008'],
            [NEXT, 'operator', 'string', '>='],
            [NEXT, '#1', 'Lamports'],
            [NEXT, 'value', 'bignum', '67175012'],
            [NEXT, 'operator', 'string', '<='],
            [NEXT, '#2', 'KnownOwner'],
            [NEXT, 'value', 'number', '0'],
            [NEXT, 'operator', 'string', '='],
        ],
        title: 'Lighthouse: Assert Account Info Multi',
    },
    {
        // 6LHBhFVLwuqiH93znCkyzMBZCkye5eHSBBeNZsz7m7M4SmJny9PQkiWtzdquEQvPfHVmn6bT6AeMa4pjNCVbefA
        data: [
            12, 5, 3, 1, 2, 216, 76, 74, 189, 47, 32, 227, 219, 8, 122, 136, 58, 66, 174, 136, 66, 117, 115, 83, 186,
            248, 44, 153, 55, 108, 154, 8, 139, 235, 47, 189, 139, 0, 1, 1, 216, 76, 74, 189, 47, 32, 227, 219, 8, 122,
            136, 58, 66, 174, 136, 66, 117, 115, 83, 186, 248, 44, 153, 55, 108, 154, 8, 139, 235, 47, 189, 139, 0, 2,
            1, 192, 145, 33, 0, 0, 0, 0, 0, 4,
        ],
        keys: ['2mWhJDFtX2LGKggEPVhznvs8cPzy5HM8HhsVPj5YxqA8'],
        rows: [
            ['account-row-0', 'Target Account', '2mWhJDFtX2LGKggEPVhznvs8cPzy5HM8HhsVPj5YxqA8'],
            ['ix-args-0-1', 'logLevel', 'number', '5'],
            ['ix-args-0-2', 'assertions', 'Array[3]'],
            [NEXT, '#0', 'MetaAssertion'],
            [NEXT, 'fields', 'Array[1]'],
            [NEXT, '#0', 'AuthorizedWithdrawer'],
            [NEXT, 'value', 'pubkey', MULTI_TARGET],
            [NEXT, 'operator', 'string', '='],
            [NEXT, '#1', 'MetaAssertion'],
            [NEXT, 'fields', 'Array[1]'],
            [NEXT, '#0', 'AuthorizedStaker'],
            [NEXT, 'value', 'pubkey', MULTI_TARGET],
            [NEXT, 'operator', 'string', '='],
            [NEXT, '#2', 'StakeAssertion'],
            [NEXT, 'fields', 'Array[1]'],
            [NEXT, '#0', 'DelegationStake'],
            [NEXT, 'value', 'bignum', '2200000'],
            [NEXT, 'operator', 'string', '>='],
        ],
        title: 'Lighthouse: Assert Stake Account Multi',
    },
];

describe('LighthouseDetailsCard', () => {
    it.each(CASES)('should render $title', ({ data, keys, rows, title }) => {
        renderLighthouse(
            instruction(
                data,
                keys.map(pubkey => ({ isSigner: false, isWritable: false, pubkey })),
            ),
        );

        expect(screen.getByText(title)).toBeInTheDocument();
        rows.reduce<Element | null>((above, [testId, ...texts]) => {
            const row = testId === NEXT ? nextSibling(above) : screen.getByTestId(testId);
            texts.forEach(text => expect(row).toHaveTextContent(text));
            return row;
        }, null);
    });

    // Guards the account-role badges in the shared CodamaInstructionBody. The
    // writable-non-signer and readonly-signer cases regressed historically to no
    // badge at all (an `||`/`&&` precedence bug that only rendered for
    // writable-signers); these assert each role surfaces the right badge.
    it.each([
        {
            badges: ['Writable'],
            isSigner: false,
            isWritable: true,
            name: 'a writable, non-signer account as Writable only',
        },
        { badges: ['Signer'], isSigner: true, isWritable: false, name: 'a readonly signer account as Signer only' },
        { badges: ['Writable', 'Signer'], isSigner: true, isWritable: true, name: 'a writable signer account as both' },
        { badges: [], isSigner: false, isWritable: false, name: 'a readonly, non-signer account with neither' },
    ])('should badge $name', ({ badges, isSigner, isWritable }) => {
        // Assert Account Info, single target account — only the account role varies.
        renderLighthouse(instruction(ACCOUNT_INFO_DATA, [{ isSigner, isWritable, pubkey: ACCOUNT_INFO_TARGET }]));

        const accountRow = screen.getByTestId('account-row-0');
        expect(['Writable', 'Signer'].filter(badge => accountRow.textContent?.includes(badge))).toEqual(badges);
    });
});

function instruction(data: number[], keys: Array<{ isSigner: boolean; isWritable: boolean; pubkey: string }>) {
    return {
        data: Buffer.from(data),
        keys: keys.map(key => ({ ...key, pubkey: new PublicKey(key.pubkey) })),
        programId: new PublicKey(LIGHTHOUSE_ADDRESS),
    };
}

// Decode the fixture through the real parser + dispatcher wrapper so the card is
// exercised exactly as in production (canonical `{ type, info }` + raw ix).
function renderLighthouse(raw: { data: Buffer; keys: unknown[]; programId: PublicKey }) {
    const parsed = parseLighthouseInstruction(toKitInstruction(raw as unknown as TransactionInstruction));
    invariant(parsed, 'expected fixture to parse as a Lighthouse instruction');
    const ix = toParsedInstruction(parsed, LIGHTHOUSE_PROGRAM_LABEL, raw.programId);
    return render(
        <LighthouseDetailsCard
            ix={ix}
            raw={raw as unknown as TransactionInstruction}
            index={0}
            result={{ err: null }}
        />,
    );
}

function nextSibling(el: Element | null): Element {
    invariant(el, 'expected current element to be non-null');
    // eslint-disable-next-line testing-library/no-node-access -- tests walk the DOM by sibling index
    const sibling = el.nextElementSibling;
    invariant(sibling, 'expected nextElementSibling to exist');
    return sibling;
}
