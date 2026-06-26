import {
    CloseInfo,
    DeployWithMaxDataLenInfo,
    ExtendProgramInfo,
    InitializeBufferInfo,
    SetAuthorityCheckedInfo,
    SetAuthorityInfo,
    UpgradeInfo,
    WriteInfo,
} from '@components/instruction/bpf-upgradeable-loader/types';
import { type ParsedInstruction, PublicKey } from '@solana/web3.js';
import { create } from 'superstruct';

import type { KitInstruction } from '@/app/shared/lib/web3js-compat';
import type { ParserProgramLabel } from '@/app/utils/programs';

/** On-chain id of the upgradeable BPF loader; also the RPC `parsed.program` discriminator. */
export const BPF_UPGRADEABLE_LOADER_PROGRAM_ID = 'BPFLoaderUpgradeab1e11111111111111111111111';
export const BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL = 'bpf-upgradeable-loader' satisfies ParserProgramLabel;

/**
 * Canonical shape of a parsed Upgradeable BPF Loader instruction. Both the
 * inspector (raw bytes path) and the tx page (RPC pre-parsed path) normalise to
 * this shape, which is exactly what `BpfUpgradeableLoaderDetailsCard` renders.
 */
export type BpfUpgradeableLoaderParsed =
    | { type: 'initializeBuffer'; info: InitializeBufferInfo }
    | { type: 'write'; info: WriteInfo }
    | { type: 'deployWithMaxDataLen'; info: DeployWithMaxDataLenInfo }
    | { type: 'upgrade'; info: UpgradeInfo }
    | { type: 'setAuthority'; info: SetAuthorityInfo }
    | { type: 'setAuthorityChecked'; info: SetAuthorityCheckedInfo }
    | { type: 'close'; info: CloseInfo }
    | { type: 'extendProgram'; info: ExtendProgramInfo };

// Bincode u32 discriminants of `UpgradeableLoaderInstruction` (agave loader-v3).
const enum Discriminant {
    InitializeBuffer = 0,
    Write = 1,
    DeployWithMaxDataLen = 2,
    Upgrade = 3,
    SetAuthority = 4,
    Close = 5,
    ExtendProgram = 6,
    SetAuthorityChecked = 7,
}

/**
 * Decode a raw Upgradeable BPF Loader instruction (inspector path). The RPC does
 * not pre-parse instructions in the inspector, so we read the bincode-encoded
 * data and map account positions to the same named fields the RPC emits, keeping
 * the inspector and tx-page renderings identical. Account orderings mirror
 * agave's `parse_bpf_loader.rs`.
 */
export function parseBpfUpgradeableLoaderInstruction(ix: KitInstruction): BpfUpgradeableLoaderParsed | undefined {
    try {
        const data = ix.data;
        if (data.length < 4) return undefined;
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        const discriminant = view.getUint32(0, true);

        // Account at position `i`, or undefined when the instruction supplied fewer keys.
        const acc = (i: number): PublicKey | undefined => {
            const meta = ix.accounts[i];
            return meta ? new PublicKey(meta.address) : undefined;
        };
        // Required account: throws (→ caught → undefined parse) when missing.
        const req = (i: number): PublicKey => {
            const meta = ix.accounts[i];
            if (!meta) throw new Error(`missing account at index ${i}`);
            return new PublicKey(meta.address);
        };

        switch (discriminant) {
            case Discriminant.InitializeBuffer:
                return { info: { account: req(0), authority: req(1) }, type: 'initializeBuffer' };
            case Discriminant.Write: {
                const offset = view.getUint32(4, true);
                const bytesLen = Number(view.getBigUint64(8, true));
                const bytes = data.slice(16, 16 + bytesLen);
                return {
                    info: { account: req(0), authority: req(1), bytes: Buffer.from(bytes).toString('base64'), offset },
                    type: 'write',
                };
            }
            case Discriminant.DeployWithMaxDataLen:
                return {
                    info: {
                        authority: req(7),
                        bufferAccount: req(3),
                        clockSysvar: req(5),
                        maxDataLen: Number(view.getBigUint64(4, true)),
                        payerAccount: req(0),
                        programAccount: req(2),
                        programDataAccount: req(1),
                        rentSysvar: req(4),
                        systemProgram: req(6),
                    },
                    type: 'deployWithMaxDataLen',
                };
            case Discriminant.Upgrade:
                return {
                    info: {
                        authority: req(6),
                        bufferAccount: req(2),
                        clockSysvar: req(5),
                        programAccount: req(1),
                        programDataAccount: req(0),
                        rentSysvar: req(4),
                        spillAccount: req(3),
                    },
                    type: 'upgrade',
                };
            case Discriminant.SetAuthority:
                return { info: { account: req(0), authority: req(1), newAuthority: acc(2) }, type: 'setAuthority' };
            case Discriminant.SetAuthorityChecked:
                return {
                    info: { account: req(0), authority: req(1), newAuthority: req(2) },
                    type: 'setAuthorityChecked',
                };
            case Discriminant.Close:
                return {
                    info: { account: req(0), authority: req(2), programAccount: acc(3), recipient: req(1) },
                    type: 'close',
                };
            case Discriminant.ExtendProgram:
                return {
                    info: {
                        additionalBytes: view.getUint32(4, true),
                        // ExtendProgramInfo types payerAccount as nullable; the card renders `null` as "None".
                        // eslint-disable-next-line unicorn/no-null -- matches the RPC-parsed shape's nullable field
                        payerAccount: acc(3) ?? null,
                        programAccount: req(1),
                        programDataAccount: req(0),
                        systemProgram: acc(2),
                    },
                    type: 'extendProgram',
                };
            default:
                return undefined;
        }
    } catch {
        return undefined;
    }
}

/**
 * Normalise an RPC-pre-parsed ParsedInstruction (tx-page path) into the same
 * canonical shape, reusing the superstruct validators so RPC's base58 strings
 * are coerced into PublicKey instances. Returns undefined for unrecognised types
 * so the dispatcher passes RPC's value through unchanged.
 */
export function parseBpfUpgradeableLoaderRpcInstruction(ix: ParsedInstruction): BpfUpgradeableLoaderParsed | undefined {
    if (ix.program !== BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL) return undefined;
    try {
        switch (ix.parsed.type) {
            case 'initializeBuffer':
                return { info: create(ix.parsed.info, InitializeBufferInfo), type: 'initializeBuffer' };
            case 'write':
                return { info: create(ix.parsed.info, WriteInfo), type: 'write' };
            case 'deployWithMaxDataLen':
                return { info: create(ix.parsed.info, DeployWithMaxDataLenInfo), type: 'deployWithMaxDataLen' };
            case 'upgrade':
                return { info: create(ix.parsed.info, UpgradeInfo), type: 'upgrade' };
            case 'setAuthority':
                return { info: create(ix.parsed.info, SetAuthorityInfo), type: 'setAuthority' };
            case 'setAuthorityChecked':
                return { info: create(ix.parsed.info, SetAuthorityCheckedInfo), type: 'setAuthorityChecked' };
            case 'close':
                return { info: create(ix.parsed.info, CloseInfo), type: 'close' };
            case 'extendProgram':
                return { info: create(ix.parsed.info, ExtendProgramInfo), type: 'extendProgram' };
            default:
                return undefined;
        }
    } catch {
        return undefined;
    }
}
