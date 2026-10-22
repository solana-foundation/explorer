import { type ProgramIdlPair } from '../api/types';
import { type AnchorIdl, type CodamaIdl, type SupportedIdl } from '../lib/types';
import { IdlVariant } from './idl-variant';
import { getIdlStandard } from './idl-version';

type TaggedIdl = { standard: 'Anchor'; idl: AnchorIdl } | { standard: 'Codama'; idl: CodamaIdl };
export type SourcedIdl = TaggedIdl & { source: IdlVariant; idlAddress: string | undefined };

export function getOnChainIdls({
    programMetadataIdl,
    programMetadataIdlAddress,
    anchorIdl,
    anchorIdlAddress,
}: ProgramIdlPair): SourcedIdl[] {
    const idls: SourcedIdl[] = [];
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

function tagIdl(idl: SupportedIdl): TaggedIdl {
    return isCodamaIdl(idl) ? { idl, standard: 'Codama' } : { idl, standard: 'Anchor' };
}

function isCodamaIdl(idl: SupportedIdl): idl is CodamaIdl {
    return getIdlStandard(idl) === 'Codama';
}
