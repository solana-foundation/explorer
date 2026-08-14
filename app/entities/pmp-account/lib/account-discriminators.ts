/**
 * The three PMP account layouts, as the byte at offset 0. Duplicated from the generated client's
 * `AccountDiscriminator` deliberately: this file imports NOTHING, so the account page's tab gate can classify an
 * account without pulling the client, pako, yaml and smol-toml onto `/address/*`.
 */
export const PMP_EMPTY_DISCRIMINATOR = 0;
export const PMP_BUFFER_DISCRIMINATOR = 1;
export const PMP_METADATA_DISCRIMINATOR = 2;

/**
 * Whether these raw account bytes are a PMP Metadata account, the one layout that carries its own decode config.
 * Ownership is NOT checked here - the caller compares `owner` against `PMP_ADDRESS`, and a byte check that quietly
 * assumed ownership would read as a full classification.
 */
export function isPmpMetadataAccountData(data: Uint8Array | undefined): boolean {
    return data?.[0] === PMP_METADATA_DISCRIMINATOR;
}
