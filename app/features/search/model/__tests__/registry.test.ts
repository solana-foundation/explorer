import { describe, expect, it } from 'vitest';

import { searchProviders } from '../registry';

describe('searchProviders registry', () => {
    it('should contain all three tiers', () => {
        expect(searchProviders).toHaveProperty('local');
        expect(searchProviders).toHaveProperty('fallback');
        expect(searchProviders).toHaveProperty('remote');
    });

    it('should have at least one provider per tier', () => {
        expect(searchProviders.local.length).toBeGreaterThan(0);
        expect(searchProviders.fallback.length).toBeGreaterThan(0);
        expect(searchProviders.remote.length).toBeGreaterThan(0);
    });

    it.each(['local', 'fallback', 'remote'] as const)('should only contain "%s" providers in the %s tier', kind => {
        for (const provider of searchProviders[kind]) {
            expect(provider.kind).toBe(kind);
        }
    });

    it.each(['local', 'fallback', 'remote'] as const)('should sort the "%s" tier by descending priority', kind => {
        const priorities = searchProviders[kind].map(p => p.priority);
        expect(priorities).toEqual([...priorities].sort((a, b) => b - a));
    });

    it.each(['local', 'fallback', 'remote'] as const)(
        'should have unique priority values within the "%s" tier',
        kind => {
            const priorities = searchProviders[kind].map(p => p.priority);
            expect(new Set(priorities).size).toBe(priorities.length);
        },
    );
});
