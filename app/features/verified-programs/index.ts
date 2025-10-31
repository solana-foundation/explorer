// Public API for verified programs feature

// Types
export type { ProgramMetadata, ProgramMetadataResponse, VerifiedProgramInfo, VerifiedProgramsResponse } from './types';

// API functions
export { fetchProgramsProgressively } from './api';

// Model functions
export { extractProgramNameFromRepo, getProgramName, isValidGitHubUrl } from './model';

// UI components
export { VerifiedProgramsCard } from './ui/VerifiedProgramsCard';
