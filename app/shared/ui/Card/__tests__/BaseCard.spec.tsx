import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BaseCard } from '../BaseCard';

describe('BaseCard', () => {
    it.each([
        ['none', 'mb-0'],
        ['sm', 'mb-2'],
    ] as const)('should replace the dashkit margin with marginBottom="%s"', (marginBottom, expected) => {
        render(<BaseCard ui="dashkit" marginBottom={marginBottom} data-testid="card" />);

        const card = screen.getByTestId('card');
        expect(card).toHaveClass(expected);
        expect(card).not.toHaveClass('mb-6');
    });

    it('should keep the dashkit margin by default', () => {
        render(<BaseCard ui="dashkit" data-testid="card" />);

        expect(screen.getByTestId('card')).toHaveClass('mb-6');
    });
});
