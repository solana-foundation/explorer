import { type ProgramIdlPair } from '../api/types';
import { type AnchorIdl, type CodamaIdl, type IdlStandard, type SupportedIdl } from '../lib/types';
import { IdlVariant } from './idl-variant';
import { getIdlStandard } from './idl-version';

type TaggedIdl = {
    [S in IdlStandard]: { standard: S; idl: { Anchor: AnchorIdl; Codama: CodamaIdl }[S] };
}[IdlStandard];
export type SourcedIdl = TaggedIdl & { source: IdlVariant; idlAddress: string | undefined };

export function getOnChainCandidates({
    programMetadataIdl,
    programMetadataIdlAddress,
    anchorIdl,
    anchorIdlAddress,
}: ProgramIdlPair): SourcedIdl[] {
    const candidates: SourcedIdl[] = [];
    if (programMetadataIdl) {
        candidates.push({
            ...tagIdl(programMetadataIdl),
            idlAddress: programMetadataIdlAddress,
            source: IdlVariant.ProgramMetadata,
        });
    }
    if (anchorIdl) candidates.push({ ...tagIdl(anchorIdl), idlAddress: anchorIdlAddress, source: IdlVariant.Anchor });
    return candidates;
}

export function getAnchorAccountIdls(candidates: readonly SourcedIdl[]): AnchorIdl[] {
    return getAnchorIdls(candidates.filter(candidate => candidate.source === IdlVariant.Anchor));
}

export function getAnchorIdls(candidates: readonly SourcedIdl[]): AnchorIdl[] {
    return candidates.flatMap(candidate => (candidate.standard === 'Anchor' ? [candidate.idl] : []));
}

export function getAnchorIdlsWithAccounts(candidates: readonly SourcedIdl[]): AnchorIdl[] {
    return getAnchorIdls(candidates).filter(idl => (idl.accounts?.length ?? 0) > 0);
}

function tagIdl(idl: SupportedIdl): TaggedIdl {
    return isCodamaIdl(idl) ? { idl, standard: 'Codama' } : { idl, standard: 'Anchor' };
}

function isCodamaIdl(idl: SupportedIdl): idl is CodamaIdl {
    return getIdlStandard(idl) === 'Codama';
}
