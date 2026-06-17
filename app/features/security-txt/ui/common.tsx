import classNames from 'classnames';
import { ExternalLink } from 'react-feather';

import { Badge } from '@/app/components/shared/ui/badge';
import { BaseTable } from '@/app/shared/ui/Table';

import type { SecurityTxtVersion } from './types';
import { isValidLink, parseCodeValue } from './utils';

export function CodeCell({ value, alignRight = true }: { value: string; alignRight: boolean }) {
    return (
        <BaseTable.Cell>
            <RenderCode value={value} alignRight={alignRight} />
        </BaseTable.Cell>
    );
}

export function SecurityTxtVersionBadge({
    version,
    className,
}: React.HTMLAttributes<unknown> & { version: SecurityTxtVersion }) {
    return (
        <Badge ui="dashkit" variant="info" className={className} data-testid="security-txt-version-badge">
            <SecurityTxtVersionBadgeTitle version={version} />
        </Badge>
    );
}

export function SecurityTxtVersionBadgeTitle({ version }: { version: SecurityTxtVersion }) {
    if (version === 'neodyme') {
        return <>Neodyme</>;
    }
    if (version === 'pmp') {
        return <>Program Metadata</>;
    }

    return null;
}

export function ContactInfo({ type, information }: { type: string; information: string }) {
    switch (type.toLowerCase()) {
        case 'discord':
            return <>Discord: {information}</>;
        case 'email':
            return (
                <a rel="noopener noreferrer" target="_blank" href={`mailto:${information}`}>
                    {information}
                    <ExternalLink className="ml-1.5 align-text-top" size={13} />
                </a>
            );
        case 'telegram':
            return (
                <a rel="noopener noreferrer" target="_blank" href={`https://t.me/${information}`}>
                    Telegram: {information}
                    <ExternalLink className="ml-1.5 align-text-top" size={13} />
                </a>
            );
        case 'twitter':
            return (
                <a rel="noopener noreferrer" target="_blank" href={`https://twitter.com/${information}`}>
                    Twitter {information}
                    <ExternalLink className="ml-1.5 align-text-top" size={13} />
                </a>
            );
        case 'link':
            if (isValidLink(information)) {
                return (
                    <a rel="noopener noreferrer" target="_blank" href={`${information}`}>
                        {information}
                        <ExternalLink className="ml-1.5 align-text-top" size={13} />
                    </a>
                );
            }
            return <>{information}</>;
        case 'other':
        default:
            return (
                <>
                    {type}: {information}
                </>
            );
    }
}

export function RenderExternalLink({ url }: { url: string }) {
    return (
        <span className="font-mono">
            <a rel="noopener noreferrer" target="_blank" href={url}>
                {url}
                <ExternalLink className="ml-1.5 align-text-top" size={13} />
            </a>
        </span>
    );
}

export function ExternalLinkCell({ url }: { url: string }) {
    return (
        <BaseTable.Cell className="text-right">
            <RenderExternalLink url={url} />
        </BaseTable.Cell>
    );
}

export function StringCell({ value }: { value: string }) {
    return <BaseTable.Cell className="text-right font-mono">{value}</BaseTable.Cell>;
}

export function RenderCode({ value, alignRight = true }: { value: any; alignRight?: boolean }) {
    return (
        <div className="flex items-end">
            <pre className={classNames('max-w-[500px] overflow-x-auto', { 'lg:ml-auto': alignRight })}>
                {parseCodeValue(value)}
            </pre>
        </div>
    );
}
