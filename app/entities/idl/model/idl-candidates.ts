import { type ProgramIdlPair } from '../api/types';
import { type AnchorIdl, type CodamaIdl, type SupportedIdl, type TaggedIdl } from '../lib/types';
import { type CustomIdlOrigin, type CustomIdlRecord } from './custom-idl/types';
import { getIdlStandard } from './idl-version';

export type OnChainIdlSource = 'programMetadata' | 'anchor';

export type IdlSource = 'custom' | OnChainIdlSource;

export type SourcedIdl = TaggedIdl &
    ({ source: 'custom'; origin: CustomIdlOrigin } | { source: OnChainIdlSource; address: string | undefined });

type OnChainSourcedIdl = Extract<SourcedIdl, { source: OnChainIdlSource }>;

export function selectIdlCandidates(onChain: ProgramIdlPair, record: CustomIdlRecord | undefined): SourcedIdl[] {
    if (record?.selected === 'custom') return [{ ...record.customIdl, origin: record.origin, source: 'custom' }];
    return getOnChainCandidates(onChain);
}

export function getOnChainCandidates({
    programMetadataIdl,
    programMetadataIdlAddress,
    anchorIdl,
    anchorIdlAddress,
}: ProgramIdlPair): OnChainSourcedIdl[] {
    const candidates: OnChainSourcedIdl[] = [];
    if (programMetadataIdl) {
        candidates.push({
            ...tagIdl(programMetadataIdl),
            address: programMetadataIdlAddress,
            source: 'programMetadata',
        });
    }
    if (anchorIdl) candidates.push({ ...tagIdl(anchorIdl), address: anchorIdlAddress, source: 'anchor' });
    return candidates;
}

export function getOnChainAnchorIdl(onChain: ProgramIdlPair): AnchorIdl | undefined {
    return getFirstAnchorIdl(getOnChainCandidates(onChain).filter(candidate => candidate.source === 'anchor'));
}

export function getFirstAnchorIdl(candidates: readonly SourcedIdl[]): AnchorIdl | undefined {
    return candidates.find(candidate => candidate.standard === 'Anchor')?.idl;
}

export function getFirstAnchorIdlWithAccounts(candidates: readonly SourcedIdl[]): AnchorIdl | undefined {
    const anchorIdls = candidates.flatMap(candidate => (candidate.standard === 'Anchor' ? [candidate.idl] : []));
    return anchorIdls.find(idl => (idl.accounts?.length ?? 0) > 0);
}

function tagIdl(idl: SupportedIdl): TaggedIdl {
    return getIdlStandard(idl) === 'Anchor'
        ? { idl: idl as AnchorIdl, standard: 'Anchor' }
        : { idl: idl as CodamaIdl, standard: 'Codama' };
}
