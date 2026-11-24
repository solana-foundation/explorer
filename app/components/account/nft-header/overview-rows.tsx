import type { NftHeaderModel } from '@/app/components/account/nft-header/model';
import { MutabilityHint, NftCreatorsList } from '@/app/components/account/nft-header/NftHeaderVariants';
import type { KeyValueRowInput } from '@/app/shared/ui/key-value';

export function nftOverviewRows(model: NftHeaderModel): KeyValueRowInput[] {
    return [
        model.primarySaleHappened !== undefined && {
            label: 'Market',
            value: model.primarySaleHappened ? 'Secondary Market' : 'Primary Market',
        },
        { label: 'Metadata', value: <MutabilityHint mutable={model.mutable} /> },
    ];
}

export function nftCreatorsOverviewRow(model: Pick<NftHeaderModel, 'creators'>): KeyValueRowInput {
    return { label: 'Creators', value: <NftCreatorsList creators={model.creators} /> };
}
