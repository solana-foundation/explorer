import { Cluster } from '@utils/cluster';
import { describe, expect, it } from 'vitest';

import { toScheduleCluster } from '../cluster';

describe('toScheduleCluster', () => {
    it('should map every cluster the schedule is keyed by', () => {
        expect(toScheduleCluster(Cluster.MainnetBeta)).toBe('mainnet-beta');
        expect(toScheduleCluster(Cluster.Devnet)).toBe('devnet');
        expect(toScheduleCluster(Cluster.Testnet)).toBe('testnet');
        expect(toScheduleCluster(Cluster.Custom)).toBe('custom');
    });
});
