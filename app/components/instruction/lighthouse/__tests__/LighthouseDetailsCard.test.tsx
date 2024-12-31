import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import * as lighthouseSdk from 'lighthouse-sdk';

import { LighthouseDetailsCard } from '../LighthouseDetailsCard';

jest.mock('react-feather', () => ({
    CornerDownRight: () => <div data-testid="corner-down-right" />,
}));

jest.mock('../../InstructionCard', () => ({
    InstructionCard: ({ children, title }: { children: React.ReactNode; title: string }) => (
        <div data-testid="instruction-card" className="card">
            <div className="card-header">
                <div>{title}</div>
            </div>
            <div className="table-responsive mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <tbody className="list">{children}</tbody>
                </table>
            </div>
        </div>
    ),
}));

jest.mock('../../../common/Address', () => ({
    Address: ({ pubkey }: { pubkey: PublicKey }) => <div data-testid="address">{pubkey.toBase58()}</div>,
}));

jest.mock('../../../../utils/anchor', () => ({
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

jest.mock('change-case', () => ({
    split: jest.fn(() => 'mocked-split'),
}));

describe('LighthouseDetailsCard', () => {
    const defaultProps = {
        childIndex: undefined,
        index: 0,
        innerCards: undefined,
        result: { err: null },
    };

    beforeEach(() => {
        jest.spyOn(lighthouseSdk, 'identifyLighthouseInstruction');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Assert Instructions', () => {
        it('renders AssertSysvarClock instruction', () => {
            const ix = {
                data: Buffer.from([15, 0, 0, 166, 238, 134, 18, 0, 0, 0, 0, 3]),
                keys: [],
                programId: new PublicKey('L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95'),
            };

            render(<LighthouseDetailsCard ix={ix} {...defaultProps} />);

            expect(screen.getByText('Lighthouse: Assert Sysvar Clock')).toBeInTheDocument();
        });

        it('renders Assert Account Info instruction', () => {
            const ix = {
                data: Buffer.from([5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                keys: [
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('AUuYypaXez7kXWWWYecmsb89prMCnba6g2tBWm3BxKQV'),
                    },
                ],
                programId: new PublicKey('L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95'),
            };

            render(<LighthouseDetailsCard ix={ix} {...defaultProps} />);

            expect(screen.getByText('Lighthouse: Assert Account Info')).toBeInTheDocument();
        });

        it('renders Assert Token Account instruction', () => {
            const ix = {
                data: Buffer.from([9, 0, 2, 102, 198, 105, 197, 1, 0, 0, 0, 2]),
                keys: [
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('5bjPLjnXeCfVPa3khXYzdiHaUYrW6zwveZywNJydaumJ'),
                    },
                ],
                programId: new PublicKey('L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95'),
            };

            render(<LighthouseDetailsCard ix={ix} {...defaultProps} />);

            expect(screen.getByText('Lighthouse: Assert Token Account')).toBeInTheDocument();
        });

        it('renders Assert Bubblegum Tree Config instruction', () => {
            const ix = {
                data: Buffer.from([
                    17, 4, 1, 2, 134, 9, 147, 82, 122, 185, 62, 253, 58, 44, 51, 49, 20, 153, 54, 6, 230, 246, 131, 112,
                    125, 179, 20, 217, 213, 24, 172, 55, 152, 38, 45, 0,
                ]),
                keys: [
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('FMPNEcpSDsAskMHGtB6b6vh4CipN9NNdhWtHKTDqZ9oS'),
                    },
                ],
                programId: new PublicKey('L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95'),
            };

            render(<LighthouseDetailsCard ix={ix} {...defaultProps} />);

            expect(screen.getByText('Lighthouse: Assert Bubblegum Tree Config Account')).toBeInTheDocument();
        });

        it('renders Assert Upgradeable Loader Account instruction', () => {
            const ix = {
                data: Buffer.from([
                    13, 4, 3, 0, 1, 22, 81, 71, 137, 179, 144, 181, 85, 107, 85, 94, 131, 115, 192, 111, 181, 1, 164,
                    59, 203, 113, 59, 100, 131, 63, 109, 1, 41, 231, 66, 35, 227, 0,
                ]),
                keys: [
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('DatucYgNGQn1qtsAJ7LDzt3n2mZstbTuLqyXDGbEwZDP'),
                    },
                ],
                programId: new PublicKey('L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95'),
            };

            render(<LighthouseDetailsCard ix={ix} {...defaultProps} />);

            expect(screen.getByText('Lighthouse: Assert Upgradeable Loader Account')).toBeInTheDocument();

            const accountRow = screen.getByTestId('account-row-0');
            expect(accountRow).toHaveTextContent('Target Account');
            expect(accountRow).toHaveTextContent('DatucYgNGQn1qtsAJ7LDzt3n2mZstbTuLqyXDGbEwZDP');

            const ixArgs0a = screen.getByTestId('ix-args-0-1');
            expect(ixArgs0a).toHaveTextContent('logLevel');
            expect(ixArgs0a).toHaveTextContent('number');
            expect(ixArgs0a).toHaveTextContent('4');

            const ixArgs0b = screen.getByTestId('ix-args-0-2');
            expect(ixArgs0b).toHaveTextContent('assertion');
            expect(ixArgs0b).toHaveTextContent('ProgramData');

            const ixArgs1 = screen.getByTestId('ix-args-1-1');
            expect(ixArgs1).toHaveTextContent('fields');
            expect(ixArgs1).toHaveTextContent('Array[1]');

            const ixArgs2 = screen.getByTestId('ix-args-2-0');
            expect(ixArgs2).toHaveTextContent('#0');
            expect(ixArgs2).toHaveTextContent('UpgradeAuthority');

            const ixArgs3a = screen.getByTestId('ix-args-3-1');
            expect(ixArgs3a).toHaveTextContent('value');
            expect(ixArgs3a).toHaveTextContent('Option(Some)');

            const ixArgs4b = screen.getByTestId('ix-args-4-1');
            expect(ixArgs4b).toHaveTextContent('value');
            expect(ixArgs4b).toHaveTextContent('pubkey');
            expect(ixArgs4b).toHaveTextContent('2W7rVWpiRMzex7sGBnww6sozQp94xFBzCGYUzUKZw2X4');

            const ixArgs3b = screen.getByTestId('ix-args-3-2');
            expect(ixArgs3b).toHaveTextContent('operator');
            expect(ixArgs3b).toHaveTextContent('string');
            expect(ixArgs3b).toHaveTextContent('=');
        });
    });

    describe('Assert Multi Instructions', () => {
        it('renders AssertTokenAccountMulti instruction', () => {
            const ix = {
                data: Buffer.from([
                    10, 5, 6, 8, 2, 204, 80, 128, 133, 6, 0, 0, 0, 4, 2, 168, 134, 128, 222, 10, 0, 0, 0, 5, 3, 0, 0, 6,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 238, 1, 64, 143, 245, 9, 77, 0, 80, 251, 252, 27, 68, 110, 244, 105,
                    249, 207, 89, 9, 156, 201, 247, 154, 75, 187, 221, 13, 238, 195, 38, 246, 0,
                ]),
                keys: [
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('BasxJXmna7VWFdcrBSgmkPnfGaRmxU5iVQpRUoyNpX5Y'),
                    },
                ],
                programId: new PublicKey('L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95'),
            };

            render(<LighthouseDetailsCard ix={ix} {...defaultProps} />);

            expect(screen.getByText('Lighthouse: Assert Token Account Multi')).toBeInTheDocument();
        });

        it('renders AssertAccountInfoMulti instruction', () => {
            const ix = {
                data: Buffer.from([
                    6, 5, 3, 0, 139, 61, 114, 1, 0, 0, 0, 0, 4, 0, 61, 17, 105, 2, 0, 0, 0, 0, 5, 3, 0, 0,
                ]),
                keys: [
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('H2596LHcqWoaX3MAtTCZdtJixdL8K6ZLHLkQ8QmU2rVb'),
                    },
                ],
                programId: new PublicKey('L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95'),
            };

            render(<LighthouseDetailsCard ix={ix} {...defaultProps} />);

            expect(screen.getByText('Lighthouse: Assert Account Info Multi')).toBeInTheDocument();
        });

        it('renders AssertStakeAccountMulti instruction', () => {
            const ix = {
                data: Buffer.from([
                    12, 5, 3, 1, 2, 216, 76, 74, 189, 47, 32, 227, 219, 8, 122, 136, 58, 66, 174, 136, 66, 117, 115, 83,
                    186, 248, 44, 153, 55, 108, 154, 8, 139, 235, 47, 189, 139, 0, 1, 1, 216, 76, 74, 189, 47, 32, 227,
                    219, 8, 122, 136, 58, 66, 174, 136, 66, 117, 115, 83, 186, 248, 44, 153, 55, 108, 154, 8, 139, 235,
                    47, 189, 139, 0, 2, 1, 192, 145, 33, 0, 0, 0, 0, 0, 4,
                ]),
                keys: [
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('2mWhJDFtX2LGKggEPVhznvs8cPzy5HM8HhsVPj5YxqA8'),
                    },
                ],
                programId: new PublicKey('L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95'),
            };

            render(<LighthouseDetailsCard ix={ix} {...defaultProps} />);

            expect(screen.getByText('Lighthouse: Assert Stake Account Multi')).toBeInTheDocument();
        });
    });
});
