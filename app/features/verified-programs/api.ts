import Logger from '@/app/utils/logger';

import { getProgramName } from './model';
import { ProgramMetadata, VerifiedProgramInfo, VerifiedProgramsResponse } from './types';

// Use local API routes to avoid CORS issues in development
const API_BASE_URL = '/api/verified-programs';

// Fetch metadata for a single program
async function fetchProgramMetadata(programId: string): Promise<ProgramMetadata | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/metadata/${programId}`);
        if (!response.ok) {
            Logger.debug(`Metadata fetch failed for ${programId}: HTTP ${response.status}`);
            return null;
        }

        const data: ProgramMetadata[] = await response.json();

        // Return first entry if exists
        if (data.length === 0) {
            Logger.debug(`Metadata is empty for ${programId}: API returned empty array`);
            return null;
        }
        return data[0];
    } catch (error) {
        Logger.error(`Failed to fetch metadata for ${programId}`, error);
        return null;
    }
}

// Fetch metadata for multiple programs (in parallel for one page)
async function fetchMetadataForPage(programIds: string[]): Promise<Map<string, ProgramMetadata | null>> {
    const results = await Promise.allSettled(programIds.map(id => fetchProgramMetadata(id)));

    const metadataMap = new Map<string, ProgramMetadata | null>();
    results.forEach((result, index) => {
        const programId = programIds[index];
        metadataMap.set(programId, result.status === 'fulfilled' ? result.value : null);
    });

    return metadataMap;
}

// Fetch programs page by page with metadata
export async function fetchProgramsProgressively(
    onPageLoaded: (programs: VerifiedProgramInfo[], page: number, totalPages: number, totalCount: number) => void
): Promise<void> {
    try {
        // Fetch first page to get total pages
        const firstPageResponse = await fetch(`${API_BASE_URL}/list/1`);
        if (!firstPageResponse.ok) {
            throw new Error('Failed to fetch verified programs');
        }
        const firstPage: VerifiedProgramsResponse = await firstPageResponse.json();

        const totalPages = firstPage.meta.total_pages;
        const totalCount = firstPage.meta.total;

        // Process first page
        const firstPageMetadata = await fetchMetadataForPage(firstPage.verified_programs);
        const firstPagePrograms = firstPage.verified_programs.map(programId => {
            const metadata = firstPageMetadata.get(programId) ?? null;

            return {
                isVerified: true as const,
                lastVerifiedAt: metadata?.last_verified_at,
                name: getProgramName(programId, metadata?.repo_url),
                programId,
                repoUrl: metadata?.repo_url,
            };
        });

        onPageLoaded(firstPagePrograms, 1, totalPages, totalCount);

        // Fetch remaining pages sequentially
        for (let page = 2; page <= totalPages; page++) {
            const pageResponse = await fetch(`${API_BASE_URL}/list/${page}`);
            if (!pageResponse.ok) {
                Logger.error(`Failed to fetch page ${page}`);
                continue;
            }

            const pageData: VerifiedProgramsResponse = await pageResponse.json();
            const pageMetadata = await fetchMetadataForPage(pageData.verified_programs);
            const pagePrograms = pageData.verified_programs.map(programId => {
                const metadata = pageMetadata.get(programId) ?? null;

                return {
                    isVerified: true as const,
                    lastVerifiedAt: metadata?.last_verified_at,
                    name: getProgramName(programId, metadata?.repo_url),
                    programId,
                    repoUrl: metadata?.repo_url,
                };
            });

            onPageLoaded(pagePrograms, page, totalPages, totalCount);

            // Small delay between pages to avoid rate limiting
            if (page < totalPages) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    } catch (error) {
        Logger.error('Failed to fetch programs progressively', error);
        throw error;
    }
}
