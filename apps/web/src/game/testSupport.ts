import { applyEvent, createGame } from "@memorydots/engine";
import type { EngineConfig, GameEvent, Outcome } from "@memorydots/engine";
import type { Snapshot } from "./transport";

// Test helper: replays events through the real engine and wraps the result as a snapshot.
export function snapshotAfter(config: EngineConfig, events: GameEvent[]): Snapshot {
    let state = createGame(config);
    let outcome: Outcome | null = null;
    let lastTap: Snapshot["lastTap"] = null;
    for (const e of events) {
        const r = applyEvent(config, state, e);
        state = r.state;
        outcome = r.outcome;
        lastTap = e.type === "tap" ? { player: e.player, dot: e.dot } : null;
    }
    return { config, state, outcome, clock: null, lastTap, roundNumber: 1 };
}