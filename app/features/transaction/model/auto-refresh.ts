export const AUTO_REFRESH_INTERVAL = 2000;

export enum AutoRefresh {
    Active,
    Inactive,
    BailedOut,
}

export type AutoRefreshProps = {
    autoRefresh: AutoRefresh;
};
