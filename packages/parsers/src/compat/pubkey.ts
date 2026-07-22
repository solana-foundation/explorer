import { PublicKey } from '@solana/web3.js';
import { coerce, instance, string } from 'superstruct';

// Coerces the RPC's base58 pubkey strings into web3.js PublicKey instances — the shape the app's
// cards still consume. Kit-native consumers should validate plain address strings instead.
export const PublicKeyFromString = coerce(instance(PublicKey), string(), value => new PublicKey(value));
