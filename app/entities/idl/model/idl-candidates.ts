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

export function getAnchorAccountIdl(candidates: readonly SourcedIdl[]): AnchorIdl | undefined {
    return getFirstAnchorIdl(candidates.filter(candidate => candidate.source === IdlVariant.Anchor));
}

export function getFirstAnchorIdl(candidates: readonly SourcedIdl[]): AnchorIdl | undefined {
    return candidates.find(candidate => candidate.standard === 'Anchor')?.idl;
}

export function getFirstAnchorIdlWithAccounts(candidates: readonly SourcedIdl[]): AnchorIdl | undefined {
    const anchorIdls = candidates.flatMap(candidate => (candidate.standard === 'Anchor' ? [candidate.idl] : []));
    return anchorIdls.find(idl => (idl.accounts?.length ?? 0) > 0);
}

function tagIdl(idl: SupportedIdl): TaggedIdl {
    return isCodamaIdl(idl) ? { idl, standard: 'Codama' } : { idl, standard: 'Anchor' };
}

function isCodamaIdl(idl: SupportedIdl): idl is CodamaIdl {
    return getIdlStandard(idl) === 'Codama';
}
