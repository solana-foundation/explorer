import { describe, expect, it } from 'vitest';

import { resolveRpcEndpoint } from '../resolve-rpc-endpoint.js';

const RPC_ENDPOINTS = {
    devnet: 'https://devnet.rpc.address',
    'mainnet-beta': 'https://mainnet-beta.rpc.address',
    simd296: 'https://simd296.rpc.address',
    testnet: 'https://testnet.rpc.address',
};

describe('resolveRpcEndpoint', () => {
    it('should resolve the endpoint configured for the cluster', () => {
        expect(resolveRpcEndpoint('mainnet-beta', RPC_ENDPOINTS)).toBe('https://mainnet-beta.rpc.address');
        expect(resolveRpcEndpoint('simd296', RPC_ENDPOINTS)).toBe('https://simd296.rpc.address');
    });
});
