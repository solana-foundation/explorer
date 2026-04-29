import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../InfoTooltip', () => ({
    InfoTooltip: ({ text }: { text?: string }) => <span>{text}</span>,
}));

describe('NFTArt', () => {
    afterEach(() => {
        vi.resetModules();
        vi.unstubAllEnvs();
    });

    it('renders a disabled VIEW ORIGINAL label for unsupported URI schemes', async () => {
        vi.stubEnv('NEXT_PUBLIC_VIEW_ORIGINAL_DISPLAY_ENABLED', 'true');
        const { NFTImageContent } = await import('../NFTArt');

        render(<NFTImageContent uri="ipfs://QmTestHash" />);

        expect(screen.getByText('VIEW ORIGINAL')).toBeInTheDocument();
        expect(screen.getByTestId('view-original-disabled')).toHaveAttribute('aria-disabled', 'true');
        expect(screen.queryByRole('link', { name: 'VIEW ORIGINAL' })).not.toBeInTheDocument();
    });
});
