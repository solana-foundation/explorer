import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { InstructionArg } from '../model/args';
import { type InstructionSurface, InstructionSurfaceProvider } from '../model/surface';
import { ArgRows } from '../ui/ArgRows';

const STUB_SURFACE: InstructionSurface = {
    Shell: () => undefined,
    result: { err: null },
};

describe('ArgRows', () => {
    it('should shade a nested argument row and leave a top-level row plain', () => {
        const args: InstructionArg[] = [
            textLeaf('top'),
            { children: [textLeaf('nested')], kind: 'group', name: 'config', type: 'object' },
        ];
        render(
            <InstructionSurfaceProvider surface={STUB_SURFACE}>
                <table>
                    <tbody>
                        <ArgRows args={args} />
                    </tbody>
                </table>
            </InstructionSurfaceProvider>,
        );
        fireEvent.click(screen.getByText('Expand'));

        expect(screen.getByTestId('ix-args-0-0')).not.toHaveClass('bg-black/20');
        expect(screen.getByTestId('ix-args-1-0')).toHaveClass('bg-black/20');
    });

    it('should render an empty argument with its name and type, no value and no toggle', () => {
        render(
            <InstructionSurfaceProvider surface={STUB_SURFACE}>
                <table>
                    <tbody>
                        <ArgRows args={[{ kind: 'empty', name: 'limit', type: 'Option(None)' }]} />
                    </tbody>
                </table>
            </InstructionSurfaceProvider>,
        );

        const cells = within(screen.getByTestId('ix-args-0-0')).getAllByRole('cell');
        expect(cells.map(cell => cell.textContent)).toEqual(['limit', 'Option(None)', '']);
        expect(screen.queryByText('Expand')).not.toBeInTheDocument();
    });
});

function textLeaf(name: string): InstructionArg {
    return { kind: 'leaf', name, type: 'number', value: { kind: 'text', value: '1' } };
}
