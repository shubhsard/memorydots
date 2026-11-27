"use client";

import { useEffect, useState } from "react";
import { countdownSecondsLeft } from "./countdown";
import type { Clock } from "./transport";

const TICK_MS = 200;

/** Seconds left on the stall countdown, or null when none is showing. Re-renders about 5 times a second. */
export function useCountdown(clock: Clock | null): number | null {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (clock === null) return;
        const id = setInterval(() => setNow(Date.now()), TICK_MS);
        return () => clearInterval(id);
    }, [clock]);

    return countdownSecondsLeft(clock, now);
}