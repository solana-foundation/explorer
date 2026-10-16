import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { InstructionIntentAvailability } from '../../lib/intent';
import { SYSTEM_PROGRAM_ADDRESS } from '../../mocks/fixtures';
import { InstructionIntentProvider, useInstructionIntentContext } from '../instruction-intent-context';

const PENDING: InstructionIntentAvailability = { status: 'pending' };

const mocks = vi.hoisted(() => ({ useInstructionIntent: vi.fn() }));

vi.mock('../use-instruction-intent', () => ({ useInstructionIntent: mocks.useInstructionIntent }));

function IntentToggle() {
    const intent = useInstructionIntentContext();

    return (
        <button type="button" data-testid="intent-toggle" data-open={intent?.open} onClick={intent?.toggle}>
            toggle
        </button>
    );
}

function renderIntentProvider(programId: string, ixIntentAvailability: InstructionIntentAvailability) {
    return render(
        <InstructionIntentProvider programId={programId} ixIntentAvailability={ixIntentAvailability}>
            <IntentToggle />
        </InstructionIntentProvider>,
    );
}

describe('InstructionIntentProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.useInstructionIntent.mockReturnValue({ status: 'idle' });
    });

    it('should not request the intent when the card is closed', () => {
        renderIntentProvider(SYSTEM_PROGRAM_ADDRESS, PENDING);

        expect(screen.getByTestId('intent-toggle')).toHaveAttribute('data-open', 'false');
        expect(mocks.useInstructionIntent).toHaveBeenLastCalledWith({
            enabled: false,
            ixIntentAvailability: PENDING,
            programId: SYSTEM_PROGRAM_ADDRESS,
        });
    });

    it('should request the intent when the card opens', async () => {
        renderIntentProvider(SYSTEM_PROGRAM_ADDRESS, PENDING);

        await userEvent.click(screen.getByTestId('intent-toggle'));

        expect(screen.getByTestId('intent-toggle')).toHaveAttribute('data-open', 'true');
        expect(mocks.useInstructionIntent).toHaveBeenLastCalledWith({
            enabled: true,
            ixIntentAvailability: PENDING,
            programId: SYSTEM_PROGRAM_ADDRESS,
        });
    });

    it('should keep the intent requested when the card closes again', async () => {
        renderIntentProvider(SYSTEM_PROGRAM_ADDRESS, PENDING);

        await userEvent.click(screen.getByTestId('intent-toggle'));
        await userEvent.click(screen.getByTestId('intent-toggle'));

        expect(screen.getByTestId('intent-toggle')).toHaveAttribute('data-open', 'false');
        expect(mocks.useInstructionIntent).toHaveBeenLastCalledWith({
            enabled: true,
            ixIntentAvailability: PENDING,
            programId: SYSTEM_PROGRAM_ADDRESS,
        });
    });
});
