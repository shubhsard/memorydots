import { describe, expect, test } from "vitest";
import type { GameEvent } from "@memorydots/engine";
import { LOCAL_CONFIG, LOCAL_PLAYERS } from "./config";
import { guideMessage } from "./guide";
import { snapshotAfter } from "./testSupport";

const tap = (player: number, dot: number): GameEvent => ({ type: "tap", player, dot });
const guide = (events: GameEvent[]) => guideMessage(snapshotAfter(LOCAL_CONFIG, events), LOCAL_PLAYERS);

describe("guideMessage", () => {
    test("turn 1: the first player picks any dot", () => {
        expect(guide([])).toBe("Your turn: pick any dot");
    });

    test("the next player is told to replay in order", () => {
        expect(guide([tap(0, 3)])).toBe("Local's turn: tap the dots in order");
    });

    test("after a full replay the same player is told to pick any dot", () => {
        expect(guide([tap(0, 3), tap(1, 3)])).toBe("Local's turn: pick any dot");
    });

    test("it never reveals the sequence length while replaying", () => {
        const short = guide([tap(0, 3)]); // replaying 1 dot
        const long = guide([tap(0, 3), tap(1, 3), tap(1, 7), tap(0, 3), tap(0, 7), tap(0, 1)]); // replaying 3
        expect(long).toBe("Local's turn: tap the dots in order");
        expect(short.replace("Local's", "X")).toBe(long.replace("Local's", "X"));
        expect(/\d/.test(short + long)).toBe(false);
    });

    test("the message follows the active player", () => {
        expect(guide([tap(0, 3), tap(1, 3), tap(1, 7)])).toBe("Your turn: tap the dots in order");
    });

    test("a wrong tap says so while the correct dot is revealed", () => {
        expect(guide([tap(0, 3), tap(1, 9)])).toBe("Wrong tap");
    });

    test("other endings use a plain message until the result takes over", () => {
        expect(guide([tap(0, 3), { type: "timeout", player: 1 }])).toBe("Round over");
    });
});