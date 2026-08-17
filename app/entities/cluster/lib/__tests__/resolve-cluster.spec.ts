import { afterEach, describe, expect, it, vi } from 'vitest';

import { Cluster, DEFAULT_CLUSTER } from '../cluster';
import { decideCustomUrl, isCustomUrlCarryable, parseQuery } from '../resolve-cluster';

// The whitelist is deployment configuration, empty unless a deployment sets it, so every case that
// depends on it says so. whitelisted-rpcs.spec.ts covers parsing the variable itself.
function whitelist(hostnames: string) {
    vi.stubEnv('NEXT_PUBLIC_WHITELISTED_RPCS', hostnames);
}

afterEach(() => {
    vi.unstubAllEnvs();
});

function makeSearchParams(params: Record<string, string> = {}): URLSearchParams {
    return new URLSearchParams(params);
}

describe('parseQuery', () => {
    it('should return the cluster from URL params when present', () => {
        expect(parseQuery(makeSearchParams({ cluster: 'devnet' }))).toBe(Cluster.Devnet);
    });

    it('should return default cluster when no params are provided', () => {
        expect(parseQuery(makeSearchParams())).toBe(DEFAULT_CLUSTER);
    });

    it('should return default cluster for empty cluster param', () => {
        expect(parseQuery(makeSearchParams({ cluster: '' }))).toBe(DEFAULT_CLUSTER);
    });

    it('should return default cluster for unrecognized cluster param', () => {
        expect(parseQuery(makeSearchParams({ cluster: 'bogus-cluster' }))).toBe(DEFAULT_CLUSTER);
    });

    it('should return testnet when cluster param is testnet', () => {
        expect(parseQuery(makeSearchParams({ cluster: 'testnet' }))).toBe(Cluster.Testnet);
    });
});

