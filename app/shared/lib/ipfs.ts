import { CID } from 'multiformats/cid';

import { Logger } from '@/app/shared/lib/logger';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs';

/** The scheme an on-chain metadata URI uses to name IPFS content. */
export const IPFS_PROTOCOL = 'ipfs:';

/**
 * Maps an `ipfs://` URL to its HTTP gateway URL, so callers that only speak
 * http(s) can read it — an `<img src>`, or the metadata proxy's `fetchResource`,
 * which rejects every other scheme.
 *
 * Returns '' for a malformed CID: that URI names nothing fetchable, and callers
 * treat the empty string as "no resource" rather than passing it on.
 *
 * Only the `ipfs:` branch lives here. Each caller keeps its own decision about
 * other schemes, and must keep passing the original URI string rather than
 * `url.href`, which `new URL` may have normalised.
 */
export function resolveIpfsUri(url: URL): string {
    // eslint-disable-next-line no-restricted-syntax -- Strips redundant "ipfs/" prefix from the path for a clean gateway URL.
    const fullPath = (url.host + url.pathname).replace(/^ipfs\//, '');
    // Split the CID from any subpath (e.g. "QmXXX/image.png" → cid="QmXXX", subpath="/image.png")
    const firstSlash = fullPath.indexOf('/');
    const cid = firstSlash === -1 ? fullPath : fullPath.slice(0, firstSlash);
    const subpath = firstSlash === -1 ? '' : fullPath.slice(firstSlash);
    if (!verifyCID(cid)) {
        Logger.warn(`[ipfs] Cannot fetch a malformed CID: ${cid}`);
        return '';
    }
    return `${IPFS_GATEWAY}/${cid}${subpath}${url.search}`;
}

function verifyCID(cid: string): boolean {
    try {
        CID.parse(cid);
        return true;
    } catch {
        return false;
    }
}
