import { describe, expect, test } from "vitest";
import type { GameEvent } from "@memorydots/engine";
import { LOCAL_CONFIG, LOCAL_PLAYERS } from "./config";
import { guideMessage } from "./guide";
import { snapshotAfter } from "./testSupport";

const tap = (player: number, dot: number): GameEvent => ({ type: "tap", player, dot });
const guide = (events: GameEvent[]) => guideMessage(snapshotAfter(LOCAL_CONFIG, events), LOCAL_PLAYERS);

describe("guideMessage", () => {
    test("turn 1: the first player picks any dot", () => {
        expect(guide([])).toBe("Player 1's turn: pick any dot");
    });

    test("the next player is told to replay in order", () => {
        expect(guide([tap(0, 3)])).toBe("Player 2's turn: tap the dots in order");
    });

    test("after a full replay the same player is told to pick any dot", () => {
        expect(guide([tap(0, 3), tap(1, 3)])).toBe("Player 2's turn: pick any dot");
    });

    test("it never reveals the sequence length while replaying", () => {
        const short = guide([tap(0, 3)]); // replaying 1 dot
        const long = guide([tap(0, 3), tap(1, 3), tap(1, 7), tap(0, 3), tap(0, 7), tap(0, 1)]); // replaying 3
        // Same player replaying a sequence of a different length: the message must not change.
        expect(short).toBe("Player 2's turn: tap the dots in order");
        expect(long).toBe(short);
    });

    test("the message follows the active player", () => {
        expect(guide([tap(0, 3), tap(1, 3), tap(1, 7)])).toBe("Player 1's turn: tap the dots in order");
    });

    test("a wrong tap says so while the correct dot is revealed", () => {
        expect(guide([tap(0, 3), tap(1, 9)])).toBe("Wrong tap");
    });

    test("other endings use a plain message until the result takes over", () => {
        expect(guide([tap(0, 3), { type: "timeout", player: 1 }])).toBe("Round over");
    });
});