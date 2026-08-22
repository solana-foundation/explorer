import { sha256 } from '@noble/hashes/sha256';
import {
    type Address,
    getAddressDecoder,
    getAddressEncoder,
    getProgramDerivedAddress,
    getStructDecoder,
    type ReadonlyUint8Array,
} from '@solana/kit';

import { NAME_PROGRAM_ADDRESS } from '../api/constants';

const HASH_PREFIX = 'SPL Name Service';

/** A name account derives from three seeds; absent class/parent are seeded as 32 zero bytes. */
const EMPTY_SEED = new Uint8Array(32);

const addressEncoder = getAddressEncoder();

/**
 * Hash a bare domain label (no `.sol` suffix) the way SPL Name Service does: SHA-256 over the
 * UTF-8 bytes of the prefix concatenated with the name.
 */
export function getHashedName(name: string): Uint8Array {
    return sha256(new TextEncoder().encode(HASH_PREFIX + name));
}

/** Derive the registry account address holding a hashed name's record. */
export async function getNameAccountKey(
    hashedName: Uint8Array,
    { nameClass, nameParent }: { nameClass?: Address; nameParent?: Address } = {},
): Promise<Address> {
    const [nameAccountKey] = await getProgramDerivedAddress({
        programAddress: NAME_PROGRAM_ADDRESS,
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
