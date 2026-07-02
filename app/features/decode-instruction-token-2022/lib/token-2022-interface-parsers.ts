import {
    type AccountMeta,
    addDecoderSizePrefix,
    getAddressDecoder,
    getBooleanDecoder,
    getOptionDecoder,
    getStructDecoder,
    getU32Decoder,
    getU64Decoder,
    getUtf8Decoder,
} from '@solana/kit';
import { getTokenMetadataFieldDecoder } from '@solana-program/token-2022';

import { getDiscriminatorBytesDecoder } from '@/app/shared/lib/get-discriminator-bytes-decoder';
import type { KitInstruction } from '@/app/shared/lib/web3js-compat';

/**
 * Corrected parsers for the SPL Token Metadata / Token Group *interface*
 * instructions in Token-2022.
 *
 * Codama generates these instructions with an unbounded `getBytesDecoder()` for
 * their 8-byte discriminator (see {@link getDiscriminatorBytesDecoder}). As the
 * first struct field it swallows the whole buffer, so every field after it
 * decodes from an empty slice and throws — the upstream `parse*Instruction`
 * helpers are unusable for these eight instructions. Each parser below mirrors
 * its upstream counterpart (same account order, same field decoders) but bounds
 * the discriminator so the remaining fields decode correctly.
 *
 * `InitializeTokenGroupMember` is intentionally absent: its data is the
 * discriminator alone, so the greedy decoder has nothing left to starve and the
 * upstream parser works as-is.
 *
 * Remove this module once the codegen bug is fixed upstream (still present in
 * `@solana-program/token-2022@0.12.0`).
 */

const lengthPrefixedString = () => addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder());
const optionalAddress = () =>
    // eslint-disable-next-line unicorn/no-null -- @solana/kit uses `prefix: null` to mean "no length prefix"
    getOptionDecoder(getAddressDecoder(), { noneValue: 'zeroes', prefix: null });

/** Map an instruction's positional accounts onto the given names, in order. */
function namedAccounts<const K extends readonly string[]>(
    ix: KitInstruction,
    names: K,
): Record<K[number], AccountMeta> {
    if (ix.accounts.length < names.length) {
        throw new Error(`Expected at least ${names.length} accounts, got ${ix.accounts.length}`);
    }
    const named = {} as Record<K[number], AccountMeta>;
    names.forEach((name, index) => {
        named[name as K[number]] = ix.accounts[index];
    });
    return named;
}

export function parseInitializeTokenMetadataInstruction(ix: KitInstruction) {
    const data = getStructDecoder([
        ['discriminator', getDiscriminatorBytesDecoder()],
        ['name', lengthPrefixedString()],
        ['symbol', lengthPrefixedString()],
        ['uri', lengthPrefixedString()],
    ]).decode(ix.data);
    return { accounts: namedAccounts(ix, ['metadata', 'updateAuthority', 'mint', 'mintAuthority']), data };
}

export function parseUpdateTokenMetadataFieldInstruction(ix: KitInstruction) {
    const data = getStructDecoder([
        ['discriminator', getDiscriminatorBytesDecoder()],
        ['field', getTokenMetadataFieldDecoder()],
        ['value', lengthPrefixedString()],
    ]).decode(ix.data);
    return { accounts: namedAccounts(ix, ['metadata', 'updateAuthority']), data };
}

export function parseRemoveTokenMetadataKeyInstruction(ix: KitInstruction) {
    const data = getStructDecoder([
        ['discriminator', getDiscriminatorBytesDecoder()],
        ['idempotent', getBooleanDecoder()],
        ['key', lengthPrefixedString()],
    ]).decode(ix.data);
    return { accounts: namedAccounts(ix, ['metadata', 'updateAuthority']), data };
}

export function parseEmitTokenMetadataInstruction(ix: KitInstruction) {
    const data = getStructDecoder([
        ['discriminator', getDiscriminatorBytesDecoder()],
        ['start', getOptionDecoder(getU64Decoder())],
        ['end', getOptionDecoder(getU64Decoder())],
    ]).decode(ix.data);
    return { accounts: namedAccounts(ix, ['metadata']), data };
}

export function parseUpdateTokenMetadataUpdateAuthorityInstruction(ix: KitInstruction) {
    const data = getStructDecoder([
        ['discriminator', getDiscriminatorBytesDecoder()],
        ['newUpdateAuthority', optionalAddress()],
    ]).decode(ix.data);
    return { accounts: namedAccounts(ix, ['metadata', 'updateAuthority']), data };
}

export function parseInitializeTokenGroupInstruction(ix: KitInstruction) {
    const data = getStructDecoder([
        ['discriminator', getDiscriminatorBytesDecoder()],
        ['updateAuthority', optionalAddress()],
        ['maxSize', getU64Decoder()],
    ]).decode(ix.data);
    return { accounts: namedAccounts(ix, ['group', 'mint', 'mintAuthority']), data };
}

export function parseUpdateTokenGroupMaxSizeInstruction(ix: KitInstruction) {
    const data = getStructDecoder([
        ['discriminator', getDiscriminatorBytesDecoder()],
        ['maxSize', getU64Decoder()],
    ]).decode(ix.data);
    return { accounts: namedAccounts(ix, ['group', 'updateAuthority']), data };
}

export function parseUpdateTokenGroupUpdateAuthorityInstruction(ix: KitInstruction) {
    const data = getStructDecoder([
        ['discriminator', getDiscriminatorBytesDecoder()],
        ['newUpdateAuthority', optionalAddress()],
    ]).decode(ix.data);
    return { accounts: namedAccounts(ix, ['group', 'updateAuthority']), data };
}
