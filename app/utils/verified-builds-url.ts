import { Cluster } from './cluster';

// Canonical docs link for verified builds, shared by every card that explains the feature.
export const VERIFIED_BUILDS_GUIDE_URL = 'https://solana.com/developers/guides/advanced/verified-builds';

const OSEC_REGISTRY_URL = 'https://verify.osec.io';
const OSEC_DEVNET_REGISTRY_URL = 'https://verify-devnet.osec.io';

// OSEC hosts a separate verified-builds registry per cluster; Testnet/Custom have none. Kept in this
// React-free module so server routes (e.g. the account OG image) can read it without pulling the SWR/
// web3.js graph in `verified-builds.tsx`.
export function getOsecRegistryUrl(cluster: Cluster): string | undefined {
    switch (cluster) {
        case Cluster.MainnetBeta:
            return OSEC_REGISTRY_URL;
        case Cluster.Devnet:
            return OSEC_DEVNET_REGISTRY_URL;
        default:
            return undefined;
    }
}

export function supportsVerifiedBuilds(cluster: Cluster): boolean {
    return getOsecRegistryUrl(cluster) !== undefined;
}

// Strip `.git` from clone URLs so `<repo>/tree/<sha>` deep-links resolve on GitHub.
export function normalizeRepoUrl(repoUrl: string | undefined): string | undefined {
    if (!repoUrl) return undefined;
    if (repoUrl.endsWith('.git')) return repoUrl.slice(0, -4);
    return repoUrl.replace('.git/', '/');
}

// repo_url is signer-controlled; require https to block javascript:/data: schemes.
export function safeRepoUrl(repoUrl: string | undefined): string | undefined {
    if (!repoUrl) return undefined;
    try {
        const url = new URL(repoUrl);
        if (url.protocol !== 'https:') return undefined;
        return url.toString();
    } catch {
        return undefined;
    }
}

// PDA fields are signer-controlled; gate the composed URL through safeRepoUrl before exposing.
export function composeOnchainRepoUrl(gitUrl: string | undefined, commit: string): string | undefined {
    const base = normalizeRepoUrl(gitUrl);
    if (!base) return undefined;
    const composed = commit.length ? `${base}/tree/${commit}` : base;
    return safeRepoUrl(composed);
}

// Trim trailing slashes so a composed `<repo>/tree/<sha>` link has no `//` and labels read cleanly.
export function trimTrailingSlashes(value: string): string {
    let result = value;
    while (result.endsWith('/')) result = result.slice(0, -1);
    return result;
}

// Compact, readable repository label: drop the scheme and any trailing slash or `.git`. Display only
// — the clickable href is still built from the full URL via composeOnchainRepoUrl.
export function repoLabel(repository: string): string {
    let label = trimTrailingSlashes(repository);
    if (label.startsWith('https://')) label = label.slice('https://'.length);
    else if (label.startsWith('http://')) label = label.slice('http://'.length);
    if (label.endsWith('.git')) label = label.slice(0, -'.git'.length);
    return label;
}
