import { KitAddress } from '@components/common/KitAddress';
import type { Address } from '@solana/kit';

export function InstructionAddress({ address }: { address: Address }) {
    return <KitAddress address={address} alignRight link />;
}
