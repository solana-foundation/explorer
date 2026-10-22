import { createInstructionParserDispatcher, isParsedInstruction } from '@entities/instruction-parser';
import {
    AccountRole,
    address,
    getBase58Decoder,
    getBase58Encoder,
    getU32Encoder,
    type ReadonlyUint8Array,
} from '@solana/kit';
import { type ParsedInstruction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import agaveParseVote from '../__fixtures__/agave-parse-vote.json';
import mainnetTowerSync from '../__fixtures__/mainnet-tower-sync.json';
import { voteInstructionParser } from '../vote-client';
import {
    parseVoteKitInstruction,
    parseVoteRpcInstruction,
    VOTE_PARSER_LABEL,
    VOTE_PROGRAM_ADDRESS,
} from '../vote-parser';

type Fixture = { accounts: string[]; data: string; parsed: { info: object; type: string } };

const dispatcher = createInstructionParserDispatcher([voteInstructionParser]);

function parse({ accounts, data }: Pick<Fixture, 'accounts' | 'data'>) {
    return parseVoteKitInstruction({
        accounts: accounts.map(account => ({ address: address(account), role: AccountRole.WRITABLE })),
        data: new Uint8Array(getBase58Encoder().encode(data)),
        programAddress: VOTE_PROGRAM_ADDRESS,
    });
}

function rpcInstruction(parsed: object): ParsedInstruction {
    return { parsed, program: VOTE_PARSER_LABEL, programId: new PublicKey(VOTE_PROGRAM_ADDRESS) };
}

// superstruct's `create` writes coerced values back into its input, so each call gets its own copy.
function fromRpc(parsed: object) {
    return parseVoteRpcInstruction(rpcInstruction(structuredClone(parsed)));
}

function rawInstruction({ accounts, data }: Pick<Fixture, 'accounts' | 'data'>) {
    return new TransactionInstruction({
        data: Buffer.from(getBase58Encoder().encode(data)),
        keys: accounts.map(account => ({ isSigner: false, isWritable: true, pubkey: new PublicKey(account) })),
        programId: new PublicKey(VOTE_PROGRAM_ADDRESS),
    });
}

// Each case is one `VoteInstruction` variant serialised with wincode and run through agave's
// `transaction-status` `parse_vote` (anza-xyz/agave@15d135df3c, solana-vote-interface 7.2.0), so
// `parsed` is the exact jsonParsed payload the RPC returns for `data` and `accounts`.
const agaveCases: (Fixture & { name: string })[] = agaveParseVote;

describe('parseVoteKitInstruction', () => {
    it('should cover every instruction type the RPC emits', () => {
        expect(new Set(agaveCases.map(({ parsed }) => parsed.type)).size).toBe(20);
    });

    it.each(agaveCases.map(fixture => [fixture.name, fixture] as const))(
        'should decode %s bytes into the RPC jsonParsed shape',
        (_, fixture) => {
            const decoded = parse(fixture);
            expect(decoded).toEqual(fixture.parsed);
            expect(decoded).toStrictEqual(fromRpc(fixture.parsed));
        },
    );

    it('should decode a mainnet TowerSync into the RPC jsonParsed payload of the same transaction', () => {
        const decoded = parse(mainnetTowerSync);
        expect(decoded).toEqual(mainnetTowerSync.parsed);
        expect(decoded).toStrictEqual(fromRpc(mainnetTowerSync.parsed));
    });

    it('should return undefined when fewer accounts than the instruction requires are passed', () => {
        const { accounts, data } = agaveCase('tower-sync');
        expect(parse({ accounts: accounts.slice(0, 1), data })).toBeUndefined();
    });

    it('should return undefined for an unknown discriminator', () => {
        const data = base58(getU32Encoder().encode(20));
        expect(parse({ accounts: mainnetTowerSync.accounts, data })).toBeUndefined();
    });

    it('should return undefined for truncated data', () => {
        const { accounts, data } = mainnetTowerSync;
        const bytes = getBase58Encoder().encode(data).slice(0, 40);
        expect(parse({ accounts, data: base58(bytes) })).toBeUndefined();
    });

    it('should reject an option tag other than 0 or 1', () => {
        const { accounts, data } = agaveCase('vote-no-timestamp');
        const bytes = new Uint8Array(getBase58Encoder().encode(data));
        bytes[bytes.length - 1] = 2;
        expect(parse({ accounts, data: base58(bytes) })).toBeUndefined();
    });

    it('should reject a non-canonical varint lockout offset', () => {
        // TowerSync with a u64::MAX root and one lockout whose offset 1 is padded to two bytes (0x81 0x00).
        const bytes = new Uint8Array([
            ...getU32Encoder().encode(14),
            ...new Uint8Array(8).fill(0xff),
            1,
            0x81,
            0x00,
            1,
            ...new Uint8Array(32),
            0,
            ...new Uint8Array(32),
        ]);
        expect(parse({ accounts: mainnetTowerSync.accounts, data: base58(bytes) })).toBeUndefined();
    });
});

describe('parseVoteRpcInstruction', () => {
    beforeEach(() => {
        vi.spyOn(Logger, 'error').mockImplementation(() => {});
    });

    it.each(agaveCases.map(fixture => [fixture.name, fixture] as const))(
        'should accept the RPC jsonParsed payload for %s',
        (_, fixture) => {
            expect(fromRpc(fixture.parsed)).toEqual(fixture.parsed);
        },
    );

    it('should return undefined for another program', () => {
        expect(
            parseVoteRpcInstruction({ ...rpcInstruction(structuredClone(mainnetTowerSync.parsed)), program: 'system' }),
        ).toBeUndefined();
    });

    it('should return undefined for a type the slice does not model', () => {
        expect(parseVoteRpcInstruction(rpcInstruction({ info: {}, type: 'futureVote' }))).toBeUndefined();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should log and return undefined when the RPC payload fails validation', () => {
        const { parsed } = mainnetTowerSync;
        expect(
            parseVoteRpcInstruction(rpcInstruction({ ...parsed, info: { ...parsed.info, voteAccount: 'nope' } })),
        ).toBeUndefined();
        expect(Logger.error).toHaveBeenCalledOnce();
    });
});

describe('voteInstructionParser', () => {
    it('should render the same ParsedInstruction from bytes and from RPC jsonParsed', () => {
        const fromBytes = dispatcher.fromTransactionInstruction(rawInstruction(mainnetTowerSync));
        const fromJsonParsed = dispatcher.fromParsedInstruction(
            rpcInstruction(structuredClone(mainnetTowerSync.parsed)),
        );

        expect(isParsedInstruction(fromBytes)).toBe(true);
        expect(fromBytes).toStrictEqual(fromJsonParsed);
    });

    it('should mark undecodable bytes as an unparsed vote instruction', () => {
        const result = dispatcher.fromTransactionInstruction(rawInstruction({ accounts: [], data: '' }));
        expect(result).toMatchObject({ programLabel: VOTE_PARSER_LABEL, unknown: true });
    });
});

function agaveCase(name: string) {
    const fixture = agaveCases.find(entry => entry.name === name);
    if (!fixture) throw new Error(`Missing agave fixture ${name}`);
    return fixture;
}

function base58(bytes: ReadonlyUint8Array) {
    return getBase58Decoder().decode(bytes);
}
