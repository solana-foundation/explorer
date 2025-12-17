import { Idl } from '@coral-xyz/anchor';
import { IdlInstruction, IdlTypeDef } from '@coral-xyz/anchor/dist/cjs/idl';
import { render, screen } from '@testing-library/react';
import { mapAccountToRows, mapIxArgsToRows } from '@utils/anchor';
import BN from 'bn.js';
import { vi } from 'vitest';

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
        it('should handle u64 numbers larger than 53 bits without overflow', () => {
            // Number larger than Number.MAX_SAFE_INTEGER (2^53 - 1 = 9007199254740991)
            const largeNumber = new BN('18446744073709551615'); // Max u64: 2^64 - 1

            const ixType: IdlInstruction = {
                accounts: [],
                args: [{ name: 'amount', type: 'u64' }],
                discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
                name: 'testInstruction',
            };

            const ixArgs = {
                amount: largeNumber,
            };

            const rows = mapIxArgsToRows(ixArgs, ixType, mockIdl);

            // Render the rows to check output
            const { container } = render(
                <table>
                    <tbody>{rows}</tbody>
                </table>
            );

            // Should display the full number without precision loss
            expect(container.textContent).toContain('18,446,744,073,709,551,615');
        });

        it('should handle u128 numbers without overflow', () => {
            const largeU128 = new BN('340282366920938463463374607431768211455'); // Max u128: 2^128 - 1

            const ixType: IdlInstruction = {
                accounts: [],
                args: [{ name: 'largeValue', type: 'u128' }],
                discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
                name: 'testInstruction',
            };

            const ixArgs = {
                largeValue: largeU128,
            };

            const rows = mapIxArgsToRows(ixArgs, ixType, mockIdl);

            const { container } = render(
                <table>
                    <tbody>{rows}</tbody>
                </table>
            );

            // Should display the full number
            expect(container.textContent).toContain('340,282,366,920,938,463,463,374,607,431,768,211,455');
        });

        it('should handle u256 numbers without overflow', () => {
            // Very large u256 number
            const largeU256 = new BN('115792089237316195423570985008687907853269984665640564039457584007913129639935');

            const ixType: IdlInstruction = {
                accounts: [],
                args: [{ name: 'veryLargeValue', type: 'u256' }],
                discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
                name: 'testInstruction',
            };

            const ixArgs = {
                veryLargeValue: largeU256,
            };

            const rows = mapIxArgsToRows(ixArgs, ixType, mockIdl);

            const { container } = render(
                <table>
                    <tbody>{rows}</tbody>
                </table>
            );

            // Should display the full number without scientific notation
            // The number is formatted with commas, so check for the raw number in chunks
            const formattedNumber =
                '115,792,089,237,316,195,423,570,985,008,687,907,853,269,984,665,640,564,039,457,584,007,913,129,639,935';
            expect(container.textContent).toContain(formattedNumber);
        });

        it('should handle regular numbers (u32) correctly', () => {
            const regularNumber = 1000000;

            const ixType: IdlInstruction = {
                accounts: [],
                args: [{ name: 'count', type: 'u32' }],
                discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
                name: 'testInstruction',
            };

            const ixArgs = {
                count: regularNumber,
            };

            const rows = mapIxArgsToRows(ixArgs, ixType, mockIdl);

            const { container } = render(
                <table>
                    <tbody>{rows}</tbody>
                </table>
            );

            expect(container.textContent).toContain('1,000,000');
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

            const accountData = {
                balance: largeBalance,
            };

            const rows = mapAccountToRows(accountData, accountType, mockIdl);

            const { container } = render(
                <table>
                    <tbody>{rows}</tbody>
                </table>
            );

            // Should display without precision loss
            expect(container.textContent).toContain('9,999,999,999,999,999,999');
        });
    });

    describe('error handling with proper table structure', () => {
        it('should render proper table structure on error in mapIxArgsToRows', () => {
            const ixType: IdlInstruction = {
                accounts: [],
                args: [],
                discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
                name: 'testInstruction',
            };

            const ixArgs = {
                unknownField: 'value',
            };

            const rows = mapIxArgsToRows(ixArgs, ixType, mockIdl);

            render(
                <table>
                    <tbody>{rows}</tbody>
                </table>
            );

            // Should have proper 3-column structure
            const cells = screen.getAllByRole('cell');
            expect(cells.length).toBe(3);

            // First column: field name
            expect(cells[0]).toHaveTextContent('unknownField');

            // Second column: type (instruction name)
            expect(cells[1]).toHaveTextContent('testInstruction');

            // Third column: should contain JSON viewer
            expect(screen.getByTestId('json-viewer')).toBeInTheDocument();
        });

        it('should render proper table structure on error in mapAccountToRows', () => {
            const accountType: IdlTypeDef = {
                name: 'TestAccount',
                type: {
                    fields: [],
                    kind: 'struct',
                },
            };

            const accountData = {
                unknownField: 'value',
            };

            const rows = mapAccountToRows(accountData, accountType, mockIdl);

            render(
                <table>
                    <tbody>{rows}</tbody>
                </table>
            );

            // Should have proper 3-column structure
            const cells = screen.getAllByRole('cell');
            expect(cells.length).toBe(3);

            // First column: field name
            expect(cells[0]).toHaveTextContent('unknownField');

            // Second column: type (account type name)
            expect(cells[1]).toHaveTextContent('TestAccount');

            // Third column: should contain JSON viewer
            expect(screen.getByTestId('json-viewer')).toBeInTheDocument();
        });

        it('should render JSON viewer when account type is not a struct (enum)', () => {
            const accountType: IdlTypeDef = {
                name: 'TestEnum',
                type: {
                    kind: 'enum',
                    variants: [{ name: 'VariantA' }, { name: 'VariantB' }],
                },
            };

            const accountData = {
                someField: 'value',
            };

            const rows = mapAccountToRows(accountData, accountType, mockIdl);

            render(
                <table>
                    <tbody>{rows}</tbody>
                </table>
            );

            // Should render JSON viewer for non-struct types
            expect(screen.getByTestId('json-viewer')).toBeInTheDocument();

            // Should show error message in console (tested via the error being caught)
            const cells = screen.getAllByRole('cell');
            expect(cells.length).toBe(3);
            expect(cells[0]).toHaveTextContent('someField');
        });

        it('should render JSON viewer when account type is type alias', () => {
            const accountType: IdlTypeDef = {
                name: 'TestTypeAlias',
                type: {
                    alias: { defined: { name: 'SomeOtherType' } },
                    kind: 'type',
                },
            };

            const accountData = {
                someField: 'value',
            };

            const rows = mapAccountToRows(accountData, accountType, mockIdl);

            render(
                <table>
                    <tbody>{rows}</tbody>
                </table>
            );

            // Should render JSON viewer for type alias
            expect(screen.getByTestId('json-viewer')).toBeInTheDocument();

            // Verify table structure
            const cells = screen.getAllByRole('cell');
            expect(cells.length).toBe(3);
            expect(cells[1]).toHaveTextContent('TestTypeAlias');
        });
    });
});

describe('number overflow demonstration', () => {
    it('demonstrates the problem with toNumber() on large values', () => {
        const largeNumber = new BN('18446744073709551615'); // Max u64

        // BN.js will actually throw an error if the number is too large for toNumber()
        // This proves why we MUST use toString() instead
        expect(() => largeNumber.toNumber()).toThrow('Number can only safely store up to 53 bits');

        // This preserves the full value (the correct way)
        const usingToString = largeNumber.toString();
        expect(usingToString).toBe('18446744073709551615');
    });

    it('shows MAX_SAFE_INTEGER limitation', () => {
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
