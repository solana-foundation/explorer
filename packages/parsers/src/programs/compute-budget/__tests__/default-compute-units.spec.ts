import { describe, expect, it } from 'vitest';

import { gen } from '../../../__tests__/gen.js';
import { getDefaultComputeUnits } from '../default-compute-units.js';

describe('getDefaultComputeUnits', () => {
    it.each([
        { name: 'System', program: gen.systemProgram, units: 150 },
        { name: 'Vote', program: gen.voteProgram, units: 2_100 },
    ])('should report $units cu for the $name program', ({ program, units }) => {
        expect(getDefaultComputeUnits(program)).toBe(units);
    });

    it('should report zero for a program with no default cu', () => {
        expect(getDefaultComputeUnits(gen.address(1))).toBe(0);
    });
});
