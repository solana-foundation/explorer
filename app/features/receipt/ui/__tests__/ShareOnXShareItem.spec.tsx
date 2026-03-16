/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ShareOnXShareItem } from '../ShareOnXShareItem';

const mockCustomToast = vi.fn();

vi.mock('@/app/components/shared/ui/sonner/use-toast', () => ({
    useToast: () => ({ custom: mockCustomToast }),
}));

describe('ShareOnXShareItem', () => {
    beforeEach(() => {
        mockCustomToast.mockClear();
    });
    it('should open X share URL when clicked', async () => {
        const openSpy = vi.spyOn(globalThis, 'open').mockReturnValue(window);

        render(<ShareOnXShareItem />);
        await userEvent.click(screen.getByRole('button', { name: /share on x/i }));

        expect(openSpy).toHaveBeenCalledWith(
            expect.stringContaining('https://x.com/intent/tweet?url='),
            '_blank',
            'noreferrer'
        );

        openSpy.mockRestore();
    });

    it('should call onShare when window opens successfully', async () => {
        vi.spyOn(globalThis, 'open').mockReturnValue(window);
        const onShare = vi.fn();

        render(<ShareOnXShareItem onShare={onShare} />);
        await userEvent.click(screen.getByRole('button', { name: /share on x/i }));

        expect(onShare).toHaveBeenCalledOnce();

        vi.restoreAllMocks();
    });

    it('should show error toast when window fails to open', async () => {
        vi.spyOn(globalThis, 'open').mockReturnValue(null);

        render(<ShareOnXShareItem onShare={vi.fn()} />);
        await userEvent.click(screen.getByRole('button', { name: /share on x/i }));

        expect(mockCustomToast).toHaveBeenCalledWith({ title: 'Failed to open share window', type: 'error' });

        vi.restoreAllMocks();
    });

    it('should not throw when onShare is not provided and window opens', async () => {
        vi.spyOn(globalThis, 'open').mockReturnValue(window);

        render(<ShareOnXShareItem />);
        await userEvent.click(screen.getByRole('button', { name: /share on x/i }));

        vi.restoreAllMocks();
    });
});
