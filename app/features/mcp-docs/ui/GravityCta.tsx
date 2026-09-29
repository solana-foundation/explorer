'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight } from 'react-feather';

import { cn } from '@/app/components/shared/utils';
import { useReducedMotion } from '@/app/shared/lib/use-reduced-motion';

import { type CtaFieldScope, resolveCtaField } from '../lib/ctaFieldTuning';

const CTA_FIELD_X = 110;
const CTA_FIELD_Y = 70;
const CTA_GRAVITY = 260_000;
const CTA_GRAVITY_REF = 200;
const CTA_FIELD_REF_RADIUS = 712;
const CTA_MAX_DOTS = 2600;
const CTA_SCROLL_EPSILON = 2;
const CTA_MOBILE_QUERY = '(hover: none), (max-width: 767px)';
const CTA_MOBILE_DOT_DIVISOR = 2;
const CTA_MOBILE_PULL_DOT_DIVISOR = 2;
const CTA_DRAIN_TAU = 0.4;
const CTA_REDIST_OVERFILL = 1.5;
const CTA_HOVER_SCALE = 1.02;
const CTA_DOT_SIZES = [
    { max: 1, min: 1, weight: 10 },
    { max: 2, min: 2, weight: 1.6 },
    { max: 3, min: 3, weight: 0.08 },
    { max: 4, min: 4, weight: 0.06 },
    { max: 5, min: 5, weight: 0.04 },
    { max: 6, min: 6, weight: 0.02 },
];
const CTA_DOT_WEIGHT = CTA_DOT_SIZES.reduce((sum, bucket) => sum + bucket.weight, 0);
const CTA_CELL = 90;
const CTA_GROW_MIN_SIZE = 2;
const CTA_GROW_SECONDS = 1;
const CTA_IDLE_MAX_SIZE = 3;
const CTA_IDLE_WEIGHT = CTA_DOT_SIZES.reduce(
    (sum, bucket) => (bucket.min <= CTA_IDLE_MAX_SIZE ? sum + bucket.weight : sum),
    0,
);
const CTA_BIG_BUCKETS = CTA_DOT_SIZES.filter(
    bucket => bucket.min > CTA_GROW_MIN_SIZE && bucket.min <= CTA_IDLE_MAX_SIZE,
);
const CTA_BIG_WEIGHT = CTA_BIG_BUCKETS.reduce((sum, bucket) => sum + bucket.weight, 0);
const CTA_BIG_LIFE_MIN = 3;
const CTA_BIG_LIFE_MAX = 10;
const CTA_HOVER_GRAVITY = 2000;
const CTA_GRAVITY_RAMP_SECONDS = 0.2;
const CTA_STOP_DRAG = 10;
const CTA_FLUX_DRAG = 2;
const CTA_HIT_GAIN = 0.0022 / 3;
const CTA_HIT_CEILING = 0.16 / 3;

type CtaDot = {
    age: number;
    dying: number;
    life: number;
    size: number;
    vx: number;
    vy: number;
    wx: number;
    wy: number;
    x: number;
    y: number;
};

