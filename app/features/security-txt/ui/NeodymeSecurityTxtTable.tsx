import { TableCardBody } from '@components/common/TableCardBody';

import { BaseTable } from '@/app/shared/ui/Table';

import type { NeodymeSecurityTXT } from '../lib/types';
import { CodeCell, ContactInfo, ExternalLinkCell, StringCell } from './common';
import { isValidLink } from './utils';

enum DisplayType {
    String,
    URL,
    Date,
    Contacts,
    PGP,
    Auditors,
}

type TableRow = {
    display: string;
    key: keyof NeodymeSecurityTXT;
    type: DisplayType;
};

export function NeodymeSecurityTxtTable({ data }: { data: NeodymeSecurityTXT }) {
    return (
        <TableCardBody>
            {ROWS.filter(x => x.key in data).map((x, idx) => {
                return (
                    <BaseTable.Row key={idx}>
                        <BaseTable.Cell className="e-w-full">{x.display}</BaseTable.Cell>
                        <RenderEntry value={data[x.key]} type={x.type} />
                    </BaseTable.Row>
                );
            })}
        </TableCardBody>
    );
}

const ROWS: TableRow[] = [
    {
        display: 'Name',
        key: 'name',
        type: DisplayType.String,
    },
    {
        display: 'Project URL',
        key: 'project_url',
        type: DisplayType.URL,
    },
    {
        display: 'Contacts',
        key: 'contacts',
        type: DisplayType.Contacts,
    },
    {
        display: 'Policy',
        key: 'policy',
        type: DisplayType.URL,
    },
    {
        display: 'Preferred Languages',
        key: 'preferred_languages',
        type: DisplayType.String,
    },
    {
        display: 'Secure Contact Encryption',
        key: 'encryption',
        type: DisplayType.PGP,
    },
    {
        display: 'Source Code URL',
        key: 'source_code',
        type: DisplayType.URL,
    },
    {
        display: 'Source Code Release Version',
        key: 'source_release',
        type: DisplayType.String,
    },
    {
        display: 'Source Code Revision',
        key: 'source_revision',
        type: DisplayType.String,
    },
    {
        display: 'Auditors',
        key: 'auditors',
        type: DisplayType.Auditors,
    },
    {
        display: 'Acknowledgements',
        key: 'acknowledgements',
        type: DisplayType.URL,
    },
    {
        display: 'Expiry',
        key: 'expiry',
        type: DisplayType.Date,
    },
];

function RenderEntry({ value, type }: { value: NeodymeSecurityTXT[keyof NeodymeSecurityTXT]; type: DisplayType }) {
    if (!value) {
        return <></>;
    }
    switch (type) {
        case DisplayType.String:
            return <StringCell value={value} />;
        case DisplayType.Contacts:
            return (
                <BaseTable.Cell className="e-text-right e-font-mono">
                    <ul className="e-m-0 e-list-none e-pl-0 e-text-right">
                        {value?.split(',').map((c, i) => {
                            const idx = c.indexOf(':');
                            if (idx < 0) {
                                //invalid contact
                                return <li key={i}>{c}</li>;
                            }
                            const [type, information] = [c.slice(0, idx), c.slice(idx + 1)];
                            return (
                                <li key={i}>
                                    <ContactInfo type={type} information={information} />
                                </li>
                            );
                        })}
                    </ul>
                </BaseTable.Cell>
            );
        case DisplayType.URL:
            if (isValidLink(value)) {
                return <ExternalLinkCell url={value} />;
            }
            return <CodeCell value={value} alignRight />;
        case DisplayType.Date:
            return <StringCell value={value} />;
        case DisplayType.PGP:
            if (isValidLink(value)) {
                return <ExternalLinkCell url={value} />;
            }
            return <CodeCell value={value} alignRight={false} />;
        case DisplayType.Auditors:
            if (isValidLink(value)) {
                return <ExternalLinkCell url={value} />;
            }
            return (
                <BaseTable.Cell className="e-text-right">
                    <ul className="e-m-0 e-list-none e-pl-0 e-text-right">
                        {value?.split(',').map((c, idx) => {
                            return <li key={idx}>{c}</li>;
                        })}
                    </ul>
                </BaseTable.Cell>
            );
        default:
            break;
    }
    return <></>;
}
