/**
 * The v1 wire prefix: the version flag bit (0x80) with version number 1.
 * This byte identifies v1.
 * A legacy message opens with its signer count, which never sets the flag bit.
 * A v0 message opens with 0x80.
 */
const V1_MESSAGE_PREFIX = 0x81;

export function isV1MessageBytes(bytes: Uint8Array): boolean {
    return bytes.length > 0 && bytes[0] === V1_MESSAGE_PREFIX;
}
