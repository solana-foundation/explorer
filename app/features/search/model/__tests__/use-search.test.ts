import { describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import type { SearchContext, SearchOptions, SearchProvider, SearchProviderRegistry } from '../../lib/types';
import { resolveProviders, search } from '../use-search';
import { createSearchContext } from './provider-test-utils';

const ctx = createSearchContext();

describe('resolveProviders', () => {
    it('should return results from all providers', async () => {
        const providers = [
            makeProvider('A', 'local', () => [makeResult('A', 'a')]),
            makeProvider('B', 'local', () => [makeResult('B', 'b')]),
        ];

        const results = await resolveProviders(providers, 'test', ctx);

        expect(results).toEqual([makeResult('A', 'a'), makeResult('B', 'b')]);
    });

    it('should return empty array when given no providers', async () => {
        expect(await resolveProviders([], 'test', ctx)).toEqual([]);
    });

    it('should handle async providers', async () => {
        const providers = [makeProvider('Async', 'remote', async () => [makeResult('Async', 'x')])];

        const results = await resolveProviders(providers, 'q', ctx);

        expect(results).toEqual([makeResult('Async', 'x')]);
    });

    it('should skip rejected providers and log an error', async () => {
        const errorSpy = vi.spyOn(Logger, 'error').mockImplementation(() => {});

        const providers = [
            makeProvider('Good', 'local', () => [makeResult('Good', 'g')]),
            makeProvider('Bad', 'local', () => {
                throw new Error('boom');
            }),
            makeProvider('AlsoGood', 'local', () => [makeResult('Also', 'a')]),
        ];

        const results = await resolveProviders(providers, 'q', ctx);

        expect(results).toEqual([makeResult('Good', 'g'), makeResult('Also', 'a')]);
        expect(errorSpy).toHaveBeenCalledOnce();
        expect(errorSpy).toHaveBeenCalledWith(
            expect.objectContaining({ cause: expect.any(Error), message: expect.stringContaining('Bad') }),
        );

        errorSpy.mockRestore();
    });

    it('should skip async rejected providers', async () => {
        const errorSpy = vi.spyOn(Logger, 'error').mockImplementation(() => {});

        const providers = [
            makeProvider('Broken', 'remote', () => Promise.reject(new Error('network'))),
            makeProvider('OK', 'remote', async () => [makeResult('OK', 'ok')]),
        ];

        const results = await resolveProviders(providers, 'q', ctx);

        expect(results).toEqual([makeResult('OK', 'ok')]);
        expect(errorSpy).toHaveBeenCalledOnce();

        errorSpy.mockRestore();
    });

    it('should pass query and context to providers', async () => {
        const searchFn = vi.fn(() => []);
        const providers = [makeProvider('Spy', 'local', searchFn)];
        const customCtx = createSearchContext({ currentEpoch: 42n });

        await resolveProviders(providers, 'myquery', customCtx);

        expect(searchFn).toHaveBeenCalledWith('myquery', customCtx);
    });
});

describe('search', () => {
    function makeRegistry(overrides?: Partial<SearchProviderRegistry>): SearchProviderRegistry {
        return { fallback: [], local: [], remote: [], ...overrides };
    }

    it('should return local results when available', async () => {
        const registry = makeRegistry({
            local: [makeProvider('L', 'local', () => [makeResult('Local', 'l')])],
        });

        const results = await search(registry, 'q', ctx);

        expect(results).toEqual([makeResult('Local', 'l')]);
    });

    it('should include remote results after local results', async () => {
        const registry = makeRegistry({
            local: [makeProvider('L', 'local', () => [makeResult('Local', 'l')])],
            remote: [makeProvider('R', 'remote', () => [makeResult('Remote', 'r')])],
        });

        const results = await search(registry, 'q', ctx);

        expect(results).toEqual([makeResult('Local', 'l'), makeResult('Remote', 'r')]);
    });

    it('should use fallback providers when local returns no results', async () => {
        const registry = makeRegistry({
            fallback: [makeProvider('F', 'fallback', () => [makeResult('Fallback', 'f')])],
            local: [makeProvider('L', 'local', () => [])],
        });

        const results = await search(registry, 'q', ctx);

        expect(results).toEqual([makeResult('Fallback', 'f')]);
    });

    it('should skip fallback providers when local has results', async () => {
        const fallbackFn = vi.fn(() => [makeResult('Fallback', 'f')]);
        const registry = makeRegistry({
            fallback: [makeProvider('F', 'fallback', fallbackFn)],
            local: [makeProvider('L', 'local', () => [makeResult('Local', 'l')])],
        });

        const results = await search(registry, 'q', ctx);

        expect(results).toEqual([makeResult('Local', 'l')]);
        expect(fallbackFn).not.toHaveBeenCalled();
    });

    it('should combine fallback and remote when local is empty', async () => {
        const registry = makeRegistry({
            fallback: [makeProvider('F', 'fallback', () => [makeResult('Fallback', 'f')])],
            local: [makeProvider('L', 'local', () => [])],
            remote: [makeProvider('R', 'remote', () => [makeResult('Remote', 'r')])],
        });

        const results = await search(registry, 'q', ctx);

        expect(results).toEqual([makeResult('Fallback', 'f'), makeResult('Remote', 'r')]);
    });

    it('should return empty array when all tiers are empty', async () => {
        const results = await search(makeRegistry(), 'q', ctx);

        expect(results).toEqual([]);
    });

    it('should start remote concurrently with local', async () => {
        const order: string[] = [];

        const registry = makeRegistry({
            local: [
                makeProvider('L', 'local', async () => {
                    order.push('local-start');
                    await new Promise(r => setTimeout(r, 50));
                    order.push('local-end');
                    return [makeResult('Local', 'l')];
                }),
            ],
            remote: [
                makeProvider('R', 'remote', async () => {
                    order.push('remote-start');
                    await new Promise(r => setTimeout(r, 10));
                    order.push('remote-end');
                    return [makeResult('Remote', 'r')];
                }),
            ],
        });

        await search(registry, 'q', ctx);

        // Remote should start before local finishes
        expect(order.indexOf('remote-start')).toBeLessThan(order.indexOf('local-end'));
    });

    it('should preserve order: local, fallback, remote', async () => {
        const registry = makeRegistry({
            fallback: [makeProvider('F', 'fallback', () => [makeResult('Fallback', 'f')])],
            local: [makeProvider('L', 'local', () => [])],
            remote: [makeProvider('R', 'remote', () => [makeResult('Remote', 'r')])],
        });

        const results = await search(registry, 'q', ctx);
        const labels = results.map(r => r.label);

        expect(labels).toEqual(['Fallback', 'Remote']);
    });

    it('should handle all providers failing gracefully', async () => {
        const errorSpy = vi.spyOn(Logger, 'error').mockImplementation(() => {});

        const registry = makeRegistry({
            fallback: [
                makeProvider('F', 'fallback', () => {
                    throw new Error('fail');
                }),
            ],
            local: [
                makeProvider('L', 'local', () => {
                    throw new Error('fail');
                }),
            ],
            remote: [makeProvider('R', 'remote', () => Promise.reject(new Error('fail')))],
        });

        const results = await search(registry, 'q', ctx);

        expect(results).toEqual([]);
        expect(errorSpy).toHaveBeenCalledTimes(3);

        errorSpy.mockRestore();
    });
});

function makeProvider(
    name: string,
    kind: SearchProvider['kind'],
    impl: (query: string, ctx: SearchContext) => SearchOptions[] | Promise<SearchOptions[]>,
): SearchProvider {
    return { kind, name, priority: 0, search: impl };
}

function makeResult(label: string, value: string): SearchOptions {
    return { label, options: [{ label: value, pathname: `/${value}`, value: [value] }] };
}
