import { PublicKey } from '@solana/web3.js';
import { readFileSync, writeFileSync } from 'fs';

// Read generated features and existing feature gate file
const features = JSON.parse(readFileSync('features.json'));
const featureGatePath = 'app/utils/feature-gate/constants.ts';

// Map features to the desired format
const newFeatures = features.map(feature => ({
    description: feature.description,
    devnetActivationEpoch: feature.devnet ? parseInt(feature.devnet) : null,
    key: feature.key,
    mainnetActivationEpoch: feature.mainnet ? parseInt(feature.mainnet) : null,
    simd: feature.simd ? {
        link: feature.simd_link,
        number: parseInt(feature.simd)
    } : null,
    testnetActivationEpoch: feature.testnet ? parseInt(feature.testnet) : null,
    title: feature.title,
}));

// Generate new file content
const newContent = `import { FeatureInfoType } from './types';

export const FEATURES: FeatureInfoType[] = [
${newFeatures.map(f => `    {
        description: '${f.description?.replace(/'/g, "\\'") || ''}',
        devnetActivationEpoch: ${f.devnetActivationEpoch ?? 'null'},
        key: '${f.key}',
        mainnetActivationEpoch: ${f.mainnetActivationEpoch ?? 'null'},
        simd: ${f.simd ? `{
            link: '${f.simd.link}',
            number: ${f.simd.number},
        }` : 'null'},
        testnetActivationEpoch: ${f.testnetActivationEpoch ?? 'null'},
        title: '${f.title?.replace(/'/g, "\\'")}',
    },`).join('\n')}
];`;

// Write the new file
writeFileSync(featureGatePath, newContent);
console.log(`Updated ${featureGatePath} with ${newFeatures.length} features`);

// Validate public keys
newFeatures.forEach(feature => {
    try {
        new PublicKey(feature.key);
    } catch {
        console.error(`Invalid public key: ${feature.key}`);
        process.exit(1);
    }
});