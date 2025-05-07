export type FeatureInfoType = {
    key: string | null;
    title: string;
    simd_link: string[];
    simds: string[];
    owners: string[];
    min_agave_versions: string[];
    min_fd_versions: string[];
    min_jito_versions: string[];
    planned_testnet_order: number | string | null;
    testnet_activation_epoch: number | string | null;
    devnet_activation_epoch: number | string | null;
    comms_required: string | null;
    mainnet_activation_epoch: number | string | null;
    description: string | null;
};