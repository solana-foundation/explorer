import { describe, expect, it } from 'vitest';

import { normalizeSearchParams } from '../normalize-search-params';

describe('normalizeSearchParams', () => {
    it('should return empty object for empty input', () => {
        expect(normalizeSearchParams({})).toEqual({});
    });

    it('should leave normal params unchanged', () => {
        expect(normalizeSearchParams({ foo: 'bar', view: 'receipt' })).toEqual({
            foo: 'bar',
            view: 'receipt',
        });
    });

    it('should expose HTML-entity-mangled key under real name (amp;cluster → cluster)', () => {
        expect(normalizeSearchParams({ 'amp;cluster': 'devnet', view: 'receipt' })).toEqual({
            cluster: 'devnet',
            view: 'receipt',
        });
    });

    it('should prefer real key when both real and amp;-prefixed param exist', () => {
        expect(normalizeSearchParams({ 'amp;cluster': 'devnet', cluster: 'testnet' })).toEqual({
            cluster: 'testnet',
        });
    });

    it('should normalize multiple amp;-prefixed params', () => {
        expect(
            normalizeSearchParams({
                'amp;cluster': 'devnet',
                'amp;customUrl': 'https://example.com',
                view: 'receipt',
            }),
        ).toEqual({
            cluster: 'devnet',
            customUrl: 'https://example.com',
            view: 'receipt',
        });
    });

    it('should preserve array values', () => {
        expect(normalizeSearchParams({ 'amp;cluster': 'devnet', ids: ['a', 'b'] })).toEqual({
            cluster: 'devnet',
            ids: ['a', 'b'],
        });
    });

    it('should normalize many amp;-prefixed params (long query string)', () => {
        expect(
            normalizeSearchParams({
                'amp;a': '1',
                'amp;b': '2',
                'amp;c': '3',
                'amp;cluster': 'devnet',
                'amp;customUrl': 'https://example.com',
                'amp;view': 'receipt',
            }),
        ).toEqual({
            a: '1',
            b: '2',
            c: '3',
            cluster: 'devnet',
            customUrl: 'https://example.com',
            view: 'receipt',
        });
    });

    it('should prefer real keys when multiple pairs of real and amp;-prefixed exist', () => {
        expect(
            normalizeSearchParams({
                'amp;cluster': 'devnet',
                'amp;customUrl': 'https://wrong.com',
                'amp;view': 'preview',
                cluster: 'testnet',
                customUrl: 'https://correct.com',
                view: 'receipt',
            }),
        ).toEqual({
            cluster: 'testnet',
            customUrl: 'https://correct.com',
            view: 'receipt',
        });
    });

    it('should handle only amp;-prefixed params (no normal keys)', () => {
        expect(
            normalizeSearchParams({
                'amp;bar': 'y',
                'amp;baz': 'z',
                'amp;foo': 'x',
            }),
        ).toEqual({
            bar: 'y',
            baz: 'z',
            foo: 'x',
        });
    });

    it('should normalize double-encoded amp;amp;foo to single amp;foo key (one level)', () => {
        // If a client sent ?foo=1&amp;amp;bar=2, we get key "amp;amp;bar" -> realKey "amp;bar"
        expect(normalizeSearchParams({ 'amp;amp;bar': '2', foo: '1' })).toEqual({
            'amp;bar': '2',
            foo: '1',
        });
    });

    it('should treat key exactly "amp;" as becoming empty string key', () => {
        expect(normalizeSearchParams({ 'amp;': 'orphan' })).toEqual({
            '': 'orphan',
        });
    });

    it('should return empty object for null/undefined-like input', () => {
        expect(normalizeSearchParams(null as unknown as Record<string, string>)).toEqual({});
        expect(normalizeSearchParams(undefined as unknown as Record<string, string>)).toEqual({});
    });
});
