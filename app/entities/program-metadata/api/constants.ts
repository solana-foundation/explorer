// Program Metadata Program (PMP) seeds. A program's metadata is stored in PDAs keyed by these
// seeds — the IDL under `idl`, security.txt under `security`. Resolution runs through @solana/idl:
// the IDL seed via /api/idl-latest, security.txt via /api/security-txt (custom/localhost resolve
// client-side in resolve-pmp-content-client).
export const IDL_SEED = 'idl';
export const SECURITY_TXT_SEED = 'security';

export const errors = {
    500: 'Metadata fetch failed',
};
