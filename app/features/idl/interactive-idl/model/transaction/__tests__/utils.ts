import { gen } from '@__fixtures__/gen';
import { Transaction, TransactionInstruction } from '@solana/web3.js';

export function makeTx(): Transaction {
    const tx = new Transaction();
    tx.feePayer = gen.publicKey(1);
    tx.add(
        new TransactionInstruction({
            data: Buffer.from([]),
            keys: [],
            programId: gen.publicKey(0),
        }),
    );
    return tx;
}
