import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { LogRow } from '../../model/to-log-rows';
import { ProgramLogs } from '../ProgramLogs';

const ROW: LogRow = {
    lines: [{ prefix: '> ', style: 'success', text: 'Program returned success' }],
    status: 'success',
};
const PROGRAM_ID = { toBase58: () => 'AM4L8ZAkTXANjmCK42TUjtXuyV1qwXdqF1YVFbJibTS9' };

describe('ProgramLogs', () => {
    it('should title a row with the program and the instruction, and link the row to the instruction card', () => {
        render(
            <ProgramLogs
                rows={[ROW]}
                instructions={[{ name: 'Transfer Checked', programId: PROGRAM_ID, programName: 'Token Program' }]}
            />,
        );

        expect(screen.getByRole('link')).toHaveAttribute('href', '#ix-1');
        expect(screen.getByText('Token Transfer Checked')).toBeInTheDocument();
        expect(screen.getByText('Program returned success')).toBeInTheDocument();
    });

    it('should title a row with the program address when nothing names the program or the instruction', () => {
        render(<ProgramLogs rows={[ROW]} instructions={[{ programId: PROGRAM_ID }]} />);

        expect(screen.getByText(`${PROGRAM_ID.toBase58()} Instruction`)).toBeInTheDocument();
    });

    it('should show rows with no link when the page has no instructions', () => {
        render(<ProgramLogs rows={[ROW, ROW]} />);

        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.getAllByText('Instruction')).toHaveLength(2);
    });
});
