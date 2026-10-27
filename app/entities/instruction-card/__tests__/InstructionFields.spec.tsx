import { PublicKey } from '@solana/web3.js';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { account, string } from '../model/fields';
import { type InstructionSurface, InstructionSurfaceProvider } from '../model/surface';
import { InstructionFields } from '../ui/InstructionFields';

vi.mock('@/app/components/common/Address', () => ({ Address: () => <div /> }));

const STUB_SURFACE: InstructionSurface = {
    Card: () => undefined,
    Shell: () => undefined,
    instructionData: () => undefined,
    result: { err: null },
    signature: undefined,
};

describe('InstructionFields', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should copy the value of a string field', async () => {
        const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
        vi.stubGlobal('navigator', { clipboard: { writeText } });

        render(
            <InstructionSurfaceProvider surface={STUB_SURFACE}>
                <table>
                    <tbody>
                        <InstructionFields fields={[string('Seed', 'abc')]} programId={PublicKey.default} />
                    </tbody>
                </table>
            </InstructionSurfaceProvider>,
        );

        const valueCell = within(screen.getAllByRole('row')[1]).getAllByRole('cell')[1];
        // eslint-disable-next-line testing-library/no-node-access -- the copy icon has no role or label
        const copyIcon = valueCell.querySelector('svg');
        expect(copyIcon).not.toBeNull();
        await userEvent.click(copyIcon as SVGElement);

        expect(writeText).toHaveBeenCalledWith('abc');
    });

    it.each([
        { badges: ['Writable', 'Signer'], role: { isSigner: true, isWritable: true } },
        { badges: [], role: { isSigner: false, isWritable: false } },
    ])('should show the badges $badges beside the label of an account field', ({ badges, role }) => {
        render(
            <InstructionSurfaceProvider surface={STUB_SURFACE}>
                <table>
                    <tbody>
                        <InstructionFields
                            fields={[account('Source', PublicKey.default, role)]}
                            programId={PublicKey.default}
                        />
                    </tbody>
                </table>
            </InstructionSurfaceProvider>,
        );

        const labelCell = within(screen.getAllByRole('row')[1]).getAllByRole('cell')[0];
        expect(labelCell).toHaveTextContent(['Source', ...badges].join(''));
    });
});
