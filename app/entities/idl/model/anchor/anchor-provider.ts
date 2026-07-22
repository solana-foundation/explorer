import { AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Connection, Keypair } from '@solana/web3.js';

/** A throwaway read-only AnchorProvider (random-keypair wallet) for decoding with an Anchor `Program`. */
export function getProvider(url: string): AnchorProvider {
    return new AnchorProvider(new Connection(url), new NodeWallet(Keypair.generate()), {});
}
