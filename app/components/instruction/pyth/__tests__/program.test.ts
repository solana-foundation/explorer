import { PythInstruction } from '@components/instruction/pyth/program';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

const PYTH_VERSION = 2;

const KEYS = [
    'FagABcRBhZH27JDtu6A1Jo9woXyoznP28QujLkxkN9Hj',
    '7txXZZD6Um59YoLMF7XUNimbMjsqsWhc7g2EniiTrmp1',
    'GgU1RSCbCTNfjPqBGnR7NBDZoLQwB7oEjnHqzGtcCLBH',
].map(key => ({ isSigner: false, isWritable: false, pubkey: new PublicKey(key) }));

const PUBLISHER = new PublicKey('4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi');

function u32(value: number): number[] {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    return Array.from(bytes);
}

function u64(value: bigint): number[] {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setBigUint64(0, value, true);
    return Array.from(bytes);
}

function i64(value: bigint): number[] {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setBigInt64(0, value, true);
    return Array.from(bytes);
}

/** A uint8 length-prefixed UTF-8 string, as the Pyth product attribute list encodes them. */
function lpString(value: string): number[] {
    const bytes = new TextEncoder().encode(value);
    return [bytes.length, ...bytes];
}

function instruction(type: number, ...payload: number[][]): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from([...u32(PYTH_VERSION), ...u32(type), ...payload.flat()]),
        keys: KEYS,
        programId: new PublicKey('FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH'),
    });
}

describe('PythInstruction', () => {
    it('should resolve the instruction type from the header', () => {
        expect(PythInstruction.decodeInstructionType(instruction(0))).toBe('InitMapping');
        expect(PythInstruction.decodeInstructionType(instruction(7, u32(1), u32(0), i64(1n), u64(1n), u64(1n)))).toBe(
            'UpdatePrice',
        );
    });

    it('should reject an unsupported Pyth version', () => {
        const ix = new TransactionInstruction({
            data: Buffer.from([...u32(1), ...u32(0)]),
            keys: KEYS,
            programId: new PublicKey('FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH'),
        });
        expect(() => PythInstruction.decodeInstructionType(ix)).toThrow('Unsupported Pyth version: 1');
    });

    it('should reject data whose instruction index does not match the decoder', () => {
        expect(() => PythInstruction.decodeInitMapping(instruction(1))).toThrow('instruction index mismatch 1 != 0');
    });

    it('should decode an "add publisher" instruction', () => {
        const ix = instruction(5, Array.from(PUBLISHER.toBytes()));
        expect(PythInstruction.decodeAddPublisher(ix).publisherPubkey.toBase58()).toBe(PUBLISHER.toBase58());
    });

    it('should decode an "add price" instruction with a negative exponent', () => {
        const ix = instruction(4, u32(0xfffffff7), u32(1));
        expect(PythInstruction.decodeAddPrice(ix)).toMatchObject({ exponent: -9, priceType: 1 });
    });

    it('should decode an "update price" instruction as numbers', () => {
        const ix = instruction(7, u32(1), u32(0), i64(-12345n), u64(678n), u64(170640000n));
        const params = PythInstruction.decodeUpdatePrice(ix);

        expect(params.price).toBe(-12345);
        expect(params.conf).toBe(678);
        expect(params.publishSlot).toBe(170640000);
    });

    it('should decode the trailing attribute list of an "update product" instruction', () => {
        const ix = instruction(3, lpString('symbol'), lpString('BTC/USD'), lpString('asset_type'), lpString('Crypto'));

        expect(Object.fromEntries(PythInstruction.decodeUpdateProduct(ix).attributes)).toEqual({
            asset_type: 'Crypto',
            symbol: 'BTC/USD',
        });
    });

    it('should decode a "set min publishers" instruction', () => {
        const ix = instruction(12, [3], [0, 0, 0]);
        expect(PythInstruction.decodeSetMinPublishers(ix).minPublishers).toBe(3);
    });
});
