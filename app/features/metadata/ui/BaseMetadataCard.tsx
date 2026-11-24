import { ErrorCard } from '@components/common/ErrorCard';
import { JsonViewer } from '@components/common/JsonViewer';
import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import { cva } from 'class-variance-authority';
import { useState } from 'react';

import { withStringsInsteadOfBigInts } from '@/app/shared/lib/bigint-to-string';
import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';
import { CardTabs } from '@/app/shared/ui/card-tabs';
import { InlineCopyButton } from '@/app/shared/ui/json-view';
import { ROW_PADDING } from '@/app/shared/ui/spacing';

export type MetadataSection = {
    id: string;
    title: string;
    data: object;
};

// One "Metadata" section with a tab per source (or a single source's name) and a copy button in the header.
export function BaseMetadataCard({ sections }: { sections: MetadataSection[] }) {
    if (sections.length === 0) {
        return <ErrorCard text="No metadata found" />;
    }

    return (
        // `className=""`: bare wrapper, the surface comes from the card inside.
        <CollapsibleSection title="Metadata" className="">
            <TabsMetadataCard sections={sections} />
        </CollapsibleSection>
    );
}

function TabsMetadataCard({ sections }: { sections: MetadataSection[] }) {
    const [activeId, setActiveId] = useState(sections[0].id);
    const active = sections.find(section => section.id === activeId) ?? sections[0];
    const [copyState, copy] = useCopyToClipboard(1000);
    return (
        <div className="w-full overflow-hidden rounded-lg border border-solid border-outer-space-800 bg-outer-space-900">
            <div className={tabsHeaderVariants({ content: sections.length > 1 ? 'tabs' : 'label' })}>
                {sections.length > 1 ? (
                    <CardTabs
                        items={sections.map(section => ({ id: section.id, label: section.title }))}
                        onChange={setActiveId}
                        value={active.id}
                        look="plain"
                    />
                ) : (
                    <span className="flex-1 text-sm font-normal text-white">{active.title}</span>
                )}
                <span className="flex shrink-0 items-center">
                    <InlineCopyButton
                        noun="JSON"
                        state={copyState}
                        onCopy={() => copy(JSON.stringify(withStringsInsteadOfBigInts(active.data), undefined, 2))}
                    />
                </span>
            </div>
            <div className={ROW_PADDING}>
                <JsonViewer version="v2" src={active.data} blockCopy={false} />
            </div>
        </div>
    );
}

// 48px tall whether it holds tabs or a label, so the header height is stable.
const tabsHeaderVariants = cva(
    'flex w-full gap-2.5 border-0 border-b border-solid border-outer-space-800 pl-3 pr-[17.5px]',
    { variants: { content: { label: 'items-center py-3.5', tabs: 'items-stretch' } } },
);
