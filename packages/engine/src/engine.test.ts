// memorydots rules engine: unit tests (Vitest).
// Run from the repo root with `npm test`, or from this package with `npx vitest run`.

import { test, expect } from "vitest";
import { createGame, applyEvent } from "./engine";
import type { EngineConfig, GameEvent, GameState } from "./types";

// ---------- helpers ----------

const cfg = (dotCounts: number[] = [4], playerCount = 2): EngineConfig => ({
    levels: dotCounts.map((dotCount, i) => ({
        levelNumber: i + 1,
        levelType: "grid",
        dotCount,
    })),
    playerCount,
    idleMs: 10_000,
    countdownMs: 10_000,
});

const tap = (player: number, dot: number): GameEvent => ({ type: "tap", player, dot });

// Plays one full normal turn: the active player replays the whole sequence, then adds `dot`.
function turn(c: EngineConfig, s: GameState, dot: number): GameState {
    const p = s.activePlayer;
    for (const d of s.sequence) s = applyEvent(c, s, tap(p, d)).state;
    return applyEvent(c, s, tap(p, dot)).state;
}

// Plays turns adding each dot in `order`, returning the state after the last add.
function playAdds(c: EngineConfig, s: GameState, order: number[]): GameState {
    for (const dot of order) s = turn(c, s, dot);
    return s;
}

function deepFreeze<T>(o: T): T {
    if (o && typeof o === "object") {
        Object.values(o).forEach(deepFreeze);
        Object.freeze(o);
    }
    return o;
}

// ---------- start of game ----------

test("createGame starts empty, in add phase, player 0 active", () => {
    const s = createGame(cfg());
    expect(s.sequence).toEqual([]);
    expect(s.phase).toBe("add");
    expect(s.activePlayer).toBe(0);
    expect(s.levelIndex).toBe(0);
    expect(s.replayIndex).toBe(0);
    expect(s.result).toBeNull();
});

test("createGame can start with another player", () => {
    expect(createGame(cfg(), 1).activePlayer).toBe(1);
});

// ---------- add phase ----------

test("adding a dot appends it and passes the turn to replay", () => {
    const c = cfg();
    const r = applyEvent(c, createGame(c), tap(0, 2));
    expect(r.state.sequence).toEqual([2]);
    expect(r.state.phase).toBe("replay");
    expect(r.state.activePlayer).toBe(1);
    expect(r.state.replayIndex).toBe(0);
    expect(r.outcome).toEqual({ kind: "dot_added", dot: 2, nextPlayer: 1 });
});

test("add phase: a dot already in the sequence is rejected, not a loss", () => {
    const c = cfg();
    let s = playAdds(c, createGame(c), [2]); // P1 to replay then add
    s = applyEvent(c, s, tap(1, 2)).state; // replay [2] correctly -> add phase
    expect(s.phase).toBe("add");
    const r = applyEvent(c, s, tap(1, 2));
    expect(r.outcome).toEqual({ kind: "rejected", reason: "dot_already_used" });
    expect(r.state).toBe(s); // unchanged, same object
});

test("invalid dots are rejected: negative, too large, fractional, NaN", () => {
    const c = cfg([4]);
    const s = createGame(c);
    for (const dot of [-1, 4, 25, 1.5, NaN]) {
        const r = applyEvent(c, s, tap(0, dot));
        expect(r.outcome, `dot ${dot}`).toEqual({ kind: "rejected", reason: "invalid_dot" });
        expect(r.state).toBe(s);
    }
});

// ---------- turn and player checks ----------

test("tapping out of turn is rejected", () => {
    const c = cfg();
    const s = createGame(c);
    expect(applyEvent(c, s, tap(1, 0)).outcome).toEqual({
        kind: "rejected",
        reason: "not_your_turn",
    });
});

test("unknown player indexes are rejected", () => {
    const c = cfg();
    const s = createGame(c);
    for (const player of [-1, 2, 0.5, NaN]) {
        expect(applyEvent(c, s, tap(player, 0)).outcome).toEqual({
            kind: "rejected",
            reason: "unknown_player",
        });
    }
    expect(applyEvent(c, s, { type: "leave", player: 7 }).outcome).toEqual({
        kind: "rejected",
        reason: "unknown_player",
    });
});

// ---------- replay phase ----------

test("correct replay taps advance replayIndex, then move to add", () => {
    const c = cfg();
    let s = playAdds(c, createGame(c), [2]);
    s = playAdds(c, s, [0]); // P1 replays [2], adds 0 -> sequence [2,0], P0 to replay
    let r = applyEvent(c, s, tap(0, 2));
    expect(r.outcome).toEqual({ kind: "replay_correct" });
    expect(r.state.replayIndex).toBe(1);
    expect(r.state.phase).toBe("replay");
    r = applyEvent(c, r.state, tap(0, 0));
    expect(r.outcome).toEqual({ kind: "replay_finished" });
    expect(r.state.phase).toBe("add");
    expect(r.state.activePlayer).toBe(0);
});

test("a wrong replay tap loses; the other player wins", () => {
    const c = cfg();
    const s = playAdds(c, createGame(c), [2]);
    const r = applyEvent(c, s, tap(1, 3));
    expect(r.state.phase).toBe("ended");
    expect(r.state.result).toEqual({ kind: "loss", loser: 1, winner: 0, reason: "wrong_tap" });
    expect(r.outcome.kind).toBe("game_over");
});

test("replaying a dot out of order is a wrong tap", () => {
    const c = cfg();
    const s = playAdds(c, createGame(c), [2, 0]); // P0 must replay [2,0]
    const r = applyEvent(c, s, tap(0, 0)); // 0 first instead of 2
    expect(r.state.result?.kind).toBe("loss");
});

