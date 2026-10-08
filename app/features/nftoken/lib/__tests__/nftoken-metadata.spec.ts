import { describe, expect, it } from 'vitest';

import { parseNftokenMetadata } from '../nftoken-metadata';

describe('parseNftokenMetadata', () => {
    it('should read the name and the image', () => {
        expect(parseNftokenMetadata({ image: 'https://cdn.glow.app/a.png', name: 'Genesis: friends.glow' })).toEqual({
            kind: 'loaded',
            metadata: { image: 'https://cdn.glow.app/a.png', name: 'Genesis: friends.glow' },
        });
    });

    it('should ignore fields outside the schema', () => {
        expect(parseNftokenMetadata({ name: 'A', traits: [{ trait_type: 'Glow ID', value: 'a' }] })).toEqual({
            kind: 'loaded',
            metadata: { image: undefined, name: 'A' },
        });
    });

    it.each([
        ['missing', {}],
        ['null', { image: null, name: null }],
        ['empty', { image: '', name: '' }],
        ['blank', { image: '  ', name: ' \n' }],
    ])('should read %s fields as absent', (_, json) => {
        expect(parseNftokenMetadata(json)).toEqual({ kind: 'loaded', metadata: { image: undefined, name: undefined } });
    });

    it('should trim the name and the image', () => {
        expect(parseNftokenMetadata({ image: ' https://cdn.glow.app/a.png\n', name: ' A ' })).toEqual({
            kind: 'loaded',
            metadata: { image: 'https://cdn.glow.app/a.png', name: 'A' },
        });
    });

    it.each([
        ['a name that is not a string', { name: 5 }],
        ['an image that is not a string', { image: { url: 'https://cdn.glow.app/a.png' } }],
        ['an empty array', []],
        ['an array of objects', [{ name: 'A' }]],
        ['null', null],
        ['a string', 'metadata'],
        ['a number', 1],
        ['a boolean', true],
    ])('should settle %s as unavailable', (_, json) => {
        expect(parseNftokenMetadata(json)).toEqual({ kind: 'unavailable' });
    });
});
