import { Logger } from '@shared/lib/logger';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getWhitelistedRpcHostnames } from '../whitelisted-rpcs';

// `Logger` is already a global no-op mock (test-setup.specs.ts), so assert on it directly.
const warn = vi.mocked(Logger.warn);

function withEnv(raw: string | undefined): readonly string[] {
    // `undefined` deletes the variable, which is what an unconfigured deployment actually looks like.
    vi.stubEnv('NEXT_PUBLIC_WHITELISTED_RPCS', raw);
    return getWhitelistedRpcHostnames();
}

beforeEach(() => {
    warn.mockClear();
});

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('getWhitelistedRpcHostnames', () => {
    it('should be empty when the deployment configures nothing', () => {
        // An entry is a standing grant of consent given on the user's behalf, so an unconfigured build
        // hands out none and prompts for every remote endpoint.
        expect(withEnv(undefined)).toEqual([]);
        expect(withEnv('')).toEqual([]);
    });

    it('should read a single hostname', () => {
        expect(withEnv('rpc.example.com')).toEqual(['rpc.example.com']);
    });

    it('should read a comma-separated list and ignore surrounding whitespace and empty slots', () => {
        expect(withEnv('  rpc.example.com , rpc.example.org ,, ')).toEqual(['rpc.example.com', 'rpc.example.org']);
    });

    it('should lowercase entries so they can match a parsed hostname', () => {
        // `URL` lowercases the host it parses, so a cased entry would never match.
        expect(withEnv('Rpc.Example.COM')).toEqual(['rpc.example.com']);
    });

    it('should keep the valid entries when one entry is invalid', () => {
        // A typo next to a good host must not empty the whitelist, nor widen it.
        expect(withEnv('rpc.example.com,https://rpc.example.org,rpc.example.net')).toEqual([
            'rpc.example.com',
            'rpc.example.net',
        ]);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][1]).toHaveProperty('entry', 'https://rpc.example.org');
    });

    it('should log every entry it skips', () => {
        expect(withEnv('not a host,also/bad')).toEqual([]);
        expect(warn).toHaveBeenCalledTimes(2);
    });

    it.each([
        // `URL` reads the first label as the host, so this would whitelist the host `https`.
        ['https://rpc.example.com', 'a scheme'],
        ['http://rpc.example.com', 'a scheme'],
        // Reads as `rpc.example.com` at a glance but resolves to the host `evil.io`.
        ['rpc.example.com@evil.io', 'a userinfo prefix'],
        // The whitelist matches on hostname alone, so the extra part is a false promise.
        ['rpc.example.com/rpc', 'a path'],
        ['rpc.example.com?key=k', 'a query'],
        // Same false promise: `RpcEndpoint.hostname` never carries one.
        ['rpc.example.com:8899', 'a port'],
        // `URL` accepts these as hostnames, so without an explicit check they would sit in the list
        // matching nothing while the operator expects subdomain matching.
        ['*.example.com', 'a wildcard'],
        ['*', 'a wildcard'],
        ['not a host', 'a space'],
        ['münchen.de', 'a non-punycode internationalised name'],
    ])('should skip %j, which carries %s', raw => {
        expect(withEnv(raw)).toEqual([]);
    });

    it('should accept the punycode spelling of an internationalised name', () => {
        // The form a parsed `RpcEndpoint.hostname` takes, so the only one that can match.
        expect(withEnv('xn--mnchen-3ya.de')).toEqual(['xn--mnchen-3ya.de']);
    });

    it('should re-read the env when it changes, and cache while it does not', () => {
        expect(withEnv('bad host')).toEqual([]);
        expect(withEnv('bad host')).toEqual([]);
        // Cached against the raw string, so a deployment warns once rather than once per call.
        expect(warn).toHaveBeenCalledTimes(1);

        expect(withEnv('rpc.example.com')).toEqual(['rpc.example.com']);
    });
});
