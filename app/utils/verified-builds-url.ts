// Strips `.git` from a repo URL whether it sits at the end of the URL (raw clone URL from
// a verify PDA) or before `/tree/<sha>` (OSecure's pre-concatenated /status payload).
// GitHub only serves `/tree/<sha>` under the bare repo path, so the strip is required for
// the rendered link to resolve.
export function normalizeRepoUrl(repoUrl: string | undefined): string | undefined {
    if (!repoUrl) return undefined;
    if (repoUrl.endsWith('.git')) return repoUrl.slice(0, -4);
    return repoUrl.replace('.git/', '/');
}
