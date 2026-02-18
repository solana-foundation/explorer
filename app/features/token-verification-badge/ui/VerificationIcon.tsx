import Image from 'next/image';
import { HelpCircle } from 'react-feather';

import NotVerifiedIcon from '../icons/not-verified.svg';
import VerifiedIcon from '../icons/verified.svg';
import { VerificationSource } from '../lib/types';

const ICON_SIZE = 16;

export function VerificationIcon({
    verifiedSources,
    verificationFoundSources,
}: {
    verifiedSources: VerificationSource[];
    verificationFoundSources: VerificationSource[];
}): JSX.Element {
    if (verifiedSources.length === verificationFoundSources.length && verificationFoundSources.length !== 0) {
        return <Image src={VerifiedIcon} alt="Verified" width={ICON_SIZE} />;
    }

    if (verifiedSources.length < verificationFoundSources.length) {
        return <Image src={NotVerifiedIcon} alt="Not Verified" width={ICON_SIZE} />;
    }

    return <HelpCircle className="e-text-gray-500" size={ICON_SIZE} />;
}
