import { describe, expect, it } from 'vitest';

import { loadOgFonts } from '../fonts';

describe('og-fonts', () => {
    it('should return both families at 400, 500 and 600', async () => {
        const fonts = await loadOgFonts();

        expect(fonts.map(({ name, weight }) => `${name} ${weight}`)).toEqual([
            'Rubik 400',
            'Rubik 500',
            'Rubik 600',
            'Roboto Mono 400',
            'Roboto Mono 500',
            'Roboto Mono 600',
        ]);
    });

    it('should lead with Rubik, which is what makes it default family', async () => {
        const [first] = await loadOgFonts();

        expect(first.name).toBe('Rubik');
    });

    it('should return only the weights a request names', async () => {
        const fonts = await loadOgFonts([
            { family: 'Rubik', weights: [400, 500] },
            { family: 'Roboto Mono', weights: [400, 500] },
        ]);

        expect(fonts.map(({ name, weight }) => `${name} ${weight}`)).toEqual([
            'Rubik 400',
            'Rubik 500',
            'Roboto Mono 400',
            'Roboto Mono 500',
        ]);
    });

    it('should take every weight of a family whose request names none', async () => {
        const fonts = await loadOgFonts([{ family: 'Roboto Mono' }]);

        expect(fonts.map(({ name, weight }) => `${name} ${weight}`)).toEqual([
            'Roboto Mono 400',
            'Roboto Mono 500',
            'Roboto Mono 600',
        ]);
    });

    it('should drop a family the request omits', async () => {
        const fonts = await loadOgFonts([{ family: 'Rubik', weights: [400] }]);

        expect(fonts.map(({ name, weight }) => `${name} ${weight}`)).toEqual(['Rubik 400']);
    });

    it('should keep the request order rather than the declaration order', async () => {
        const fonts = await loadOgFonts([
            { family: 'Roboto Mono', weights: [400] },
            { family: 'Rubik', weights: [400] },
        ]);

        expect(fonts.map(({ name }) => name)).toEqual(['Roboto Mono', 'Rubik']);
    });
});
