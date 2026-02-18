import Image from 'next/image';
import { HelpCircle } from 'react-feather';

import NotVerifiedIcon from '../icons/not-verified.svg';
import VerifiedIcon from '../icons/verified.svg';
import PartiallyVerifiedIcon from '../icons/partially-verified.svg';
import { VerificationSource } from '../lib/types';
import { EVerificationSource } from '../model/use-verification-sources';
import { RISK_MAX_LEVEL_GOOD, RISK_MAX_LEVEL_WARNING } from '@/app/utils/rugcheck';

const ICON_SIZE = 16;

export function VerificationIcon({
    verifiedSources,
    verificationFoundSources,
    isLoading,
}: {
    isLoading?: boolean;
    verifiedSources: VerificationSource[];
    verificationFoundSources: VerificationSource[];
}): JSX.Element {
    const rugCheckSource = verificationFoundSources.find(source => source.name === EVerificationSource.RugCheck);
    const rugCheckScore = rugCheckSource?.score;
    const hasRugCheckScore = rugCheckScore !== undefined;

    if (isLoading) {
        return <HelpCircle className="e-text-gray-500" size={ICON_SIZE} />;
    }

    const isFullyVerified =
        verifiedSources.length === verificationFoundSources.length &&
        verificationFoundSources.length !== 0 &&
        (!hasRugCheckScore || rugCheckScore <= RISK_MAX_LEVEL_GOOD);

    if (isFullyVerified) {
        return <Image src={VerifiedIcon} alt="Verified" width={ICON_SIZE} />;
    }

    const isPartiallyVerified =
        hasRugCheckScore && rugCheckScore > RISK_MAX_LEVEL_GOOD && rugCheckScore <= RISK_MAX_LEVEL_WARNING;

    if (isPartiallyVerified) {
        return <Image src={PartiallyVerifiedIcon} alt="Partially Verified" width={ICON_SIZE} />;
    }

    const isNotVerified =
        verifiedSources.length < verificationFoundSources.length ||
        (hasRugCheckScore && rugCheckScore > RISK_MAX_LEVEL_WARNING);

    if (isNotVerified) {
        return <Image src={NotVerifiedIcon} alt="Not Verified" width={ICON_SIZE} />;
    }

    return <HelpCircle className="e-text-gray-500" size={ICON_SIZE} />;
}
