import { describe, expect, it } from 'vitest';

import { generateNameVariations } from './generate-name-variations';

describe('generateNameVariations', () => {
    it('should generate variations for system program', () => {
        const result = generateNameVariations(['system', 'program'], ['system']);

        expect(result).toEqual(['systemProgram', 'system_program', 'system program', 'systemprogram', 'system']);
    });

    it('should generate variations for token program', () => {
        const result = generateNameVariations(['token', 'program'], ['token']);

        expect(result).toEqual(['tokenProgram', 'token_program', 'token program', 'tokenprogram', 'token']);
    });

    it('should generate variations for associated token program', () => {
        const result = generateNameVariations(['associated', 'token', 'program'], ['associatedToken', 'associated']);

        expect(result).toEqual([
            'associatedTokenProgram',
            'associated_token_program',
            'associated token program',
            'associatedtokenprogram',
            'associatedToken',
            'associated',
        ]);
    });

    it('should generate variations for ata program', () => {
        const result = generateNameVariations(['ata', 'program'], ['ata']);

        expect(result).toEqual(['ataProgram', 'ata_program', 'ata program', 'ataprogram', 'ata']);
    });

    it('should generate variations without additional keys', () => {
        const result = generateNameVariations(['system', 'program'], []);

        expect(result).toEqual(['systemProgram', 'system_program', 'system program', 'systemprogram']);
    });

    it('should generate variations with default empty additional keys', () => {
        const result = generateNameVariations(['compute', 'budget']);

        expect(result).toEqual(['computeBudget', 'compute_budget', 'compute budget', 'computebudget']);
    });
});
