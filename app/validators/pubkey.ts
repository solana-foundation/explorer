import { type Address, isAddress } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { coerce, define, instance, string } from 'superstruct';

export const PublicKeyFromString = coerce(instance(PublicKey), string(), value => new PublicKey(value));

// Kit-native counterpart: validates and brands a base58 string into a kit `Address` without
// constructing a heavy web3.js `PublicKey`. Prefer this for new code.
export const AddressFromString = define<Address>('AddressFromString', value =>
    typeof value === 'string' && isAddress(value) ? true : 'Expected a base58-encoded Solana address',
);
