import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    type InstructionFetchResult,
    InstructionIntentButton,
    InstructionIntentProvider,
    InstructionIntentRow,
} from '../..';
import { SYSTEM_PROGRAM_ADDRESS } from '../../mocks/fixtures';

const LOADING: InstructionFetchResult = { status: 'loading' };

const mocks = vi.hoisted(() => ({ useInstructionIntent: vi.fn() }));

vi.mock('../../model/use-instruction-intent', () => ({ useInstructionIntent: mocks.useInstructionIntent }));

function IntentConsumers({ innerIxIndex }: { innerIxIndex?: number }) {
    return (
        <>
            <InstructionIntentButton innerIxIndex={innerIxIndex} />
            <table>
                <tbody>
                    <InstructionIntentRow innerIxIndex={innerIxIndex} />
                </tbody>
            </table>
        </>
    );
}

function renderIntentProvider(programId: string, ixFetchResult: InstructionFetchResult, cardInnerIxIndex?: number) {
    return render(
        <InstructionIntentProvider programId={programId} ixFetchResult={ixFetchResult}>
            <IntentConsumers innerIxIndex={cardInnerIxIndex} />
        </InstructionIntentProvider>,
    );
}

describe('InstructionIntentButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.useInstructionIntent.mockReturnValue({ status: 'idle' });
    });

    it('should render nothing when outside a provider', () => {
        render(<IntentConsumers />);

        expect(screen.queryByTestId('instruction-intent-trigger')).not.toBeInTheDocument();
        expect(screen.queryByTestId('instruction-intent-panel')).not.toBeInTheDocument();
    });

    it("should render nothing when an inner card sits in its parent's provider", () => {
        mocks.useInstructionIntent.mockReturnValue({ reason: 'no-metadata', status: 'unavailable' });
        renderIntentProvider(SYSTEM_PROGRAM_ADDRESS, LOADING, 0);

        expect(screen.queryByTestId('instruction-intent-trigger')).not.toBeInTheDocument();
        expect(screen.queryByTestId('instruction-intent-panel')).not.toBeInTheDocument();
    });

    it('should not render the row when the card is closed', () => {
        renderIntentProvider(SYSTEM_PROGRAM_ADDRESS, LOADING);

        expect(screen.getByTestId('instruction-intent-trigger')).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByTestId('instruction-intent-trigger')).not.toHaveAttribute('aria-controls');
        expect(screen.queryByTestId('instruction-intent-panel')).not.toBeInTheDocument();
    });

    it('should render the row and point the button at it when the card opens', async () => {
        mocks.useInstructionIntent.mockReturnValue({ reason: 'no-metadata', status: 'unavailable' });
        renderIntentProvider(SYSTEM_PROGRAM_ADDRESS, LOADING);

        await userEvent.click(screen.getByTestId('instruction-intent-trigger'));

        const panel = screen.getByTestId('instruction-intent-panel');
        expect(panel).toHaveTextContent("This program doesn't publish intent metadata.");
        expect(screen.getByTestId('instruction-intent-trigger')).toHaveAttribute('aria-controls', panel.id);
    });

    it('should label the button "Intent unavailable" when the result is unavailable', () => {
        mocks.useInstructionIntent.mockReturnValue({ reason: 'no-metadata', status: 'unavailable' });
        renderIntentProvider(SYSTEM_PROGRAM_ADDRESS, LOADING);

        expect(screen.getByRole('button', { name: 'Intent unavailable' })).toBeInTheDocument();
    });

    it('should label the button "Intent failed to load" when the result is failed', () => {
        mocks.useInstructionIntent.mockReturnValue({ retry: vi.fn(), status: 'failed' });
        renderIntentProvider(SYSTEM_PROGRAM_ADDRESS, LOADING);

        expect(screen.getByRole('button', { name: 'Intent failed to load' })).toBeInTheDocument();
    });

    it('should mark the button busy when the open intent loads', async () => {
        mocks.useInstructionIntent.mockReturnValue({ status: 'loading' });
        renderIntentProvider(SYSTEM_PROGRAM_ADDRESS, LOADING);

        await userEvent.click(screen.getByTestId('instruction-intent-trigger'));

        expect(screen.getByTestId('instruction-intent-trigger')).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByTestId('instruction-intent-loading')).toBeInTheDocument();
    });
});
