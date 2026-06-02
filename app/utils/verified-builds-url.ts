// Verified-build PDAs store the git clone URL (`.../<repo>.git`). Callers append
// `/tree/<commit>` to deep-link the verified commit, but GitHub only serves
// `/tree/<sha>` under the bare repo path -- so the trailing `.git` must be stripped first.
// See also: `normalizeOsecRepoUrl` in scripts/update-verified-programs.ts (handles the
// upstream-pre-concatenated `.git/tree/<sha>` shape).
export function normalizeRepoUrl(repoUrl: string | undefined): string | undefined {
    if (!repoUrl) return undefined;
    if (repoUrl.endsWith('.git')) return repoUrl.slice(0, -4);
    return repoUrl;
}
