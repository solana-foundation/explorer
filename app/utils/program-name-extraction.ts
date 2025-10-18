import Logger from './logger';

// Validate that repo URL is from GitHub (security check)
export function isValidGitHubUrl(repoUrl: string): boolean {
    try {
        const url = new URL(repoUrl);
        const isValid = url.hostname === 'github.com' || url.hostname === 'www.github.com';

        if (!isValid) {
            Logger.debug(`Invalid GitHub URL hostname: ${url.hostname} (expected github.com)`);
        }

        return isValid;
    } catch (error) {
        Logger.debug(`Failed to parse repo URL: ${repoUrl}`, error);
        return false;
    }
}

// Extract program name from GitHub repo URL
// Example: "https://github.com/Ellipsis-Labs/phoenix-v1" → "Phoenix V1"
export function extractProgramNameFromRepo(repoUrl: string): string | null {
    // Validate GitHub URL first
    if (!isValidGitHubUrl(repoUrl)) return null;

    try {
        const url = new URL(repoUrl);
        const pathParts = url.pathname.split('/').filter(Boolean);

        // GitHub URLs: /org/repo-name
        if (pathParts.length >= 2) {
            const repoName = pathParts[1];

            // Convert kebab-case/snake_case to Title Case
            return repoName
                .replace(/[-_]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        Logger.debug(`GitHub URL has insufficient path parts: ${repoUrl} (got ${pathParts.length}, need >= 2)`);
        return null;
    } catch (error) {
        Logger.debug(`Failed to extract program name from: ${repoUrl}`, error);
        return null;
    }
}

// Get program name with fallback chain
export function getProgramName(programId: string, repoUrl?: string): string {
    // 1. Try extracting from repo URL (includes validation)
    if (repoUrl) {
        const extractedName = extractProgramNameFromRepo(repoUrl);
        if (extractedName) return extractedName;
    }

    // 2. Fallback to address
    return programId;
}
