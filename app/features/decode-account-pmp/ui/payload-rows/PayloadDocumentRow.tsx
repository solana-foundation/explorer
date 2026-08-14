import { Copyable } from '@components/common/Copyable';

import { BaseTable } from '@/app/shared/ui/Table';

import { CARD_TABLE_COLUMNS } from '../BasePmpAccountDataCard';

/**
 * A decoded payload as a document. Plain text for every format: json, yaml, toml.
 */
export function PayloadDocumentRow({ text }: { text: string }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell colSpan={CARD_TABLE_COLUMNS}>
                <div className="relative">
                    <div className="absolute right-2 top-2 z-10" data-testid="pmp-account-document-copy">
                        <Copyable text={text} />
                    </div>
                    <pre
                        data-testid="pmp-account-document"
                        className="mb-0 max-h-80 overflow-auto whitespace-pre-wrap bg-heavy-metal-900 p-3 pr-8 text-left text-xs [overflow-wrap:anywhere]"
                    >
                        {text}
                    </pre>
                </div>
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
