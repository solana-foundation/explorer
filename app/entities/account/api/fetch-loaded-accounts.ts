import { getRpc } from '@entities/cluster/@x/account';
import { type Address, address, getAddressDecoder, getU32Decoder } from '@solana/kit';

import { toSafeUint } from '@/app/shared/lib/bigint-to-number';
import { fromBase64 } from '@/app/shared/lib/bytes';

const UPGRADEABLE_LOADER_ID = 'BPFLoaderUpgradeab1e11111111111111111111111';

// The runtime builds this sysvar per transaction instead of loading it, so it costs nothing.
const INSTRUCTIONS_SYSVAR_ID = 'Sysvar1nstructions1111111111111111111111111';

// A program account is a 4-byte state discriminant (2) followed by its program data address.
const PROGRAM_STATE = 2;
const PROGRAM_STATE_SLICE = { length: 36, offset: 0 };
const SIZE_ONLY_SLICE = { length: 0, offset: 0 };

// The most addresses `getMultipleAccounts` accepts in one call.
const BATCH_SIZE = 100;

export type LoadedAccounts = Readonly<{
    /** Accounts that exist, plus the program data behind any upgradeable program among them. */
    accountCount: number;
    dataSize: number;
}>;

/**
 * The accounts a transaction naming `addresses` loads, counted as Agave's `load_transaction_accounts`
 * does: the program data behind an upgradeable program is loaded with it, and counted once.
 * `undefined` when the node omits a size, since any total would then be wrong.
 */
export async function fetchLoadedAccounts(
    addresses: readonly string[],
    clusterUrl: string,
): Promise<LoadedAccounts | undefined> {
    const rpc = getRpc(clusterUrl);
    const listed = [...new Set(addresses)].filter(candidate => candidate !== INSTRUCTIONS_SYSVAR_ID);

    const infos = await getMultipleAccounts(
        rpc,
        listed.map(candidate => address(candidate)),
        PROGRAM_STATE_SLICE,
    );

    const listedSet = new Set(listed);
    const programDataAddresses = new Set<Address>();
    let accountCount = 0;
    let dataSize = 0;

    for (const info of infos) {
        if (info === null) continue;

        const size = toSafeUint(info.space);
        if (size === undefined) return undefined;
        accountCount += 1;
        dataSize += size;

        if (info.owner !== UPGRADEABLE_LOADER_ID) continue;

        const programData = readProgramDataAddress(fromBase64(info.data[0]));
        if (programData !== undefined && !listedSet.has(programData)) programDataAddresses.add(programData);
    }

    if (programDataAddresses.size === 0) return { accountCount, dataSize };

    const programDataInfos = await getMultipleAccounts(rpc, [...programDataAddresses], SIZE_ONLY_SLICE);

    for (const info of programDataInfos) {
        if (info === null) continue;

        const size = toSafeUint(info.space);
        if (size === undefined) return undefined;
        accountCount += 1;
        dataSize += size;
    }

    return { accountCount, dataSize };
}

// The runtime checks the state rather than the executable flag, so this does too.
function readProgramDataAddress(slice: Uint8Array): Address | undefined {
    if (slice.length !== PROGRAM_STATE_SLICE.length || getU32Decoder().decode(slice) !== PROGRAM_STATE) {
        return undefined;
    }
    return getAddressDecoder().decode(slice, 4);
}

async function getMultipleAccounts(
    rpc: ReturnType<typeof getRpc>,
    addresses: readonly Address[],
    dataSlice: { length: number; offset: number },
) {
    const batches = [];
    for (let start = 0; start < addresses.length; start += BATCH_SIZE) {
        batches.push(addresses.slice(start, start + BATCH_SIZE));
    }

    const responses = await Promise.all(
        batches.map(batch =>
            rpc.getMultipleAccounts(batch, { commitment: 'confirmed', dataSlice, encoding: 'base64' }).send(),
        ),
    );
    return responses.flatMap(({ value }) => value);
}
