// Configuration for the metadata proxy route. Note: the Next.js route segment
// config (`dynamic`, `maxDuration`) stays in route.ts — Next only reads those
// as literal exports of the route module, not via re-export.

export const USER_AGENT = process.env.NEXT_PUBLIC_METADATA_USER_AGENT ?? 'Solana Explorer';

// 3 MB default: well under Vercel's ~4.5 MB buffered-response cap. Oversize
// fetches degrade to the ProxiedImage "view original" fallback. Tune from the
// success-path size stats logged in fetch-resource.ts.
export const MAX_SIZE = process.env.NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE
    ? Number(process.env.NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE)
    : 3_000_000;

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

const BROWSER_MAX_AGE = 300; // 5 min
const EDGE_MAX_AGE = 86_400; // 1 day
const EDGE_SWR = 604_800; // 7 days

// Proxied metadata/images are effectively immutable (content-addressed Arweave/
// IPFS or static CDN assets), so cache 2xx responses hard at the Vercel edge to
// keep repeat views off this function and the upstream. The browser stays
// modest (max-age) while the edge does the heavy lifting via a long s-maxage +
// stale-while-revalidate. Set on success ONLY — error responses must not be
// cached, and the upstream's own Cache-Control is intentionally not forwarded
// (it's often no-store/no-cache, which would disqualify the response entirely).
export const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${BROWSER_MAX_AGE}`,
    'Vercel-CDN-Cache-Control': `public, s-maxage=${EDGE_MAX_AGE}, stale-while-revalidate=${EDGE_SWR}`,
};
