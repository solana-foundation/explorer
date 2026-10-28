import { PublicKey } from '@solana/web3.js';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/app/__tests__/card-harness';

import { account, epoch, type InstructionField, slot, string } from '../model/fields';
import { type InstructionSurface, InstructionSurfaceProvider } from '../model/surface';
import { InstructionFields } from '../ui/InstructionFields';

vi.mock('@/app/components/common/Address', () => ({ Address: () => <div /> }));
vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const STUB_SURFACE: InstructionSurface = {
    Card: () => undefined,
    collapsible: false,
    instructionData: () => undefined,
    rawInstructions: undefined,
    result: { err: null },
    signature: undefined,
    validateProgram: false,
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

    it('should link an epoch field to the page of the epoch', () => {
        renderWithProviders(
            <InstructionSurfaceProvider surface={STUB_SURFACE}>
                <table>
                    <tbody>
                        <InstructionFields fields={[epoch('Lockup Expiry Epoch', 300)]} programId={PublicKey.default} />
                    </tbody>
                </table>
            </InstructionSurfaceProvider>,
        );

        expect(screen.getByRole('link', { name: '300' })).toHaveAttribute(
            'href',
            expect.stringContaining('/epoch/300'),
        );
    });

    it('should reject markup as the value of a json field', () => {
        // An unused `@ts-expect-error` fails tsc, so this breaks if the kind accepts markup.
        // @ts-expect-error A json field holds data, not markup.
        const field: InstructionField = { kind: 'json', label: 'Data', value: <div /> };

        expect(field.kind).toBe('json');
    });

    it('should link a slot field to the page of its block', () => {
        renderWithProviders(
            <InstructionSurfaceProvider surface={STUB_SURFACE}>
                <table>
                    <tbody>
                        <InstructionFields fields={[slot('Recent Slot', 170640000n)]} programId={PublicKey.default} />
                    </tbody>
                </table>
            </InstructionSurfaceProvider>,
        );

        expect(screen.getByRole('link', { name: '170,640,000' })).toHaveAttribute(
            'href',
            expect.stringContaining('/block/170640000'),
        );
    });
});
