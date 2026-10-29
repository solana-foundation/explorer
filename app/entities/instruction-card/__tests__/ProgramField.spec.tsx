import { PublicKey, StakeProgram } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ClusterProvider } from '@/app/providers/cluster';

import { ProgramField } from '../ui/ProgramField';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/'),
    useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const UNKNOWN_PROGRAM = new PublicKey('4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T');

describe('ProgramField', () => {
    it('should show the explorer label of a known program instead of the given name', () => {
        renderField(StakeProgram.programId, 'Stake');

        expect(screen.getByRole('link')).toHaveTextContent('Stake Program');
    });

    it('should show the given name of a program without an explorer label', () => {
        renderField(UNKNOWN_PROGRAM, 'My Program');

        expect(screen.getByRole('link')).toHaveTextContent('My Program');
    });
});

function renderField(programId: PublicKey, name: string) {
    return render(
        <ClusterProvider>
            <table>
                <tbody>
                    <ProgramField programId={programId} name={name} />
                </tbody>
            </table>
        </ClusterProvider>,
    );
}
