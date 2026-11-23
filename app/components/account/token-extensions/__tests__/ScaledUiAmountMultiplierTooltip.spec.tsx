import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import ScaledUiAmountMultiplierTooltip from '../ScaledUiAmountMultiplierTooltip';

describe('ScaledUiAmountMultiplierTooltip', () => {
    it('should say that the multiplier is unknown when the status is unknown', async () => {
        render(<ScaledUiAmountMultiplierTooltip rawAmount="1000" scaledUiAmountMultiplier={{ status: 'unknown' }} />);

        await userEvent.hover(screen.getByRole('button'));

        expect(await screen.findByRole('tooltip')).toHaveTextContent('multiplier is unknown');
    });
});
