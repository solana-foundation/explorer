import { bases } from 'multiformats/basics';
import { CID } from 'multiformats/cid';

import { Logger } from '@/app/shared/lib/logger';

const IPFS_GATEWAY = 'https://ipfs.filebase.io/ipfs';

type GatewayResolution = { kind: 'gateway'; uri: string };
type IpfsResolution = GatewayResolution | { kind: 'malformed-cid' };

/**
 * Returns `undefined` for a URL that is not `ipfs://` and contains no CID. On `undefined`, a caller
 * must keep the original URI string instead of `url.href`, because `new URL` can rewrite the string.
 */
export function resolveIpfsUri(url: URL): IpfsResolution | undefined {
    if (url.protocol === IPFS_PROTOCOL) {
        const path = url.host + url.pathname;
        const cidPath = path.startsWith('ipfs/') ? path.slice('ipfs/'.length) : path;
        const resolution = toGateway(cidPath, url);
        if (resolution) return resolution;
        Logger.warn(`[ipfs] Cannot fetch a malformed CID: ${cidPath}`);
        return { kind: 'malformed-cid' };
    }
    const cidPath = gatewayCidPath(url);
    return cidPath === undefined ? undefined : toGateway(cidPath, url);
}

const IPFS_PROTOCOL = 'ipfs:';
const GATEWAY_PATH_PREFIX = '/ipfs/';
const SUBDOMAIN_NAMESPACE = 'ipfs';

function gatewayCidPath(url: URL): string | undefined {
    const [label, namespace] = url.hostname.split('.');
    if (namespace === SUBDOMAIN_NAMESPACE) return url.pathname === '/' ? label : label + url.pathname;
    if (url.pathname.startsWith(GATEWAY_PATH_PREFIX)) return url.pathname.slice(GATEWAY_PATH_PREFIX.length);
    return undefined;
}

function toGateway(cidPath: string, { search, hash }: URL): GatewayResolution | undefined {
    // Split the CID from any subpath (e.g. "QmXXX/image.png" → cid="QmXXX", subpath="/image.png")
    const firstSlash = cidPath.indexOf('/');
    const cid = firstSlash === -1 ? cidPath : cidPath.slice(0, firstSlash);
    const subpath = firstSlash === -1 ? '' : cidPath.slice(firstSlash);
    if (!verifyCID(cid)) return undefined;
    return { kind: 'gateway', uri: `${IPFS_GATEWAY}/${cid}${subpath}${search}${hash}` };
}

function verifyCID(cid: string): boolean {
    const base = Object.values(bases).find(({ prefix }) => prefix === cid[0]);
    try {
        CID.parse(cid, base);
        return true;
    } catch {
        return false;
    }
}
