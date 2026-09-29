import { gen } from '@__fixtures__/gen';
import { TxInstructionSurface } from '@entities/instruction-card';
import { toParsedInstruction } from '@entities/instruction-parser';
import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { invariant } from '@/app/shared/lib/invariant';
import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { LIGHTHOUSE_ADDRESS, LIGHTHOUSE_PROGRAM_LABEL } from '../../lib/constants';
import { parseLighthouseInstruction } from '../../lib/lighthouse-parser';
import { LighthouseDetailsCard } from '../LighthouseDetailsCard';

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
    Address: ({ pubkey, overrideText }: { pubkey: PublicKey; overrideText?: string }) => (
        <div data-testid="address">{overrideText ?? pubkey.toBase58()}</div>
    ),
}));

vi.mock('@/app/components/common/Copyable', () => ({
    Copyable: ({ text, children }: { text: string; children: React.ReactNode }) => (
        <div data-testid="copyable" data-text={text}>
            {children}
        </div>
    ),
}));

describe('LighthouseDetailsCard', () => {
    describe('Assert Instructions', () => {
        it('should render Assert Sysvar Clock instruction', () => {
            const ix = {
                data: Buffer.from([15, 0, 0, 166, 238, 134, 18, 0, 0, 0, 0, 3]),
                keys: [],
                programId: new PublicKey(LIGHTHOUSE_ADDRESS),
            };

            renderLighthouse(ix);

            expect(screen.getByText('Lighthouse: Assert Sysvar Clock')).toBeInTheDocument();

            const ixArgs0a = screen.getByTestId('ix-args-0-0');
            expect(ixArgs0a).toHaveTextContent('logLevel');
            expect(ixArgs0a).toHaveTextContent('number');
            expect(ixArgs0a).toHaveTextContent('0');

            const ixArgs0b = screen.getByTestId('ix-args-0-1');
            expect(ixArgs0b).toHaveTextContent('assertion');
            expect(ixArgs0b).toHaveTextContent('Slot');

            const ixArgs1 = screen.getByTestId('ix-args-1-0');
            expect(ixArgs1).toHaveTextContent('value');
            expect(ixArgs1).toHaveTextContent('bignum');
            expect(ixArgs1).toHaveTextContent('310832806');

            const ixArgs2 = screen.getByTestId('ix-args-1-1');
            expect(ixArgs2).toHaveTextContent('operator');
            expect(ixArgs2).toHaveTextContent('string');
            expect(ixArgs2).toHaveTextContent('<');
        });

        it('should render Assert Account Info instruction', () => {
            // 43PnzYerXr5b4LNf8A1j8kqztt8Voa7oiL9pzDTmWwSKCeLdZbLLJRd9A2XebiJvRP6kjNW6pF4mnGYnbSsRNXoU
            const ix = {
                data: Buffer.from([5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                keys: [
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('AUuYypaXez7kXWWWYecmsb89prMCnba6g2tBWm3BxKQV'),
                    },
                ],
                programId: new PublicKey(LIGHTHOUSE_ADDRESS),
            };

            renderLighthouse(ix);

            expect(screen.getByText('Lighthouse: Assert Account Info')).toBeInTheDocument();

            const accountRow = screen.getByTestId('account-row-0');
            expect(accountRow).toHaveTextContent('TargetAccount');
            expect(accountRow).toHaveTextContent('AUuYypaXez7kXWWWYecmsb89prMCnba6g2tBWm3BxKQV');

            const ixArgs0a = screen.getByTestId('ix-args-0-0');
            expect(ixArgs0a).toHaveTextContent('logLevel');
            expect(ixArgs0a).toHaveTextContent('number');
            expect(ixArgs0a).toHaveTextContent('4');

            const ixArgs0b = screen.getByTestId('ix-args-0-1');
            expect(ixArgs0b).toHaveTextContent('assertion');
            expect(ixArgs0b).toHaveTextContent('Lamports');

            const ixArgs1 = screen.getByTestId('ix-args-1-0');
            expect(ixArgs1).toHaveTextContent('value');
            expect(ixArgs1).toHaveTextContent('bignum');
            expect(ixArgs1).toHaveTextContent('0');

            const ixArgs2 = screen.getByTestId('ix-args-1-1');
            expect(ixArgs2).toHaveTextContent('operator');
            expect(ixArgs2).toHaveTextContent('string');
            expect(ixArgs2).toHaveTextContent('=');
        });

        it('should render Assert Token Account instruction', () => {
            // 5ZtLCLaUGDVXyCZhKLiiNTFqasqUAwahpEeFNHM86amL2awLDByWkuWAdz6C7gdt1GRmfDbjUooh8ozL6a5LUyeZ
            const ix = {
                data: Buffer.from([9, 0, 2, 102, 198, 105, 197, 1, 0, 0, 0, 2]),
                keys: [
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('5bjPLjnXeCfVPa3khXYzdiHaUYrW6zwveZywNJydaumJ'),
                    },
                ],
                programId: new PublicKey(LIGHTHOUSE_ADDRESS),
            };

            renderLighthouse(ix);

            expect(screen.getByText('Lighthouse: Assert Token Account')).toBeInTheDocument();

            const accountRow = screen.getByTestId('account-row-0');
            expect(accountRow).toHaveTextContent('TargetAccount');
            expect(accountRow).toHaveTextContent('5bjPLjnXeCfVPa3khXYzdiHaUYrW6zwveZywNJydaumJ');

            const ixArgs0a = screen.getByTestId('ix-args-0-0');
            expect(ixArgs0a).toHaveTextContent('logLevel');
            expect(ixArgs0a).toHaveTextContent('number');
            expect(ixArgs0a).toHaveTextContent('0');

            const ixArgs0b = screen.getByTestId('ix-args-0-1');
            expect(ixArgs0b).toHaveTextContent('assertion');
            expect(ixArgs0b).toHaveTextContent('Amount');

            const ixArgs1 = screen.getByTestId('ix-args-1-0');
            expect(ixArgs1).toHaveTextContent('value');
            expect(ixArgs1).toHaveTextContent('bignum');
            expect(ixArgs1).toHaveTextContent('7607010918');

            const ixArgs2 = screen.getByTestId('ix-args-1-1');
            expect(ixArgs2).toHaveTextContent('operator');
            expect(ixArgs2).toHaveTextContent('string');
            expect(ixArgs2).toHaveTextContent('>');
        });

        it('should render Assert Bubblegum Tree Config instruction', () => {
            // 5WA6DR6vBbyk6wsyxfFAQcsyFLLFamPFKWwgYMSpWbFdUBCCP2WweVggGKtrnJmUa8yyZE5ykqeaQe97daxpPMKZ
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
                programId: new PublicKey(LIGHTHOUSE_ADDRESS),
            };

            renderLighthouse(ix);

            expect(screen.getByText('Lighthouse: Assert Bubblegum Tree Config Account')).toBeInTheDocument();

            const accountRow = screen.getByTestId('account-row-0');
            expect(accountRow).toHaveTextContent('TargetAccount');
            expect(accountRow).toHaveTextContent('FMPNEcpSDsAskMHGtB6b6vh4CipN9NNdhWtHKTDqZ9oS');

            const ixArgs0a = screen.getByTestId('ix-args-0-0');
            expect(ixArgs0a).toHaveTextContent('logLevel');
            expect(ixArgs0a).toHaveTextContent('number');
            expect(ixArgs0a).toHaveTextContent('4');

            const ixArgs0b = screen.getByTestId('ix-args-0-1');
            expect(ixArgs0b).toHaveTextContent('assertion');
            expect(ixArgs0b).toHaveTextContent('TreeDelegate');

            const ixArgs1 = screen.getByTestId('ix-args-1-0');
            expect(ixArgs1).toHaveTextContent('value');
            expect(ixArgs1).toHaveTextContent('pubkey');
            expect(ixArgs1).toHaveTextContent('ArMorTp7EVn3SVVo8SJ92BiJAKETEczng6fyN743W3e');

            const ixArgs2 = screen.getByTestId('ix-args-1-1');
            expect(ixArgs2).toHaveTextContent('operator');
            expect(ixArgs2).toHaveTextContent('string');
            expect(ixArgs2).toHaveTextContent('=');
        });

        it('should render Assert Upgradeable Loader Account instruction', () => {
            // 2PmrAtG26M6g8YiokmgbqrJYT4Rhe3kRN3AY3WCcu7NPuX4Jc4aiXoNb5aZuFK48vYhm8pDmwZhVZ9sP6KMAdsKw
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
                programId: new PublicKey(LIGHTHOUSE_ADDRESS),
            };

            renderLighthouse(ix);

            expect(screen.getByText('Lighthouse: Assert Upgradeable Loader Account')).toBeInTheDocument();

            const accountRow = screen.getByTestId('account-row-0');
            expect(accountRow).toHaveTextContent('TargetAccount');
            expect(accountRow).toHaveTextContent('DatucYgNGQn1qtsAJ7LDzt3n2mZstbTuLqyXDGbEwZDP');

            const ixArgs0a = screen.getByTestId('ix-args-0-0');
            expect(ixArgs0a).toHaveTextContent('logLevel');
            expect(ixArgs0a).toHaveTextContent('number');
            expect(ixArgs0a).toHaveTextContent('4');

            const ixArgs0b = screen.getByTestId('ix-args-0-1');
            expect(ixArgs0b).toHaveTextContent('assertion');
            expect(ixArgs0b).toHaveTextContent('ProgramData');

            const ixArgs1 = screen.getByTestId('ix-args-1-0');
            expect(ixArgs1).toHaveTextContent('fields');
            expect(ixArgs1).toHaveTextContent('Array[1]');

            const ixArgs2 = screen.getByTestId('ix-args-2-0');
            expect(ixArgs2).toHaveTextContent('#0');
            expect(ixArgs2).toHaveTextContent('UpgradeAuthority');

            const ixArgs3a = screen.getByTestId('ix-args-3-0');
            expect(ixArgs3a).toHaveTextContent('value');
            expect(ixArgs3a).toHaveTextContent('Option(Some)');

            const ixArgs4b = screen.getByTestId('ix-args-4-0');
            expect(ixArgs4b).toHaveTextContent('value');
            expect(ixArgs4b).toHaveTextContent('pubkey');
            expect(ixArgs4b).toHaveTextContent('2W7rVWpiRMzex7sGBnww6sozQp94xFBzCGYUzUKZw2X4');

            const ixArgs3b = screen.getByTestId('ix-args-3-1');
            expect(ixArgs3b).toHaveTextContent('operator');
            expect(ixArgs3b).toHaveTextContent('string');
            expect(ixArgs3b).toHaveTextContent('=');
        });

        it('should render Assert Account Delta instruction', () => {
            // 66hhUzJEyouUj6Zge5kK8UQxKncTbmntXCPeHAL9pLEQQKeAAVKoyTwSRuF59EuMAhJcwgwEgyY6X3svHdSgHZzL
            const ix = {
                data: Buffer.from([
                    4, 1, 0, 0, 0, 0, 31, 10, 250, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 4,
                ]),
                keys: [
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('14gyJnETr2upBHRoCVFfvqcaGGEZuJT1vYXzWCJGJ45h'),
                    },
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('6Le7uLy8Y2JvCq5x5huvF3pSQBvP1Y6W325wNpFz4s4u'),
                    },
                ],
                programId: new PublicKey(LIGHTHOUSE_ADDRESS),
            };

            renderLighthouse(ix);

            expect(screen.getByText('Lighthouse: Assert Account Delta')).toBeInTheDocument();

            const accountRowA = screen.getByTestId('account-row-0');
            expect(accountRowA).toHaveTextContent('AccountA');
            expect(accountRowA).toHaveTextContent('14gyJnETr2upBHRoCVFfvqcaGGEZuJT1vYXzWCJGJ45h');

            const accountRowB = screen.getByTestId('account-row-1');
            expect(accountRowB).toHaveTextContent('AccountB');
            expect(accountRowB).toHaveTextContent('6Le7uLy8Y2JvCq5x5huvF3pSQBvP1Y6W325wNpFz4s4u');

            const ixArgs0a = screen.getByTestId('ix-args-0-0');
            expect(ixArgs0a).toHaveTextContent('logLevel');
            expect(ixArgs0a).toHaveTextContent('number');
            expect(ixArgs0a).toHaveTextContent('1');

            const ixArgs0b = screen.getByTestId('ix-args-0-1');
            expect(ixArgs0b).toHaveTextContent('assertion');
            expect(ixArgs0b).toHaveTextContent('AccountInfo');

            const ixArgs1 = screen.getByTestId('ix-args-1-0');
            expect(ixArgs1).toHaveTextContent('aOffset');
            expect(ixArgs1).toHaveTextContent('0');

            const ixArgs2 = screen.getByTestId('ix-args-1-1');
            expect(ixArgs2).toHaveTextContent('assertion');
            expect(ixArgs2).toHaveTextContent('Lamports');

            const ixArgs3 = screen.getByTestId('ix-args-2-0');
            expect(ixArgs3).toHaveTextContent('value');
            expect(ixArgs3).toHaveTextContent('bignum');
            expect(ixArgs3).toHaveTextContent('-100000000');

            const ixArgs4 = screen.getByTestId('ix-args-2-1');
            expect(ixArgs4).toHaveTextContent('operator');
            expect(ixArgs4).toHaveTextContent('string');
            expect(ixArgs4).toHaveTextContent('>=');
        });

        it('should render Memory Write instruction', () => {
            // 66hhUzJEyouUj6Zge5kK8UQxKncTbmntXCPeHAL9pLEQQKeAAVKoyTwSRuF59EuMAhJcwgwEgyY6X3svHdSgHZzL
            const ix = {
                data: Buffer.from([0, 0, 254, 0, 1, 1]),
                keys: [
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey(LIGHTHOUSE_ADDRESS),
                    },
                    { isSigner: false, isWritable: false, pubkey: new PublicKey('11111111111111111111111111111111') },
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('6Le7uLy8Y2JvCq5x5huvF3pSQBvP1Y6W325wNpFz4s4u'),
                    },
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('14gyJnETr2upBHRoCVFfvqcaGGEZuJT1vYXzWCJGJ45h'),
                    },
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('6Le7uLy8Y2JvCq5x5huvF3pSQBvP1Y6W325wNpFz4s4u'),
                    },
                ],
                programId: new PublicKey(LIGHTHOUSE_ADDRESS),
            };

            renderLighthouse(ix);

            expect(screen.getByText('Lighthouse: Memory Write')).toBeInTheDocument();

            const accountRow = screen.getByTestId('account-row-0');
            expect(accountRow).toHaveTextContent('ProgramId');
            expect(accountRow).toHaveTextContent(LIGHTHOUSE_ADDRESS);

            const accountRow1 = screen.getByTestId('account-row-1');
            expect(accountRow1).toHaveTextContent('SystemProgram');
            expect(accountRow1).toHaveTextContent('11111111111111111111111111111111');

            // payer and sourceAccount share this address; each row must still
            // get its own positional name (not a single address-collapsed label).
            const accountRow2 = screen.getByTestId('account-row-2');
            expect(accountRow2).toHaveTextContent('Payer');
            expect(accountRow2).toHaveTextContent('6Le7uLy8Y2JvCq5x5huvF3pSQBvP1Y6W325wNpFz4s4u');

            const accountRow3 = screen.getByTestId('account-row-3');
            expect(accountRow3).toHaveTextContent('Memory');
            expect(accountRow3).toHaveTextContent('14gyJnETr2upBHRoCVFfvqcaGGEZuJT1vYXzWCJGJ45h');

            const accountRow4 = screen.getByTestId('account-row-4');
            expect(accountRow4).toHaveTextContent('SourceAccount');
            expect(accountRow4).toHaveTextContent('6Le7uLy8Y2JvCq5x5huvF3pSQBvP1Y6W325wNpFz4s4u');

            const ixArgs0a = screen.getByTestId('ix-args-0-0');
            expect(ixArgs0a).toHaveTextContent('memoryId');
            expect(ixArgs0a).toHaveTextContent('number');
            expect(ixArgs0a).toHaveTextContent('0');

            const ixArgs0b = screen.getByTestId('ix-args-0-1');
            expect(ixArgs0b).toHaveTextContent('memoryBump');
            expect(ixArgs0b).toHaveTextContent('number');
            expect(ixArgs0b).toHaveTextContent('254');

            const ixArgs0c = screen.getByTestId('ix-args-0-2');
            expect(ixArgs0c).toHaveTextContent('writeOffset');
            expect(ixArgs0c).toHaveTextContent('number');
            expect(ixArgs0c).toHaveTextContent('0');

            const ixArgs0d = screen.getByTestId('ix-args-0-3');
            expect(ixArgs0d).toHaveTextContent('writeType');
            expect(ixArgs0d).toHaveTextContent('AccountInfoField');

            const ixArgs1a = screen.getByTestId('ix-args-1-0');
            expect(ixArgs1a).toHaveTextContent('fields');
            expect(ixArgs1a).toHaveTextContent('Array[1]');

            const ixArgs1b = screen.getByTestId('ix-args-2-0');
            expect(ixArgs1b).toHaveTextContent('#0');
            expect(ixArgs1b).toHaveTextContent('number');
            expect(ixArgs1b).toHaveTextContent('1');
        });

        it('should render Memory Close instruction', () => {
            // 4L7Bfjj8P5GyChqaVmVFbxxgzrhzAkBJU6Tk3DtsL75m35GYTS35q9mQbUUcpffDj2g14xxWRARWFtMUGpeEDxnG
            const ix = {
                data: Buffer.from([1, 0, 254]),
                keys: [
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey(LIGHTHOUSE_ADDRESS),
                    },
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('6Le7uLy8Y2JvCq5x5huvF3pSQBvP1Y6W325wNpFz4s4u'),
                    },
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('14gyJnETr2upBHRoCVFfvqcaGGEZuJT1vYXzWCJGJ45h'),
                    },
                ],
                programId: new PublicKey(LIGHTHOUSE_ADDRESS),
            };

            renderLighthouse(ix);

            expect(screen.getByText('Lighthouse: Memory Close')).toBeInTheDocument();

            const accountRow = screen.getByTestId('account-row-0');
            expect(accountRow).toHaveTextContent('ProgramId');
            expect(accountRow).toHaveTextContent(LIGHTHOUSE_ADDRESS);

            const accountRow1 = screen.getByTestId('account-row-1');
            expect(accountRow1).toHaveTextContent('Payer');
            expect(accountRow1).toHaveTextContent('6Le7uLy8Y2JvCq5x5huvF3pSQBvP1Y6W325wNpFz4s4u');

            const accountRow2 = screen.getByTestId('account-row-2');
            expect(accountRow2).toHaveTextContent('Memory');
            expect(accountRow2).toHaveTextContent('14gyJnETr2upBHRoCVFfvqcaGGEZuJT1vYXzWCJGJ45h');

            const ixArgs0a = screen.getByTestId('ix-args-0-0');
            expect(ixArgs0a).toHaveTextContent('memoryId');
            expect(ixArgs0a).toHaveTextContent('number');
            expect(ixArgs0a).toHaveTextContent('0');

            const ixArgs0b = screen.getByTestId('ix-args-0-1');
            expect(ixArgs0b).toHaveTextContent('memoryBump');
            expect(ixArgs0b).toHaveTextContent('number');
            expect(ixArgs0b).toHaveTextContent('254');
        });
    });

    describe('Assert Multi Instructions', () => {
        it('should render AssertTokenAccountMulti instruction', () => {
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
                programId: new PublicKey(LIGHTHOUSE_ADDRESS),
            };

            renderLighthouse(ix);

            expect(screen.getByText('Lighthouse: Assert Token Account Multi')).toBeInTheDocument();
        });

        it('should render Assert Account Info Multi instruction', () => {
            // 6LHBhFVLwuqiH93znCkyzMBZCkye5eHSBBeNZsz7m7M4SmJny9PQkiWtzdquEQvPfHVmn6bT6AeMa4pjNCVbefA
            const ix = {
                data: Buffer.from([6, 5, 3, 0, 112, 1, 103, 2, 0, 0, 0, 0, 4, 0, 100, 2, 1, 4, 0, 0, 0, 0, 5, 3, 0, 0]),
                keys: [
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('FZLY576gVwyD6rEosP72pRUC9TAe7LhgvoSepk3F63PY'),
                    },
                ],
                programId: new PublicKey(LIGHTHOUSE_ADDRESS),
            };

            renderLighthouse(ix);

            expect(screen.getByText('Lighthouse: Assert Account Info Multi')).toBeInTheDocument();

            const accountRow = screen.getByTestId('account-row-0');
            expect(accountRow).toHaveTextContent('TargetAccount');
            expect(accountRow).toHaveTextContent('FZLY576gVwyD6rEosP72pRUC9TAe7LhgvoSepk3F63PY');

            const ixArgs0a = screen.getByTestId('ix-args-0-0');
            expect(ixArgs0a).toHaveTextContent('logLevel');
            expect(ixArgs0a).toHaveTextContent('number');
            expect(ixArgs0a).toHaveTextContent('5');

            const ixArgs0b = screen.getByTestId('ix-args-0-1');
            expect(ixArgs0b).toHaveTextContent('assertions');
            expect(ixArgs0b).toHaveTextContent('Array[3]');

            // eslint-disable-next-line testing-library/no-node-access
            const ixArgs0bChildren = ixArgs0b.nextElementSibling;

            const ixArgs1a = ixArgs0bChildren;
            expect(ixArgs1a).toHaveTextContent('#0');
            expect(ixArgs1a).toHaveTextContent('Lamports');

            const ixArgs1aChild0 = nextSibling(ixArgs1a);
            expect(ixArgs1aChild0).toHaveTextContent('value');
            expect(ixArgs1aChild0).toHaveTextContent('bignum');
            expect(ixArgs1aChild0).toHaveTextContent('40305008');

            const ixArgs1aChild1 = nextSibling(ixArgs1aChild0);
            expect(ixArgs1aChild1).toHaveTextContent('operator');
            expect(ixArgs1aChild1).toHaveTextContent('string');
            expect(ixArgs1aChild1).toHaveTextContent('>=');

            const ixArgs1b = nextSibling(ixArgs1aChild1);
            expect(ixArgs1b).toHaveTextContent('#1');
            expect(ixArgs1b).toHaveTextContent('Lamports');

            const ixArgs1bChild0 = nextSibling(ixArgs1b);
            expect(ixArgs1bChild0).toHaveTextContent('value');
            expect(ixArgs1bChild0).toHaveTextContent('bignum');
            expect(ixArgs1bChild0).toHaveTextContent('67175012');

            const ixArgs1bChild1 = nextSibling(ixArgs1bChild0);
            expect(ixArgs1bChild1).toHaveTextContent('operator');
            expect(ixArgs1bChild1).toHaveTextContent('string');
            expect(ixArgs1bChild1).toHaveTextContent('<=');

            const ixArgs1c = nextSibling(ixArgs1bChild1);
            expect(ixArgs1c).toHaveTextContent('#2');
            expect(ixArgs1c).toHaveTextContent('KnownOwner');

            const ixArgs1cChild0 = nextSibling(ixArgs1c);
            expect(ixArgs1cChild0).toHaveTextContent('value');
            expect(ixArgs1cChild0).toHaveTextContent('number');
            expect(ixArgs1cChild0).toHaveTextContent('0');

            const ixArgs1cChild1 = nextSibling(ixArgs1cChild0);
            expect(ixArgs1cChild1).toHaveTextContent('operator');
            expect(ixArgs1cChild1).toHaveTextContent('string');
            expect(ixArgs1cChild1).toHaveTextContent('=');
        });

        it('should render Assert Stake Account Multi instruction', () => {
            // 6LHBhFVLwuqiH93znCkyzMBZCkye5eHSBBeNZsz7m7M4SmJny9PQkiWtzdquEQvPfHVmn6bT6AeMa4pjNCVbefA
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
                programId: new PublicKey(LIGHTHOUSE_ADDRESS),
            };

            renderLighthouse(ix);

            expect(screen.getByText('Lighthouse: Assert Stake Account Multi')).toBeInTheDocument();

            const accountRow = screen.getByTestId('account-row-0');
            expect(accountRow).toHaveTextContent('TargetAccount');
            expect(accountRow).toHaveTextContent('2mWhJDFtX2LGKggEPVhznvs8cPzy5HM8HhsVPj5YxqA8');

            const ixArgs0a = screen.getByTestId('ix-args-0-0');
            expect(ixArgs0a).toHaveTextContent('logLevel');
            expect(ixArgs0a).toHaveTextContent('number');
            expect(ixArgs0a).toHaveTextContent('5');

            const ixArgs0b = screen.getByTestId('ix-args-0-1');
            expect(ixArgs0b).toHaveTextContent('assertions');
            expect(ixArgs0b).toHaveTextContent('Array[3]');

            // eslint-disable-next-line testing-library/no-node-access
            const ixArgs0bChildren = ixArgs0b.nextElementSibling;

            // 1st assertion
            let next = ixArgs0bChildren;
            expect(next).toHaveTextContent('#0');
            expect(next).toHaveTextContent('MetaAssertion');

            next = nextSibling(next);
            expect(next).toHaveTextContent('fields');
            expect(next).toHaveTextContent('Array[1]');

            next = nextSibling(next);
            expect(next).toHaveTextContent('#0');
            expect(next).toHaveTextContent('AuthorizedWithdrawer');

            next = nextSibling(next);
            expect(next).toHaveTextContent('value');
            expect(next).toHaveTextContent('pubkey');
            expect(next).toHaveTextContent('FZLY576gVwyD6rEosP72pRUC9TAe7LhgvoSepk3F63PY');

            next = nextSibling(next);
            expect(next).toHaveTextContent('operator');
            expect(next).toHaveTextContent('string');
            expect(next).toHaveTextContent('=');

            // 2nd assertion

            next = nextSibling(next);
            expect(next).toHaveTextContent('#1');
            expect(next).toHaveTextContent('MetaAssertion');

            next = nextSibling(next);
            expect(next).toHaveTextContent('fields');
            expect(next).toHaveTextContent('Array[1]');

            next = nextSibling(next);
            expect(next).toHaveTextContent('#0');
            expect(next).toHaveTextContent('AuthorizedStaker');

            next = nextSibling(next);
            expect(next).toHaveTextContent('value');
            expect(next).toHaveTextContent('pubkey');
            expect(next).toHaveTextContent('FZLY576gVwyD6rEosP72pRUC9TAe7LhgvoSepk3F63PY');

            next = nextSibling(next);
            expect(next).toHaveTextContent('operator');
            expect(next).toHaveTextContent('string');
            expect(next).toHaveTextContent('=');

            // 3rd assertion

            next = nextSibling(next);
            expect(next).toHaveTextContent('#2');
            expect(next).toHaveTextContent('StakeAssertion');

            next = nextSibling(next);
            expect(next).toHaveTextContent('fields');
            expect(next).toHaveTextContent('Array[1]');

            next = nextSibling(next);
            expect(next).toHaveTextContent('#0');
            expect(next).toHaveTextContent('DelegationStake');

            next = nextSibling(next);
            expect(next).toHaveTextContent('value');
            expect(next).toHaveTextContent('bignum');
            expect(next).toHaveTextContent('2200000');

            next = nextSibling(next);
            expect(next).toHaveTextContent('operator');
            expect(next).toHaveTextContent('string');
            expect(next).toHaveTextContent('>=');
        });
    });

    describe('account role badges', () => {
        const assertAccountInfo = (isSigner: boolean, isWritable: boolean) => ({
            data: Buffer.from([5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            keys: [{ isSigner, isWritable, pubkey: new PublicKey('AUuYypaXez7kXWWWYecmsb89prMCnba6g2tBWm3BxKQV') }],
            programId: new PublicKey(LIGHTHOUSE_ADDRESS),
        });

        it('should badge a writable, non-signer account as Writable only', () => {
            renderLighthouse(assertAccountInfo(false, true));

            const accountRow = screen.getByTestId('account-row-0');
            expect(accountRow).toHaveTextContent('Writable');
            expect(accountRow).not.toHaveTextContent('Signer');
        });

        it('should badge a readonly signer account as Signer only', () => {
            renderLighthouse(assertAccountInfo(true, false));

            const accountRow = screen.getByTestId('account-row-0');
            expect(accountRow).toHaveTextContent('Signer');
            expect(accountRow).not.toHaveTextContent('Writable');
        });

        it('should badge a writable signer account as both Writable and Signer', () => {
            renderLighthouse(assertAccountInfo(true, true));

            const accountRow = screen.getByTestId('account-row-0');
            expect(accountRow).toHaveTextContent('Writable');
            expect(accountRow).toHaveTextContent('Signer');
        });

        it('should show no role badge for a readonly, non-signer account', () => {
            renderLighthouse(assertAccountInfo(false, false));

            const accountRow = screen.getByTestId('account-row-0');
            expect(accountRow).not.toHaveTextContent('Writable');
            expect(accountRow).not.toHaveTextContent('Signer');
        });
    });

    describe('account table', () => {
        it('should omit the account table when the instruction takes no accounts', () => {
            renderLighthouse({
                data: Buffer.from([15, 0, 0, 166, 238, 134, 18, 0, 0, 0, 0, 3]),
                keys: [],
                programId: new PublicKey(LIGHTHOUSE_ADDRESS),
            });

            expect(screen.queryByText('Account Name')).not.toBeInTheDocument();
            expect(screen.getByText('Argument Name')).toBeInTheDocument();
        });

        it('should label an account past the declared ones as a remaining account', () => {
            const extra = gen.publicKey(0);
            renderLighthouse({
                data: Buffer.from([5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                keys: [
                    {
                        isSigner: false,
                        isWritable: false,
                        pubkey: new PublicKey('AUuYypaXez7kXWWWYecmsb89prMCnba6g2tBWm3BxKQV'),
                    },
                    { isSigner: false, isWritable: false, pubkey: extra },
                ],
                programId: new PublicKey(LIGHTHOUSE_ADDRESS),
            });

            expect(screen.getByTestId('account-row-0')).toHaveTextContent('TargetAccount');
            const extraRow = screen.getByTestId('account-row-1');
            expect(extraRow).toHaveTextContent('Remaining Account #1');
            expect(extraRow).toHaveTextContent(extra.toBase58());
        });
    });

    it('should name the program in the Program row', () => {
        renderLighthouse({
            data: Buffer.from([15, 0, 0, 166, 238, 134, 18, 0, 0, 0, 0, 3]),
            keys: [],
            programId: new PublicKey(LIGHTHOUSE_ADDRESS),
        });

        expect(screen.getByText('Lighthouse')).toBeInTheDocument();
    });
});

// Decode the fixture through the real parser + dispatcher wrapper so the card is
// exercised exactly as in production (canonical `{ type, info }` + raw ix).
function renderLighthouse(raw: { data: Buffer; keys: unknown[]; programId: PublicKey }) {
    const parsed = parseLighthouseInstruction(toKitInstruction(raw as unknown as TransactionInstruction));
    invariant(parsed, 'expected fixture to parse as a Lighthouse instruction');
    const ix = toParsedInstruction(parsed, LIGHTHOUSE_PROGRAM_LABEL, raw.programId);
    const view = render(
        <TxInstructionSurface result={{ err: null }}>
            <LighthouseDetailsCard ix={ix} raw={raw as unknown as TransactionInstruction} index={0} />
        </TxInstructionSurface>,
    );
    expandAllGroups();
    return view;
}

// A test timeout cannot stop a synchronous loop, so the loop stops at a fixed depth.
function expandAllGroups() {
    for (let level = 0; level < MAX_GROUP_DEPTH; level++) {
        const toggles = screen.queryAllByText('Expand');
        if (toggles.length === 0) return;
        toggles.forEach(toggle => fireEvent.click(toggle));
    }
    throw new Error('a group did not expand');
}

const MAX_GROUP_DEPTH = 10;

function nextSibling(el: Element | null): Element {
    invariant(el, 'expected current element to be non-null');
    // eslint-disable-next-line testing-library/no-node-access -- tests walk the DOM by sibling index
    const sibling = el.nextElementSibling;
    invariant(sibling, 'expected nextElementSibling to exist');
    return sibling;
}
