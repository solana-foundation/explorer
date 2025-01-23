import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';

import { Address } from '@/app/components/common/Address';
import { useCluster } from '@/app/providers/cluster';

import { Cluster, clusterName } from '../cluster';

// feature gate, simd PR, activation devnet, activation testnet
export type FeatureInfoType = {
    key: string;
    title: string;
    description: string;
    simd: { number: number; link: string } | null;
    devnetActivationEpoch: number | null;
    testnetActivationEpoch: number | null;
    mainnetActivationEpoch: number | null;
};

export const FEATURES: FeatureInfoType[] = [
    {
        description: 'Two new instructions for moving value between stake accounts without holding Withdrawer',
        devnetActivationEpoch: 798,
        key: '7bTK6Jis8Xpfrs8ZoUfiMDPazTcdPcTWheZFJTA5Z6X4',
        mainnetActivationEpoch: 727,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0148-stake-program-move-instructions.md',
            number: 148,
        },
        testnetActivationEpoch: 712,
        title: 'MoveStake and MoveLamports',
    },
    {
        description: 'Enable confidential token transfers',
        devnetActivationEpoch: 801,
        key: 'zkhiy5oLowR7HY4zogXjCjeMXyruLqBwSWH21qcFtnv',
        mainnetActivationEpoch: 731,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0153-elgamal-proof-program.md',
            number: 153,
        },
        testnetActivationEpoch: 714,
        title: 'Enable ZK ElGamal Proof program',
    },
    {
        description: 'Passes on 100% of priority fee to validators',
        devnetActivationEpoch: 805,
        key: '3opE3EzAKnUftUDURkzMgwpNgimBAypW1mNDYH4x4Zg7',
        mainnetActivationEpoch: null,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0096-reward-collected-priority-fee-in-entirety.md',
            number: 96,
        },
        testnetActivationEpoch: 716,
        title: 'Reward full priority fee to validators',
    },
    {
        description: 'Simplify account loading',
        devnetActivationEpoch: 800,
        key: 'EQUMpNFr7Nacb1sva56xn1aLfBxppEoSBH8RRVdkcD1x',
        mainnetActivationEpoch: 728,
        simd: null,
        testnetActivationEpoch: 713,
        title: 'Disable account loader special case',
    },
    {
        description: 'Removing legacy floating number arithmetic operation in fee calculation, make it integer-based',
        devnetActivationEpoch: 802,
        key: 'BtVN7YjDzNE6Dk7kTT7YTDgMNUZTNgiSJgsdzAeTg2jF',
        mainnetActivationEpoch: null,
        simd: null,
        testnetActivationEpoch: 715,
        title: 'Removing unwanted rounding in fee calculation',
    },
    {
        description:
            'Unified syscall interface for all sysvars, without needing to include sysvar address in transactions',
        devnetActivationEpoch: 806,
        key: 'CLCoTADvV64PSrnR6QXty6Fwrt9Xc6EdxSJE4wLRePjq',
        mainnetActivationEpoch: null,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0127-get-sysvar-syscall.md',
            number: 127,
        },
        testnetActivationEpoch: 717,
        title: 'Enable sol_get_sysvar',
    },
    {
        description: 'Enable new voting instruction',
        devnetActivationEpoch: 813,
        key: 'tSynMCspg4xFiCj1v3TDb4c7crMR5tSBhLz4sF7rrNA',
        mainnetActivationEpoch: null,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0138-deprecate-legacy-vote-instructions.md',
            number: 138,
        },
        testnetActivationEpoch: 718,
        title: 'Add TowerSync instruction',
    },
    {
        description: 'Turn feature gate syscall into a BPF program, enabling revocation of pending features.',
        devnetActivationEpoch: 816,
        key: '4eohviozzEeivk1y9UbrnekbAFMDQyJz5JjA9Y6gyvky',
        mainnetActivationEpoch: null,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0089-programify-feature-gate-program.md',
            number: 89,
        },
        testnetActivationEpoch: 719,
        title: 'Programify Feature Gate',
    },
    // Upcoming Devnet features
    {
        description: 'Migrate the config program to a BPF program',
        devnetActivationEpoch: 817,
        key: '2Fr57nzzkLYXW695UdDxDeR5fhnZWSttZeZYemrnpGFV',
        mainnetActivationEpoch: null,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0140-migrate-config-to-core-bpf.md',
            number: 140,
        },
        testnetActivationEpoch: 720,
        title: 'Migrate config program to Core BPF',
    },
    {
        description: 'Allow core developers to exclude system programs from write-locking transactions',
        devnetActivationEpoch: 819,
        key: '8U4skmMVnF6k2kMvrWbQuRUT3qQSiTYpSjqmhmgfthZu',
        mainnetActivationEpoch: null,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0105-dynamic-reserved-accounts-set.md',
            number: 105,
        },
        testnetActivationEpoch: 722,
        title: 'Add new unwritable reserved accounts',
    },
    {
        description: 'Improve performance of validator performance at epoch boundary by skipping rent collection',
        devnetActivationEpoch: 824,
        key: 'CGB2jM8pwZkeeiXQ66kBMyBR6Np61mggL7XUsmLjVcrw',
        mainnetActivationEpoch: null,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0183-skip-rent-rewrites.md',
            number: 183,
        },
        testnetActivationEpoch: 733,
        title: 'Skip rent writes',
    },
    // Upcoming Testnet features
    {
        description: 'Disables rent collection for accounts, to be activated when all rent-paying accounts are gone',
        devnetActivationEpoch: null,
        key: 'CJzY83ggJHqPGDq8VisV3U91jDJLuEaALZooBrXtnnLU',
        mainnetActivationEpoch: null,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0084-disable-rent-fees-collection.md',
            number: 84,
        },
        testnetActivationEpoch: null,
        title: 'Disable rent fees collection',
    },
    {
        description: 'Enable on-chain verification of Passkeys and the WebAuthn Standard (secp256r1) signatures',
        devnetActivationEpoch: null,
        key: 'sr11RdZWgbHTHxSroPALe6zgaT5A1K9LcE4nfsZS4gi',
        mainnetActivationEpoch: null,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0075-precompile-for-secp256r1-sigverify.md',
            number: 75,
        },
        testnetActivationEpoch: null,
        title: 'Enable secp256r1 precompile',
    },
    {
        description: 'Migrate the Address Lookup Table to a BPF program',
        devnetActivationEpoch: null,
        key: 'C97eKZygrkU4JxJsZdjgbUY7iQR7rKTr4NyDWo2E5pRm',
        mainnetActivationEpoch: null,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0128-migrate-address-lookup-table-to-core-bpf.md',
            number: 128,
        },
        testnetActivationEpoch: null,
        title: 'Address Lookup Table to Core BPF',
    },
    {
        description: 'Add a new syscall to get the epoch stake',
        devnetActivationEpoch: null,
        key: 'FKe75t4LXxGaQnVHdUKM6DSFifVVraGZ8LyNo7oPwy1Z',
        mainnetActivationEpoch: null,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0133-syscall-get-epoch-stake.md',
            number: 133,
        },
        testnetActivationEpoch: null,
        title: 'GetEpochStake',
    },
    {
        description:
            'Removes pitfalls and foot-guns from the virtual machine and syscalls by enabling account data direct mapping',
        devnetActivationEpoch: null,
        key: 'GJVDwRkUPNdk9QaK4VsU4g1N41QNxhy1hevjf8kz45Mq',
        mainnetActivationEpoch: null,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/pull/219',
            number: 219,
        },
        testnetActivationEpoch: null,
        title: 'Stricter VM verification constraints',
    },
    {
        description: 'Only vote for blocks with sufficiently sized fec sets',
        devnetActivationEpoch: null,
        key: 'ffecLRhhakKSGhMuc6Fz2Lnfq4uT9q3iu9ZsNaPLxPc',
        mainnetActivationEpoch: null,
        simd: null,
        testnetActivationEpoch: null,
        title: 'Vote only on full fec sets',
    },
    {
        description: 'Faster homomorphic hashing of accounts, enabling account state to be hashed in every block',
        devnetActivationEpoch: null,
        key: 'LtHaSHHsUge7EWTPVrmpuexKz6uVHZXZL6cgJa7W7Zn',
        mainnetActivationEpoch: null,
        simd: {
            link: 'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0215-accounts-lattice-hash.md',
            number: 215,
        },
        testnetActivationEpoch: null,
        title: 'Accounts Lattice Hash',
    },
];

