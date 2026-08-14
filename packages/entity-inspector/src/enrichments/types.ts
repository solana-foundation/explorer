import type { IdlStandard } from '@explorer/idl-decode';
import type { IdlSource } from '@explorer/idl-decode/fetch';
import type { TokenProgram } from '@explorer/parsers';
import type { SecurityTxtFields as ParsedSecurityTxtFields } from '@explorer/parsers/security-txt';

import type { SafeNumeric } from '../shared/types.js';

// Enrichment result shapes live here, not in resolver modules like the source — types are the contract; resolvers import them.

export type VerificationEvidence = {
    signer: string;
    signer_label: string | null;
    on_chain_hash: string;
    executable_hash: string;
    last_verified_at: string | null;
    repo_url: string | null;
    is_frozen: boolean;
    message: string;
};

export type VerificationResult =
    | { status: 'verified'; evidence: VerificationEvidence }
    | { status: 'unverified' }
    | { status: 'unknown'; reason: 'source_unavailable' | 'verification_invalid' };

// The byte-parser's fields (source of truth in @explorer/parsers) plus the PMP-only extras the
// canonical metadata path populates — extends rather than re-spells so a new parser field propagates.
export type SecurityTxtFields = ParsedSecurityTxtFields & {
    logo?: string | null;
    description?: string | null;
    notification?: string | null;
    sdk?: string | null;
    version?: string | null;
};

export type SecurityMetadataResult =
    | {
          status: 'present';
          data: SecurityTxtFields;
          source_type: 'pmp_canonical' | 'embedded_security_txt';
          security_expired?: true;
      }
    | { status: 'missing' }
    | { status: 'unknown'; reason: 'source_unavailable' | 'security_invalid' };

export type MultisigReferenceResult =
    | {
          status: 'is_multisig';
          version: 'v3' | 'v4' | TokenProgram;
          multisig_address: string | null;
          threshold: SafeNumeric;
          members: string[] | null;
      }
    | { status: 'not_multisig' }
    | { status: 'unknown'; reason: 'source_unavailable' };

// Derived from @explorer/idl-decode's detection vocabulary; the extra members are the source
// explorer-mcp's wider wire vocabulary (legacy converts to codama at client creation; shank is undetectable).
export type IdlType = `${IdlStandard}` | 'anchor_legacy' | 'shank';

/**
 * The publication refined where one has variants: PMP resolves under the program's canonical PDA or
 * under a fallback authority (the only lookup a frozen program can publish through), while the Anchor
 * PDA has a single derivation and so refines to itself. Wire vocabulary — deliberately spelled here
 * rather than derived from `IdlSource`, so an upstream rename cannot move these values.
 */
export type IdlSourceType = 'anchor' | 'pmp_canonical' | 'pmp_fallback';

export type IdlDiscoveryResult =
    | {
          status: 'found';
          idl_type: IdlType;
          /** Where it was published, as the package reports it. */
          source: IdlSource;
          source_type: IdlSourceType;
          /** PMP only: `null` when the canonical PDA served it, else the authority whose PDA did. */
          authority?: string | null;
          program_name: string | null;
          // The source shipped the whole IDL json here; deliberately omitted — detection + name serve the tool.
          data?: Record<string, unknown>;
      }
    | { status: 'not_found' }
    | { status: 'unknown'; reason: 'source_unavailable' | 'idl_invalid' | 'address_unverified' };
