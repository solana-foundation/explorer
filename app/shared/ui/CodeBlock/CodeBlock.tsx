'use client';

import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

import { BaseCodeBlock, type BaseCodeBlockProps } from './BaseCodeBlock';

export type CodeBlockProps = Omit<BaseCodeBlockProps, 'copyState' | 'onCopy'>;

// One hook per block — a hook hoisted into the parent would flip every sibling block to "Copied".
export function CodeBlock({ code, ...props }: CodeBlockProps) {
    const [copyState, copy] = useCopyToClipboard();

    return <BaseCodeBlock {...props} code={code} copyState={copyState} onCopy={() => copy(code)} />;
}
