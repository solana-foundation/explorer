import Image from 'next/image';

import { EVerificationSource } from '../../lib/types';
import CoinGeckoLogo from './coingecko-logo.png';
import JupiterLogo from './jupiter-logo.png';
import RugCheckLogo from './rugcheck-logo.png';
import SolflareLogo from './solflare-logo.png';

const ICON_SIZE = 16;

const SOURCE_ICONS = {
    [EVerificationSource.CoinGecko]: CoinGeckoLogo,
    [EVerificationSource.Jupiter]: JupiterLogo,
    [EVerificationSource.RugCheck]: RugCheckLogo,
    [EVerificationSource.Solflare]: SolflareLogo,
};

export function SourceIcon({ source }: { source: EVerificationSource }) {
    const icon = SOURCE_ICONS[source];

    return <Image src={icon} alt={source} width={ICON_SIZE} height={ICON_SIZE} className="rounded-full" />;
}
