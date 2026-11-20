import { type Address, isAddress } from '@solana/kit';
import { define } from 'superstruct';

export const AddressFromString = /*#__PURE__*/ define<Address>('AddressFromString', value =>
    typeof value === 'string' && isAddress(value) ? true : 'Expected a base58-encoded Solana address',
);
