import { capitalCase } from 'change-case';

import Logger from '@/app/utils/logger';

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

export function extractProgramNameFromRepo(repoUrl: string): string | null {
    if (!isValidGitHubUrl(repoUrl)) return null;

    try {
        const url = new URL(repoUrl);
        const pathParts = url.pathname.split('/').filter(Boolean);

        if (pathParts.length >= 2) {
            const repoName = pathParts[1];

            return capitalCase(repoName);
        }

        Logger.debug(`GitHub URL has insufficient path parts: ${repoUrl} (got ${pathParts.length}, need >= 2)`);
        return null;
    } catch (error) {
        Logger.debug(`Failed to extract program name from: ${repoUrl}`, error);
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
