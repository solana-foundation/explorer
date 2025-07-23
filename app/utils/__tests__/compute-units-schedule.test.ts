import { ComputeBudgetProgram, PublicKey, VersionedBlockResponse } from '@solana/web3.js';

import { Cluster } from '../cluster';
import { estimateRequestedComputeUnits, getReservedComputeUnits } from '../compute-units-schedule';

describe('getReservedComputeUnits', () => {
    describe('mainnet', () => {
        it('returns default compute units before builtin feature activation', () => {
            // Before epoch 759 on mainnet
            expect(
                getReservedComputeUnits({
                    cluster: Cluster.MainnetBeta,
                    epoch: 758n,
                    programId: '11111111111111111111111111111111', // System Program
                })
            ).toEqual(200_000);

            expect(
                getReservedComputeUnits({
                    cluster: Cluster.MainnetBeta,
                    epoch: 0n,
                    programId: 'Vote111111111111111111111111111111111111111', // Vote Program
                })
            ).toEqual(200_000);
        });

        it('returns minimal compute units for builtins after feature activation', () => {
            // After epoch 759 on mainnet
            expect(
                getReservedComputeUnits({
                    cluster: Cluster.MainnetBeta,
                    epoch: 759n,
                    programId: '11111111111111111111111111111111', // System Program
                })
            ).toEqual(3_000);

            expect(
                getReservedComputeUnits({
                    cluster: Cluster.MainnetBeta,
                    epoch: 1000n,
                    programId: 'Vote111111111111111111111111111111111111111', // Vote Program
                })
            ).toEqual(3_000);

            expect(
                getReservedComputeUnits({
                    cluster: Cluster.MainnetBeta,
                    epoch: 759n,
                    programId: 'ComputeBudget111111111111111111111111111111', // Compute Budget
                })
            ).toEqual(3_000);
        });

        it('returns default compute units for non-builtins after feature activation', () => {
            expect(
                getReservedComputeUnits({
                    cluster: Cluster.MainnetBeta,
                    epoch: 759n,
                    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program
                })
            ).toEqual(200_000);
        });

        it('handles feature gate program migration correctly', () => {
            // Before migration (epoch 753), feature gate is builtin
            expect(
                getReservedComputeUnits({
                    cluster: Cluster.MainnetBeta,
                    epoch: 752n,
                    programId: 'Feature111111111111111111111111111111111111',
                })
            ).toEqual(200_000); // Before builtin optimization

            // After builtin optimization but before migration
            expect(
                getReservedComputeUnits({
                    cluster: Cluster.MainnetBeta,
                    epoch: 758n, // After 753 but before 759
                    programId: 'Feature111111111111111111111111111111111111',
                })
            ).toEqual(200_000); // Still default because migration happened before builtin optimization

            // After both migration and builtin optimization
            expect(
                getReservedComputeUnits({
                    cluster: Cluster.MainnetBeta,
                    epoch: 759n,
                    programId: 'Feature111111111111111111111111111111111111',
                })
            ).toEqual(200_000); // Now BPF, uses default
        });
    });

    describe('devnet', () => {
        it('returns correct compute units based on devnet activation epochs', () => {
            // Before epoch 842 on devnet
            expect(
                getReservedComputeUnits({
                    cluster: Cluster.Devnet,
                    epoch: 841n,
                    programId: '11111111111111111111111111111111',
                })
            ).toEqual(200_000);

            // After epoch 842 on devnet
            expect(
                getReservedComputeUnits({
                    cluster: Cluster.Devnet,
                    epoch: 842n,
                    programId: '11111111111111111111111111111111',
                })
            ).toEqual(3_000);
        });
    });

    describe('testnet', () => {
        it('returns correct compute units based on testnet activation epochs', () => {
            // Before epoch 750 on testnet
            expect(
                getReservedComputeUnits({
                    cluster: Cluster.Testnet,
                    epoch: 749n,
                    programId: '11111111111111111111111111111111',
                })
            ).toEqual(200_000);

            // After epoch 750 on testnet
            expect(
                getReservedComputeUnits({
                    cluster: Cluster.Testnet,
                    epoch: 750n,
                    programId: '11111111111111111111111111111111',
                })
            ).toEqual(3_000);
        });
    });

    describe('custom cluster', () => {
        it('always uses most recent configuration', () => {
            expect(
                getReservedComputeUnits({
                    cluster: Cluster.Custom,
                    epoch: 0n,
                    programId: '11111111111111111111111111111111',
                })
            ).toEqual(3_000);

            expect(
                getReservedComputeUnits({
                    cluster: Cluster.Custom,
                    epoch: 1000n,
                    programId: 'Feature111111111111111111111111111111111111',
                })
            ).toEqual(200_000);
        });
    });

    describe('edge cases', () => {
        it('handles undefined epoch', () => {
            expect(
                getReservedComputeUnits({
                    cluster: Cluster.MainnetBeta,
                    programId: '11111111111111111111111111111111',
                })
            ).toEqual(200_000);
        });

        it('handles negative epoch', () => {
            expect(
                getReservedComputeUnits({
                    cluster: Cluster.MainnetBeta,
                    epoch: -1n,
                    programId: '11111111111111111111111111111111',
                })
            ).toEqual(200_000);
        });
    });
});

