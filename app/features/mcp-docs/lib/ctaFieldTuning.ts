export type CtaFieldTuning = {
    density: number;

    drift: number;

    falloff: number;

    flight: number;

    maxSpeed: number;

    pullDensity: number;

    softening: number;

    spawn: number;
};

export const CTA_FIELD_TUNING_DEFAULTS: CtaFieldTuning = {
    density: 1,
    drift: 360,
    falloff: 2,
    flight: 1,
    maxSpeed: 1800,
    pullDensity: 5,
    softening: 24,
    spawn: 1100,
};

export type CtaFieldScope = 'base' | 'closingDesktop' | 'heroDesktop';

const CTA_FIELD_SCOPE_DEFAULTS: Record<Exclude<CtaFieldScope, 'base'>, CtaFieldTuning> = {
    closingDesktop: {
        density: 1,
        drift: 360,
        falloff: 2,
        flight: 0.55,
        maxSpeed: 960,
        pullDensity: 2.5,
        softening: 24,
        spawn: 1100,
    },
    heroDesktop: {
        density: 0.6,
        drift: 320,
        falloff: 1.3,
        flight: 0.3,
        maxSpeed: 360,
        pullDensity: 1.5,
        softening: 24,
        spawn: 550,
    },
};

export function resolveCtaField(scope: CtaFieldScope): CtaFieldTuning {
    return scope === 'base'
        ? CTA_FIELD_TUNING_DEFAULTS
        : { ...CTA_FIELD_TUNING_DEFAULTS, ...CTA_FIELD_SCOPE_DEFAULTS[scope] };
}
