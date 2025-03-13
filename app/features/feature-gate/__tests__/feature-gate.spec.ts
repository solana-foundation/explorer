import fetch from 'node-fetch';
import { vi } from 'vitest';

import { fetchFeatureGateInformation, getLink } from '../index';

// Taken from ../../../utils/feature-gate/featureGates.json
const FEATURE = {
    "description": "Two instructions for moving value between stake accounts without holding Withdrawer",
    "devnetActivationEpoch": 798,
    "key": "7bTK6Jis8Xpfrs8ZoUfiMDPazTcdPcTWheZFJTA5Z6X4",
    "mainnetActivationEpoch": 727,
    "simd": 148,
    "simd_link": "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0148-stake-program-move-instructions.md",
    "testnetActivationEpoch": 712,
    "title": "MoveStake and MoveLamports"
};

vi.mock('node-fetch', async () => {
    const actual = await vi.importActual('node-fetch');
    return {
        ...actual,
        default: vi.fn()
    };
});

/**
 *  mock valid response
 */
function mockFetchOnce(data: any = {}) {
    // @ts-expect-error fetch does not have mocked fn
    fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => data
    });
}

/**
 *  mock error during process
 */
function mockRejectOnce<T extends Error>(error: T) {
    // @ts-expect-error fetch does not have mocked fn
    fetch.mockRejectedValueOnce(error);
}

describe('fetchFeatureGateInformation', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should handle unexpected error while fetching, but react as there was no data', async () => {
        await expect(fetchFeatureGateInformation()).resolves.toEqual('No data');

        mockRejectOnce(new Error('Network Error'));
        await expect(fetchFeatureGateInformation(FEATURE)).resolves.toEqual('No data');
    });

    it('should return feature info', async () => {
        mockFetchOnce("# Summary");
        const data = await fetchFeatureGateInformation(FEATURE);

        expect(fetch).toHaveBeenCalledWith(getLink(FEATURE.simd_link), { method: 'GET' });
        expect(data).toEqual("# Summary");
    });
});
