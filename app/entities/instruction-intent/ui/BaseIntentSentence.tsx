import { Address } from '@components/common/Address';
import { abbreviateAddress } from '@components/shared/address';
import { useCluster } from '@entities/cluster/@x/instruction-intent';
import type { Address as KitAddress } from '@solana/kit';
import { displayAddress } from '@utils/tx';

import type { IntentSentencePart } from '../lib/intent';

export function BaseIntentSentence({ parts }: { parts: readonly IntentSentencePart[] }) {
    return (
        <div className="m-0 break-words text-sm leading-normal text-white" data-testid="intent-sentence">
            {/* Index key: one address can appear twice in a sentence */}
            {parts.map((part, index) =>
                part.kind === 'address' ? (
                    <SentenceAddress key={index} address={part.address} />
                ) : (
                    <span key={index}>{part.text}</span>
                ),
            )}
        </div>
    );
}

function SentenceAddress({ address }: { address: KitAddress }) {
    const { cluster } = useCluster();
    // `Address` shows a known label by itself, so only a bare address gets the short form
    const overrideText =
        displayAddress(address, cluster) === address ? abbreviateAddress(address, { head: 5, tail: 5 }) : undefined;

    return (
        // `Address` lays itself out as a full-width row, and the inline block keeps it in the sentence flow
        <span className="inline-block max-w-full align-bottom">
            <Address address={address} link noNicknameEditing overrideText={overrideText} />
        </span>
    );
}
