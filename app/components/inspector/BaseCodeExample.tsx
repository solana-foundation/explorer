import React from 'react';

import { BaseCodeBlock } from '@/app/shared/ui/CodeBlock';

export type CodeExampleLanguage = 'rust' | 'shell' | 'typescript' | 'url';

export function BaseCodeExample({
    code,
    focus,
    language,
}: {
    code: string;
    focus: string;
    language: CodeExampleLanguage;
}) {
    const keywords = KEYWORDS[language];
    const rendered = code.split('\n').map((line, i) => (
        // Lines of a fixed snippet never reorder, so the index is a stable key.
        <span key={i} className="block" style={wrapIndentStyle(line)}>
            {language === 'shell' && i === 0 && <span className="select-none opacity-40">$ </span>}
            {/* An empty block span has no height, so a blank line keeps one space to hold its row. */}
            {line === '' ? ' ' : renderLine(line, focus, keywords)}
        </span>
    ));
    // The addresses are made up, so the sample has no copy control and its caption says it is illustrative.
    return <BaseCodeBlock caption={EXAMPLE_LABEL} code={code} rendered={rendered} variant="reference" wrap="wrap" />;
}

export const EXAMPLE_LABEL = 'Illustrative example';

const KEYWORDS: Record<CodeExampleLanguage, string[]> = {
    rust: ['use', 'fn', 'let'],
    shell: [],
    typescript: ['import', 'from', 'const', 'new'],
    url: [],
};

// Highlighter-style band in Tailwind emerald-400; clone keeps it continuous across wrapped lines.
const UNDERLINE_STYLE: React.CSSProperties = {
    WebkitBoxDecorationBreak: 'clone',
    backgroundImage: 'linear-gradient(transparent 75%, rgba(52, 211, 153, 0.45) 75%)',
    boxDecorationBreak: 'clone',
};

function renderLine(line: string, focus: string, keywords: string[]): React.ReactNode {
    const at = line.indexOf(focus);
    if (at === -1) {
        return <span className="opacity-40">{highlight(line, keywords)}</span>;
    }
    return (
        <>
            <span className="opacity-40">{highlight(line.slice(0, at), keywords)}</span>
            <mark className="bg-transparent p-0 pb-1 text-white" style={UNDERLINE_STYLE}>
                {highlight(focus, keywords)}
            </mark>
            <span className="opacity-40">{highlight(line.slice(at + focus.length), keywords)}</span>
        </>
    );
}

const WRAP_EXTRA_INDENT = 2;

function wrapIndentStyle(line: string): React.CSSProperties {
    const indent = line.length - line.trimStart().length + WRAP_EXTRA_INDENT;
    return { paddingLeft: `${indent}ch`, textIndent: `-${indent}ch` };
}

// Two-colour highlighting is enough for a short static snippet: double-quoted strings, then whole-word keywords.
function highlight(text: string, keywords: string[]): React.ReactNode[] {
    return text.split('"').flatMap((part, i) => {
        if (i % 2 === 1) {
            return [
                <span key={i} className="text-accent">
                    &quot;{part}&quot;
                </span>,
            ];
        }
        return part.split(' ').flatMap((word, j, words) => {
            const separator = j < words.length - 1 ? ' ' : '';
            const node = keywords.includes(word) ? (
                <span key={`${i}-${j}`} className="text-destructive-300">
                    {word}
                </span>
            ) : (
                word
            );
            return [node, separator];
        });
    });
}
