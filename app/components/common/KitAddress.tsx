import { type Address } from '@solana/kit';
import { type ComponentProps } from 'react';

import { toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';

import { Address as AddressDisplay } from './Address';

// Kit-flavoured wrapper around the shared <Address> renderer. The renderer still requires a
// web3.js PublicKey, so this is where the kit `Address` → `PublicKey` conversion happens —
// one place, so every render site can stay kit-native.
type KitAddressProps = Omit<ComponentProps<typeof AddressDisplay>, 'pubkey'> & { address: Address };

export function KitAddress({ address, ...rest }: KitAddressProps) {
    return <AddressDisplay pubkey={toLegacyPublicKey(address)} {...rest} />;
}
