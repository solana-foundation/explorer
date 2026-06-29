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
