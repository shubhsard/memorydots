// Pure: never mutates its inputs, never reads a clock, never does I/O.

import type {
    ApplyEvent,
    CreateGame,
    EngineConfig,
    EngineResult,
    GameEvent,
    GameState,
    LossReason,
    RejectReason,
} from "./types";

export const createGame: CreateGame = (config, firstPlayer = 0) => ({
    levelIndex: 0,
    sequence: [],
    phase: "add", // an empty sequence means nothing to replay: the first player adds
    activePlayer: firstPlayer,
    replayIndex: 0,
    result: null,
});

const nextPlayer = (config: EngineConfig, player: number): number =>
    (player + 1) % config.playerCount;

const reject = (state: GameState, reason: RejectReason): EngineResult => ({
    state,
    outcome: { kind: "rejected", reason },
});

// Ends the game with `loser` losing. In a 2-player game the winner is the other player.
const lose = (
    config: EngineConfig,
    state: GameState,
    loser: number,
    reason: LossReason
): EngineResult => {
    const result = {
        kind: "loss" as const,
        loser,
        winner: nextPlayer(config, loser),
        reason,
    };
    return {
        state: { ...state, phase: "ended", result },
        outcome: { kind: "game_over", result },
    };
};

export const applyEvent: ApplyEvent = (config, state, event: GameEvent) => {
    if (state.phase === "ended") return reject(state, "game_ended");

    const player = event.player;
    if (!Number.isInteger(player) || player < 0 || player >= config.playerCount) {
        return reject(state, "unknown_player");
    }

    // A deliberate leave is allowed on anyone's turn.
    if (event.type === "leave") return lose(config, state, player, "left");

    if (player !== state.activePlayer) return reject(state, "not_your_turn");

    if (event.type === "timeout") return lose(config, state, player, "timeout");

    // ---- tap ----
    const level = config.levels[state.levelIndex];
    const dot = event.dot;
    if (!Number.isInteger(dot) || dot < 0 || dot >= level.dotCount) {
        return reject(state, "invalid_dot");
    }

    if (state.phase === "replay") {
        if (dot !== state.sequence[state.replayIndex]) {
            return lose(config, state, player, "wrong_tap");
        }

        const replayIndex = state.replayIndex + 1;
        if (replayIndex < state.sequence.length) {
            return {
                state: { ...state, replayIndex },
                outcome: { kind: "replay_correct" },
            };
        }

        // Whole sequence replayed. If it already uses every dot, the level is complete.
        if (state.sequence.length === level.dotCount) {
            const nextLevelIndex = state.levelIndex + 1;
            if (nextLevelIndex < config.levels.length) {
                const next = nextPlayer(config, player);
                return {
                    state: {
                        ...state,
                        levelIndex: nextLevelIndex,
                        sequence: [],
                        phase: "add",
                        activePlayer: next,
                        replayIndex: 0,
                    },
                    outcome: { kind: "level_complete", nextLevelIndex, nextPlayer: next },
                };
            }
            const result = { kind: "perfect_recall" as const };
            return {
                state: { ...state, replayIndex, phase: "ended", result },
                outcome: { kind: "game_over", result },
            };
        }

        // Otherwise the player now adds one new dot.
        return {
            state: { ...state, replayIndex, phase: "add" },
            outcome: { kind: "replay_finished" },
        };
    }

    // ---- phase === "add" ----
    if (state.sequence.includes(dot)) return reject(state, "dot_already_used");

    const next = nextPlayer(config, player);
    return {
        state: {
            ...state,
            sequence: [...state.sequence, dot],
            phase: "replay",
            activePlayer: next,
            replayIndex: 0,
        },
        outcome: { kind: "dot_added", dot, nextPlayer: next },
    };
};