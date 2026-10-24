'use client';

import { atom, getDefaultStore, useAtomValue } from 'jotai';

export interface FeedbackRequest {
    origin: HTMLElement | null;
}

const feedbackRequestAtom = atom<FeedbackRequest | undefined>(undefined);

export function openFeedbackPopup(origin: HTMLElement | null) {
    getDefaultStore().set(feedbackRequestAtom, { origin });
}

export function useFeedbackRequest() {
    return useAtomValue(feedbackRequestAtom);
}

export function takeFeedbackRequest() {
    getDefaultStore().set(feedbackRequestAtom, undefined);
}
