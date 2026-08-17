import { describe, expect, it } from 'vitest';

import { MAX_CLUSTER_NAME_LENGTH, normalizeClusterName, suggestClusterName } from '../cluster-name';

const LONG_HOST = `${'a'.repeat(60)}.example.com`;

describe('normalizeClusterName', () => {
    it('should trim surrounding whitespace', () => {
        expect(normalizeClusterName('  Local  ')).toBe('Local');
    });

    it('should keep a name at the cap intact', () => {
        const name = 'x'.repeat(MAX_CLUSTER_NAME_LENGTH);
        expect(normalizeClusterName(name)).toBe(name);
    });

    it('should cut a name past the cap', () => {
        expect(normalizeClusterName('x'.repeat(MAX_CLUSTER_NAME_LENGTH + 20))).toHaveLength(MAX_CLUSTER_NAME_LENGTH);
    });

    // The cut can land on a space, invisible on the pill but a different name to store and delete by.
    it('should not leave a trailing space behind the cut', () => {
        const name = `${'x'.repeat(MAX_CLUSTER_NAME_LENGTH - 1)} more`;
        expect(normalizeClusterName(name)).toBe('x'.repeat(MAX_CLUSTER_NAME_LENGTH - 1));
    });

    it('should reduce a blank name to an empty string', () => {
        expect(normalizeClusterName('   ')).toBe('');
    });
});

describe('suggestClusterName', () => {
    it('should suggest the host', () => {
        expect(suggestClusterName('https://staging.example.com/rpc', [])).toBe('staging.example.com');
    });

    it('should keep the port, which is what tells two local validators apart', () => {
        expect(suggestClusterName('http://localhost:8899', [])).toBe('localhost:8899');
    });

    // Providers put the API key there, and the name is the line the switcher always shows.
    it('should leave the path and query out of the suggestion', () => {
        expect(suggestClusterName('https://staging.example.com/rpc?api-key=secret', [])).toBe('staging.example.com');
    });

    it('should suggest nothing when the URL is not an endpoint', () => {
        expect(suggestClusterName('my-node.example', [])).toBe('');
        expect(suggestClusterName('', [])).toBe('');
    });

    it('should number the suggestion when the host is already taken', () => {
        expect(suggestClusterName('https://staging.example.com/a', ['staging.example.com'])).toBe(
            'staging.example.com (2)',
        );
    });

    it('should keep counting past the first collision', () => {
        expect(
            suggestClusterName('https://staging.example.com/c', ['staging.example.com', 'staging.example.com (2)']),
        ).toBe('staging.example.com (3)');
    });

    it('should cap the suggestion', () => {
        expect(suggestClusterName(`https://${LONG_HOST}`, [])).toHaveLength(MAX_CLUSTER_NAME_LENGTH);
    });

    // The counter is the part that makes the name unique, so the host gives way to it.
    it('should keep the counter when the capped suggestion collides', () => {
        const capped = suggestClusterName(`https://${LONG_HOST}`, []);
        const numbered = suggestClusterName(`https://${LONG_HOST}`, [capped]);
        expect(numbered.endsWith(' (2)')).toBe(true);
        expect(numbered.length).toBeLessThanOrEqual(MAX_CLUSTER_NAME_LENGTH);
    });
});
