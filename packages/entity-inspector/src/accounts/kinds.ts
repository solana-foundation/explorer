// Inspector-owned vocabularies (value-first): the runtime constants are the source; types derive from them.
import {
    ADDRESS_LOOKUP_TABLE_PROGRAM_LABEL,
    BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL,
    CONFIG_PROGRAM_LABEL,
    NONCE_PROGRAM_LABEL,
    SPL_TOKEN_PROGRAM_LABEL,
    SPL_TOKEN_2022_PROGRAM_LABEL,
    STAKE_PROGRAM_LABEL,
    SYSVAR_PROGRAM_LABEL,
    VOTE_PROGRAM_LABEL,
} from '@explorer/parsers';

// A malformed identifier is the error side of decodeIdentifierKind's Result — not a kind.
export const ACCOUNT_IDENTIFIER_KIND = 'account';
export const TRANSACTION_IDENTIFIER_KIND = 'transaction';
export const IDENTIFIER_KINDS = [ACCOUNT_IDENTIFIER_KIND, TRANSACTION_IDENTIFIER_KIND] as const;
export type IdentifierKind = (typeof IDENTIFIER_KINDS)[number];

export const ACCOUNT_TOKEN_SUBTYPE = 'account';
export const MINT_TOKEN_SUBTYPE = 'mint';
export const MULTISIG_TOKEN_SUBTYPE = 'multisig';
export const TOKEN_SUBTYPES = [ACCOUNT_TOKEN_SUBTYPE, MINT_TOKEN_SUBTYPE, MULTISIG_TOKEN_SUBTYPE] as const;
export type TokenSubtype = (typeof TOKEN_SUBTYPES)[number];

// Subtypes mirror the PMP program's own AccountDiscriminator — a closed set of three, not an open seed space.
export const EMPTY_PROGRAM_METADATA_SUBTYPE = 'empty';
export const BUFFER_PROGRAM_METADATA_SUBTYPE = 'buffer';
export const METADATA_PROGRAM_METADATA_SUBTYPE = 'metadata';
export const PROGRAM_METADATA_SUBTYPES = [
    EMPTY_PROGRAM_METADATA_SUBTYPE,
    BUFFER_PROGRAM_METADATA_SUBTYPE,
    METADATA_PROGRAM_METADATA_SUBTYPE,
] as const;
export type ProgramMetadataSubtype = (typeof PROGRAM_METADATA_SUBTYPES)[number];

// RPC-shared kinds — each kind IS its RPC label by construction (value aliases mirroring AccountEntityKind's Exclude derivation).
export const ADDRESS_LOOKUP_TABLE_KIND = ADDRESS_LOOKUP_TABLE_PROGRAM_LABEL;
export const BPF_UPGRADEABLE_LOADER_KIND = BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL;
export const CONFIG_KIND = CONFIG_PROGRAM_LABEL;
export const NONCE_KIND = NONCE_PROGRAM_LABEL;
export const STAKE_KIND = STAKE_PROGRAM_LABEL;
export const SYSVAR_KIND = SYSVAR_PROGRAM_LABEL;
export const VOTE_KIND = VOTE_PROGRAM_LABEL;

// Composite token kinds — token program label × subtype, derived from the same specimens.
export const SPL_TOKEN_ACCOUNT_KIND = `${SPL_TOKEN_PROGRAM_LABEL}:${ACCOUNT_TOKEN_SUBTYPE}` as const;
export const SPL_TOKEN_MINT_KIND = `${SPL_TOKEN_PROGRAM_LABEL}:${MINT_TOKEN_SUBTYPE}` as const;
export const SPL_TOKEN_MULTISIG_KIND = `${SPL_TOKEN_PROGRAM_LABEL}:${MULTISIG_TOKEN_SUBTYPE}` as const;
export const SPL_TOKEN_2022_ACCOUNT_KIND = `${SPL_TOKEN_2022_PROGRAM_LABEL}:${ACCOUNT_TOKEN_SUBTYPE}` as const;
export const SPL_TOKEN_2022_MINT_KIND = `${SPL_TOKEN_2022_PROGRAM_LABEL}:${MINT_TOKEN_SUBTYPE}` as const;
export const SPL_TOKEN_2022_MULTISIG_KIND = `${SPL_TOKEN_2022_PROGRAM_LABEL}:${MULTISIG_TOKEN_SUBTYPE}` as const;

// PMP accounts are never jsonParsed, so the label has no @explorer/parsers counterpart to alias.
export const PROGRAM_METADATA_LABEL = 'program-metadata';
export const PROGRAM_METADATA_EMPTY_KIND = `${PROGRAM_METADATA_LABEL}:${EMPTY_PROGRAM_METADATA_SUBTYPE}` as const;
export const PROGRAM_METADATA_BUFFER_KIND = `${PROGRAM_METADATA_LABEL}:${BUFFER_PROGRAM_METADATA_SUBTYPE}` as const;
export const PROGRAM_METADATA_METADATA_KIND = `${PROGRAM_METADATA_LABEL}:${METADATA_PROGRAM_METADATA_SUBTYPE}` as const;

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
