'use client';

import type { NftokenAccount } from '../lib/nftoken-accounts';
import { useNftokenMetadata } from '../model/use-nftoken-metadata';
import { BaseNftokenHeader } from './BaseNftokenHeader';

export function NftokenAccountHeader({ nftoken }: { nftoken: NftokenAccount }) {
    const metadata = useNftokenMetadata(nftoken.metadata_url);

    return <BaseNftokenHeader kind={nftoken.kind} metadata={metadata} mutable={nftoken.authority_can_update} />;
}
