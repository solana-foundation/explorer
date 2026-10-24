export interface PlayedSequence {
    done: Promise<void>;
    cutShort: () => Promise<unknown>;
}

const CUT_SHORT_MS = 100;

function fadeOutFromHere(elements: (Element | null)[], running: (Animation | undefined)[]): Promise<unknown> {
    const frames = elements.flatMap(element => {
        if (!element) return [];
        const { opacity, transform } = getComputedStyle(element);
        return [{ element, opacity, transform }];
    });
    running.forEach(animation => animation?.cancel());
    return Promise.all(
        frames.map(
            ({ element, opacity, transform }) =>
                element.animate(
                    [
                        { opacity, transform },
                        { opacity: 0, transform },
                    ],
                    {
                        duration: CUT_SHORT_MS,
                        easing: 'ease-out',
                        fill: 'forwards',
                    },
                ).finished,
        ),
    );
}

export const SENT_RING = { height: 30, radius: 6, width: 86 } as const;
export const SENT_RING_LENGTH =
    2 * (SENT_RING.width - 2 * SENT_RING.radius) +
    2 * (SENT_RING.height - 2 * SENT_RING.radius) +
    2 * Math.PI * SENT_RING.radius;

const SWAP_HOLD_MS = 2000;
const SWAP_OUT_MS = 300;
const SWAP_END_FRAME: Keyframe = { opacity: 0, transform: 'translateY(-24px) scale(0.94)' };

export function playSwapExit(
    layers: { panel: HTMLElement; overlay: HTMLElement | null; ring: SVGElement | null },
    reduced: boolean,
    easing: string,
): PlayedSequence {
    const timing: KeyframeAnimationOptions = {
        delay: SWAP_HOLD_MS,
        direction: 'reverse',
        duration: SWAP_OUT_MS,
        fill: 'both',
    };
    const animations = [
        layers.panel.animate([reduced ? { opacity: 0 } : SWAP_END_FRAME, { opacity: 1, transform: 'none' }], {
            ...timing,
            easing,
        }),
        layers.overlay?.animate([{ opacity: 0 }, { offset: 0.6, opacity: 1 }, { opacity: 1 }], timing),
        // Empty as the popup starts to leave.
        layers.ring?.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: SENT_RING_LENGTH }], {
            duration: SWAP_HOLD_MS,
            easing: 'linear',
            fill: 'forwards',
        }),
    ];
    return {
        cutShort: () => fadeOutFromHere([layers.panel, layers.overlay], animations),
        done: Promise.all(animations.map(animation => animation?.finished)).then(() => undefined),
    };
}
