import { createEmitInstruction, unpack } from '@solana/spl-token-metadata';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import useSWRImmutable from 'swr/immutable';

export function useMetadataExtensionSimulation(
    address: string | undefined,
    programId: string | undefined,
    url: string
) {
    return useSWRImmutable(programId ? [address, programId, url] : null, async ([addr, programId, clusterUrl]) => {
        if (!addr) {
            return null;
        }

        const ix = createEmitInstruction({
            metadata: new PublicKey(addr),
            programId: new PublicKey(programId),
        });
        const tx = new Transaction().add(ix);

        // toly.sol
        tx.feePayer = new PublicKey('86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY');
        const connection = new Connection(clusterUrl);
        const result = await connection.simulateTransaction(tx);

        if (result.value.err) {
            console.log(result.value.logs);
            return null;
        }

        if (result.value.returnData) {
            return unpack(Buffer.from(result.value.returnData.data[0], 'base64'));
        }

        return null;
    });
}
