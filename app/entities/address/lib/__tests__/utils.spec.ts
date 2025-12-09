import { describe, expect, it } from 'vitest';

import { truncateAddress } from '../utils';

describe('truncateAddress', () => {
    it('should handle Solana address format (base58, 44 characters)', () => {
        const address = '3eHrHjUQcbyZ1gozTpFngKbjdnyYZxLxfrXSuT9TJHfM';
        expect(truncateAddress(address)).toBe('3eHr..JHfM');
    });

    it('should handle address with padLeft=3 and padRight=5', () => {
        const address = '3eHrHjUQcbyZ1gozTpFngKbjdnyYZxLxfrXSuT9TJHfM';
        expect(truncateAddress(address, 3, 5)).toBe('3eH..TJHfM');
    });
});
