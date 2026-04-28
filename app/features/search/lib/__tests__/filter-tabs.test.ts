import { describe, expect, it } from 'vitest';

import { computeFilterArgs } from '../filter-tabs';
import type { SearchOptions } from '../types';

function makeGroup(label: string, count = 1): SearchOptions {
    return {
        label,
        options: Array.from({ length: count }, (_, i) => ({
            label: `${label} item ${i}`,
            pathname: `/${label.toLowerCase()}/${i}`,
            value: [`${label}-${i}`],
        })),
    };
}

const tokens = makeGroup('Tokens', 2);
const programs = makeGroup('Programs', 3);
const featureGates = makeGroup('Feature Gates', 1);
const accounts = makeGroup('Accounts', 2);

describe('computeFilterArgs', () => {
    describe('counts', () => {
        it('should count total for "all" tab', () => {
            expect(computeFilterArgs([tokens, accounts]).counts.all).toBe(4);
        });

        it('should count per-group for named tabs', () => {
            const { counts } = computeFilterArgs([tokens, programs]);
            expect(counts.tokens).toBe(2);
            expect(counts.programs).toBe(3);
        });

        it('should sum multiple groups into a single tab count', () => {
            const programLoaders = makeGroup('Program Loaders', 1);
            expect(computeFilterArgs([programs, programLoaders]).counts.programs).toBe(4);
        });

        it('should return 0 for tabs with no matching groups', () => {
            const { counts } = computeFilterArgs([accounts]);
            expect(counts.tokens).toBe(0);
            expect(counts.programs).toBe(0);
        });
    });

    describe('visibleTabs', () => {
        it('should always include the "all" tab', () => {
            expect(computeFilterArgs([]).visibleTabs.map(t => t.id)).toContain('all');
        });

        it('should include tabs that have results', () => {
            expect(computeFilterArgs([tokens]).visibleTabs.map(t => t.id)).toContain('tokens');
        });

        it('should exclude tabs with no results', () => {
            const ids = computeFilterArgs([tokens]).visibleTabs.map(t => t.id);
            expect(ids).not.toContain('programs');
            expect(ids).not.toContain('other');
        });
    });

    describe('filteredResults — active tab filtering', () => {
        it('should return all groups when filter is "all"', () => {
            expect(computeFilterArgs([tokens, programs, featureGates]).filteredResults).toHaveLength(3);
        });

        it('should return only matching groups for a named filter', () => {
            const { filteredResults } = computeFilterArgs([tokens, programs, accounts], 'tokens');
            expect(filteredResults).toHaveLength(1);
            expect(filteredResults[0].label).toBe('Tokens');
        });

        it('should return empty array when filter has no matching groups', () => {
            expect(computeFilterArgs([accounts], 'tokens').filteredResults).toHaveLength(0);
        });
    });

    describe('filteredResults — "all" tab reordering', () => {
        it('should place Tokens first when not already first', () => {
            expect(computeFilterArgs([accounts, tokens, programs]).filteredResults[0].label).toBe('Tokens');
        });

        it('should leave Tokens in place when already first', () => {
            expect(computeFilterArgs([tokens, accounts, programs]).filteredResults[0].label).toBe('Tokens');
        });

        it('should place Feature Gates last when not already last', () => {
            const labels = computeFilterArgs([featureGates, tokens, accounts]).filteredResults.map(g => g.label);
            expect(labels[labels.length - 1]).toBe('Feature Gates');
        });

        it('should leave Feature Gates in place when already last', () => {
            const labels = computeFilterArgs([tokens, accounts, featureGates]).filteredResults.map(g => g.label);
            expect(labels[labels.length - 1]).toBe('Feature Gates');
        });

        it('should apply both Tokens-first and Feature-Gates-last at the same time', () => {
            const labels = computeFilterArgs([featureGates, accounts, tokens]).filteredResults.map(g => g.label);
            expect(labels[0]).toBe('Tokens');
            expect(labels[labels.length - 1]).toBe('Feature Gates');
        });

        it('should not reorder when filter is not "all"', () => {
            const programLoaders = makeGroup('Program Loaders', 1);
            const labels = computeFilterArgs([programLoaders, programs], 'programs').filteredResults.map(g => g.label);
            expect(labels).toEqual(['Program Loaders', 'Programs']);
        });
    });
});
