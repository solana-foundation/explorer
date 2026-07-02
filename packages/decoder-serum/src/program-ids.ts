import { address } from '@solana/kit';

// Historical Serum DEX deployments (two v1 deploys, then v2/v3 per @project-serum/serum layout versions).
export const SERUM_DEX_V1_PROGRAM_IDS = [
    address('4ckmDgGdxQoPDLUkDT3vHgSAkzA3QRdNq5ywwY4sUSJn'),
    address('BJ3jrUzddfuSrZHXSCxMUUQsjKEyLmuuyZebkcaFp2fg'),
];
export const SERUM_DEX_V2_PROGRAM_ID = address('EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o');
export const SERUM_DEX_V3_PROGRAM_ID = address('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin');
export const OPEN_BOOK_PROGRAM_ID = address('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX');

// Every Serum DEX deployment except the OpenBook fork is abandoned; their instructions are named but no longer decoded.
export const DEPRECATED_SERUM_PROGRAM_IDS = [
    ...SERUM_DEX_V1_PROGRAM_IDS,
    SERUM_DEX_V2_PROGRAM_ID,
    SERUM_DEX_V3_PROGRAM_ID,
];

export const SERUM_PROGRAM_IDS = [...DEPRECATED_SERUM_PROGRAM_IDS, OPEN_BOOK_PROGRAM_ID];

// Program display names for the app registry; the package is their source of truth.
export const OPENBOOK_DEX_PROGRAM_LABEL = 'OpenBook Dex';
export const SERUM_DEX_V1_PROGRAM_LABEL = 'Serum Dex v1 (deprecated)';
export const SERUM_DEX_V2_PROGRAM_LABEL = 'Serum Dex v2 (deprecated)';
export const SERUM_DEX_V3_PROGRAM_LABEL = 'Serum Dex v3 (deprecated)';
