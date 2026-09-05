import type { IdlStandard } from '@explorer/idl-decode';
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
    | { status: 'unknown'; reason: 'source_unavailable' | 'verification_invalid' | 'loader_state_undecoded' };

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
          /** `pmp_canonical` names the only PDA this leg reads — it never consults a fallback authority. */
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
    | { status: 'unknown'; reason: 'source_unavailable' | 'loader_state_undecoded' };

// Derived from @explorer/idl-decode's detection vocabulary; the extra members are the source
// explorer-mcp's wider wire vocabulary (legacy converts to codama at client creation; shank is undetectable).
export type IdlType = `${IdlStandard}` | 'anchor_legacy' | 'shank';

/**
 * Which publication served the IDL. Wire vocabulary — deliberately spelled here rather than derived
 * from `IdlSource`, so an upstream rename cannot move these values.
 */
export type IdlSourceWire = 'anchor' | 'pmp';

export type IdlDiscoveryResult =
    | {
          status: 'found';
          idl_type: IdlType;
          source: IdlSourceWire;
          /** PMP only: `null` when the canonical PDA served it, else the authority whose PDA did. */
          authority?: string | null;
          program_name: string | null;
          // The source shipped the whole IDL json here; deliberately omitted — detection + name serve the tool.
          data?: Record<string, unknown>;
      }
    | { status: 'not_found' }
    | { status: 'unknown'; reason: 'source_unavailable' | 'idl_invalid' | 'address_unverified' };
