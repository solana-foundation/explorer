'use client';

import type * as React from 'react';

import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

import { BaseCodeBlock, type BaseCodeBlockProps } from './BaseCodeBlock';

export type CodeBlockProps = Omit<BaseCodeBlockProps, 'code' | 'copyState' | 'onCopy'> & {
    // The plain text the copy control writes to the clipboard.
    code: string;
    // Optional markup shown in place of `code`, e.g. highlighted tokens; `code` stays the copied text.
    children?: React.ReactNode;
};

// One hook per block — a hook hoisted into the parent would flip every sibling block to "Copied".
export function CodeBlock({ children, code, ...props }: CodeBlockProps) {
    const [copyState, copy] = useCopyToClipboard();

    return <BaseCodeBlock {...props} code={children ?? code} copyState={copyState} onCopy={() => copy(code)} />;
}
