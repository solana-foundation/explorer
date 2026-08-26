import {
    BASE_INCLUSION_FEE_LAMPORTS,
    derivePriorityFeeLamports,
    estimateRequestedCostUnits,
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

    it('should leave an accurately budgeted transfer cheaper than the flat 5,000-lamport base fee', () => {
        // A transfer requesting 1,000 units: 1,481 executed cost less 150 consumed plus 1,000 requested.
        const projections = projectResourceAndInclusionFees({ priorityFeeLamports: 0, requestedCostUnits: 2_331 });

        expect(projections.at(-1)?.totalFeeLamports).toEqual(3_666);
    });

    it('should make a loose compute budget more expensive than today', () => {
        // The same transfer with a wallet's default 200,000 unit request left in place.
        const projections = projectResourceAndInclusionFees({ priorityFeeLamports: 0, requestedCostUnits: 201_331 });

        expect(projections.at(-1)?.totalFeeLamports).toEqual(103_166);
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

describe('estimateRequestedCostUnits', () => {
    it('should swap the consumed compute units out for the requested limit', () => {
        // The executed cost of a SOL transfer, against a wallet's default 200,000 unit request.
        expect(
            estimateRequestedCostUnits({
                computeUnitsConsumed: 150,
                executedCostUnits: 1_481,
                requestedComputeUnits: 200_000,
            }),
        ).toEqual(201_331);
    });

    it('should leave the cost alone when the request was consumed exactly', () => {
        expect(
            estimateRequestedCostUnits({
                computeUnitsConsumed: 150,
                executedCostUnits: 1_481,
                requestedComputeUnits: 150,
            }),
        ).toEqual(1_481);
    });

    it('should never project below the cost the transaction already incurred', () => {
        // A real transaction cannot consume more than it requested; the clamp covers a requested
        // limit that could not be read rather than trusting the subtraction to stay positive.
        expect(
            estimateRequestedCostUnits({
                computeUnitsConsumed: 4_644,
                executedCostUnits: 6_306,
                requestedComputeUnits: 0,
            }),
        ).toEqual(6_306);
    });

    it('should scale the correction with the size of the over-request', () => {
        const shared = { computeUnitsConsumed: 150, executedCostUnits: 1_481 };

        expect(estimateRequestedCostUnits({ ...shared, requestedComputeUnits: 1_400_000 })).toEqual(
            estimateRequestedCostUnits({ ...shared, requestedComputeUnits: 10_000 }) + 1_390_000,
        );
    });
});