// ---------- timeout and leave ----------

test("timeout by the active player is a loss", () => {
    const c = cfg();
    const s = playAdds(c, createGame(c), [2]);
    const r = applyEvent(c, s, { type: "timeout", player: 1 });
    expect(r.state.result).toEqual({ kind: "loss", loser: 1, winner: 0, reason: "timeout" });
});

test("timeout for a player who is not active is rejected", () => {
    const c = cfg();
    const s = playAdds(c, createGame(c), [2]);
    expect(applyEvent(c, s, { type: "timeout", player: 0 }).outcome).toEqual({
        kind: "rejected",
        reason: "not_your_turn",
    });
});

test("leave works on anyone's turn and loses for the leaver", () => {
    const c = cfg();
    const s = playAdds(c, createGame(c), [2]); // P1 is active
    const r = applyEvent(c, s, { type: "leave", player: 0 });
    expect(r.state.result).toEqual({ kind: "loss", loser: 0, winner: 1, reason: "left" });
});

test("nothing is accepted after the game has ended", () => {
    const c = cfg();
    const ended = applyEvent(c, playAdds(c, createGame(c), [2]), tap(1, 3)).state;
    const events: GameEvent[] = [
        tap(0, 1),
        tap(1, 2),
        { type: "timeout", player: 0 },
        { type: "leave", player: 1 },
    ];
    for (const e of events) {
        const r = applyEvent(c, ended, e);
        expect(r.outcome).toEqual({ kind: "rejected", reason: "game_ended" });
        expect(r.state).toBe(ended);
    }
});

// ---------- level completion and Perfect Recall ----------

test("full sequence replayed on the final level ends in perfect_recall", () => {
    const c = cfg([4]);
    let s = playAdds(c, createGame(c), [2, 0, 3, 1]); // P1 added the 4th dot, P0 must replay
    expect(s.sequence.length).toBe(4);
    expect(s.activePlayer).toBe(0);
    let r;
    for (const d of s.sequence) {
        r = applyEvent(c, s, tap(0, d));
        s = r.state;
    }
    expect(s.phase).toBe("ended");
    expect(s.result).toEqual({ kind: "perfect_recall" });
    expect(r!.outcome).toEqual({ kind: "game_over", result: { kind: "perfect_recall" } });
});

test("25-dot spec scenario: P1 (index 0) adds the 25th dot, P2 replays all 25", () => {
    const c = cfg([25]);
    const order = Array.from({ length: 25 }, (_, i) => (i * 7) % 25); // a permutation of 0..24
    let s = playAdds(c, createGame(c), order);
    expect(s.sequence.length).toBe(25);
    expect(s.activePlayer).toBe(1); // second player must replay everything
    for (const d of s.sequence) s = applyEvent(c, s, tap(1, d)).state;
    expect(s.result).toEqual({ kind: "perfect_recall" });
});

test("completing a non-final level advances, resets, and gives the next player the first add", () => {
    const c = cfg([2, 3]);
    const s = playAdds(c, createGame(c), [1, 0]); // P0 added 1, P1 added 0; P0 must replay [1,0]
    expect(s.activePlayer).toBe(0);
    let r = applyEvent(c, s, tap(0, 1));
    r = applyEvent(c, r.state, tap(0, 0));
    expect(r.outcome).toEqual({ kind: "level_complete", nextLevelIndex: 1, nextPlayer: 1 });
    expect(r.state.levelIndex).toBe(1);
    expect(r.state.sequence).toEqual([]);
    expect(r.state.phase).toBe("add");
    expect(r.state.activePlayer).toBe(1);
    expect(r.state.replayIndex).toBe(0);
    expect(r.state.result).toBeNull();
    // dot 2 only exists on the new level
    expect(applyEvent(c, r.state, tap(1, 2)).outcome.kind).toBe("dot_added");
});

test("dot validity follows the current level's dotCount", () => {
    const c = cfg([2, 3]);
    const s = createGame(c);
    expect(applyEvent(c, s, tap(0, 2)).outcome.kind).toBe("rejected"); // level 1 has dots 0,1
});

// ---------- purity ----------

test("applyEvent never mutates its input state", () => {
    const c = cfg();
    const s0 = deepFreeze(createGame(c));
    const s1 = deepFreeze(applyEvent(c, s0, tap(0, 2)).state);
    const s2 = deepFreeze(applyEvent(c, s1, tap(1, 2)).state);
    deepFreeze(applyEvent(c, s2, tap(1, 3)).state); // would throw in strict mode on any mutation
    expect(s0.sequence).toEqual([]);
    expect(s1.sequence).toEqual([2]);
});

test("applyEvent is deterministic", () => {
    const c = cfg();
    const s = playAdds(c, createGame(c), [2, 0]);
    const e = tap(0, 2);
    expect(applyEvent(c, s, e)).toEqual(applyEvent(c, s, e));
});

test("a full random-order game never reaches an inconsistent state", () => {
    const c = cfg([9]);
    const order = [4, 1, 8, 0, 6, 2, 7, 3, 5];
    let s = createGame(c);
    for (const dot of order) {
        s = turn(c, s, dot);
        expect(new Set(s.sequence).size).toBe(s.sequence.length); // no duplicates
        expect(s.phase).toBe("replay");
    }
    for (const d of s.sequence) s = applyEvent(c, s, tap(s.activePlayer, d)).state;
    expect(s.result?.kind).toBe("perfect_recall");
});