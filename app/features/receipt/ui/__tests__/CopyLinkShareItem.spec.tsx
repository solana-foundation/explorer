/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CopyLinkShareItem } from '../CopyLinkShareItem';

vi.mock('@/app/shared/lib/useCopyToClipboard', () => ({
    useCopyToClipboard: () => ['copy', vi.fn()] as const,
}));

describe('CopyLinkShareItem', () => {
    it('should call onCopy when clicked', async () => {
        const onCopy = vi.fn();
        render(<CopyLinkShareItem onCopy={onCopy} />);

        await userEvent.click(screen.getByRole('button', { name: /copy link/i }));

        expect(onCopy).toHaveBeenCalledOnce();
    });

    it('should not throw when onCopy is not provided', async () => {
        render(<CopyLinkShareItem />);

        await userEvent.click(screen.getByRole('button', { name: /copy link/i }));
    });
});
