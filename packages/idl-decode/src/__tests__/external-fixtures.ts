// IDLs from codama's own test suite (the sha-pinned `codama-fixtures` tarball, imported at their
// source revision, never copied) — same load-per-call convention as fixtures.ts: clones, so a
// mutating test cannot leak into the next. Kept apart from fixtures.ts so suites that never touch
// the tarball don't parse its JSONs.
import associatedTokenAccountIdl from 'codama-fixtures/packages/dynamic-client/test/programs/idls/associated-token-account-idl.json';
import blogIdl from 'codama-fixtures/packages/dynamic-client/test/programs/idls/blog-idl.json';
import circularAccountRefsIdl from 'codama-fixtures/packages/dynamic-client/test/programs/idls/circular-account-refs-idl.json';
import collectionTypesIdl from 'codama-fixtures/packages/dynamic-client/test/programs/idls/collection-types-idl.json';
import customResolversTestIdl from 'codama-fixtures/packages/dynamic-client/test/programs/idls/custom-resolvers-test-idl.json';
import exampleIdl from 'codama-fixtures/packages/dynamic-client/test/programs/idls/example-idl.json';
import mplTokenMetadataIdl from 'codama-fixtures/packages/dynamic-client/test/programs/idls/mpl-token-metadata-idl.json';
import pmpIdl from 'codama-fixtures/packages/dynamic-client/test/programs/idls/pmp-idl.json';
import sasIdl from 'codama-fixtures/packages/dynamic-client/test/programs/idls/sas-idl.json';
import systemProgramIdl from 'codama-fixtures/packages/dynamic-client/test/programs/idls/system-program-idl.json';
import token2022Idl from 'codama-fixtures/packages/dynamic-client/test/programs/idls/token-2022-idl.json';
import tokenIdl from 'codama-fixtures/packages/dynamic-client/test/programs/idls/token-idl.json';

import { isCodamaIdl } from '../detect';
import type { CodamaIdl } from '../types';

export type CodamaFixture = {
    /** A zero-argument instruction codama's dynamic client can build accounts-only; absent ⇔ the IDL declares no instruction discriminators (decoding can only miss). */
    instruction?: string;
    load: () => CodamaIdl;
};

// proven at load with the package's own detection; T lets a caller claim a narrower root type
function codamaRoot<T extends CodamaIdl = CodamaIdl>(idl: unknown): T {
    const clone = structuredClone(idl);
    if (!isCodamaIdl(clone)) throw new Error('fixture is not a codama root node');
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- the guard proves the standard; T is the caller's claim beyond it
    return clone as T;
}

export const codamaFixtures: Record<string, CodamaFixture> = {
    'associated-token-account': { instruction: 'create', load: () => codamaRoot(associatedTokenAccountIdl) },
    blog: { instruction: 'subscribe', load: () => codamaRoot(blogIdl) },
    'circular-account-refs': { load: () => codamaRoot(circularAccountRefsIdl) },
    'collection-types': { load: () => codamaRoot(collectionTypesIdl) },
    'custom-resolvers-test': { load: () => codamaRoot(customResolversTestIdl) },
    example: { instruction: 'noArguments', load: () => codamaRoot(exampleIdl) },
    'mpl-token-metadata': { instruction: 'puffMetadata', load: () => codamaRoot(mplTokenMetadataIdl) },
    pmp: { instruction: 'setImmutable', load: () => codamaRoot(pmpIdl) },
    sas: { instruction: 'emitEvent', load: () => codamaRoot(sasIdl) },
    'system-program': { instruction: 'upgradeNonceAccount', load: () => codamaRoot(systemProgramIdl) },
    token: { instruction: 'syncNative', load: () => codamaRoot(tokenIdl) },
    'token-2022': { instruction: 'syncNative', load: () => codamaRoot(token2022Idl) },
};
