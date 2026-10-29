import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { InstructionCardFrame } from '../ui/InstructionCardFrame';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

describe('InstructionCardFrame', () => {
    it.each([
        { case: 'a transaction that succeeds', err: null, variant: 'success' },
        { case: 'the instruction that fails', err: { InstructionError: [0, 'Custom'] }, variant: 'warning' },
        { case: 'another instruction that fails', err: { InstructionError: [1, 'Custom'] }, variant: 'dark' },
        { case: 'a transaction that fails outside an instruction', err: 'AccountInUse', variant: 'dark' },
    ])('should show a $variant badge for $case', ({ err, variant }) => {
        render(
            <ScrollAnchorProvider>
                <InstructionCardFrame title="System: Transfer" result={{ err }} position={{ index: 0 }}>
                    {null}
                </InstructionCardFrame>
            </ScrollAnchorProvider>,
        );

        expect(screen.getByText('#1')).toHaveAttribute('data-variant', variant);
    });
});
