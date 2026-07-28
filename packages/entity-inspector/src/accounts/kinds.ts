// Inspector-owned vocabularies (value-first): the runtime constants are the source; types derive from them.

export const ACCOUNT_IDENTIFIER_KIND = 'account';
export const INVALID_IDENTIFIER_KIND = 'invalid';
export const TRANSACTION_IDENTIFIER_KIND = 'transaction';
export const IDENTIFIER_KINDS = [
    ACCOUNT_IDENTIFIER_KIND,
    INVALID_IDENTIFIER_KIND,
    TRANSACTION_IDENTIFIER_KIND,
] as const;
export type IdentifierKind = (typeof IDENTIFIER_KINDS)[number];

export const ACCOUNT_TOKEN_SUBTYPE = 'account';
export const MINT_TOKEN_SUBTYPE = 'mint';
export const MULTISIG_TOKEN_SUBTYPE = 'multisig';
export const TOKEN_SUBTYPES = [ACCOUNT_TOKEN_SUBTYPE, MINT_TOKEN_SUBTYPE, MULTISIG_TOKEN_SUBTYPE] as const;
export type TokenSubtype = (typeof TOKEN_SUBTYPES)[number];

// Inspector-invented account kinds (no RPC counterpart) — the RPC-shared members derive from @explorer/parsers in types.ts.
export const BPF_LOADER_2_KIND = 'bpf-loader-2';
export const BPF_LOADER_KIND = 'bpf-loader';
export const COMPRESSED_NFT_KIND = 'compressed-nft';
export const FEATURE_KIND = 'feature';
export const LOADER_V4_KIND = 'loader-v4';
export const NATIVE_PROGRAM_KIND = 'native-program';
export const NFTOKEN_KIND = 'nftoken';
export const SOLANA_ATTESTATION_SERVICE_KIND = 'solana-attestation-service';
export const UNKNOWN_KIND = 'unknown';
