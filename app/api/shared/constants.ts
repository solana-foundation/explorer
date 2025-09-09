import { PROGRAM_METADATA_PROGRAM_ADDRESS } from '@solana-program/program-metadata';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import { SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS } from 'sas-lib';

export const ENABLED_PROGRAMS_FOR_CPI_CALLS = [
    TOKEN_2022_PROGRAM_ADDRESS.toString(),
    SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS.toString(),
    PROGRAM_METADATA_PROGRAM_ADDRESS.toString(),
];
