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

const UNDERLINE_PATH =
    'M1.2,2.26 L5.3,2.55 L9.3,2.59 L13.4,2.46 L17.5,2.27 L21.5,2.28 L25.6,2.20 L29.7,2.25 L33.7,2.11 L37.8,1.72 L41.9,1.50 L45.9,1.36 L50.0,1.60 L54.1,1.76 L58.1,1.86 L62.2,1.82 L66.3,1.75 L70.3,1.99 L74.4,2.33 L78.5,2.67 L82.5,2.64 L86.6,2.33 L90.7,2.20 L94.7,2.01 L98.8,2.12 Q100.0,2.81 98.8,4.10 L94.7,3.99 L90.7,4.22 L86.6,4.34 L82.5,4.55 L78.5,4.68 L74.4,4.42 L70.3,4.00 L66.3,3.90 L62.2,3.81 L58.1,3.88 L54.1,3.75 L50.0,3.67 L45.9,3.45 L41.9,3.51 L37.8,3.76 L33.7,4.01 L29.7,4.24 L25.6,4.22 L21.5,4.15 L17.5,4.16 L13.4,4.36 L9.3,4.56 L5.3,4.43 L1.2,4.27 Q0.0,3.53 1.2,2.24 Z';
// Tailwind emerald-400.
const UNDERLINE_FILL = '#34d399';
const UNDERLINE_STYLE: React.CSSProperties = {
    WebkitBoxDecorationBreak: 'clone',
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 6" preserveAspectRatio="none"><path d="${UNDERLINE_PATH}" fill="${UNDERLINE_FILL}"/></svg>`,
    )}")`,
    backgroundPosition: 'left bottom',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 6px',
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
