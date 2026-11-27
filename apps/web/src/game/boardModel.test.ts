import { describe, expect, test } from "vitest";
import type { EngineConfig, GameEvent } from "@memorydots/engine";
import { dotLabel, getColumns, getDotViews } from "./boardModel";
import type { DotView } from "./boardModel";
import { LOCAL_CONFIG } from "./config";
import { snapshotAfter as run } from "./testSupport";

const tap = (player: number, dot: number): GameEvent => ({ type: "tap", player, dot });

const tappable = (views: DotView[]) => views.filter((v) => v.tappable).length;

describe("getColumns", () => {
    test("makes a roughly square grid", () => {
        expect(getColumns(25)).toBe(5);
        expect(getColumns(9)).toBe(3);
        expect(getColumns(4)).toBe(2);
        expect(getColumns(8)).toBe(3);
    });
});

describe("getDotViews", () => {
    test("turn 1 has no replay: every dot shows a plus and is tappable", () => {
        const views = getDotViews(run(LOCAL_CONFIG, []));
        expect(views.length).toBe(25);
        expect(views.every((v) => v.mark === "plus" && v.tone === "idle" && v.tappable)).toBe(true);
    });

    test("after an add the next player's board is fresh, with a green flash on the new dot", () => {
        const snap = run(LOCAL_CONFIG, [tap(0, 3)]); // P1 now replays [3]
        const fresh = getDotViews(snap);
        expect(tappable(fresh)).toBe(25);
        expect(fresh.every((v) => v.mark === "none" && v.tone === "idle")).toBe(true);

        const flashing = getDotViews(snap, 3);
        expect(flashing[3]).toEqual({ dot: 3, tone: "green", mark: "plus", tappable: true });
        expect(tappable(flashing)).toBe(25); // the flash is visual only
    });

    test("during a replay, correct dots show a tick and dim; the rest stay tappable", () => {
        const snap = run(LOCAL_CONFIG, [tap(0, 3), tap(1, 3), tap(1, 7), tap(0, 3)]); // P0 replaying [3,7], 1 done
        expect(snap.state.phase).toBe("replay");
        expect(snap.state.replayIndex).toBe(1);
        const views = getDotViews(snap);
        expect(views[3]).toEqual({ dot: 3, tone: "dim", mark: "tick", tappable: false });
        expect(views[7]).toEqual({ dot: 7, tone: "idle", mark: "none", tappable: true }); // not given away
        expect(tappable(views)).toBe(24);
    });

    test("once the whole sequence is replayed, the other dots show a plus", () => {
        const snap = run(LOCAL_CONFIG, [tap(0, 3), tap(1, 3)]); // P1 replayed [3], now adds
        expect(snap.state.phase).toBe("add");
        const views = getDotViews(snap);
        expect(views[3]).toEqual({ dot: 3, tone: "dim", mark: "tick", tappable: false });
        expect(views[0]).toEqual({ dot: 0, tone: "idle", mark: "plus", tappable: true });
        expect(tappable(views)).toBe(24);
    });

    test("a wrong tap shows a red cross on the tapped dot and green on the right one", () => {
        const snap = run(LOCAL_CONFIG, [tap(0, 3), tap(1, 9)]); // should have been 3
        expect(snap.state.phase).toBe("ended");
        const views = getDotViews(snap);
        expect(views[9]).toEqual({ dot: 9, tone: "red", mark: "cross", tappable: false });
        expect(views[3]).toEqual({ dot: 3, tone: "green", mark: "none", tappable: false });
        expect(tappable(views)).toBe(0);
        expect(views[0]).toEqual({ dot: 0, tone: "dim", mark: "none", tappable: false });
    });

    test("a stall timeout mid-replay keeps the ticks and makes nothing tappable", () => {
        const snap = run(LOCAL_CONFIG, [
            tap(0, 3),
            tap(1, 3),
            tap(1, 7),
            tap(0, 3),
            { type: "timeout", player: 0 },
        ]);
        expect(snap.state.phase).toBe("ended");
        const views = getDotViews(snap);
        expect(views[3].mark).toBe("tick");
        expect(views.some((v) => v.mark === "cross")).toBe(false);
        expect(tappable(views)).toBe(0);
    });

    test("Perfect Recall leaves every dot ticked and nothing tappable", () => {
        const small: EngineConfig = {
            levels: [{ levelNumber: 1, levelType: "grid", dotCount: 4 }],
            playerCount: 2,
            idleMs: 10_000,
            countdownMs: 10_000,
        };
        const snap = run(small, [
            tap(0, 2),
            tap(1, 2), tap(1, 0),
            tap(0, 2), tap(0, 0), tap(0, 3),
            tap(1, 2), tap(1, 0), tap(1, 3), tap(1, 1),
            tap(0, 2), tap(0, 0), tap(0, 3), tap(0, 1),
        ]);
        expect(snap.state.result).toEqual({ kind: "perfect_recall" });
        const views = getDotViews(snap);
        expect(views.every((v) => v.mark === "tick" && !v.tappable)).toBe(true);
    });
});

describe("dotLabel", () => {
    test("describes position and state without relying on colour", () => {
        const view = (over: Partial<DotView>): DotView => ({
            dot: 7,
            tone: "idle",
            mark: "none",
            tappable: true,
            ...over,
        });
        expect(dotLabel(view({}), 5)).toBe("Row 2, column 3");
        expect(dotLabel(view({ mark: "tick", tone: "dim", tappable: false }), 5)).toBe(
            "Row 2, column 3, replayed correctly"
        );
        expect(dotLabel(view({ mark: "plus" }), 5)).toBe("Row 2, column 3, available to add");
        expect(dotLabel(view({ mark: "cross", tone: "red", tappable: false }), 5)).toBe(
            "Row 2, column 3, wrong tap"
        );
        expect(dotLabel(view({ tone: "dim", tappable: false }), 5)).toBe("Row 2, column 3, not available");
    });
});