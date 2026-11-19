import { clusterFromSlug, DEFAULT_CLUSTER } from '@utils/cluster';

import { lookupTokenInfo } from '@/app/entities/token-info/server';

export type AddressPageMetadataProps = Readonly<{
    params: Promise<{
        address: string;
    }>;
    searchParams: Promise<{
        cluster?: string;
    }>;
}>;

export default async function getReadableTitleFromAddress(props: AddressPageMetadataProps): Promise<string> {
    const { address } = await props.params;
    const { cluster: clusterParam } = await props.searchParams;

    // An absent param means the default cluster, matching how the page itself reads the query.
    const cluster = clusterParam === undefined ? DEFAULT_CLUSTER : (clusterFromSlug(clusterParam) ?? DEFAULT_CLUSTER);

    const lookup = await lookupTokenInfo({ cluster, genesisHash: undefined, mint: address });
    const tokenName = lookup.kind === 'listed' ? lookup.token.name : undefined;
    if (tokenName == null) {
        return address;
    }
    const tokenDisplayAddress = `${address.slice(0, 2)}\u2026${address.slice(-2)}`;
    return `Token | ${tokenName} (${tokenDisplayAddress})`;
}
