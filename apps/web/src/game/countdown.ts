import type { Clock } from "./transport";

/**
 * Seconds to show on the active player's avatar, or null when no countdown is visible.
 * The countdown only appears once the idle limit has passed (the last 10 seconds of the
 * 20-second allowance) and counts 10, 9, ... 1, then 0 at the moment they stall out.
 */
export function countdownSecondsLeft(clock: Clock | null, now: number): number | null {
    if (clock === null || now < clock.countdownStartsAt) return null;
    const msLeft = Math.max(0, clock.stallsOutAt - now);
    return Math.ceil(msLeft / 1000);
}