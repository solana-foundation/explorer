/**
 * Search params as returned by Next.js (e.g. from page props or URLSearchParams).
 */
export type SearchParams = Record<string, string | string[] | undefined>;

/** Prefix that appears in param names when `&` was HTML-encoded as `&amp;` and the query string was split on `&`. */
const HTML_ENTITY_AMP_PREFIX = 'amp;';

/**
 * Normalizes search params so that HTML-entity-mangled keys are treated as their real names.
 *
 * ## Why this happens
 *
 * In HTML, a bare `&` in an attribute value is invalid—it must be written as `&amp;`.
 * When a URL like `?view=receipt&cluster=devnet` is embedded in HTML (e.g. in a link
 * or in metadata), it is often stored as `?view=receipt&amp;cluster=devnet`.
 *
 * When that URL is requested **without** decoding HTML entities first, the server
 * parses the query string by splitting on `&`. The segment `amp;cluster=devnet` is
 * then interpreted as a single param with key `amp;cluster` and value `devnet`. We
 * receive `{ view: 'receipt', 'amp;cluster': 'devnet' }` instead of
 * `{ view: 'receipt', cluster: 'devnet' }`.
 *
 * This can occur when:
 * - **Link unfurlers** (e.g. Slack) fetch URLs for previews from an HTML context and
 *   the client sends the HTML-encoded form.
 * - **Crawlers or bots** request URLs that appeared in HTML and do not decode `&amp;`
 *   back to `&` before sending the request.
 *
 * Query parsers do not
 * decode HTML entities, so we normalize these keys defensively.
 *
 * @param searchParams - Raw search params (e.g. from request or page props).
 * @returns A new object with normalized keys. For any key of the form `amp;foo`, the
 *   value is exposed under `foo`. If both `foo` and `amp;foo` exist, the real key
 *   `foo` wins. Other keys and array values are preserved as-is.
 */
export function normalizeSearchParams(searchParams: SearchParams): SearchParams {
    if (!searchParams || typeof searchParams !== 'object') {
        return {};
    }

    const out: SearchParams = {};

    for (const [key, value] of Object.entries(searchParams)) {
        if (key.startsWith(HTML_ENTITY_AMP_PREFIX)) {
            const realKey = key.slice(HTML_ENTITY_AMP_PREFIX.length);
            if (!(realKey in out)) {
                out[realKey] = value;
            }
        } else {
            out[key] = value;
        }
    }

    return out;
}
