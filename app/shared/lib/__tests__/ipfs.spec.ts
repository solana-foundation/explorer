import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { resolveIpfsUri } from '../ipfs';

const GATEWAY = 'https://ipfs.filebase.io/ipfs';
const CID_V0 = 'QmWATWQ7fVPP2EFGu71UkfnqhYXDYH566qy47CnJDgvs8u';
const CID_V1 = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3ek5bfx73d7h4x7bgd35y2nuq';
const CID_V1_BASE32_UPPER = CID_V1.toUpperCase();
const CID_V1_BASE16 = 'f01701220c3c4733ec8affd06cf9e9ff50ffc6bcd2ec8ae84b7fec7f3f2ff0987bee34da4';

describe('resolveIpfsUri', () => {
    it.each([
        [`ipfs://${CID_V0}`, `${GATEWAY}/${CID_V0}`],
        [`ipfs://ipfs/${CID_V0}`, `${GATEWAY}/${CID_V0}`],
        [`ipfs://${CID_V1}/metadata/0.json?v=2`, `${GATEWAY}/${CID_V1}/metadata/0.json?v=2`],
        [`ipfs://${CID_V1}/sprite.svg#token`, `${GATEWAY}/${CID_V1}/sprite.svg#token`],
        [`ipfs://${CID_V1_BASE32_UPPER}`, `${GATEWAY}/${CID_V1_BASE32_UPPER}`],
    ])('should map %s to the gateway', (uri, expected) => {
        expect(resolve(uri)).toEqual({ kind: 'gateway', uri: expected });
    });

    it.each([
        'ipfs.io',
        'gateway.ipfs.io',
        'dweb.link',
        'gateway.pinata.cloud',
        'example.mypinata.cloud',
        'example.com',
    ])('should map an /ipfs/ URL on %s to the gateway', host => {
        expect(resolve(`https://${host}/ipfs/${CID_V0}/image.png?filename=a.png`)).toEqual({
            kind: 'gateway',
            uri: `${GATEWAY}/${CID_V0}/image.png?filename=a.png`,
        });
    });

    it.each([
        [`http://ipfs.io/ipfs/${CID_V1}`, `${GATEWAY}/${CID_V1}`],
        [`https://IPFS.IO/ipfs/${CID_V1}`, `${GATEWAY}/${CID_V1}`],
        [`https://ipfs.io/ipfs/${CID_V1_BASE16}`, `${GATEWAY}/${CID_V1_BASE16}`],
        [`https://ipfs.io/ipfs/${CID_V0}/sprite.svg#token`, `${GATEWAY}/${CID_V0}/sprite.svg#token`],
        [`${GATEWAY}/${CID_V1}`, `${GATEWAY}/${CID_V1}`],
    ])('should map the /ipfs/ URL %s to the gateway', (uri, expected) => {
        expect(resolve(uri)).toEqual({ kind: 'gateway', uri: expected });
    });

    it.each([
        [`https://${CID_V1}.ipfs.dweb.link/`, `${GATEWAY}/${CID_V1}`],
        [`https://${CID_V1}.ipfs.nftstorage.link/image.png?x=1`, `${GATEWAY}/${CID_V1}/image.png?x=1`],
        [`https://${CID_V1_BASE32_UPPER}.IPFS.W3S.LINK`, `${GATEWAY}/${CID_V1}`],
        [`https://${CID_V1}.ipfs.dweb.link/ipfs/image.png`, `${GATEWAY}/${CID_V1}/ipfs/image.png`],
        [`https://${CID_V1}.ipfs.dweb.link/ipfs/${CID_V0}`, `${GATEWAY}/${CID_V1}/ipfs/${CID_V0}`],
    ])('should map the subdomain URL %s to the gateway', (uri, expected) => {
        expect(resolve(uri)).toEqual({ kind: 'gateway', uri: expected });
    });

    it.each([
        'https://example.com/logo.png',
        'https://ipfs.io/',
        'https://ipfs.io/ipns/example.eth',
        'https://ipfs.io/ipfs/',
        'https://ipfs.io/ipfs/not-a-valid-cid',
        'https://example.com/ipfs/report.pdf',
        'https://gateway.ipfs.io/',
        `https://${CID_V1}.ipns.dweb.link/`,
    ])('should return undefined for %s', uri => {
        expect(resolve(uri)).toBeUndefined();
    });

    it.each(['ipfs://not-a-valid-cid', 'ipfs://ipfs/'])('should return a malformed-CID result for %s', uri => {
        expect(resolve(uri)).toEqual({ kind: 'malformed-cid' });
    });

    describe('warning', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should warn with the malformed CID of an ipfs:// URI', () => {
            resolve('ipfs://not-a-valid-cid');
            expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('not-a-valid-cid'));
        });

        it('should not warn for an /ipfs/ URL without a CID', () => {
            resolve('https://example.com/ipfs/report.pdf');
            expect(Logger.warn).not.toHaveBeenCalled();
        });
    });
});

function resolve(uri: string) {
    return resolveIpfsUri(new URL(uri));
}
