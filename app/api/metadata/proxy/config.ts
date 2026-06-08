// Configuration for the metadata proxy route. Note: the Next.js route segment
// config (`dynamic`, `maxDuration`) stays in route.ts — Next only reads those
// as literal exports of the route module, not via re-export.

export const USER_AGENT = process.env.NEXT_PUBLIC_METADATA_USER_AGENT ?? 'Solana Explorer';

// 4 MB default: just under Vercel's ~4.5 MB buffered-response cap (a thin
// ~0.5 MB margin), so our cap stays the binding constraint while fitting more
// images. Oversize fetches degrade to the ProxiedImage "view original"
// fallback. Tune from the success-path size stats logged in fetch-resource.ts.
export const MAX_SIZE = process.env.NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE
    ? Number(process.env.NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE)
    : 4_000_000;

export const TIMEOUT = process.env.NEXT_PUBLIC_METADATA_TIMEOUT
    ? Number(process.env.NEXT_PUBLIC_METADATA_TIMEOUT)
    : 10_000;

// Prevent proxied content (e.g. SVG with embedded scripts) from executing
// anything if the proxy URL is opened directly as a top-level document.
export const SECURITY_HEADERS = {
    'Content-Security-Policy':
        "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
};

const BROWSER_MAX_AGE = 86_400; // 1 day

// Cache successful (2xx) responses in the viewer's own browser for up to a day
// so repeat views skip the round-trip. The proxied content is effectively
// immutable (content-addressed Arweave/IPFS, static CDN assets), so a day-long
// browser cache is safe; a rare in-place overwrite of a mutable URL is still
// picked up once the window lapses (no `immutable`). Browser-only by design: no
// `Vercel-CDN-Cache-Control`, so responses are not cached at the Vercel edge —
// every cold or cross-client view re-invokes the function. Set on success ONLY
// (error responses must not be cached), and the upstream's own Cache-Control is
// intentionally not forwarded (it's frequently no-store/no-cache/private).
export const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${BROWSER_MAX_AGE}`,
};

const ERROR_MAX_AGE = 30; // 30 seconds

// Error responses are cached briefly in the viewer's own browser only. This is
// what makes ProxiedImage's failure-reason probe free: the `<img>` element can't
// read an HTTP status, so on a load failure the component re-`fetch`es the same
// URL to learn why — and because the failed `<img>` request populated the cache,
// that probe is served from cache instead of re-hitting the proxy (no upstream
// re-download for an oversize 413). `private` keeps the verdict out of shared and
// edge caches (no `Vercel-CDN-Cache-Control`); the short TTL lets a transient
// 5xx clear quickly while a stable 413/404/415 stays cheap to re-read.
export const ERROR_CACHE_HEADERS = {
    'Cache-Control': `private, max-age=${ERROR_MAX_AGE}`,
};
