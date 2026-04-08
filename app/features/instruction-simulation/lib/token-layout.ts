/** Base SPL mint account size (bytes) */
export const MINT_SIZE = 82;

/** Token-2022 mints can be larger with extensions; decode only the base layout */
export const MIN_MINT_ACCOUNT_BUFFER_LENGTH = MINT_SIZE;

/** Base SPL token account size (bytes) */
export const TOKEN_ACCOUNT_SIZE = 165;

/** mintAuthorityOption(4) + mintAuthority(32) + supply(8) = 44 */
export const DECIMALS_OFFSET = 44;

/**
 * Token-2022 account type discriminator values.
 * The discriminator byte sits at offset `TOKEN_ACCOUNT_SIZE` (165).
 */
export const ACCOUNT_TYPE_MINT = 1;
export const ACCOUNT_TYPE_TOKEN = 2;
