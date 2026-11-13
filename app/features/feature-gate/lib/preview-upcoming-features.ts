// A short Upcoming list shows in full; a longer one opens on its first rows and a "Show more" button, so the
// Activated list below stays within reach.
export const UPCOMING_FULL_LIST_LIMIT = 6;
export const UPCOMING_PREVIEW_SIZE = 4;

/** The rows the Upcoming section shows, and how many the "Show more" button would add. */
export function previewUpcomingFeatures<T>(features: readonly T[], showAll: boolean) {
    if (showAll || features.length <= UPCOMING_FULL_LIST_LIMIT) return { hiddenCount: 0, visible: [...features] };
    return {
        // Never negative, so "Show N more" stays right even if the preview size ever exceeds the full-list limit.
        hiddenCount: Math.max(0, features.length - UPCOMING_PREVIEW_SIZE),
        visible: features.slice(0, UPCOMING_PREVIEW_SIZE),
    };
}
