import { sha256 } from '@noble/hashes/sha256';
import {
    type Address,
    getAddressDecoder,
    getAddressEncoder,
    getProgramDerivedAddress,
    getStructDecoder,
    type ReadonlyUint8Array,
} from '@solana/kit';

import { SNS_PARENT_NAME_ACCOUNT, SPL_NAME_SERVICE_PROGRAM_ADDRESS } from './constants';

const HASH_PREFIX = 'SPL Name Service';

/** A name account derives from three seeds; absent class/parent are seeded as 32 zero bytes. */
const EMPTY_SEED = new Uint8Array(32);

const addressEncoder = getAddressEncoder();

const SNS_TLD = '.sns';

export function formatSnsName(label: string): string {
    return label + SNS_TLD;
}

export function parseSnsLabel(domain: string): string | undefined {
    return domain.endsWith(SNS_TLD) ? domain.slice(0, -SNS_TLD.length) : undefined;
}

export function getSnsNameAccount(label: string): Promise<Address> {
    return getNameAccountKey(getHashedName(label), { nameParent: SNS_PARENT_NAME_ACCOUNT });
}

export function getHashedName(label: string): Uint8Array {
    return sha256(new TextEncoder().encode(HASH_PREFIX + label));
}

/** Derive the registry account address holding a hashed name's record. */
export async function getNameAccountKey(
    hashedName: Uint8Array,
    { nameClass, nameParent }: { nameClass?: Address; nameParent?: Address } = {},
): Promise<Address> {
    const [nameAccountKey] = await getProgramDerivedAddress({
        programAddress: SPL_NAME_SERVICE_PROGRAM_ADDRESS,
        seeds: [
            hashedName,
            nameClass ? addressEncoder.encode(nameClass) : EMPTY_SEED,
            nameParent ? addressEncoder.encode(nameParent) : EMPTY_SEED,
        ],
    });
    return nameAccountKey;
}

/**
 * The 96-byte registry header. Accounts carry free-form data past the header, which the
 * fixed-size decoder ignores.
 */
const nameRegistryHeaderDecoder = getStructDecoder([
    ['parentName', getAddressDecoder()],
    ['owner', getAddressDecoder()],
    ['class', getAddressDecoder()],
]);

export const NAME_REGISTRY_HEADER_SIZE = nameRegistryHeaderDecoder.fixedSize;

/** Read the owner out of a registry account. Undefined when the data is too short to hold a header. */
export function decodeNameRegistryOwner(data: ReadonlyUint8Array | Uint8Array): Address | undefined {
    if (data.length < NAME_REGISTRY_HEADER_SIZE) return undefined;
    return nameRegistryHeaderDecoder.decode(data.subarray(0, NAME_REGISTRY_HEADER_SIZE)).owner;
}
