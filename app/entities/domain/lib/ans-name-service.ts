import { sha256 } from '@noble/hashes/sha256';
import {
    type Address,
    address,
    type Base58EncodedBytes,
    fixDecoderSize,
    getAddressDecoder,
    getAddressEncoder,
    getBooleanDecoder,
    getBytesDecoder,
    getProgramDerivedAddress,
    getStructDecoder,
    getU32Decoder,
    getU64Decoder,
    getUtf8Decoder,
    type ReadonlyUint8Array,
} from '@solana/kit';

/**
 * ANS (AllDomains Name Service) primitives, vendored from the MIT-licensed
 * https://github.com/onsol-labs/tld-parser-kit (whose published package pins @solana/kit ^5).
 * Derivations are locked against @onsol/tldparser 0.6.5 vectors in the colocated spec.
 */

export const ANS_PROGRAM_ADDRESS = address('ALTNSZ46uaAUU7XUV6awvdorLGqAsPwa9shm7h4uP2FK');
export const TLD_HOUSE_PROGRAM_ADDRESS = address('TLDHkysf5pCnKsVA4gXpNvmy7psXLPEu4LAdDJthT9S');

const HASH_PREFIX = 'ALT Name Service';
const TLD_HOUSE_PREFIX = 'tld_house';
const ORIGIN_TLD = 'ANS';

/** A name account derives from three seeds; absent class/parent are seeded as 32 zero bytes. */
const EMPTY_SEED = new Uint8Array(32);

const addressEncoder = getAddressEncoder();
const addressDecoder = getAddressDecoder();
const utf8Decoder = getUtf8Decoder();

/**
 * Hash a name the way ANS does: SHA-256 over the UTF-8 bytes of the prefix concatenated with
 * the name. Note the prefix differs from SPL Name Service's ("ALT" vs "SPL").
 */
export function getAnsHashedName(name: string): Uint8Array {
    return sha256(new TextEncoder().encode(HASH_PREFIX + name));
}

/** Derive the ANS registry account address holding a hashed name's record. */
export async function getAnsNameAccountKey(
    hashedName: Uint8Array,
    { nameClass, nameParent }: { nameClass?: Address; nameParent?: Address } = {},
): Promise<Address> {
    const [nameAccountKey] = await getProgramDerivedAddress({
        programAddress: ANS_PROGRAM_ADDRESS,
        seeds: [
            hashedName,
            nameClass ? addressEncoder.encode(nameClass) : EMPTY_SEED,
            nameParent ? addressEncoder.encode(nameParent) : EMPTY_SEED,
        ],
    });
    return nameAccountKey;
}

/** The name account every TLD is registered under — a constant of the deployed program. */
async function getOriginNameAccountKey(): Promise<Address> {
    return getAnsNameAccountKey(getAnsHashedName(ORIGIN_TLD));
}

/** Derive the TLD house account for a TLD (e.g. `.bonk`), which doubles as the reverse-lookup name class. */
export async function getTldHouseKey(tld: string): Promise<Address> {
    const [tldHouse] = await getProgramDerivedAddress({
        programAddress: TLD_HOUSE_PROGRAM_ADDRESS,
        seeds: [new TextEncoder().encode(TLD_HOUSE_PREFIX), new TextEncoder().encode(tld.toLowerCase())],
    });
    return tldHouse;
}

/**
 * Derive the name account for a domain (`alice.bonk`) or subdomain (`sub.alice.bonk`).
 * Registries hash lowercase names, so input is normalized here. Subdomain labels are seeded
 * with a leading NUL byte, matching on-chain registration. Undefined for label counts ANS
 * cannot register (one label, or more than three).
 */
export async function getAnsDomainAddress(domainTld: string): Promise<Address | undefined> {
    const parts = domainTld.toLowerCase().split('.');
    if (parts.length < 2 || parts.length > 3) return undefined;

    if (parts.length === 3) {
        const [subDomain, domain, tld] = parts;
        const parentKey = await deriveNameAccount(`.${tld}`);
        const domainKey = await deriveNameAccount(domain, parentKey);
        return deriveNameAccount(`\0${subDomain}`, domainKey);
    }

    const parentKey = await deriveNameAccount(`.${parts[1]}`);
    return deriveNameAccount(parts[0], parentKey);
}