export function GravityCta({
    children,
    className,
    desktopScope = 'base',
    dotScale = 1,
    falloff,
    fieldRef,
    flightSpeedScale = 1,
    href,
    mobileDotScale = 1,
    mobilePullScale = 1,
    pageBottomGap,
    softening,
    wrapClassName,
    zoneBottom = 0.625,
    zoneTop = 0.375,
}: {
    children: React.ReactNode;
    className?: string;
    desktopScope?: CtaFieldScope;
    dotScale?: number;
    falloff?: number;
    fieldRef?: React.RefObject<HTMLElement | null>;
    flightSpeedScale?: number;
    href: string;
    mobileDotScale?: number;
    mobilePullScale?: number;
    softening?: number;
    pageBottomGap?: number;
    wrapClassName?: string;
    zoneBottom?: number;
    zoneTop?: number;
}) {
    const reduced = useReducedMotion();
    const wrapRef = useRef<HTMLSpanElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const linkRef = useRef<HTMLAnchorElement>(null);
    const pointerRef = useRef<{ x: number; y: number } | undefined>(undefined);
    const zoneRef = useRef(false);
    const [fieldEl, setFieldEl] = useState<HTMLElement | undefined>(undefined);

    useEffect(() => {
        setFieldEl(fieldRef?.current ?? undefined);
    }, [fieldRef]);

    useEffect(() => {
        if (reduced) return;
        const wrap = wrapRef.current;
        const canvas = canvasRef.current;
        const link = linkRef.current;
        const ctx = canvas?.getContext('2d');
        if (!wrap || !canvas || !link || !ctx) return;

        let fieldScale = 1;
        let width = 0;
        let height = 0;
        let centerX = 0;
        let centerY = 0;
        let halfW = 0;
        let halfH = 0;

        const measure = () => {
            const box = wrap.getBoundingClientRect();
            halfW = box.width / 2;
            halfH = box.height / 2;
            if (fieldEl) {
                const fieldBox = fieldEl.getBoundingClientRect();
                width = fieldBox.width;
                height = fieldBox.height;
                centerX = box.left - fieldBox.left + halfW;
                centerY = box.top - fieldBox.top + halfH;
            } else {
                width = box.width + CTA_FIELD_X * 2;
                height = box.height + CTA_FIELD_Y * 2;
                centerX = CTA_FIELD_X + halfW;
                centerY = CTA_FIELD_Y + halfH;
            }

            const spread = (span: number, at: number) => (span * span) / 3 - span * at + at * at;
            const radius = Math.sqrt(spread(width, centerX) + spread(height, centerY));
            fieldScale = radius > 0 ? radius / CTA_FIELD_REF_RADIUS : 1;
            const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(wrap);
        if (fieldEl) observer.observe(fieldEl);

        const dots: CtaDot[] = [];

        const randomSize = (idle: boolean) => {
            let ticket = Math.random() * (idle ? CTA_IDLE_WEIGHT : CTA_DOT_WEIGHT);
            for (const bucket of CTA_DOT_SIZES) {
                if (idle && bucket.min > CTA_IDLE_MAX_SIZE) break;
                if (ticket < bucket.weight) return bucket.min + Math.random() * (bucket.max - bucket.min);
                ticket -= bucket.weight;
            }
            return 1;
        };
        const drift = () => (Math.random() - 0.5) * 30;

        const bigSize = () => {
            let ticket = Math.random() * CTA_BIG_WEIGHT;
            for (const bucket of CTA_BIG_BUCKETS) {
                if (ticket < bucket.weight) return bucket.min + Math.random() * (bucket.max - bucket.min);
                ticket -= bucket.weight;
            }
            return CTA_BIG_BUCKETS[CTA_BIG_BUCKETS.length - 1].min;
        };

        const makeDot = (size: number, x: number, y: number) => {
            const big = size > CTA_GROW_MIN_SIZE;
            dots.push({
                age: 0,
                dying: 0,
                life: big
                    ? CTA_GROW_SECONDS + CTA_BIG_LIFE_MIN + Math.random() * (CTA_BIG_LIFE_MAX - CTA_BIG_LIFE_MIN)
                    : Infinity,
                size,
                vx: drift(),
                vy: drift(),
                wx: 0,
                wy: 0,
                x,
                y,
            });
        };

        const startFade = (dot: CtaDot, dt: number) => {
            const t = Math.min(dot.age / CTA_GROW_SECONDS, 1);
            dot.size = 1 + (dot.size - 1) * t * (2 - t);
            dot.dying = dt;
        };

        const sparseXY = (): [number, number] => {
            const cols = Math.max(1, Math.floor(width / CTA_CELL));
            const rows = Math.max(1, Math.floor(height / CTA_CELL));
            const counts = new Int32Array(cols * rows);
            for (const dot of dots) {
                if (dot.dying > 0) continue;
                const cx = Math.min(cols - 1, Math.max(0, Math.floor((dot.x / width) * cols)));
                const cy = Math.min(rows - 1, Math.max(0, Math.floor((dot.y / height) * rows)));
                counts[cy * cols + cx]++;
            }
            let sparsest = 0;
            for (let cell = 1; cell < counts.length; cell++) {
                if (counts[cell] < counts[sparsest]) sparsest = cell;
            }
            return [
                ((sparsest % cols) + Math.random()) * (width / cols),
                (Math.floor(sparsest / cols) + Math.random()) * (height / rows),
            ];
        };

        const spawn = (idle: boolean) => makeDot(randomSize(idle), Math.random() * width, Math.random() * height);
        const spawnBig = () => makeDot(bigSize(), ...sparseXY());

        const mobile = window.matchMedia(CTA_MOBILE_QUERY);
        let phone = mobile.matches;
        const onMobileChange = () => {
            phone = mobile.matches;
        };
        mobile.addEventListener('change', onMobileChange);
        const restingCap = (density: number) =>
            Math.round(
                phone
                    ? (CTA_MAX_DOTS / CTA_MOBILE_DOT_DIVISOR) * mobileDotScale * dotScale * density
                    : CTA_MAX_DOTS * dotScale * density,
            );
        const pullCap = (resting: number, swarm: number) =>
            phone
                ? Math.round((resting * swarm * mobilePullScale) / CTA_MOBILE_PULL_DOT_DIVISOR)
                : Math.round(resting * swarm);

        const seed = () => {
            const cap = restingCap(resolveCtaField(phone ? 'base' : desktopScope).density);
            while (dots.length < cap) spawn(true);
        };
        seed();

        let swell = 0;
        let scale = 1;
        let spawnDebt = 0;
        let last = 0;
        let frame = 0;
        let running = false;
        let gravityScale = 0;
        let wasActive = false;

        const step = (now: number) => {
            const dt = last === 0 ? 1 / 60 : Math.min((now - last) / 1000, 1 / 20);
            last = now;

            const tuning = resolveCtaField(phone ? 'base' : desktopScope);
            const bandFalloff = falloff ?? tuning.falloff;
            const inverseSquare = bandFalloff === 2;
            const speed = flightSpeedScale * tuning.flight;
            const gravity = CTA_GRAVITY * speed * speed * Math.pow(fieldScale, bandFalloff + 1);
            const refAccel = gravity / (CTA_GRAVITY_REF * CTA_GRAVITY_REF);
            const fieldSoftening = (softening ?? tuning.softening) * fieldScale;
            const restingDots = restingCap(tuning.density);
            const pullDots = pullCap(restingDots, tuning.pullDensity);

            const active = pointerRef.current !== undefined || zoneRef.current;
            if (active) {
                gravityScale = Math.min(
                    CTA_HOVER_GRAVITY,
                    gravityScale + (CTA_HOVER_GRAVITY / CTA_GRAVITY_RAMP_SECONDS) * dt,
                );
            } else {
                gravityScale = 0;
            }

            if (wasActive && !active) {
                for (const dot of dots) {
                    if (dot.dying === 0 && dot.size > CTA_IDLE_MAX_SIZE) startFade(dot, dt);
                }
            }
            wasActive = active;

            const hovering = active;
            const maxDots = hovering ? pullDots : restingDots;
            const spawnRate = hovering ? tuning.spawn * tuning.pullDensity : tuning.spawn;

            spawnDebt += dt * spawnRate;
            while (spawnDebt >= 1) {
                spawnDebt -= 1;
                if (dots.length < maxDots) spawn(!active);
            }

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#1DD79B';

            for (let index = dots.length - 1; index >= 0; index--) {
                const dot = dots[index];

                if (dot.dying > 0) {
                    dot.dying += dt;
                    if (dot.dying >= CTA_GROW_SECONDS) {
                        dots.splice(index, 1);
                        continue;
                    }
                    const fade = 1 - dot.dying / CTA_GROW_SECONDS;
                    const dyingSize = dot.size * fade;
                    ctx.globalAlpha = 0.2 + (dyingSize / 8) * 0.55;
                    ctx.beginPath();
                    ctx.arc(dot.x, dot.y, dyingSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                    continue;
                }

                dot.age += dt;

                if (!active && dot.age >= dot.life) {
                    dot.dying = dt;
                    spawnBig();
                    continue;
                }

                const dx = centerX - dot.x;
                const dy = centerY - dot.y;
                const softened = Math.sqrt(dx * dx + dy * dy + fieldSoftening * fieldSoftening);
                const drop = inverseSquare
                    ? (CTA_GRAVITY_REF * CTA_GRAVITY_REF) / (softened * softened)
                    : Math.pow(CTA_GRAVITY_REF / softened, bandFalloff);
                const pull = refAccel * drop * gravityScale * dt;
                const distance = Math.max(Math.hypot(dx, dy), 0.001);
                dot.vx += (dx / distance) * pull;
                dot.vy += (dy / distance) * pull;

                const dotSpeed = Math.hypot(dot.vx, dot.vy);
                if (dotSpeed > tuning.maxSpeed) {
                    dot.vx *= tuning.maxSpeed / dotSpeed;
                    dot.vy *= tuning.maxSpeed / dotSpeed;
                }

                if (!active) {
                    const damp = Math.exp(-dt * CTA_STOP_DRAG);
                    dot.vx *= damp;
                    dot.vy *= damp;
                }

                const fluxDamp = Math.exp(-dt * CTA_FLUX_DRAG);
                dot.wx = dot.wx * fluxDamp + (Math.random() - 0.5) * tuning.drift * dt;
                dot.wy = dot.wy * fluxDamp + (Math.random() - 0.5) * tuning.drift * dt;

                dot.x += (dot.vx + dot.wx) * dt;
                dot.y += (dot.vy + dot.wy) * dt;

                const segment = Math.max(0, halfW - halfH);
                const localX = dot.x - centerX;
                const localY = dot.y - centerY;
                const clamped = Math.max(-segment, Math.min(segment, localX));
                if (Math.hypot(localX - clamped, localY) <= halfH + dot.size / 2) {
                    swell = Math.min(CTA_HIT_CEILING, swell + dot.size * dot.size * CTA_HIT_GAIN);
                    if (dot.size > CTA_GROW_MIN_SIZE) {
                        startFade(dot, dt);
                    } else {
                        dots.splice(index, 1);
                    }
                    if (dots.length < maxDots) spawn(!active);
                    continue;
                }

                if (dot.x < -40 || dot.x > width + 40 || dot.y < -40 || dot.y > height + 40) {
                    dots.splice(index, 1);
                    if (dots.length < maxDots) spawn(!active);
                    continue;
                }

                let renderSize = dot.size;
                if (dot.size > CTA_GROW_MIN_SIZE && dot.age < CTA_GROW_SECONDS) {
                    const t = dot.age / CTA_GROW_SECONDS;
                    renderSize = 1 + (dot.size - 1) * t * (2 - t);
                }
                ctx.globalAlpha = 0.2 + (renderSize / 8) * 0.55;
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, renderSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            const targetScale = pointerRef.current ? CTA_HOVER_SCALE : 1;

            const ease = 1 - Math.exp(-dt * 14);
            scale += (targetScale - scale) * ease;
            swell *= Math.exp(-dt * 7);

            link.style.transform = `scale(${(scale + swell).toFixed(4)})`;

            if (!hovering) {
                const cols = Math.max(1, Math.floor(width / CTA_CELL));
                const rows = Math.max(1, Math.floor(height / CTA_CELL));
                const counts = new Int32Array(cols * rows);
                const cellOf = (dot: CtaDot) =>
                    Math.min(rows - 1, Math.max(0, Math.floor((dot.y / height) * rows))) * cols +
                    Math.min(cols - 1, Math.max(0, Math.floor((dot.x / width) * cols)));
                let alive = 0;
                for (const dot of dots) {
                    if (dot.dying === 0) {
                        alive++;
                        counts[cellOf(dot)]++;
                    }
                }
                const rate = 1 - Math.exp(-dt / CTA_DRAIN_TAU);
                const overfill = (alive / counts.length) * CTA_REDIST_OVERFILL;
                let toDrain = Math.ceil(Math.max(0, alive - restingDots) * rate);
                let toRefill = 0;
                for (let index = dots.length - 1; index >= 0; index--) {
                    const dot = dots[index];
                    if (dot.dying > 0) continue;
                    const cell = cellOf(dot);
                    if (counts[cell] <= overfill || Math.random() >= rate) continue;
                    dot.dying = dt;
                    counts[cell]--;
                    if (toDrain > 0) toDrain--;
                    else toRefill++;
                }
                for (let index = dots.length - 1; index >= 0 && toDrain > 0; index--) {
                    if (dots[index].dying > 0) continue;
                    dots[index].dying = dt;
                    toDrain--;
                }
                while (toRefill-- > 0) {
                    let sparsest = 0;
                    for (let cell = 1; cell < counts.length; cell++) {
                        if (counts[cell] < counts[sparsest]) sparsest = cell;
                    }
                    counts[sparsest]++;
                    makeDot(
                        randomSize(true),
                        ((sparsest % cols) + Math.random()) * (width / cols),
                        (Math.floor(sparsest / cols) + Math.random()) * (height / rows),
                    );
                }
            }

            frame = requestAnimationFrame(step);
        };

        running = true;
        frame = requestAnimationFrame(step);

        const visibility = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting === running) return;
            running = entry.isIntersecting;
            if (running) {
                last = 0;
                frame = requestAnimationFrame(step);
            } else {
                cancelAnimationFrame(frame);
                ctx.clearRect(0, 0, width, height);
            }
        });
        visibility.observe(fieldEl ?? wrap);

        const coarse = window.matchMedia('(hover: none)');
        const updateZone = () => {
            if (!coarse.matches) {
                zoneRef.current = false;
                return;
            }
            if (pageBottomGap !== undefined) {
                const doc = document.documentElement;
                zoneRef.current =
                    window.scrollY + window.innerHeight >= doc.scrollHeight - pageBottomGap - CTA_SCROLL_EPSILON;
                return;
            }
            const rect = link.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const vh = window.innerHeight;
            zoneRef.current = centerY >= vh * zoneTop && centerY <= vh * zoneBottom;
        };
        updateZone();
        window.addEventListener('scroll', updateZone, { passive: true });
        window.addEventListener('resize', updateZone);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            visibility.disconnect();
            mobile.removeEventListener('change', onMobileChange);
            window.removeEventListener('scroll', updateZone);
            window.removeEventListener('resize', updateZone);
            link.style.transform = '';
        };
    }, [
        reduced,
        fieldEl,
        zoneTop,
        zoneBottom,
        pageBottomGap,
        mobileDotScale,
        mobilePullScale,
        flightSpeedScale,
        falloff,
        softening,
        dotScale,
        desktopScope,
    ]);

    const canvasEl = !reduced && (
        <canvas
            ref={canvasRef}
            aria-hidden
            className={cn('pointer-events-none absolute', fieldEl && 'inset-0')}
            style={fieldEl ? { zIndex: 0 } : { left: -CTA_FIELD_X, top: -CTA_FIELD_Y }}
        />
    );

    return (
        <span
            ref={wrapRef}
            className={cn('relative inline-flex', wrapClassName)}
            onPointerMove={event => {
                const box = wrapRef.current?.getBoundingClientRect();
                if (!box) return;
                pointerRef.current = {
                    x: event.clientX - (box.left + box.width / 2),
                    y: event.clientY - (box.top + box.height / 2),
                };
            }}
            onPointerLeave={() => {
                pointerRef.current = undefined;
            }}
        >
            {fieldRef ? fieldEl && createPortal(canvasEl, fieldEl) : canvasEl}
            <a
                ref={linkRef}
                href={href}
                className={cn(
                    'relative flex items-center gap-2.5 rounded-md bg-dark-accent px-6 py-3.5',
                    'text-accent-950 no-underline hover:text-accent-950',
                    className,
                )}
            >
                {children}
                <ArrowRight size={15} aria-hidden />
            </a>
        </span>
    );
}
