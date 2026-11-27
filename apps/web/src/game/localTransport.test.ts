import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { EngineConfig, GameEvent } from "@memorydots/engine";
import { LocalTransport } from "./localTransport";
import type { Snapshot } from "./transport";

const START = 1_000_000; // fake "now" in epoch ms

const config: EngineConfig = {
    levels: [{ levelNumber: 1, levelType: "grid", dotCount: 4 }],
    playerCount: 2,
    idleMs: 10_000,
    countdownMs: 10_000,
};

const tap = (player: number, dot: number): GameEvent => ({ type: "tap", player, dot });
const leave = (player: number): GameEvent => ({ type: "leave", player });

describe("LocalTransport", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(START);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ---------- snapshots and subscribing ----------

    test("starts a fresh round with the stall clock running", () => {
        const t = new LocalTransport(config);
        const snap = t.getSnapshot();
        expect(snap.state.phase).toBe("add");
        expect(snap.state.activePlayer).toBe(0);
        expect(snap.outcome).toBeNull();
        expect(snap.roundNumber).toBe(1);
        expect(snap.clock).toEqual({ countdownStartsAt: START + 10_000, stallsOutAt: START + 20_000 });
        t.close();
    });

    test("onState calls back immediately, then after every event, until unsubscribed", () => {
        const t = new LocalTransport(config);
        const seen: Snapshot[] = [];
        const unsubscribe = t.onState((s) => seen.push(s));
        expect(seen.length).toBe(1); // immediate call

        t.send(tap(0, 2));
        expect(seen.length).toBe(2);
        expect(seen[1].outcome).toEqual({ kind: "dot_added", dot: 2, nextPlayer: 1 });

        unsubscribe();
        t.send(tap(1, 2));
        expect(seen.length).toBe(2); // no more calls
        t.close();
    });

    test("send runs the engine", () => {
        const t = new LocalTransport(config);
        t.send(tap(0, 2));
        const { state } = t.getSnapshot();
        expect(state.sequence).toEqual([2]);
        expect(state.activePlayer).toBe(1);
        expect(state.phase).toBe("replay");
        t.close();
    });

    test("an out-of-turn tap is rejected and leaves the state alone", () => {
        const t = new LocalTransport(config);
        const before = t.getSnapshot().state;
        t.send(tap(1, 0));
        expect(t.getSnapshot().outcome).toEqual({ kind: "rejected", reason: "not_your_turn" });
        expect(t.getSnapshot().state).toBe(before);
        t.close();
    });

    // ---------- stall timer ----------

    test("nothing happens before the 20 second stall limit", () => {
        const t = new LocalTransport(config);
        vi.advanceTimersByTime(19_999);
        expect(t.getSnapshot().state.phase).toBe("add");
        t.close();
    });

    test("the active player loses by timeout at 20 seconds", () => {
        const t = new LocalTransport(config);
        vi.advanceTimersByTime(20_000);
        const snap = t.getSnapshot();
        expect(snap.state.phase).toBe("ended");
        expect(snap.state.result).toEqual({ kind: "loss", loser: 0, winner: 1, reason: "timeout" });
        expect(snap.outcome?.kind).toBe("game_over");
        expect(snap.clock).toBeNull();
        t.close();
    });

    test("a tap by the active player restarts the whole 20 seconds for the next player", () => {
        const t = new LocalTransport(config);
        vi.advanceTimersByTime(15_000);
        t.send(tap(0, 2)); // player 1 is now active
        expect(t.getSnapshot().clock).toEqual({
            countdownStartsAt: START + 15_000 + 10_000,
            stallsOutAt: START + 15_000 + 20_000,
        });

        vi.advanceTimersByTime(19_999);
        expect(t.getSnapshot().state.phase).toBe("replay"); // still playing
        vi.advanceTimersByTime(1);
        expect(t.getSnapshot().state.result).toEqual({
            kind: "loss",
            loser: 1,
            winner: 0,
            reason: "timeout",
        });
        t.close();
    });

    test("a tap from the player whose turn it is not does not reset the clock", () => {
        const t = new LocalTransport(config);
        const original = t.getSnapshot().clock;
        vi.advanceTimersByTime(5_000);
        t.send(tap(1, 0)); // rejected: not player 1's turn
        expect(t.getSnapshot().clock).toEqual(original);
        vi.advanceTimersByTime(15_000); // 20s in total since the start
        expect(t.getSnapshot().state.result).toEqual({
            kind: "loss",
            loser: 0,
            winner: 1,
            reason: "timeout",
        });
        t.close();
    });

    test("any tap by the active player resets the clock, even a rejected one (spec)", () => {
        const t = new LocalTransport(config);
        t.send(tap(0, 2));
        t.send(tap(1, 2)); // player 1 replays correctly, now in the add phase
        vi.advanceTimersByTime(5_000);
        t.send(tap(1, 2)); // dot already used: rejected, but still a tap
        expect(t.getSnapshot().outcome).toEqual({ kind: "rejected", reason: "dot_already_used" });
        expect(t.getSnapshot().clock?.stallsOutAt).toBe(Date.now() + 20_000);
        t.close();
    });

    test("the timer is stopped once the round ends", () => {
        const t = new LocalTransport(config);
        const seen: Snapshot[] = [];
        t.onState((s) => seen.push(s));
        t.send(tap(0, 2));
        t.send(tap(1, 3)); // wrong replay tap ends the round
        expect(t.getSnapshot().state.phase).toBe("ended");
        const count = seen.length;
        vi.advanceTimersByTime(60_000);
        expect(seen.length).toBe(count); // no late timeout event
        t.close();
    });

    test("leaving ends the round immediately and stops the timer", () => {
        const t = new LocalTransport(config);
        const seen: Snapshot[] = [];
        t.onState((s) => seen.push(s));
        t.send(leave(1)); // not their turn, but leaving is always allowed
        const snap = t.getSnapshot();
        expect(snap.state.result).toEqual({ kind: "loss", loser: 1, winner: 0, reason: "left" });
        expect(snap.clock).toBeNull();
        const count = seen.length;
        vi.advanceTimersByTime(60_000);
        expect(seen.length).toBe(count);
        t.close();
    });

    // ---------- rematch ----------

    test("rematch is ignored while a round is in progress", () => {
        const t = new LocalTransport(config);
        const before = t.getSnapshot();
        t.rematch();
        expect(t.getSnapshot()).toBe(before);
        t.close();
    });

    test("rematch starts a fresh round and alternates the starter each round", () => {
        const t = new LocalTransport(config);
        t.send(leave(0));

        vi.advanceTimersByTime(3_000);
        t.rematch(); // round 2
        let snap = t.getSnapshot();
        expect(snap.roundNumber).toBe(2);
        expect(snap.state.activePlayer).toBe(1);
        expect(snap.state.phase).toBe("add");
        expect(snap.state.sequence).toEqual([]);
        expect(snap.state.result).toBeNull();
        expect(snap.outcome).toBeNull();
        expect(snap.clock).toEqual({
            countdownStartsAt: START + 3_000 + 10_000,
            stallsOutAt: START + 3_000 + 20_000,
        });

        t.send(leave(1));
        t.rematch(); // round 3
        snap = t.getSnapshot();
        expect(snap.roundNumber).toBe(3);
        expect(snap.state.activePlayer).toBe(0);
        t.close();
    });

    test("the stall timer works again in the new round", () => {
        const t = new LocalTransport(config);
        t.send(leave(0));
        t.rematch(); // player 1 starts
        vi.advanceTimersByTime(20_000);
        expect(t.getSnapshot().state.result).toEqual({
            kind: "loss",
            loser: 1,
            winner: 0,
            reason: "timeout",
        });
        t.close();
    });

    test("firstPlayer sets who starts round 1, and the alternation follows from it", () => {
        const t = new LocalTransport(config, 1);
        expect(t.getSnapshot().state.activePlayer).toBe(1);
        t.send(leave(1));
        t.rematch();
        expect(t.getSnapshot().state.activePlayer).toBe(0);
        t.close();
    });

    // ---------- close ----------

    test("close stops the timer, the notifications and further events", () => {
        const t = new LocalTransport(config);
        const seen: Snapshot[] = [];
        t.onState((s) => seen.push(s));
        const count = seen.length;
        const before = t.getSnapshot();

        t.close();
        vi.advanceTimersByTime(60_000);
        t.send(tap(0, 1));
        t.rematch();

        expect(seen.length).toBe(count);
        expect(t.getSnapshot()).toBe(before);
    });
});