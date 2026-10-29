'use client';

import { Copyable } from '@components/common/Copyable';
import { RawDataField } from '@components/shared/RawDataField';
import { Badge } from '@components/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/shared/ui/tabs';

import { Alert } from '@/app/shared/ui/Alert';

import type { InstructionBlockField, PayloadContentBlock } from '../model/fields';

export function FieldBlock({ block }: { block: InstructionBlockField }) {
    return block.kind === 'payload' ? <PayloadTabs block={block} /> : <ContentBlock block={block} />;
}

function PayloadTabs({ block }: { block: Extract<InstructionBlockField, { kind: 'payload' }> }) {
    const handleValueChange = (value: string) => {
        if (value === 'decoded' || value === 'raw') block.onTabChange?.(value);
    };

    return (
        <Tabs defaultValue="raw" onValueChange={handleValueChange}>
            <TabsList>
                <TabsTrigger value="raw">Raw</TabsTrigger>
                <TabsTrigger value="decoded">Decoded</TabsTrigger>
            </TabsList>
            <TabsContent value="raw" className="pt-3">
                <ContentBlock block={block.raw} />
            </TabsContent>
            <TabsContent value="decoded" className="flex flex-col gap-3 pt-3">
                {block.decoded.map((content, index) => (
                    // Blocks never reorder, so the key is the position.
                    <ContentBlock key={index} block={content} />
                ))}
            </TabsContent>
        </Tabs>
    );
}

function ContentBlock({ block }: { block: PayloadContentBlock }) {
    switch (block.kind) {
        case 'note':
            return (
                <Alert variant={block.tone} className="!mb-0 whitespace-pre-wrap">
                    {block.text}
                </Alert>
            );
        case 'rawData':
            return (
                <div>
                    {block.label && <div className="mb-1.5">{block.label}</div>}
                    <RawDataField
                        data={block.data}
                        filename={block.filename}
                        extraButton={block.badge && <Badge variant={block.badge.tone}>{block.badge.text}</Badge>}
                    />
                </div>
            );
        case 'documentText':
            return (
                <div className="relative">
                    <div className="absolute right-2 top-2 z-10">
                        <Copyable text={block.text} />
                    </div>
                    <pre className="mb-0 max-h-80 overflow-auto whitespace-pre-wrap bg-heavy-metal-900 p-3 pr-8 text-left text-xs [overflow-wrap:anywhere]">
                        {block.text}
                    </pre>
                </div>
            );
    }
}
