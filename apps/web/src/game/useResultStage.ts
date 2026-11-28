"use client";

import { useEffect, useState } from "react";
import { hasReveal, resultSchedule } from "./result";
import type { ResultStage } from "./result";
import type { Snapshot } from "./transport";

/** Which stage of the end-of-round sequence to show, or null while the round is live. */
export function useResultStage(snapshot: Snapshot): ResultStage | null {
    const ended = snapshot.state.phase === "ended";
    const reveal = hasReveal(snapshot.state.result);
    const round = snapshot.roundNumber;
    const [stored, setStored] = useState<{ round: number; stage: ResultStage } | null>(null);

    useEffect(() => {
        if (!ended) return;
        const timers = resultSchedule(reveal)
            .filter((step) => step.atMs > 0)
            .map((step) => setTimeout(() => setStored({ round, stage: step.stage }), step.atMs));
        return () => timers.forEach(clearTimeout);
    }, [ended, reveal, round]);

    if (!ended) return null;
    // A stage stored for an earlier round is ignored, so a rematch starts clean.
    return stored !== null && stored.round === round ? stored.stage : resultSchedule(reveal)[0].stage;
}