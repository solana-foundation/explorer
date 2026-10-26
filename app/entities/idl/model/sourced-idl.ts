import { type ProgramIdlPair } from '../api/types';
import { type AnchorIdl, type CodamaIdl, type SupportedIdl, type TaggedIdl } from '../lib/types';
import { type CustomIdlOrigin, type CustomIdlRecord } from './custom-idl/types';
import { IdlVariant } from './idl-variant';
import { getIdlStandard } from './idl-version';

export type IdlSource = 'custom' | IdlVariant;

export type SourcedIdl = TaggedIdl &
    ({ source: 'custom'; origin: CustomIdlOrigin } | { source: IdlVariant; idlAddress: string | undefined });

export type OnChainIdl = Extract<SourcedIdl, { source: IdlVariant }>;

export function getSelectedIdls(
    onChainIdls: readonly OnChainIdl[],
    record: CustomIdlRecord | undefined,
): readonly SourcedIdl[] {
    if (record?.selected === 'custom') return [{ ...record.customIdl, origin: record.origin, source: 'custom' }];
    return onChainIdls;
}

export function getOnChainIdls({
    programMetadataIdl,
    programMetadataIdlAddress,
    anchorIdl,
    anchorIdlAddress,
}: ProgramIdlPair): OnChainIdl[] {
    const idls: OnChainIdl[] = [];
    if (programMetadataIdl) {
        idls.push({
            ...tagIdl(programMetadataIdl),
            idlAddress: programMetadataIdlAddress,
            source: IdlVariant.ProgramMetadata,
        });
    }
    if (anchorIdl) idls.push({ ...tagIdl(anchorIdl), idlAddress: anchorIdlAddress, source: IdlVariant.Anchor });
    return idls;
}

export function getAnchorAccountIdls(idls: readonly SourcedIdl[]): AnchorIdl[] {
    return getAnchorIdls(idls.filter(({ source }) => source === IdlVariant.Anchor));
}

export function getAnchorIdls(idls: readonly SourcedIdl[]): AnchorIdl[] {
    return idls.flatMap(({ idl, standard }) => (standard === 'Anchor' ? [idl] : []));
}

export function getAnchorIdlsWithAccounts(idls: readonly SourcedIdl[]): AnchorIdl[] {
    return getAnchorIdls(idls).filter(idl => (idl.accounts?.length ?? 0) > 0);
}

export function tagIdl(idl: SupportedIdl): TaggedIdl {
    return isCodamaIdl(idl) ? { idl, standard: 'Codama' } : { idl, standard: 'Anchor' };
}

function isCodamaIdl(idl: SupportedIdl): idl is CodamaIdl {
    return getIdlStandard(idl) === 'Codama';
}
