import { type Address, isAddress } from '@solana/kit';
import { define } from 'superstruct';

// Moved to the package's transitional web3.js layer alongside the schemas that consume it.
export { PublicKeyFromString } from '@explorer/parsers/compat';

// Kit-native counterpart: validates and brands a base58 string into a kit `Address` without
// constructing a heavy web3.js `PublicKey`. Prefer this for new code.
export const AddressFromString = define<Address>('AddressFromString', value =>
    typeof value === 'string' && isAddress(value) ? true : 'Expected a base58-encoded Solana address',
);
