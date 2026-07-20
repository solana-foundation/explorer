import { describe, expect, it } from 'vitest';

import { resolveRpcEndpoint } from '../resolve-rpc-endpoint.js';

const RPC_ENDPOINTS = {
    devnet: 'https://devnet.example',
    'mainnet-beta': 'https://mainnet.example',
    simd296: 'https://simd296.example',
    testnet: 'https://testnet.example',
};

describe('resolveRpcEndpoint', () => {
    it('should resolve the endpoint configured for the cluster', () => {
        expect(resolveRpcEndpoint('mainnet-beta', RPC_ENDPOINTS)).toBe('https://mainnet.example');
        expect(resolveRpcEndpoint('simd296', RPC_ENDPOINTS)).toBe('https://simd296.example');
    });
});
