import { address } from '@solana/kit';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ClusterProvider } from '@/app/providers/cluster';

import { InstructionAddress } from '../ui/InstructionAddress';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/'),
    useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const ACCOUNT = address('4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T');

describe('InstructionAddress', () => {
    it('should link the address to its account page', () => {
        render(
            <ClusterProvider>
                <InstructionAddress address={ACCOUNT} />
            </ClusterProvider>,
        );

        expect(screen.getByRole('link')).toHaveAttribute('href', `/address/${ACCOUNT}`);
    });
});
