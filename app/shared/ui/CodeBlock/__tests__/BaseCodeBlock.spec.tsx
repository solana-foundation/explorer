import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BaseCodeBlock } from '../BaseCodeBlock';

const CODE = 'claude mcp add --transport http solana-explorer https://explorer.solana.com/mcp';

describe('BaseCodeBlock', () => {
    it('should render the code and the caption', () => {
        render(<BaseCodeBlock caption=".mcp.json" code={CODE} />);

        expect(screen.getByText(CODE)).toBeInTheDocument();
        expect(screen.getByText('.mcp.json')).toBeInTheDocument();
    });

    it('should not render a copy control without an onCopy handler', () => {
        render(<BaseCodeBlock code={CODE} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should call onCopy when the copy control is clicked', async () => {
        const onCopy = vi.fn();
        render(<BaseCodeBlock code={CODE} onCopy={onCopy} />);

        await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));

        expect(onCopy).toHaveBeenCalledTimes(1);
    });

    it('should name the copy control after the current copy state', () => {
        const { rerender } = render(<BaseCodeBlock code={CODE} copyState="copied" onCopy={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();

        rerender(<BaseCodeBlock code={CODE} copyState="errored" onCopy={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
    });

    it('should announce a settled copy state through a live region', () => {
        const { rerender } = render(<BaseCodeBlock code={CODE} onCopy={vi.fn()} />);

        expect(screen.getByRole('status')).toHaveTextContent('');

        rerender(<BaseCodeBlock code={CODE} copyState="copied" onCopy={vi.fn()} />);
        expect(screen.getByRole('status')).toHaveTextContent('Copied');
    });
});
