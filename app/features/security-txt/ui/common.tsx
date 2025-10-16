import classNames from 'classnames';
import { ExternalLink } from 'react-feather';

import type { SecurityTxtVersion } from './types';
import { isValidLink, parseCodeValue } from './utils';

export function CodeCell({ value, alignRight = true }: { value: string; alignRight: boolean }) {
    return (
        <td className={classNames({ 'text-lg-end': alignRight })}>
            <RenderCode value={value} />
        </td>
    );
}

export function SecurityTxtVersionBadge({
    version,
    className,
}: React.HTMLAttributes<unknown> & { version: SecurityTxtVersion }) {
    return (
        <span className={classNames(['badge bg-info-soft', className])} data-testid="security-txt-version-badge">
            <SecurityTxtVersionBadgeTitle version={version} />
        </span>
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
                    <ExternalLink className="align-text-top ms-2" size={13} />
                </a>
            );
        case 'telegram':
            return (
                <a rel="noopener noreferrer" target="_blank" href={`https://t.me/${information}`}>
                    Telegram: {information}
                    <ExternalLink className="align-text-top ms-2" size={13} />
                </a>
            );
        case 'twitter':
            return (
                <a rel="noopener noreferrer" target="_blank" href={`https://twitter.com/${information}`}>
                    Twitter {information}
                    <ExternalLink className="align-text-top ms-2" size={13} />
                </a>
            );
        case 'link':
            if (isValidLink(information)) {
                return (
                    <a rel="noopener noreferrer" target="_blank" href={`${information}`}>
                        {information}
                        <ExternalLink className="align-text-top ms-2" size={13} />
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
        <span className="font-monospace">
            <a rel="noopener noreferrer" target="_blank" href={url}>
                {url}
                <ExternalLink className="align-text-top ms-2" size={13} />
            </a>
        </span>
    );
}

export function ExternalLinkCell({ url }: { url: string }) {
    return (
        <td className="text-lg-end">
            <RenderExternalLink url={url} />
        </td>
    );
}

export function StringCell({ value }: { value: string }) {
    return <td className="text-lg-end font-monospace">{value}</td>;
}

export function RenderCode({ value }: { value: any }) {
    return (
        <div className="d-flex e-items-end">
            <pre className="e-max-w-[500px] e-overflow-x-auto lg:e-ml-auto">{parseCodeValue(value)}</pre>
        </div>
    );
}
