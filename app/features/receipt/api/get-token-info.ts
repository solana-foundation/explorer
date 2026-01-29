import { Cluster } from '@/app/utils/cluster';

export type TokenInfo = {
    symbol?: string;
    logoURI?: string;
};

// Why? Using the original token-info on edge runtime causes module errors.
// Maybe split the original module or/and move to entities/token/api
export async function getTokenInfo(mintAddress: string, cluster: Cluster): Promise<TokenInfo | undefined> {
    const chainId = getChainIdForCluster(cluster);
    if (!chainId) return undefined;

    const response = await fetch(`https://token-list-api.solana.cloud/v1/mints?chainId=${chainId}`, {
        body: JSON.stringify({ addresses: [mintAddress] }),
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
    });

    if (response.status >= 400) {
        console.error(
            `Error calling UTL API for address ${mintAddress} on chain ID ${chainId}. Status ${response.status}`
        );
        return undefined;
    }

    const data = await response.json();
    return data?.content?.[0];
}

function getChainIdForCluster(cluster: Cluster): number | undefined {
    switch (cluster) {
        case Cluster.MainnetBeta:
            return 101;
        case Cluster.Testnet:
            return 102;
        case Cluster.Devnet:
            return 103;
        default:
            return undefined;
    }
}
