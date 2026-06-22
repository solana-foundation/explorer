import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { ExternalLink } from 'react-feather';

import { InfoTooltip } from '@/app/components/common/InfoTooltip';

import { NEODYME_SECURITY_TXT_DOC_LINK, PMP_SECURITY_TXT_DOC_LINK } from '../lib/constants';
import { useSecurityTxt } from '../model/useSecurityTxt';

export function ProgramSecurityTXTLabel({ programPubkey }: { programPubkey: PublicKey }) {
    const { securityTxt } = useSecurityTxt(programPubkey.toBase58());

    return (
        <InfoTooltip text="Security.txt helps security researchers to contact developers if they find security bugs.">
            {/* Link to the Program Metadata doc when that's the source, else the Neodyme doc. */}
            <Link
                rel="noopener noreferrer"
                target="_blank"
                href={securityTxt?.type === 'pmp' ? PMP_SECURITY_TXT_DOC_LINK : NEODYME_SECURITY_TXT_DOC_LINK}
            >
                <span className="text-dk-white">Security.txt</span>
                <ExternalLink className="ml-1.5 align-text-top" size={13} />
            </Link>
        </InfoTooltip>
    );
}
