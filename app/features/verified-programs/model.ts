import { capitalCase } from 'change-case';

import { Logger } from '@/app/shared/lib/logger';

export function isValidGitHubUrl(repoUrl: string): boolean {
    try {
        const url = new URL(repoUrl);
        const isValid = url.hostname === 'github.com' || url.hostname === 'www.github.com';

        if (!isValid) {
            Logger.debug('[verified-programs] Invalid GitHub URL hostname', {
                expected: 'github.com',
                hostname: url.hostname,
            });
        }

        return isValid;
    } catch (error) {
        Logger.debug('[verified-programs] Failed to parse repo URL', { error, repoUrl });
        return false;
    }
}

export function extractProgramNameFromRepo(repoUrl: string): string | null {
    if (!isValidGitHubUrl(repoUrl)) return null;

    try {
        const url = new URL(repoUrl);
        const pathParts = url.pathname.split('/').filter(Boolean);

        if (pathParts.length >= 2) {
            const repoName = pathParts[1];

            return capitalCase(repoName);
        }

        Logger.debug('[verified-programs] GitHub URL has insufficient path parts', {
            pathPartsCount: pathParts.length,
            repoUrl,
        });
        return null;
    } catch (error) {
        Logger.debug('[verified-programs] Failed to extract program name', { error, repoUrl });
        return null;
    }
}

export function getProgramName(programId: string, repoUrl?: string): string {
    if (repoUrl) {
        const extractedName = extractProgramNameFromRepo(repoUrl);
        if (extractedName) return extractedName;
    }

    return programId;
}
