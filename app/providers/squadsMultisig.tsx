import type { ProgramIdls } from '@entities/idl';
import { IdlStandard } from '@explorer/idl-decode';
import { decodeAccountWithIdl } from '@explorer/idl-decode/codama';
import { Connection, PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';

type SourcedIdl = NonNullable<ProgramIdls['idls']>[number];

export const SQUADS_V3_ADDRESS = 'SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu';
export const SQUADS_V4_ADDRESS = 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf';

export type SquadsMultisigVersion = 'v3' | 'v4';
export type SquadsMultisigMapInfo = {
    isSquad: boolean;
    version: SquadsMultisigVersion;
    multisig: string;
};
export type MinimalMultisigInfo =
    | { version: 'v4'; multisig: { threshold: number; members: Array<{ key: PublicKey }> } }
    | { version: 'v3'; multisig: { threshold: number; keys: Array<PublicKey> } };

const SQUADS_MAP_URL = 'https://4fnetmviidiqkjzenwxe66vgoa0soerr.lambda-url.us-east-1.on.aws/isSquadV2';

// Squads Multisig reverse map info is only available on mainnet
export function useSquadsMultisigLookup(programAuthority: PublicKey | null | undefined, cluster: Cluster) {
    return useSWRImmutable<SquadsMultisigMapInfo | null>(
        ['squadsReverseMap', programAuthority?.toString(), cluster],
        async ([_prefix, programIdString, cluster]: [string, string | undefined, Cluster]) => {
            if (cluster !== Cluster.MainnetBeta || !programIdString) {
                return null;
            }
            try {
                const response = await fetch(`${SQUADS_MAP_URL}/${programIdString}`);
                const data = await response.json();
                return 'error' in data ? null : (data as SquadsMultisigMapInfo);
            } catch (error) {
                Logger.error(error);
                return null;
            }
        },
        { suspense: true },
    );
}

// Squads v3/v4 ship legacy (pre-0.30) Anchor IDLs, so they convert to codama and cannot build an anchor
// `Program` — decode the account bytes through the codama engine instead. The decoded account exposes the
// same fields the on-chain IDL declares: v4 `Multisig` → `members[].key` + `threshold`; v3 `Ms` →
// `keys[]` + `threshold`.
type DecodedSquadsAccount = {
    keys?: readonly string[];
    members?: ReadonlyArray<{ key: string }>;
    threshold: number;
};

export function useSquadsMultisig(
    sourcedIdl: SourcedIdl | null | undefined,
    multisig: string | undefined,
    cluster: Cluster,
    version: SquadsMultisigVersion | undefined,
    url: string,
) {
    return useSWRImmutable<MinimalMultisigInfo | null>(
        sourcedIdl && multisig && version && cluster === Cluster.MainnetBeta
            ? ['squadsMultisig', multisig, version, url]
            : null,
        async () => {
            if (!sourcedIdl || !multisig || !version) return null;
            const account = await new Connection(url).getAccountInfo(new PublicKey(multisig), 'confirmed');
            if (!account) return null;

            const decoded = decodeAccountWithIdl(sourcedIdl.idl, account.data);
            if (decoded.kind !== IdlStandard.Codama) {
                if (decoded.kind === 'unknown' && decoded.errors.length) Logger.error(decoded.errors[0]);
                return null;
            }

            // decodeAccountWithIdl types the payload as unknown; the fields come from the Squads IDL
            const data = decoded.decoded.data as DecodedSquadsAccount;
            const threshold = Number(data.threshold);
            if (version === 'v4') {
                return {
                    multisig: { members: (data.members ?? []).map(m => ({ key: new PublicKey(m.key) })), threshold },
                    version,
                };
            }
            return { multisig: { keys: (data.keys ?? []).map(key => new PublicKey(key)), threshold }, version };
        },
    );
}
