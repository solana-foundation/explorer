import { type SupportedIdl } from '../lib/types';

/**
 * A program's two IDL sources side by side — the Anchor PDA IDL and the PMP `idl`-seed IDL — each with
 * the on-chain account it was read from. Generic over the IDL content type: the resolver surfaces raw
 * parsed JSON (`unknown`, see `ResolvedProgramIdls`) while downstream consumers read the
 * standard-narrowed `SupportedIdl` (see `ProgramIdlPair`). The address fields are shared by both.
 */
export type ProgramIdlSources<IdlContent> = {
    /** Anchor PDA IDL content, or `undefined` when absent / undecodable. */
    anchorIdl: IdlContent;
    /** On-chain account the Anchor IDL was read from (the derived Anchor IDL PDA), when present. */
    anchorIdlAddress: string | undefined;
    /** PMP `idl`-seed IDL content, or `undefined` when absent / undecodable. */
    programMetadataIdl: IdlContent;
    /** On-chain account the PMP IDL was read from (the PMP metadata account), when present. */
    programMetadataIdlAddress: string | undefined;
};

/** A program's resolved IDLs side by side, narrowed to the supported standards (Anchor / Codama). */
export type ProgramIdlPair = ProgramIdlSources<SupportedIdl | undefined>;