async function deriveNameAccount(name: string, parent?: Address): Promise<Address> {
    const nameParent = parent ?? (await getOriginNameAccountKey());
    return getAnsNameAccountKey(getAnsHashedName(name), { nameParent });
}

/**
 * The fixed 200-byte name record header. Registrations write free-form payload past it —
 * reverse-lookup records store the human-readable domain name there.
 */
export const ANS_NAME_RECORD_HEADER_SIZE = 200;

const ansNameRecordHeaderDecoder = getStructDecoder([
    ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
    ['parentName', getAddressDecoder()],
    ['owner', getAddressDecoder()],
    ['nclass', getAddressDecoder()],
    ['expiresAt', getU64Decoder()],
    ['createdAt', getU64Decoder()],
    ['nonTransferable', getBooleanDecoder()],
]);

/** Expired domains stay resolvable for this long past their expiry, matching the on-chain grace. */
const GRACE_PERIOD_MS = 45 * 24 * 60 * 60 * 1000;

export type AnsNameRecord = {
    parentName: Address;
    /** Undefined when the record has expired past its grace period. */
    owner: Address | undefined;
    isValid: boolean;
    /** Payload past the header, up to the first NUL byte; undefined when the record is invalid or empty. */
    name: string | undefined;
};

/** Decode a name record account. Undefined when the data is too short to hold a header. */
export function decodeAnsNameRecord(data: ReadonlyUint8Array | Uint8Array): AnsNameRecord | undefined {
    if (data.length < ANS_NAME_RECORD_HEADER_SIZE) return undefined;

    const header = ansNameRecordHeaderDecoder.decode(data);
    const isValid = header.expiresAt === 0n ? true : Number(header.expiresAt) * 1000 + GRACE_PERIOD_MS > Date.now();

    let name: string | undefined;
    if (isValid) {
        const payload = data.subarray(ANS_NAME_RECORD_HEADER_SIZE);
        name = readNulTerminatedUtf8(payload);
    }

    return {
        isValid,
        name,
        owner: isValid ? header.owner : undefined,
        parentName: header.parentName,
    };
}

export type TldInfo = { tld: string; parentAccount: Address };

/** The base58 form of the TLD house account discriminator, usable as a memcmp filter at offset 0. */
export const TLD_HOUSE_DISCRIMINATOR = 'iQgos3SdaVE' as Base58EncodedBytes;

/**
 * TLD house layout: an 8-byte discriminator and two 32-byte fields precede the parent name
 * account at offset 72, followed by the u32-length-prefixed TLD name at offset 104.
 */
const TLD_HOUSE_PARENT_OFFSET = 8 + 32 + 32;
const TLD_HOUSE_NAME_OFFSET = TLD_HOUSE_PARENT_OFFSET + 32;
const u32Decoder = getU32Decoder();

/**
 * Decode a TLD house account into its TLD name (e.g. `.bonk`) and the parent name account its
 * domains register under. Undefined when the data is too short to hold the declared fields.
 */
export function decodeTldHouse(data: ReadonlyUint8Array | Uint8Array): TldInfo | undefined {
    if (data.length < TLD_HOUSE_NAME_OFFSET + 4) return undefined;

    const nameLength = u32Decoder.decode(data, TLD_HOUSE_NAME_OFFSET);
    const nameEnd = TLD_HOUSE_NAME_OFFSET + 4 + nameLength;
    if (data.length < nameEnd) return undefined;

    const tld = readNulTerminatedUtf8(data.subarray(TLD_HOUSE_NAME_OFFSET + 4, nameEnd));
    if (!tld) return undefined;

    return {
        parentAccount: addressDecoder.decode(data, TLD_HOUSE_PARENT_OFFSET),
        tld,
    };
}

function readNulTerminatedUtf8(bytes: ReadonlyUint8Array | Uint8Array): string | undefined {
    const nulIndex = bytes.indexOf(0);
    const content = nulIndex === -1 ? bytes : bytes.subarray(0, nulIndex);
    return content.length > 0 ? utf8Decoder.decode(content) : undefined;
}
