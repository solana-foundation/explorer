'use client';

import { type UpgradeableLoaderAccountData } from '@providers/accounts';
import Image from 'next/image';
import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';
import { getProxiedUri } from '@/app/features/metadata/utils';
import { isPmpSecurityTXT, useSecurityTxt } from '@/app/features/security-txt';
import ProgramLogoPlaceholder from '@/app/img/logos-solana/low-contrast-solana-logo.svg';

import { Badge } from '../ui/badge';

const IDENTICON_WIDTH = 64;

export function ProgramHeader({ address, parsedData }: { address: string; parsedData: UpgradeableLoaderAccountData }) {
    const securityTxt = useSecurityTxt(address, parsedData);

    const { programName, logo, version, unverified } = ((): {
        programName: string;
        logo?: string;
        version?: string;
        unverified?: boolean;
    } => {
        if (!securityTxt) {
            return {
                programName: 'Program Account',
                unverified: undefined,
            };
        }
        if (isPmpSecurityTXT(securityTxt)) {
            return {
                logo: getProxiedUri(securityTxt.logo),
                programName: securityTxt.name,
                unverified: true,
                version: securityTxt.version,
            };
        }
        return {
            programName: securityTxt.name,
            unverified: true,
        };
    })();

    const unverifiedChunk = (() => {
        if (!unverified) return null;
        if (unverified) {
            const text = 'Note that this is self-reported by the author of the program and might not be accurate';
            return (
                <div className="e-ml-2 e-inline-flex e-items-center">
                    <Tooltip>
                        <TooltipTrigger className="e-border-0 e-bg-transparent e-p-0">
                            <Badge variant="destructive">Unverified</Badge>
                        </TooltipTrigger>
                        {text && (
                            <TooltipContent>
                                <div className="e-min-w-36 e-max-w-64">{text}</div>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </div>
            );
        }
    })();

    return (
        <div className="e-inline-flex e-items-center e-gap-2">
            <div className="">
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
                        // eslint-disable-next-line @next/next/no-img-element
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
                    {unverifiedChunk}
                </div>
                {version && <div className="header-pretitle no-overflow-with-ellipsis">{version}</div>}
            </div>
        </div>
    );
}
