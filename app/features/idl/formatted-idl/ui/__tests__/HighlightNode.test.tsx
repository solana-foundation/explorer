import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { HighlightNode } from '../HighlightNode';
import { SearchHighlightProvider } from '../SearchHighlightContext';

describe('HighlightNode', () => {
    describe('without search context', () => {
        it('should not highlight when context is null', () => {
            render(
                <HighlightNode>
                    <span>Test Text</span>
                </HighlightNode>
            );

            const textElement = screen.getByText('Test Text');
            const markElement = screen.queryByRole('mark');
            expect(markElement).not.toBeInTheDocument();
            expect(textElement).toBeInTheDocument();
        });
    });

    describe('with search context', () => {
        it('should not highlight when searchStr is empty', () => {
            render(
                <SearchHighlightProvider searchStr="">
                    <HighlightNode>
                        <span>Test Text</span>
                    </HighlightNode>
                </SearchHighlightProvider>
            );

            const textElement = screen.getByText('Test Text');
            const markElement = screen.queryByRole('mark');
            expect(markElement).not.toBeInTheDocument();
            expect(textElement).toBeInTheDocument();
        });

        it('should highlight when search term matches text', () => {
            render(
                <SearchHighlightProvider searchStr="test">
                    <HighlightNode>
                        <span>Test Text</span>
                    </HighlightNode>
                </SearchHighlightProvider>
            );

            const markElement = screen.getByRole('mark');
            expect(markElement).toBeInTheDocument();
            expect(within(markElement).getByText('Test Text')).toBeInTheDocument();
        });

        it('should not highlight when search term does not match text', () => {
            render(
                <SearchHighlightProvider searchStr="xyz">
                    <HighlightNode>
                        <span>Test Text</span>
                    </HighlightNode>
                </SearchHighlightProvider>
            );

            const textElement = screen.getByText('Test Text');
            const markElement = screen.queryByRole('mark');
            expect(markElement).not.toBeInTheDocument();
            expect(textElement).toBeInTheDocument();
        });
    });

    describe('text extraction from children', () => {
        it('should extract text from string children', () => {
            render(
                <SearchHighlightProvider searchStr="hello">
                    <HighlightNode>hello world</HighlightNode>
                </SearchHighlightProvider>
            );

            const markElement = screen.getByRole('mark');
            expect(markElement).toBeInTheDocument();
            expect(within(markElement).getByText('hello world')).toBeInTheDocument();
        });

        it('should extract text from number children', () => {
            render(
                <SearchHighlightProvider searchStr="42">
                    <HighlightNode>{42}</HighlightNode>
                </SearchHighlightProvider>
            );

            const markElement = screen.getByRole('mark');
            expect(markElement).toBeInTheDocument();
            expect(within(markElement).getByText('42')).toBeInTheDocument();
        });

        it('should extract text from array of children', () => {
            render(
                <SearchHighlightProvider searchStr="hello">
                    <HighlightNode>
                        <span>Hello</span>
                        <span>World</span>
                    </HighlightNode>
                </SearchHighlightProvider>
            );

            const markElement = screen.getByRole('mark');
            expect(markElement).toBeInTheDocument();
            expect(within(markElement).getByText('Hello')).toBeInTheDocument();
        });

        it('should extract text from nested React elements', () => {
            render(
                <SearchHighlightProvider searchStr="nested">
                    <HighlightNode>
                        <div data-testid="nested-text">
                            <span>Nested</span>
                            <span>Text</span>
                        </div>
                    </HighlightNode>
                </SearchHighlightProvider>
            );

            const markElement = screen.getByRole('mark');
            expect(markElement).toBeInTheDocument();
            expect(within(markElement).getByTestId('nested-text')).toBeInTheDocument();
        });

        it('should handle mixed children types', () => {
            render(
                <SearchHighlightProvider searchStr="world">
                    <HighlightNode>
                        <span>Hello</span> {123}
                        <span>World</span>
                    </HighlightNode>
                </SearchHighlightProvider>
            );

            const markElement = screen.getByRole('mark');
            expect(markElement).toBeInTheDocument();
            expect(within(markElement).getByText('World')).toBeInTheDocument();
        });

        it('should return empty string for invalid children', () => {
            render(
                <SearchHighlightProvider searchStr="test">
                    <HighlightNode>{null}</HighlightNode>
                </SearchHighlightProvider>
            );

            const markElement = screen.queryByRole('mark');
            expect(markElement).not.toBeInTheDocument();
        });
    });
});
