import { KitAddress } from '@components/common/KitAddress';
import type { Address } from '@solana/kit';

export function InstructionAddress({ address, tokenLabel }: { address: Address; tokenLabel?: boolean }) {
    return <KitAddress address={address} alignRight link fetchTokenLabelInfo={tokenLabel} />;
}
