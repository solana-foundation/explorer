import { Idl } from '@coral-xyz/anchor';
import { IdlInstruction, IdlTypeDef } from '@coral-xyz/anchor/dist/cjs/idl';
import { render, screen } from '@testing-library/react';
import { instructionIsSelfCPI, mapAccountToRows, mapIxArgsToRows } from '@utils/anchor';
import BN from 'bn.js';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

vi.mock('@components/common/JsonViewer', () => ({
    SolarizedJsonViewer: ({ src }: { src: any }) => <div data-testid="json-viewer">{JSON.stringify(src)}</div>,
}));

vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: any }) => <span data-testid="address">{pubkey.toString()}</span>,
}));

describe('anchor utilities - number overflow handling', () => {
    const mockIdl: Idl = {
        address: 'TestProgram111111111111111111111111111111',
        instructions: [],
        metadata: {
            name: 'test_program',
            spec: 'test',
            version: '0.1.0',
        },
        types: [],
    };

    describe('mapIxArgsToRows with large numbers', () => {
        it.each<{ type: 'u32' | 'u64' | 'u128' | 'u256'; value: BN | number; formatted: string }>([
            // Max u64 is larger than Number.MAX_SAFE_INTEGER
            { formatted: '18,446,744,073,709,551,615', type: 'u64', value: new BN('18446744073709551615') },
            {
                formatted: '340,282,366,920,938,463,463,374,607,431,768,211,455',
                type: 'u128',
                value: new BN('340282366920938463463374607431768211455'),
            },
            {
                formatted:
                    '115,792,089,237,316,195,423,570,985,008,687,907,853,269,984,665,640,564,039,457,584,007,913,129,639,935',
                type: 'u256',
                value: new BN('115792089237316195423570985008687907853269984665640564039457584007913129639935'),
            },
            { formatted: '1,000,000', type: 'u32', value: 1000000 },
        ])('should display $type value $formatted without precision loss', ({ type, value, formatted }) => {
            const ixType: IdlInstruction = {
                accounts: [],
                args: [{ name: 'amount', type }],
                discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
                name: 'testInstruction',
            };

            const { container } = renderRows(mapIxArgsToRows({ amount: value }, ixType, mockIdl));

            expect(container.textContent).toContain(formatted);
        });
    });

    describe('mapAccountToRows with large numbers', () => {
        it('should handle u64 in account data without overflow', () => {
            const largeBalance = new BN('9999999999999999999'); // Larger than MAX_SAFE_INTEGER

            const accountType: IdlTypeDef = {
                name: 'TestAccount',
                type: {
                    fields: [{ name: 'balance', type: 'u64' }],
                    kind: 'struct',
                },
            };

            const { container } = renderRows(mapAccountToRows({ balance: largeBalance }, accountType, mockIdl));

            expect(container.textContent).toContain('9,999,999,999,999,999,999');
        });
    });

    describe('error handling with proper table structure', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should render proper table structure on error in mapIxArgsToRows', () => {
            const ixType: IdlInstruction = {
                accounts: [],
                args: [],
                discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
                name: 'testInstruction',
            };

            renderRows(mapIxArgsToRows({ unknownField: 'value' }, ixType, mockIdl));

            expect(Logger.debug).toHaveBeenCalledTimes(1);
            expect(Logger.debug).toHaveBeenCalledWith('[utils:anchor] Error while displaying IDL-based account data', {
                error: expect.any(Error),
            });

            const cells = screen.getAllByRole('cell');
            expect(cells.length).toBe(3);
            expect(cells[0]).toHaveTextContent('unknownField');
            expect(cells[1]).toHaveTextContent('testInstruction');
            expect(screen.getByTestId('json-viewer')).toBeInTheDocument();
        });

        it.each<{ description: string; accountType: IdlTypeDef }>([
            {
                accountType: { name: 'TestAccount', type: { fields: [], kind: 'struct' } },
                description: 'a struct without the field',
            },
            {
                accountType: {
                    name: 'TestEnum',
                    type: { kind: 'enum', variants: [{ name: 'VariantA' }, { name: 'VariantB' }] },
                },
                description: 'an enum',
            },
            {
                accountType: {
                    name: 'TestTypeAlias',
                    type: { alias: { defined: { name: 'SomeOtherType' } }, kind: 'type' },
                },
                description: 'a type alias',
            },
        ])('should render JSON viewer in mapAccountToRows when account type is $description', ({ accountType }) => {
            renderRows(mapAccountToRows({ unknownField: 'value' }, accountType, mockIdl));

            expect(Logger.debug).toHaveBeenCalledTimes(1);
            expect(Logger.debug).toHaveBeenCalledWith('[utils:anchor] Error while displaying IDL-based account data', {
                error: expect.any(Error),
            });

            const cells = screen.getAllByRole('cell');
            expect(cells.length).toBe(3);
            expect(cells[0]).toHaveTextContent('unknownField');
            expect(cells[1]).toHaveTextContent(accountType.name);
            expect(screen.getByTestId('json-viewer')).toBeInTheDocument();
        });
    });
});