export function UpcomingFeatures() {
    const { cluster } = useCluster();

    // Don't show anything for localnet
    if (cluster === Cluster.Custom) {
        return null;
    }

    const filteredFeatures = FEATURES.filter(feature => {
        switch (cluster) {
            case Cluster.MainnetBeta:
                // Show features activated on devnet and testnet
                return feature.devnetActivationEpoch !== null && feature.testnetActivationEpoch !== null;
            case Cluster.Devnet:
                // Show features activated on testnet, mark if already activated on devnet
                return feature.testnetActivationEpoch !== null;
            case Cluster.Testnet:
                // Only show features not yet activated on testnet
                return feature.testnetActivationEpoch === null;
            default:
                return false;
        }
    });

    if (filteredFeatures.length === 0) {
        return null;
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-header-title">
                    <span className="me-2">🚀</span>
                    Upcoming {clusterName(cluster)} Features
                </h3>
            </div>
            <div className="card-body">
                <div className="row">
                    {filteredFeatures.map(feature => (
                        <div key={feature.key} className="col-12 col-lg-4 mb-4">
                            <div className="card h-100 feature-card">
                                <div className="card-body d-flex flex-column">
                                    <div className="d-flex align-items-center mb-3">
                                        <h4 className="card-title mb-0 text-decoration-underline">{feature.title}</h4>
                                    </div>

                                    <p className="card-text flex-grow-1">{feature.description}</p>

                                    <div className="ms-n2 mb-2">
                                        {cluster === Cluster.MainnetBeta && feature.mainnetActivationEpoch && (
                                            <span className="badge bg-success ms-2">Active on Mainnet</span>
                                        )}
                                        {cluster === Cluster.Devnet && feature.devnetActivationEpoch && (
                                            <span className="badge bg-success ms-2">Active on Devnet</span>
                                        )}
                                        {cluster === Cluster.Testnet && feature.testnetActivationEpoch && (
                                            <span className="badge bg-success ms-2">Active on Testnet</span>
                                        )}
                                    </div>

                                    <div className="activation-info mb-3">
                                        <div className="mb-1">Cluster Activations</div>
                                        {feature.mainnetActivationEpoch && (
                                            <div className="mb-1">
                                                <Link
                                                    href={`/epoch/${feature.mainnetActivationEpoch}?cluster=mainnet`}
                                                    className="epoch-link"
                                                >
                                                    Mainnet Epoch {feature.mainnetActivationEpoch}
                                                </Link>
                                            </div>
                                        )}
                                        {feature.devnetActivationEpoch && (
                                            <div className="mb-1">
                                                <Link
                                                    href={`/epoch/${feature.devnetActivationEpoch}?cluster=devnet`}
                                                    className="epoch-link"
                                                >
                                                    Devnet Epoch {feature.devnetActivationEpoch}
                                                </Link>
                                            </div>
                                        )}
                                        {feature.testnetActivationEpoch && (
                                            <div>
                                                <Link
                                                    href={`/epoch/${feature.testnetActivationEpoch}?cluster=testnet`}
                                                    className="epoch-link"
                                                >
                                                    Testnet Epoch {feature.testnetActivationEpoch}
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    <div>Feature Gate</div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Address
                                            pubkey={new PublicKey(feature.key)}
                                            link
                                            truncateChars={feature.simd ? 12 : 20}
                                        />
                                        {feature.simd && (
                                            <a
                                                href={feature.simd.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-outline-primary"
                                            >
                                                See SIMD {feature.simd.number} →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
