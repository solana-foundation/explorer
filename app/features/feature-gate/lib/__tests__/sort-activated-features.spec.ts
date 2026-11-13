import { describe, expect, it } from 'vitest';

import type { ActivatedFeature } from '../partition-features';
import { isSortDirection, sortActivatedFeatures } from '../sort-activated-features';

const feature = (title: string, clusterActivationEpoch: number) =>
    ({ clusterActivationEpoch, title }) as ActivatedFeature;

const FEATURES = [feature('middle', 700), feature('newest', 900), feature('oldest', 500)];

describe('sortActivatedFeatures', () => {
    it('should put the newest activation first when descending', () => {
        expect(sortActivatedFeatures(FEATURES, 'desc').map(f => f.title)).toEqual(['newest', 'middle', 'oldest']);
    });

    it('should put the oldest activation first when ascending', () => {
        expect(sortActivatedFeatures(FEATURES, 'asc').map(f => f.title)).toEqual(['oldest', 'middle', 'newest']);
    });

    it('should leave the input order untouched', () => {
        sortActivatedFeatures(FEATURES, 'asc');
        expect(FEATURES.map(f => f.title)).toEqual(['middle', 'newest', 'oldest']);
    });
});

describe('isSortDirection', () => {
    // `null` is the negative row because `URLSearchParams.get` returns it, the same branch `undefined` takes.
    it.each([
        ['asc', true],
        ['desc', true],
        ['newest', false],
        [null, false],
        [undefined, false],
    ])('should treat %s as %s', (value, expected) => {
        expect(isSortDirection(value)).toBe(expected);
    });
});
