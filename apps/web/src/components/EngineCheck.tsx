"use client";

import { useState } from "react";
import { applyEvent, createGame } from "@memorydots/engine";
import type { EngineConfig, GameState, Outcome } from "@memorydots/engine";

// Temporary debug view: proves the shared engine runs in the browser.
// A tiny 4-dot level. The real game never shows the sequence; this view does, on purpose.
const config: EngineConfig = {
    levels: [{ levelNumber: 1, levelType: "grid", dotCount: 4 }],
    playerCount: 2,
    idleMs: 10_000,
    countdownMs: 10_000,
};

export default function EngineCheck() {
    const [state, setState] = useState<GameState>(() => createGame(config));
    const [outcome, setOutcome] = useState<Outcome | null>(null);

    function tapDot(dot: number) {
        const result = applyEvent(config, state, {
            type: "tap",
            player: state.activePlayer,
            dot,
        });
        setState(result.state);
        setOutcome(result.outcome);
    }

    function reset() {
        setState(createGame(config));
        setOutcome(null);
    }

    const ended = state.phase === "ended";

    return (
        <section className="space-y-4">
            <p>
                Player {state.activePlayer + 1} to{" "}
                <strong>{state.phase === "replay" ? "replay" : "add"}</strong>
                {state.phase === "replay" && ` (dot ${state.replayIndex + 1} of ${state.sequence.length})`}
            </p>

            <div className="flex gap-2">
                {[0, 1, 2, 3].map((dot) => (
                    <button
                        key={dot}
                        onClick={() => tapDot(dot)}
                        disabled={ended}
                        className="h-14 w-14 rounded-full bg-indigo-600 text-white disabled:opacity-40"
                    >
                        {dot + 1}
                    </button>
                ))}
            </div>

            <p>Sequence (debug): {state.sequence.map((d) => d + 1).join(", ") || "empty"}</p>
            <p>Last outcome: {outcome ? outcome.kind : "none"}</p>
            {ended && <p className="font-semibold">Result: {JSON.stringify(state.result)}</p>}

            <button onClick={reset} className="rounded border px-3 py-1">
                Reset
            </button>
        </section>
    );
}