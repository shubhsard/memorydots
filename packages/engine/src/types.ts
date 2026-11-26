// Types only. No logic, no I/O, no clock. The engine is a pure function:
//   applyEvent(config, state, event) -> { state, outcome }

// ---------- Config (static for a match) ----------

export type DotId = number; // 0-based index into a level's dots

export interface LevelDef {
    levelNumber: number;
    levelType: string; // "grid" | "circle" | "orion" | ...; presentation only
    dotCount: number;  // valid dots are 0 .. dotCount-1
}

export interface EngineConfig {
    levels: LevelDef[];  // MVP: one level, the 5x5 grid (dotCount 25)
    playerCount: number; // 2 in MVP; the CLI prototype allows more
    // Timing constants live here for the host (server, client, CLI) to enforce.
    // The engine never reads a clock; the host sends a "timeout" event instead.
    idleMs: number;      // e.g. 10_000
    countdownMs: number; // e.g. 10_000
}

// ---------- State (changes every event, never mutated) ----------

export type Phase =
    | "replay" // active player must tap the sequence back, in order
    | "add"    // active player must tap one new dot not yet in the sequence
    | "ended"; // no further events are accepted

export type LossReason = "wrong_tap" | "timeout" | "left";

export type Result =
    | { kind: "loss"; loser: number; winner: number; reason: LossReason }
    | { kind: "perfect_recall" }; // everyone wins

export interface GameState {
    readonly levelIndex: number;
    readonly sequence: readonly DotId[]; // the single source of truth
    readonly phase: Phase;
    readonly activePlayer: number;       // 0-based player index
    readonly replayIndex: number;        // correct taps so far this turn
    readonly result: Result | null;      // non-null only when phase is "ended"
}

// ---------- Events (input) ----------

export type GameEvent =
    | { type: "tap"; player: number; dot: DotId }
    | { type: "timeout"; player: number } // host decided the stall limit passed
    | { type: "leave"; player: number };  // deliberate forfeit

// ---------- Outcome (output, so every UI can react without diffing) ----------

export type RejectReason =
    | "game_ended"
    | "not_your_turn"
    | "unknown_player"  // player index outside 0 .. playerCount-1
    | "invalid_dot"     // not a dot of the current level
    | "dot_already_used"; // add phase: dot is already in the sequence

export type Outcome =
    | { kind: "rejected"; reason: RejectReason }        // state unchanged
    | { kind: "replay_correct" }                        // one more replayed
    | { kind: "replay_finished" }                       // now in "add" phase
    | { kind: "dot_added"; dot: DotId; nextPlayer: number }
    | { kind: "level_complete"; nextLevelIndex: number; nextPlayer: number }
    | { kind: "game_over"; result: Result };

export interface EngineResult {
    state: GameState;
    outcome: Outcome;
}

// ---------- Function signatures (implemented in Step 2) ----------

export type CreateGame = (config: EngineConfig, firstPlayer?: number) => GameState;
export type ApplyEvent = (
    config: EngineConfig,
    state: GameState,
    event: GameEvent
) => EngineResult;