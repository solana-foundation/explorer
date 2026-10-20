'use client';

import { atom, useAtom } from 'jotai';

export const feedbackOpenAtom = atom(false);

export function useFeedbackOpen() {
    return useAtom(feedbackOpenAtom);
}
