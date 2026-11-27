import type { EngineConfig, GameEvent, GameState, Outcome } from "@memorydots/engine";

// The boundary between the screen and wherever the game rules run.
// The UI only ever talks to this contract: it never runs the engine itself.
//   Local, Bot, Learn demo: the engine and stall timer run in the browser (LocalTransport).
//   Remote, Random: a WebSocket client; the server runs the engine and the stall clock.

/** When the active player's stall timer fires, so the UI can draw the countdown. */
export interface Clock {
    /** Epoch ms when the visible countdown starts (the idle limit has passed). */
    countdownStartsAt: number;
    /** Epoch ms when the active player stalls out and loses. */
    stallsOutAt: number;
}

/** Everything the UI needs to render one moment of a round. */
export interface Snapshot {
    config: EngineConfig;
    state: GameState;
    /** What the last event did (e.g. "dot_added", "rejected"); null before any event. */
    outcome: Outcome | null;
    /** null once the round has ended. */
    clock: Clock | null;
    /** 1 for the first round, +1 for every rematch. */
    roundNumber: number;
}

export interface GameTransport {
    /** The latest snapshot. */
    getSnapshot(): Snapshot;
    /** UI to host: "this player tapped this dot". */
    send(event: GameEvent): void;
    /** Start another round. Ignored unless the current round has ended. */
    rematch(): void;
    /**
     * Host to UI. Calls `callback` once right away with the current snapshot,
     * then again after every change. Returns an unsubscribe function.
     */
    onState(callback: (snapshot: Snapshot) => void): () => void;
    /** Stop timers and drop subscribers. The transport is unusable afterwards. */
    close(): void;
}