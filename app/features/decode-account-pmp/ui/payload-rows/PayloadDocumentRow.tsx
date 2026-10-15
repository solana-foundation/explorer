import { Copyable } from '@components/common/Copyable';

import { FullWidthRow } from '../BasePmpAccountDataCard';

export function PayloadDocumentRow({ text }: { text: string }) {
    return (
        <FullWidthRow>
            <div className="relative w-full">
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
        </FullWidthRow>
    );
}
