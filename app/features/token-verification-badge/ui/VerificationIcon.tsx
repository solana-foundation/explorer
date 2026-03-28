import { HelpCircle } from 'react-feather';

import { VerificationSource } from '../lib/types';

const ICON_SIZE = 16;

export function VerificationIcon({
    verificationFoundSources,
    isLoading,
}: {
    isLoading?: boolean;
    verificationFoundSources: VerificationSource[];
}): React.ReactElement | null {
    if (isLoading) {
        return <HelpCircle className="e-text-gray-500" size={ICON_SIZE} />;
    }
    if (verificationFoundSources.length) {
        return null;
    }

    return <HelpCircle className="e-text-gray-500" size={ICON_SIZE} />;
}
