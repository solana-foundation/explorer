import { type FeatureInfoType } from '@entities/feature-gate';
import { address } from '@solana/kit';
import { vi } from 'vitest';

import { fetchFeatureGateInformation, getLink } from '../api/fetch-feature-gate-information';

// Taken from app/entities/feature-gate/feature-gates.json
const FEATURE: FeatureInfoType = {
    comms_required: null,
    description: 'Two instructions for moving value between stake accounts without holding Withdrawer',
    devnet_activation_epoch: 798,
    key: address('7bTK6Jis8Xpfrs8ZoUfiMDPazTcdPcTWheZFJTA5Z6X4'),
    mainnet_activation_epoch: 727,
    min_agave_versions: [],
    min_fd_versions: [],
    min_jito_versions: [],
    owners: [],
    planned_testnet_order: null,
    simd_link: [
        'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0148-stake-program-move-instructions.md',
    ],
    simds: ['148'],
    testnet_activation_epoch: 712,
    title: 'MoveStake and MoveLamports',
};

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

/**
 *  mock valid response
 */
function mockFetchOnce(data: any = {}) {
    fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => data,
    });
}

/**
 *  mock error during process
 */
function mockRejectOnce<T extends Error>(error: T) {
    fetchMock.mockRejectedValueOnce(error);
}

describe('fetchFeatureGateInformation', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should handle unexpected error while fetching, but react as there was no data', async () => {
        await expect(fetchFeatureGateInformation()).resolves.toEqual(['No data']);

        mockRejectOnce(new Error('Network Error'));
        await expect(fetchFeatureGateInformation(FEATURE)).resolves.toEqual(['No data']);
    });

    it('should return feature info', async () => {
        mockFetchOnce('# Summary');
        const data = await fetchFeatureGateInformation(FEATURE);

        expect(fetchMock).toHaveBeenCalledWith(getLink(FEATURE.simd_link[0]), { method: 'GET' });
        expect(data).toEqual(['# Summary']);
    });
});
