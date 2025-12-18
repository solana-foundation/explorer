'use client';

import { getProxiedUri } from '@features/metadata';
import { isPmpSecurityTXT, useSecurityTxt } from '@features/security-txt';
import ProgramLogoPlaceholder from '@img/logos-solana/low-contrast-solana-logo.svg';
import { type UpgradeableLoaderAccountData } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { PROGRAM_INFO_BY_ID } from '@utils/programs';
import Image from 'next/image';
import React from 'react';
import { AlertCircle } from 'react-feather';

const IDENTICON_WIDTH = 64;

// The "self-reported" warning indicates that the securityTxt metadata (name, logo, etc.)
// is self-reported by the program author and may not be accurate. We only show this warning
// when the displayed data actually comes from program metadata, not from the explorer's
// trusted internal mapping (PROGRAM_INFO_BY_ID).
export function ProgramHeader({
    address,
    parsedData,
}: {
    address: string;
    parsedData?: UpgradeableLoaderAccountData | undefined;
}) {
    const securityTxt = useSecurityTxt(address, parsedData);
    const { cluster } = useCluster();
    const { programName, logo, version, selfReported } = ((): {
        programName: string;
        logo?: string;
        version?: string;
        selfReported?: boolean;
    } => {
        const programInfo = PROGRAM_INFO_BY_ID[address];
        const isTrustedProgram = programInfo && programInfo.deployments.includes(cluster);
        const trustedProgramName = isTrustedProgram ? programInfo.name : undefined;
        const namePlaceholder = 'Program Account';

        let programName = trustedProgramName ?? namePlaceholder;

        if (!securityTxt) {
            return {
                programName,
                selfReported: false,
            };
        }

        // Only show warning if we're actually using self-reported data
        const usingSelfReportedName = !trustedProgramName;

        // Handle empty name in security.txt
        programName = (trustedProgramName ?? securityTxt.name) || namePlaceholder;

        if (isPmpSecurityTXT(securityTxt)) {
            return {
                logo: getProxiedUri(securityTxt.logo),
                programName,
                selfReported: usingSelfReportedName,
                version: securityTxt.version,
            };
        }
        return {
            programName,
            selfReported: usingSelfReportedName,
        };
    })();

    const warningChunk = (() => {
        if (!selfReported) return null;
        const text =
            'Program name and icon are self-reported by the program authority. See program security tab for more details';
        return (
            <div className="e-ml-2 e-inline-flex e-items-center">
                <Tooltip>
                    <TooltipTrigger className="e-border-0 e-bg-transparent e-p-0">
                        <AlertCircle className="e-size-3 e-text-destructive" aria-label="Self-reported program" />
                    </TooltipTrigger>
                    {text && (
                        <TooltipContent>
                            <div className="e-min-w-36 e-max-w-64">{text}</div>
                        </TooltipContent>
                    )}
                </Tooltip>
            </div>
        );
    })();

    return (
        <div className="e-inline-flex e-items-center e-gap-2">
            <div>
                <div className="e-relative e-h-10 e-w-10 e-flex-shrink-0 e-overflow-hidden e-rounded sm:e-h-16 sm:e-w-16">
                    {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            alt="Program logo"
                            className="e-h-full e-w-full e-rounded e-border-4 e-border-current e-object-cover"
                            height={16}
                            src={logo}
                            width={16}
                        />
                    ) : (
                        <Image
                            src={ProgramLogoPlaceholder}
                            height={IDENTICON_WIDTH}
                            width={IDENTICON_WIDTH}
                            alt="Program logo placeholder"
                            className="e-h-full e-w-full e-rounded e-border e-border-gray-200 e-object-cover"
                        />
                    )}
                </div>
            </div>

            <div className="e-flex-1">
                <h6 className="header-pretitle">Program account</h6>
                <div className="e-inline-flex">
                    <h2 className="header-title">{programName}</h2>
                    {warningChunk}
                </div>
                {version && <div className="header-pretitle no-overflow-with-ellipsis">{version}</div>}
            </div>
        </div>
    );
}
