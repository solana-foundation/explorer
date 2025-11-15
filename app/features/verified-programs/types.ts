export type VerifiedProgramInfo = {
    programId: string;
    name: string; // From repo URL or address fallback
    isVerified: true; // Always true for programs from /verified-programs
    repoUrl?: string; // GitHub repository URL
    lastVerifiedAt?: string; // Last verification timestamp
};

// Individual metadata entry from /status-all/{programId}
export type ProgramMetadata = {
    repo_url: string;
    commit: string;
    is_verified: boolean;
    last_verified_at: string;
    signer: string;
    on_chain_hash: string;
    executable_hash: string;
};

// API response from /status-all/{programId} (array of entries)
export type ProgramMetadataResponse = ProgramMetadata[];

// API response type from osec.io /verified-programs endpoint
export type VerifiedProgramsResponse = {
    meta: {
        total: number;
        page: number;
        total_pages: number;
        items_per_page: number;
        has_next_page: boolean;
        has_prev_page: boolean;
    };
    verified_programs: string[];
};
