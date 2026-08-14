import { AccountDiscriminator } from '@solana-program/program-metadata';
import { describe, expect, it } from 'vitest';

import {
    isPmpMetadataAccountData,
    PMP_BUFFER_DISCRIMINATOR,
    PMP_EMPTY_DISCRIMINATOR,
    PMP_METADATA_DISCRIMINATOR,
} from '../account-discriminators';

describe('PMP account discriminators', () => {
    it('should match the generated client, so a library change fails here rather than in a tab', () => {
        expect(PMP_EMPTY_DISCRIMINATOR).toBe(AccountDiscriminator.Empty);
        expect(PMP_BUFFER_DISCRIMINATOR).toBe(AccountDiscriminator.Buffer);
        expect(PMP_METADATA_DISCRIMINATOR).toBe(AccountDiscriminator.Metadata);
    });

    it('should recognise Metadata bytes only', () => {
        expect(isPmpMetadataAccountData(new Uint8Array([PMP_METADATA_DISCRIMINATOR, 7, 7]))).toBe(true);
        expect(isPmpMetadataAccountData(new Uint8Array([PMP_BUFFER_DISCRIMINATOR, 7, 7]))).toBe(false);
        expect(isPmpMetadataAccountData(new Uint8Array([PMP_EMPTY_DISCRIMINATOR]))).toBe(false);
    });

    it('should treat missing and empty data as not Metadata, so a partial fetch hides the tab', () => {
        expect(isPmpMetadataAccountData(undefined)).toBe(false);
        expect(isPmpMetadataAccountData(new Uint8Array(0))).toBe(false);
    });
});
