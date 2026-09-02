import { assert, type Infer, number, refine, type } from 'superstruct';

/** The fields of a `getRecentPerformanceSamples` entry this reads. */
type PerformanceSample = Readonly<{
    numSlots: bigint;
    samplePeriodSecs: number;
}>;

type SlotTimePayload = Infer<typeof SlotTimePayloadStruct>;

/**
 * How many of the most recent samples (one minute each) the rate is measured over. Wide enough that one
 * odd minute cannot move it, narrow enough that a slot-time feature gate shows up within minutes of
 * activating.
 */
export const MEASURED_SAMPLES = 5;

export function toSlotTimePayload(samples: readonly PerformanceSample[]): SlotTimePayload {
    return { msPerSlot: toMsPerSlot(samples) };
}

/**
 * The boundary constructor: wall-clock time the cluster spent per slot, over the samples it reports.
 *
 * Rounded to whole milliseconds so both fetch paths agree on the figure and the cached body stays stable.
 * At epoch scale that costs well under a minute, against a rate that moves by a hundred milliseconds a
 * slot when a SIMD-0525 gate activates.
 */
export function toMsPerSlot(samples: readonly PerformanceSample[]): number {
    let slots = 0n;
    let seconds = 0;

    for (const sample of samples.slice(0, MEASURED_SAMPLES)) {
        // Kit types these without checking them, and a sample that covers no slot cannot state a rate.
        if (typeof sample.numSlots !== 'bigint' || sample.numSlots <= 0n) continue;
        if (typeof sample.samplePeriodSecs !== 'number' || !Number.isFinite(sample.samplePeriodSecs)) continue;
        if (sample.samplePeriodSecs <= 0) continue;

        slots += sample.numSlots;
        seconds += sample.samplePeriodSecs;
    }

    if (slots === 0n) {
        throw new Error('[slot-time] no sample states a rate');
    }

    return Math.round((seconds * 1000) / Number(slots));
}

/** Throws rather than handing back a rate it cannot vouch for, which every countdown would then use. */
export function parseSlotTimePayload(body: unknown): number {
    assert(body, SlotTimePayloadStruct);
    return body.msPerSlot;
}

const SlotTimePayloadStruct = type({
    msPerSlot: refine(number(), 'msPerSlot', value => Number.isFinite(value) && value > 0),
});
