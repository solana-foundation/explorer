import * as React from 'react';
import { isValidElement } from 'react';

import { BaseHighlightNode } from './BaseHighlightNode';
import { useSearchHighlight } from './SearchHighlightContext';

export const HighlightNode = React.memo(
    React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<'mark'>>(({ children, className, ...props }, ref) => {
        const highlightContext = useSearchHighlight();
        if (!highlightContext) return <>{children}</>;

        const { searchStr, contains } = highlightContext;

        const isActive = (() => {
            if (!searchStr) return false;
            const textContent = extractTextFromChildren(children);

            return contains(textContent, searchStr);
        })();

        return (
            <BaseHighlightNode className={className} isActive={isActive} {...props} ref={ref}>
                {children}
            </BaseHighlightNode>
        );
    })
);
HighlightNode.displayName = 'HighlightNode';

function extractTextFromChildren(children: React.ReactNode): string {
    if (typeof children === 'string') {
        return children;
    }
    if (typeof children === 'number') {
        return String(children);
    }
    if (Array.isArray(children)) {
        return children.map(extractTextFromChildren).join('');
    }
    if (isValidElement(children)) {
        return extractTextFromChildren(children.props.children);
    }
    return '';
}