describe('instructionIsSelfCPI - Buffer operations', () => {
    // The Anchor self-CPI tag is '1d9acb512ea545e4' hex reversed
    const ANCHOR_SELF_CPI_TAG = Buffer.from('1d9acb512ea545e4', 'hex').reverse();

    it.each([
        { input: 'Buffer', toBytes: (bytes: number[]) => Buffer.from(bytes) },
        { input: 'Uint8Array', toBytes: (bytes: number[]) => new Uint8Array(bytes) },
    ])('should detect the Anchor self-CPI tag only at the start of $input input', ({ toBytes }) => {
        expect(instructionIsSelfCPI(toBytes([...ANCHOR_SELF_CPI_TAG, 0x01, 0x02, 0x03]))).toBe(true);
        expect(instructionIsSelfCPI(toBytes([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]))).toBe(false);
    });

    it('should return false for data shorter than 8 bytes', () => {
        const shortData = Buffer.from([0x01, 0x02, 0x03]);
        expect(instructionIsSelfCPI(shortData)).toBe(false);
    });

    it('should return false for empty data', () => {
        const emptyData = Buffer.from([]);
        expect(instructionIsSelfCPI(emptyData)).toBe(false);
    });

    it('should correctly identify the self-CPI tag bytes', () => {
        // Verify the tag is what we expect (e4 45 a5 2e 51 cb 9a 1d)
        const expectedTagBytes = [0xe4, 0x45, 0xa5, 0x2e, 0x51, 0xcb, 0x9a, 0x1d];
        expect(Array.from(ANCHOR_SELF_CPI_TAG)).toEqual(expectedTagBytes);
    });

    it('should handle exact 8-byte self-CPI tag', () => {
        // Just the tag, no additional data
        expect(instructionIsSelfCPI(ANCHOR_SELF_CPI_TAG)).toBe(true);
    });
});

describe('number overflow demonstration', () => {
    it('should demonstrate the problem with toNumber() on large values', () => {
        const largeNumber = new BN('18446744073709551615'); // Max u64

        // BN.js will actually throw an error if the number is too large for toNumber()
        // This proves why we MUST use toString() instead
        expect(() => largeNumber.toNumber()).toThrow('Number can only safely store up to 53 bits');

        // This preserves the full value (the correct way)
        const usingToString = largeNumber.toString();
        expect(usingToString).toBe('18446744073709551615');
    });

    it('should show MAX_SAFE_INTEGER limitation', () => {
        const maxSafe = Number.MAX_SAFE_INTEGER; // 2^53 - 1 = 9007199254740991

        // Numbers beyond this lose precision
        expect(maxSafe).toBe(9007199254740991);
        expect(maxSafe + 1).toBe(9007199254740992);
        expect(maxSafe + 2).toBe(9007199254740992); // Same as +1! Precision lost!

        // But BN can handle it correctly
        const bnMax = new BN(maxSafe.toString());
        const bnMaxPlus1 = bnMax.add(new BN(1));
        const bnMaxPlus2 = bnMax.add(new BN(2));

        expect(bnMaxPlus1.toString()).toBe('9007199254740992');
        expect(bnMaxPlus2.toString()).toBe('9007199254740993'); // Correct!
    });
});

function renderRows(rows: ReactNode) {
    return render(
        <table>
            <tbody>{rows}</tbody>
        </table>,
    );
}
