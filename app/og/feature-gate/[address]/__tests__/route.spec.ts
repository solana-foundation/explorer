import { getFeatureInfo } from '@entities/feature-gate/server';
import { address } from '@solana/kit';
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '../route';

vi.mock('next/og', () => ({
    ImageResponse: vi.fn(function () {
        return new Response('mock-image-response', {
            headers: { 'Content-Type': 'image/png' },
            status: 200,
        });
    }),
}));

vi.mock('@features/feature-gate/server', async () => {
    const { isFeatureGateOgEnabled } =
        await vi.importActual<typeof import('@features/feature-gate/env')>('@features/feature-gate/env');
    return { BaseFeatureGateImage: vi.fn(() => null), isFeatureGateOgEnabled };
});

vi.mock('@entities/feature-gate/server', () => ({ getFeatureInfo: vi.fn() }));

// Known feature gate address from feature-gates.json (branded so it can be used
// as a `FeatureInfoType['key']` in the getFeatureInfo mock returns below).
const validAddress = address('7bTK6Jis8Xpfrs8ZoUfiMDPazTcdPcTWheZFJTA5Z6X4');
// Valid base58 address but not a known feature gate
const unknownAddress = '11111111111111111111111111111112';

function makeRequest(address: string) {
    return new NextRequest(`http://localhost:3000/og/feature-gate/${address}`);
}

describe('GET /og/feature-gate/[address]', () => {
    beforeEach(() => {
        vi.stubEnv('FEATURE_GATE_OG_ENABLED', 'true');
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should return 404 when feature gate OG is disabled', async () => {
        vi.stubEnv('FEATURE_GATE_OG_ENABLED', 'false');

        const response = await GET(makeRequest(validAddress), { params: Promise.resolve({ address: validAddress }) });

        expect(response.status).toBe(404);
        expect(await response.text()).toBe('Not Found');
    });

    it('should generate image successfully for a known feature gate', async () => {
        vi.mocked(getFeatureInfo).mockReturnValue({
            comms_required: null,
            description: 'Two new instructions for moving value between stake accounts',
            devnet_activation_epoch: 798,
            key: validAddress,
            mainnet_activation_epoch: 727,
            min_agave_versions: ['v2.1.6'],
            min_fd_versions: [],
            min_jito_versions: [],
            owners: [],
            planned_testnet_order: null,
            simd_link: [],
            simds: ['148'],
            testnet_activation_epoch: 712,
            title: 'MoveStake and MoveLamports',
        });

        const response = await GET(makeRequest(validAddress), { params: Promise.resolve({ address: validAddress }) });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/png');
        expect(response.headers.get('Cache-Control')).toContain('max-age=86400');
        expect(getFeatureInfo).toHaveBeenCalledWith(validAddress);
    });

    it('should return 400 for an invalid base58 address', async () => {
        const response = await GET(makeRequest('not-valid!!!'), {
            params: Promise.resolve({ address: 'not-valid!!!' }),
        });

        expect(response.status).toBe(400);
        expect(await response.text()).toBe('Invalid address');
        expect(getFeatureInfo).not.toHaveBeenCalled();
    });

    it('should return 404 for a valid address that is not a known feature gate', async () => {
        vi.mocked(getFeatureInfo).mockReturnValue(undefined);

        const response = await GET(makeRequest(unknownAddress), {
            params: Promise.resolve({ address: unknownAddress }),
        });

        expect(response.status).toBe(404);
        expect(await response.text()).toBe('Feature not found');
    });

    it('should return 500 when image generation fails', async () => {
        vi.mocked(getFeatureInfo).mockReturnValue({
            comms_required: null,
            description: null,
            devnet_activation_epoch: null,
            key: validAddress,
            mainnet_activation_epoch: null,
            min_agave_versions: [],
            min_fd_versions: [],
            min_jito_versions: [],
            owners: [],
            planned_testnet_order: null,
            simd_link: [],
            simds: ['148'],
            testnet_activation_epoch: null,
            title: 'MoveStake and MoveLamports',
        });
        vi.mocked(ImageResponse).mockImplementationOnce(function () {
            throw new Error('Render failed');
        });

        const response = await GET(makeRequest(validAddress), { params: Promise.resolve({ address: validAddress }) });

        expect(response.status).toBe(500);
        expect(await response.text()).toBe('Failed to process request');
    });
});
