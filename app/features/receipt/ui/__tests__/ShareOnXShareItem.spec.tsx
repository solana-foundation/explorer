import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ShareOnXShareItem } from '../ShareOnXShareItem';

describe('ShareOnXShareItem', () => {
    it('should open X share URL when clicked', async () => {
        const openSpy = vi.spyOn(globalThis, 'open').mockReturnValue(null);

        render(<ShareOnXShareItem />);
        // eslint-disable-next-line no-restricted-syntax -- RegExp used for accessible name pattern matching in test assertions
        await userEvent.click(screen.getByRole('button', { name: /share on x/i }));

        expect(openSpy).toHaveBeenCalledWith(
            `https://x.com/intent/tweet?url=${encodeURIComponent(globalThis.location.href)}`,
            '_blank',
            'noreferrer',
        );

        openSpy.mockRestore();
    });

    it('should call onShare after opening the window', async () => {
        vi.spyOn(globalThis, 'open').mockReturnValue(null);
        const onShare = vi.fn();

        render(<ShareOnXShareItem onShare={onShare} />);
        // eslint-disable-next-line no-restricted-syntax -- RegExp used for accessible name pattern matching in test assertions
        await userEvent.click(screen.getByRole('button', { name: /share on x/i }));

        expect(onShare).toHaveBeenCalledOnce();

        vi.restoreAllMocks();
    });

    it('should not throw when onShare is not provided', async () => {
        vi.spyOn(globalThis, 'open').mockReturnValue(null);

        render(<ShareOnXShareItem />);
        // eslint-disable-next-line no-restricted-syntax -- RegExp used for accessible name pattern matching in test assertions
        await userEvent.click(screen.getByRole('button', { name: /share on x/i }));

        vi.restoreAllMocks();
    });
});
