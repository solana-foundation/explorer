// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
'use client';

// TODO(fsd-layering): this shared-layer component imports from `features/*`, which breaks the
// FSD dependency rule (features → entities → shared; shared must not import upward). Move
// `ProxiedImage` and the security-txt helpers down into `shared`/`entities`, re-point
// consumers, then drop these two imports.
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/shared/ui/tooltip';
import { buildProgramName, useProgramIdls } from '@entities/idl';
import { ProxiedImage } from '@features/metadata';
import { useSecurityTxt } from '@features/security-txt';
import { type UpgradeableLoaderAccountData } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { PROGRAM_INFO_BY_ID } from '@utils/programs';
import React from 'react';
import { AlertCircle } from 'react-feather';

// The "self-reported" warning indicates that the securityTxt metadata (name, logo, etc.)
// is self-reported by the program author and may not be accurate. We only show this warning
// when the displayed data actually comes from program metadata, not from the explorer's
// trusted internal mapping (PROGRAM_INFO_BY_ID).
export function ProgramHeader({
    address,
}: {
    address: string;
    // Accepted for caller compatibility; security.txt now resolves via `useSecurityTxt(address)`.
    parsedData?: UpgradeableLoaderAccountData | undefined;
}) {
    const { securityTxt } = useSecurityTxt(address);
    const { url, cluster } = useCluster();
    const { anchorIdl, programMetadataIdl } = useProgramIdls(address, url, cluster);
    // Codama / modern Anchor names only; legacy Anchor top-level name is intentionally not shown.
    const idlProgramName = buildProgramName([programMetadataIdl, anchorIdl]);
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

        // Self-reported name fallbacks, in order: security.txt, then the program's own IDL.
        // `||` (not `??`) so an empty security.txt name falls through to the IDL name.
        const selfReportedName = securityTxt?.fields.name || idlProgramName;
        const programName = trustedProgramName ?? selfReportedName ?? namePlaceholder;
        // Warn only when the displayed name is self-reported (no trusted-registry entry).
        const selfReported = !trustedProgramName && Boolean(selfReportedName);

        if (securityTxt?.type === 'pmp') {
            return {
                logo: securityTxt.fields.logo,
                programName,
                selfReported,
                version: securityTxt.fields.version,
            };
        }
        return {
            programName,
            selfReported,
        };
    })();

    const warningChunk = (() => {
        if (!selfReported) return null;
        const text =
            'Program name and icon are self-reported by the program authority. See program security tab for more details';
        return (
            <div className="ml-2 inline-flex items-center">
                <Tooltip>
                    <TooltipTrigger className="border-0 bg-transparent p-0">
                        <AlertCircle className="size-3 text-destructive" aria-label="Self-reported program" />
                    </TooltipTrigger>
                    {text && (
                        <TooltipContent>
                            <div className="min-w-36 max-w-64">{text}</div>
                        </TooltipContent>
                    )}
                </Tooltip>
            </div>
        );
    })();

    return (
        <div className="inline-flex items-center gap-2">
            <div>
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded sm:h-16 sm:w-16">
                    <ProxiedImage
                        alt="Program logo"
                        className="h-full w-full rounded border-4 border-solid border-dk-black-dark object-cover"
                        uri={logo}
                    />
                </div>
            </div>

            <div className="flex-1">
                <h6 className="uppercase tracking-[0.08em] text-dk-gray-700">Program account</h6>
                <div className="inline-flex">
                    <h2 className="mb-0">{programName}</h2>
                    {warningChunk}
                </div>
                {version && (
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap uppercase tracking-[0.08em] text-dk-gray-700">
                        {version}
                    </div>
                )}
            </div>
        </div>
    );
}
