import Logger from '@/app/utils/logger';

import { getProgramName } from './model';
import { ProgramMetadata, VerifiedProgramInfo, VerifiedProgramsResponse } from './types';

const API_BASE_URL = '/api/verified-programs';

async function fetchProgramMetadata(programId: string): Promise<ProgramMetadata | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/metadata/${programId}`);
        if (!response.ok) {
            Logger.debug(`Metadata fetch failed for ${programId}: HTTP ${response.status}`);
            return null;
        }

        const data: ProgramMetadata[] = await response.json();

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

async function fetchMetadataForPage(programIds: string[]): Promise<Map<string, ProgramMetadata | null>> {
    const results = await Promise.allSettled(programIds.map(id => fetchProgramMetadata(id)));

    const metadataMap = new Map<string, ProgramMetadata | null>();
    results.forEach((result, index) => {
        const programId = programIds[index];
        metadataMap.set(programId, result.status === 'fulfilled' ? result.value : null);
    });

    return metadataMap;
}

export async function fetchProgramsPage(page: number): Promise<{
    programs: VerifiedProgramInfo[];
    totalPages: number;
    totalCount: number;
    currentPage: number;
}> {
    try {
        const pageResponse = await fetch(`${API_BASE_URL}/list/${page}`);
        if (!pageResponse.ok) {
            throw new Error(`Failed to fetch verified programs page ${page}`);
        }

        const pageData: VerifiedProgramsResponse = await pageResponse.json();
        const totalPages = pageData.meta.total_pages;
        const totalCount = pageData.meta.total;

        const pageMetadata = await fetchMetadataForPage(pageData.verified_programs);
        const programs = pageData.verified_programs.map(programId => {
            const metadata = pageMetadata.get(programId) ?? null;

            return {
                isVerified: true as const,
                lastVerifiedAt: metadata?.last_verified_at,
                name: getProgramName(programId, metadata?.repo_url),
                programId,
                repoUrl: metadata?.repo_url,
            };
        });

        return {
            currentPage: page,
            programs,
            totalCount,
            totalPages,
        };
    } catch (error) {
        Logger.error(`Failed to fetch programs page ${page}`, error);
        throw error;
    }
}
