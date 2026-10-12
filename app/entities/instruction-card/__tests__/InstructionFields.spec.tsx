import { PublicKey } from '@solana/web3.js';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { string } from '../model/fields';
import { type InstructionSurface, InstructionSurfaceProvider } from '../model/surface';
import { InstructionFields } from '../ui/InstructionFields';

vi.mock('@/app/components/common/Address', () => ({ Address: () => <div /> }));

const STUB_SURFACE: InstructionSurface = {
    Shell: () => undefined,
    result: { err: null },
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
});
