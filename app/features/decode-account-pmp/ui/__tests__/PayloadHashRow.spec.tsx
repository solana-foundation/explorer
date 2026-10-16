import { DataSource } from '@solana-program/program-metadata';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PayloadHashRow } from '../BasePmpAccountDataCard';

describe('PayloadHashRow', () => {
    it('should show the pointer note instead of the hash for an External data source', () => {
        render(<PayloadHashRow dataSource={DataSource.External} hash="abc123" />);

        expect(screen.getByTestId('pmp-payload-data-hash-pointer')).toHaveTextContent('External pointer');
        expect(screen.queryByText('abc123')).toBeNull();
    });

    it('should show the pointer note instead of the hash for a Url data source', () => {
        render(<PayloadHashRow dataSource={DataSource.Url} hash="abc123" />);

        expect(screen.getByTestId('pmp-payload-data-hash-pointer')).toHaveTextContent('Url pointer');
        expect(screen.queryByText('abc123')).toBeNull();
    });

    it('should show the hash for a Direct data source', () => {
        render(<PayloadHashRow dataSource={DataSource.Direct} hash="abc123" />);

        expect(screen.queryByTestId('pmp-payload-data-hash-pointer')).toBeNull();
        expect(screen.getByTestId('pmp-payload-data-hash')).toHaveTextContent('abc123');
    });
});
