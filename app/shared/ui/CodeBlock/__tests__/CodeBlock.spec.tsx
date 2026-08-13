import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CodeBlock } from '../CodeBlock';

const { error } = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error } }));

const CODE = '{\n    "mcpServers": {}\n}';

describe('CodeBlock', () => {
    const writeText = vi.fn<(text: string) => Promise<void>>();

    beforeEach(() => {
        writeText.mockReset();
        error.mockReset();
        vi.stubGlobal('navigator', { clipboard: { writeText } });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should write the exact code to the clipboard', async () => {
        writeText.mockResolvedValue(undefined);
        render(<CodeBlock code={CODE} />);

        await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));

        expect(writeText).toHaveBeenCalledWith(CODE);
    });

    it('should surface the copied state after a successful write', async () => {
        writeText.mockResolvedValue(undefined);
        render(<CodeBlock code={CODE} />);

        await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));

        expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    });

    it('should surface the failed state when the clipboard write rejects', async () => {
        writeText.mockRejectedValue(new Error('denied'));
        render(<CodeBlock code={CODE} />);

        await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));

        expect(await screen.findByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
    });

    it('should log a rejected clipboard write', async () => {
        writeText.mockRejectedValue(new Error('denied'));
        render(<CodeBlock code={CODE} />);

        await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));
        await screen.findByRole('button', { name: 'Copy failed' });

        expect(error).toHaveBeenCalledWith(expect.any(Error));
    });
});
