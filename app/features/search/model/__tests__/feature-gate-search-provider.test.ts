import type { FeatureGate } from '@entities/feature-gate';
import { FEATURE_GATES } from '@entities/feature-gate';
import { describe, expect, it } from 'vitest';

import { parseSimdNumber } from '../../lib/parse-simd-number';
import { featureGateSearchProvider } from '../feature-gate-search-provider';
import { createSearchContext } from './provider-test-utils';

const ctx = createSearchContext();

// A script regenerates the registry from upstream, so these cases are derived
// from the data rather than naming gates that may move.
const gatesBySimd = new Map<number, FeatureGate[]>();
for (const gate of FEATURE_GATES) {
    for (const entry of gate.simds) {
        const simd = parseSimdNumber(entry);
        if (simd === undefined) continue;
        gatesBySimd.set(simd, [...(gatesBySimd.get(simd) ?? []), gate]);
    }
}

/**
 * A SIMD number carried by at least `minimumGates` gates and absent from every
 * title, so the title branch cannot add rows and an exact assertion holds.
 */
function simdReachableOnlyByNumber(minimumGates: number): [number, FeatureGate[]] {
    const found = [...gatesBySimd].find(
        ([simd, gates]) => gates.length >= minimumGates && !titleContains(String(simd)),
    );
    if (!found) throw new Error(`no SIMD number on ${minimumGates}+ gates is absent from every title`);
    return found;
}

function titleContains(text: string): boolean {
    return FEATURE_GATES.some(gate => gate.title.includes(text));
}

function titlesFor(query: string): string[] {
    const results = featureGateSearchProvider.search(query, ctx);
    if (!Array.isArray(results)) throw new Error('a local provider must return synchronously');
    return results.flatMap(group => group.options.map(option => option.label));
}

describe('featureGateSearchProvider', () => {
    it('should match a title substring', () => {
        const [gate] = FEATURE_GATES;
        expect(titlesFor(gate.title)).toContain(gate.title);
    });

    it('should reach a gate whose title omits its SIMD number', () => {
        const [simd, gates] = simdReachableOnlyByNumber(1);
        expect(titlesFor(String(simd))).toEqual(gates.map(gate => gate.title));
    });

    it('should return the Feature Gates group with an address option per gate', () => {
        const [simd, gates] = simdReachableOnlyByNumber(1);
        expect(featureGateSearchProvider.search(String(simd), ctx)).toEqual([
            {
                label: 'Feature Gates',
                options: gates.map(gate => ({
                    label: gate.title,
                    pathname: `/address/${gate.key}`,
                    sublabel: gate.key,
                    type: 'address',
                    value: [gate.key],
                })),
            },
        ]);
    });

    it('should list every gate that shares a SIMD number', () => {
        const [simd, gates] = simdReachableOnlyByNumber(2);
        expect(gates.length).toBeGreaterThan(1);
        expect(titlesFor(String(simd))).toEqual(gates.map(gate => gate.title));
    });

    it('should accept every spelling of a SIMD number the registry carries', () => {
        const [simd, gates] = simdReachableOnlyByNumber(1);
        const expected = gates.map(gate => gate.title);
        for (const query of [`0${simd}`, `simd${simd}`, `simd ${simd}`, `SIMD-${simd}`, `simd - ${simd}`]) {
            expect(titlesFor(query)).toEqual(expected);
        }
    });

    it('should not match a SIMD number as a prefix', () => {
        const [simd] = simdReachableOnlyByNumber(1);

        const shorter = Math.floor(simd / 10);
        if (!gatesBySimd.has(shorter) && !titleContains(String(shorter))) {
            expect(titlesFor(`simd${shorter}`)).toEqual([]);
        }

        let longer = simd * 10;
        while (gatesBySimd.has(longer)) longer++;
        expect(titlesFor(`simd${longer}`)).toEqual([]);
    });

    it('should return empty for a SIMD number no gate carries', () => {
        const absent = Math.max(...gatesBySimd.keys()) + 1;
        expect(titlesFor(`simd${absent}`)).toEqual([]);
    });

    it('should return empty for a block-sized number', () => {
        expect(titlesFor('355000000')).toEqual([]);
    });

    it('should not match the empty SIMD entries the registry carries', () => {
        expect(FEATURE_GATES.some(gate => gate.simds.some(entry => parseSimdNumber(entry) === undefined))).toBe(true);
        expect(titlesFor('simd 0')).toEqual([]);
    });

    it('should ignore a non-numeric SIMD query', () => {
        expect(titlesFor('simd-abc')).toEqual([]);
    });
});
