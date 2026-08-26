import {
    BASE_INCLUSION_FEE_LAMPORTS,
    derivePriorityFeeLamports,
    getResourceFeeLamports,
    projectResourceAndInclusionFees,
    RESOURCE_FEE_RATES,
} from '../resource-and-inclusion-fee';

const [ONE_TENTH, ONE_QUARTER, ONE_HALF] = RESOURCE_FEE_RATES;

describe('getResourceFeeLamports', () => {
    it('should charge the requested cost units at the staged rate', () => {
        expect(getResourceFeeLamports({ rate: ONE_TENTH, requestedCostUnits: 10_000 })).toEqual(1_000);
        expect(getResourceFeeLamports({ rate: ONE_QUARTER, requestedCostUnits: 10_000 })).toEqual(2_500);
        expect(getResourceFeeLamports({ rate: ONE_HALF, requestedCostUnits: 10_000 })).toEqual(5_000);
    });

    it('should round up, so any requested cost is charged', () => {
        // ceil_div per the SIMD, not truncation: a single cost unit still costs a lamport.
        expect(getResourceFeeLamports({ rate: ONE_TENTH, requestedCostUnits: 1 })).toEqual(1);
        expect(getResourceFeeLamports({ rate: ONE_HALF, requestedCostUnits: 1_481 })).toEqual(741);
    });

    it('should charge nothing when no cost units were requested', () => {
        expect(getResourceFeeLamports({ rate: ONE_HALF, requestedCostUnits: 0 })).toEqual(0);
    });
});

describe('projectResourceAndInclusionFees', () => {
    it('should sum the inclusion fee, the unchanged priority fee and the resource fee', () => {
        const projections = projectResourceAndInclusionFees({
            priorityFeeLamports: 10_000,
            requestedCostUnits: 40_000,
        });

        expect(
            projections.map(({ rate, resourceFeeLamports, totalFeeLamports }) => ({
                label: rate.label,
                resourceFeeLamports,
                totalFeeLamports,
            })),
        ).toEqual([
            { label: '1/10', resourceFeeLamports: 4_000, totalFeeLamports: 16_500 },
            { label: '1/4', resourceFeeLamports: 10_000, totalFeeLamports: 22_500 },
            { label: '1/2', resourceFeeLamports: 20_000, totalFeeLamports: 32_500 },
        ]);
    });

    it('should charge only the inclusion fee when nothing else is requested or prioritized', () => {
        const projections = projectResourceAndInclusionFees({ priorityFeeLamports: 0, requestedCostUnits: 0 });

        for (const { totalFeeLamports } of projections) {
            expect(totalFeeLamports).toEqual(BASE_INCLUSION_FEE_LAMPORTS);
        }
    });

    it('should leave a lean single-signer transfer cheaper than the flat 5,000-lamport base fee', () => {
        // A plain SOL transfer costs 1,481 cost units, so even the terminal rate stays under today's fee.
        const projections = projectResourceAndInclusionFees({ priorityFeeLamports: 0, requestedCostUnits: 1_481 });

        expect(projections.at(-1)?.totalFeeLamports).toEqual(3_241);
    });

    it('should make an over-requested compute budget more expensive than today', () => {
        // The default 200k CU request a wallet leaves in place, at the terminal rate.
        const projections = projectResourceAndInclusionFees({ priorityFeeLamports: 0, requestedCostUnits: 201_481 });

        expect(projections.at(-1)?.totalFeeLamports).toEqual(103_241);
    });
});

describe('derivePriorityFeeLamports', () => {
    it('should back the per-signature base fee out of the total', () => {
        expect(derivePriorityFeeLamports({ feeLamports: 15_000, signatureCount: 1 })).toEqual(10_000);
        expect(derivePriorityFeeLamports({ feeLamports: 15_000, signatureCount: 2 })).toEqual(5_000);
    });

    it('should report no priority fee for a transaction that paid only the base fee', () => {
        expect(derivePriorityFeeLamports({ feeLamports: 5_000, signatureCount: 1 })).toEqual(0);
        expect(derivePriorityFeeLamports({ feeLamports: 10_000, signatureCount: 2 })).toEqual(0);
    });

    it('should floor at zero rather than report a negative priority fee', () => {
        // Precompile signatures push the real base fee above the signature count's worth, so the
        // subtraction can go negative on transactions this cannot see into.
        expect(derivePriorityFeeLamports({ feeLamports: 5_000, signatureCount: 3 })).toEqual(0);
    });
});
