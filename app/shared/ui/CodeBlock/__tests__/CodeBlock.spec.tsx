import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { CodeBlock } from '../CodeBlock';

const CODE = '{\n    "mcpServers": {}\n}';

describe('CodeBlock', () => {
    const writeText = vi.fn<(text: string) => Promise<void>>();

    beforeEach(() => {
        writeText.mockReset();
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

    it('should surface and log a rejected clipboard write', async () => {
        writeText.mockRejectedValue(new Error('denied'));
        render(<CodeBlock code={CODE} />);

        await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));

        expect(await screen.findByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
        expect(vi.mocked(Logger.error)).toHaveBeenCalledWith(expect.any(Error));
    });
});