describe('estimateRequestedComputeUnits', () => {
    const createMockTransaction = (
        instructions: Array<{
            programId: string;
            data: Uint8Array;
        }>
    ): Parameters<typeof estimateRequestedComputeUnits>[0] => {
        const staticAccountKeys = [...new Set(instructions.map(ix => ix.programId))].map(id => new PublicKey(id));

        return {
            transaction: {
                message: {
                    compiledInstructions: instructions.map(ix => ({
                        data: ix.data,
                        programIdIndex: staticAccountKeys.findIndex(key => key.toBase58() === ix.programId),
                    })),
                    staticAccountKeys,
                },
            },
        } as VersionedBlockResponse['transactions'][number];
    };

    describe('with explicit compute budget', () => {
        it('returns compute units from SetComputeUnitLimit instruction', () => {
            const computeUnits = 300_000;
            const data = Buffer.alloc(5);
            data[0] = 2; // SetComputeUnitLimit instruction type
            data.writeUInt32LE(computeUnits, 1);

            const tx = createMockTransaction([
                {
                    data,
                    programId: ComputeBudgetProgram.programId.toBase58(),
                },
            ]);

            expect(estimateRequestedComputeUnits(tx, 1000n, Cluster.MainnetBeta)).toEqual(computeUnits);
        });

        it('returns compute units from deprecated RequestUnits instruction', () => {
            const computeUnits = 150_000;
            const data = Buffer.alloc(9); // RequestUnits needs 9 bytes
            data[0] = 0; // RequestUnits instruction type
            data.writeUInt32LE(computeUnits, 1);
            data.writeUInt32LE(0, 5); // additionalFee

            const tx = createMockTransaction([
                {
                    data,
                    programId: ComputeBudgetProgram.programId.toBase58(),
                },
            ]);

            expect(estimateRequestedComputeUnits(tx, 1000n, Cluster.MainnetBeta)).toEqual(computeUnits);
        });

        it('prioritizes first compute budget instruction found', () => {
            const data1 = Buffer.alloc(5);
            data1[0] = 2;
            data1.writeUInt32LE(100_000, 1);

            const data2 = Buffer.alloc(5);
            data2[0] = 2;
            data2.writeUInt32LE(200_000, 1);

            const tx = createMockTransaction([
                {
                    data: data1,
                    programId: ComputeBudgetProgram.programId.toBase58(),
                },
                {
                    data: data2,
                    programId: ComputeBudgetProgram.programId.toBase58(),
                },
            ]);

            expect(estimateRequestedComputeUnits(tx, 1000n, Cluster.MainnetBeta)).toEqual(100_000);
        });
    });

    describe('without explicit compute budget', () => {
        it('returns default for non-builtin programs', () => {
            const tx = createMockTransaction([
                {
                    data: new Uint8Array([1, 2, 3]),
                    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                },
            ]);

            expect(estimateRequestedComputeUnits(tx, 1000n, Cluster.MainnetBeta)).toEqual(200_000);
        });

        it('returns minimal units for builtin programs after activation', () => {
            const tx = createMockTransaction([
                {
                    data: new Uint8Array([1, 2, 3]),
                    programId: '11111111111111111111111111111111',
                },
            ]);

            // After activation
            expect(estimateRequestedComputeUnits(tx, 759n, Cluster.MainnetBeta)).toEqual(3_000);

            // Before activation
            expect(estimateRequestedComputeUnits(tx, 758n, Cluster.MainnetBeta)).toEqual(200_000);
        });

        it('returns sum of reserved units for mixed instructions', () => {
            const tx = createMockTransaction([
                {
                    data: new Uint8Array([1, 2, 3]),
                    programId: '11111111111111111111111111111111', // System (3k after activation)
                },
                {
                    data: new Uint8Array([4, 5, 6]),
                    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token (200k)
                },
            ]);

            // Should return the sum (3k + 200k = 203k)
            expect(estimateRequestedComputeUnits(tx, 759n, Cluster.MainnetBeta)).toEqual(203_000);
        });

        it('handles feature gate program correctly across epochs', () => {
            const tx = createMockTransaction([
                {
                    data: new Uint8Array([1, 2, 3]),
                    programId: 'Feature111111111111111111111111111111111111',
                },
            ]);

            // Before migration - uses default
            expect(estimateRequestedComputeUnits(tx, 752n, Cluster.MainnetBeta)).toEqual(200_000);

            // After migration and builtin optimization - still uses default (now BPF)
            expect(estimateRequestedComputeUnits(tx, 759n, Cluster.MainnetBeta)).toEqual(200_000);
        });
    });

    describe('edge cases', () => {
        it('handles empty instruction data', () => {
            const tx = createMockTransaction([
                {
                    data: new Uint8Array([]),
                    programId: ComputeBudgetProgram.programId.toBase58(),
                },
            ]);

            // ComputeBudget is a builtin, so after activation it gets 3k
            expect(estimateRequestedComputeUnits(tx, 1000n, Cluster.MainnetBeta)).toEqual(3_000);
        });

        it('handles invalid compute budget instruction data', () => {
            const tx = createMockTransaction([
                {
                    data: new Uint8Array([2, 1, 2]), // Too short for SetComputeUnitLimit
                    programId: ComputeBudgetProgram.programId.toBase58(),
                },
            ]);

            // ComputeBudget is a builtin, so after activation it gets 3k
            expect(estimateRequestedComputeUnits(tx, 1000n, Cluster.MainnetBeta)).toEqual(3_000);
        });

        it('handles transactions with no instructions', () => {
            const tx = createMockTransaction([]);
            expect(estimateRequestedComputeUnits(tx, 1000n, Cluster.MainnetBeta)).toEqual(0);
        });

        it('respects the 1.4M compute unit cap', () => {
            // Create a transaction with many instructions that would exceed 1.4M
            const instructions = [];
            for (let i = 0; i < 10; i++) {
                instructions.push({
                    data: new Uint8Array([1, 2, 3]),
                    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // 200k each
                });
            }
            const tx = createMockTransaction(instructions);

            // Should cap at 1.4M even though sum would be 2M
            expect(estimateRequestedComputeUnits(tx, 1000n, Cluster.MainnetBeta)).toEqual(1_400_000);
        });

        it('handles compute budget with other instructions', () => {
            const data = Buffer.alloc(5);
            data[0] = 2; // SetComputeUnitLimit
            data.writeUInt32LE(500_000, 1);

            const tx = createMockTransaction([
                {
                    data,
                    programId: ComputeBudgetProgram.programId.toBase58(),
                },
                {
                    data: new Uint8Array([1, 2, 3]),
                    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                },
            ]);

            // Should return the explicit compute budget, not the sum
            expect(estimateRequestedComputeUnits(tx, 1000n, Cluster.MainnetBeta)).toEqual(500_000);
        });
    });
});
