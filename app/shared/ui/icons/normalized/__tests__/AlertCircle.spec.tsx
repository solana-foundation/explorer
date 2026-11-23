import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DISPLAY_SIZE } from '../base';
import { NormalizedAlertCircle } from '../index';

describe('NormalizedAlertCircle', () => {
    it('should render at the shared display size and stay hidden from assistive tech', () => {
        const { container } = render(<NormalizedAlertCircle />);
        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- an aria-hidden svg has no accessible query
        const svg = container.querySelector('svg');

        expect(svg).toHaveAttribute('width', String(DISPLAY_SIZE));
        expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should take an explicit size', () => {
        const { container } = render(<NormalizedAlertCircle size={20} />);
        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- an aria-hidden svg has no accessible query
        expect(container.querySelector('svg')).toHaveAttribute('height', '20');
    });
});
