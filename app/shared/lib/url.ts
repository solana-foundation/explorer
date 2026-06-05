/** Schemes safe to place in a browser `href`/`src` without executing code. */
export const SAFE_EXTERNAL_PROTOCOLS = ['http:', 'https:'];

/** Parse `value` as an absolute URL, returning `undefined` instead of throwing. */
export function parseUrl(value: string | undefined | null): URL | undefined {
    if (!value) return undefined;
    try {
        return new URL(value);
    } catch {
        return undefined;
    }
}

/**
 * Returns `value` when it is an absolute http(s) URL safe to place in an `href`,
 * otherwise `undefined`.
 *
 * External URLs in the explorer come from attacker-controlled on-chain metadata
 * (token/NFT `external_url`, `website`, security.txt fields, …). Any other
 * scheme — `javascript:`, `data:`, `vbscript:`, `file:` — must be rejected
 * before it reaches the DOM, since `rel`/`target` do not stop a `javascript:`
 * URL from executing in this origin when clicked. `new URL` normalises away
 * obfuscation (embedded tabs/newlines, case) the same way the browser does, so
 * the protocol check here matches what a click would actually run.
 */
export function getSafeExternalHref(value: string | undefined | null): string | undefined {
    const url = parseUrl(value);
    if (!url || !SAFE_EXTERNAL_PROTOCOLS.includes(url.protocol)) return undefined;
    return value as string;
}
