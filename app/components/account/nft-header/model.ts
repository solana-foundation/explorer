import type { EditionInfo } from '@entities/nft';
import { isSome } from '@metaplex-foundation/umi';

export type NftCreator = { address: string; verified: boolean; share: number };

export type NftCollection = { address: string; name?: string };

export type NftHeaderModel = {
    typeLabel: string;
    image?: string;
    name: string;
    symbol?: string;
    edition?: string;
    collection?: NftCollection;
    compressed: boolean;
    /** Regular NFTs only: compressed ones carry no primary-sale flag. */
    primarySaleHappened?: boolean;
    mutable: boolean;
    creators: NftCreator[] | null;
};

// Undefined without a master edition: `getEditionInfo` returns the same empty result for that and for a failed RPC call.
export function getEditionSummary({ edition, masterEdition }: EditionInfo): string | undefined {
    if (!masterEdition) return undefined;
    const maxSupply = isSome(masterEdition.maxSupply) ? Number(masterEdition.maxSupply.value) : undefined;
    if (edition) {
        const number = Number(edition.edition);
        return maxSupply === undefined ? `Print ${number}, open edition` : `Print ${number} of ${maxSupply}`;
    }
    const printed = Number(masterEdition.supply);
    if (maxSupply === undefined) return `Master · ${printed} printed, open edition`;
    return maxSupply === 0 ? '1/1' : `Master · ${printed} of ${maxSupply} printed`;
}