describe('decideCustomUrl', () => {
    // The default posture: a remote endpoint, nothing approved, no developer bypass.
    const inbound = { approvedOrigins: [], candidateUrl: 'https://attacker.rpc/rpc', devFlagEnabled: false };

    it('should leave an unapproved remote endpoint pending rather than honoring or refusing it', () => {
        // Why the third state exists: `cluster=custom` in a link is not consent, but the endpoint is
        // usable, so the caller must ask rather than silently substitute a different node.
        const decision = decideCustomUrl(inbound);
        expect(decision.kind).toBe('pending');
        expect(decision).toHaveProperty('endpoint.href', 'https://attacker.rpc/rpc');
    });

    it('should honor an endpoint whose origin the user approved', () => {
        const decision = decideCustomUrl({ ...inbound, approvedOrigins: ['https://attacker.rpc'] });
        expect(decision.kind).toBe('honored');
        expect(decision).toHaveProperty('endpoint.href', 'https://attacker.rpc/rpc');
    });

    it('should hand back the parsed endpoint, so no caller re-parses what it already checked', () => {
        // Consumers downstream need the origin or the host; re-deriving them means re-handling a parse
        // failure this function has already ruled out.
        const decision = decideCustomUrl({ ...inbound, candidateUrl: 'https://my-node.example:8899/rpc?key=k' });

        expect(decision).toMatchObject({
            endpoint: {
                hasPathOrQuery: true,
                host: 'my-node.example:8899',
                hostname: 'my-node.example',
                // As given, not `URL.href`: compared against saved clusters and used as a cache key, so
                // normalisation would break both.
                href: 'https://my-node.example:8899/rpc?key=k',
                isLocal: false,
                origin: 'https://my-node.example:8899',
                protocol: 'https:',
            },
            kind: 'pending',
        });
    });

    it('should not report a bare origin as carrying a path or query', () => {
        // The consent dialog keys its second line on this, and `new URL` adds a trailing slash to a bare
        // origin, so deriving the flag from `href` would print the host twice.
        const decision = decideCustomUrl({ ...inbound, candidateUrl: 'https://my-node.example' });
        expect(decision).toHaveProperty('endpoint.hasPathOrQuery', false);
    });

    it('should approve by origin, so a different path or key on the same server does not ask again', () => {
        const decision = decideCustomUrl({
            approvedOrigins: ['https://my-node.example'],
            candidateUrl: 'https://my-node.example/rpc?api-key=rotated',
            devFlagEnabled: false,
        });
        expect(decision.kind).toBe('honored');
    });

    it('should not let an approved origin cover another port or scheme', () => {
        // A different port is a different server.
        expect(decideCustomUrl({ ...inbound, approvedOrigins: ['https://attacker.rpc:8899'] }).kind).toBe('pending');
        expect(decideCustomUrl({ ...inbound, approvedOrigins: ['http://attacker.rpc'] }).kind).toBe('pending');
    });

    it('should honor a local endpoint with no approval, on any port', () => {
        // A link pointing at the visitor's own machine reaches nothing the sender can read back.
        expect(decideCustomUrl({ ...inbound, candidateUrl: 'http://localhost:8899' }).kind).toBe('honored');
        expect(decideCustomUrl({ ...inbound, candidateUrl: 'http://localhost:8900' }).kind).toBe('honored');
        expect(decideCustomUrl({ ...inbound, candidateUrl: 'http://127.0.0.1:8899' }).kind).toBe('honored');
    });

    it('should not treat a host that merely starts with localhost as local', () => {
        expect(decideCustomUrl({ ...inbound, candidateUrl: 'http://localhost.evil.com/rpc' }).kind).toBe('pending');
    });

    it('should honor a whitelisted host with no approval', () => {
        // The only thing that skips the per-user decision for a remote endpoint.
        whitelist('rpc.example.com');
        expect(decideCustomUrl({ ...inbound, candidateUrl: 'https://rpc.example.com/rpc' }).kind).toBe('honored');
    });

    it('should leave a host pending when the deployment whitelists nothing', () => {
        // The default: nothing in the source tree grants consent on the user's behalf.
        expect(decideCustomUrl({ ...inbound, candidateUrl: 'https://rpc.example.com/rpc' }).kind).toBe('pending');
    });

    it('should match the whitelist on the hostname alone', () => {
        // A lookalike host and a userinfo prefix both read as `rpc.example.com` at a glance.
        whitelist('rpc.example.com');
        expect(decideCustomUrl({ ...inbound, candidateUrl: 'https://rpc.example.com.evil.io/rpc' }).kind).toBe(
            'pending',
        );
        expect(decideCustomUrl({ ...inbound, candidateUrl: 'https://rpc.example.com@evil.io/rpc' }).kind).toBe(
            'pending',
        );
    });

    it('should honor a whitelisted host on any port, path or scheme', () => {
        // The entry is a hostname, so it vouches for the host rather than one URL on it.
        whitelist('rpc.example.com');
        for (const candidateUrl of [
            'https://rpc.example.com',
            'https://rpc.example.com:8899/rpc',
            'http://rpc.example.com/rpc?key=k',
        ]) {
            expect(decideCustomUrl({ ...inbound, candidateUrl }).kind).toBe('honored');
        }
    });

    it('should honor any host in a multi-entry whitelist', () => {
        whitelist('rpc.example.com,rpc.example.org');
        expect(decideCustomUrl({ ...inbound, candidateUrl: 'https://rpc.example.org/rpc' }).kind).toBe('honored');
        expect(decideCustomUrl({ ...inbound, candidateUrl: 'https://rpc.example.com/rpc' }).kind).toBe('honored');
        expect(decideCustomUrl({ ...inbound, candidateUrl: 'https://other.example.com/rpc' }).kind).toBe('pending');
    });

    it('should honor anything valid once the developer bypass is on', () => {
        expect(decideCustomUrl({ ...inbound, devFlagEnabled: true }).kind).toBe('honored');
    });

    it('should refuse a non-http scheme even with the developer bypass on', () => {
        // The bypass must not skip the parse, or these schemes reach the RPC connection.
        for (const candidateUrl of ['javascript:alert(1)', 'file:///etc/passwd', 'ws://rpc.example.com']) {
            expect(decideCustomUrl({ ...inbound, candidateUrl, devFlagEnabled: true })).toEqual({ kind: 'refused' });
        }
    });

    it('should refuse a malformed candidate URL', () => {
        expect(decideCustomUrl({ ...inbound, candidateUrl: 'not a url' })).toEqual({ kind: 'refused' });
        expect(decideCustomUrl({ ...inbound, candidateUrl: '123' })).toEqual({ kind: 'refused' });
        // Parses, but as protocol `localhost:` with an empty hostname.
        expect(decideCustomUrl({ ...inbound, candidateUrl: 'localhost:8899' })).toEqual({ kind: 'refused' });
    });
});

describe('isCustomUrlCarryable', () => {
    // The builder asks a weaker question than the reader, so it can never be the stricter of the two and
    // drop an endpoint the page is using, and a pending endpoint survives an in-app click.
    it('should carry any usable http(s) endpoint regardless of trust', () => {
        expect(isCustomUrlCarryable('https://attacker.rpc/rpc')).toBe(true);
        expect(isCustomUrlCarryable('http://localhost:8899')).toBe(true);
    });

    it('should not carry an unusable value', () => {
        expect(isCustomUrlCarryable('javascript:alert(1)')).toBe(false);
        expect(isCustomUrlCarryable('not a url')).toBe(false);
        expect(isCustomUrlCarryable('')).toBe(false);
        expect(isCustomUrlCarryable(null)).toBe(false);
        expect(isCustomUrlCarryable(undefined)).toBe(false);
    });

    it('should carry everything the reader would honor', () => {
        // Structural today — both run the same `parseRpcEndpoint` — but asserted so a stricter builder
        // cannot silently drop the endpoint the page is using.
        whitelist('rpc.example.com');
        const candidates = ['https://rpc.example.com/rpc', 'http://localhost:8899', 'https://my-node.example/rpc'];
        for (const candidateUrl of candidates) {
            const decision = decideCustomUrl({
                approvedOrigins: ['https://my-node.example'],
                candidateUrl,
                devFlagEnabled: false,
            });
            if (decision.kind === 'honored') expect(isCustomUrlCarryable(candidateUrl)).toBe(true);
        }
    });
});
