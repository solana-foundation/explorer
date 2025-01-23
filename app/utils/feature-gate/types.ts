export type FeatureInfoType = {
    key: string;
    title: string;
    description: string;
    simd: { number: number; link: string } | null;
    devnetActivationEpoch: number | null;
    testnetActivationEpoch: number | null;
    mainnetActivationEpoch: number | null;
};
