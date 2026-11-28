import { describe, expect, test } from "vitest";
import type { Result } from "@memorydots/engine";
import { LOCAL_PLAYERS } from "./config";
import { avatarOutcome, hasReveal, resultMessage, resultSchedule } from "./result";

const wrongTap: Result = { kind: "loss", loser: 1, winner: 0, reason: "wrong_tap" };
const timeout: Result = { kind: "loss", loser: 0, winner: 1, reason: "timeout" };
const left: Result = { kind: "loss", loser: 1, winner: 0, reason: "left" };
const perfect: Result = { kind: "perfect_recall" };

describe("resultSchedule", () => {
    test("a wrong tap reveals for 2 s, declares the result for 2 s, then allows a rematch", () => {
        expect(resultSchedule(true)).toEqual([
            { stage: "reveal", atMs: 0 },
            { stage: "result", atMs: 1_000 },
            { stage: "rematch", atMs: 2_000 },
        ]);
    });

    test("other endings skip the reveal", () => {
        expect(resultSchedule(false)).toEqual([
            { stage: "result", atMs: 0 },
            { stage: "rematch", atMs: 1_000 },
        ]);
    });

    test("only a wrong tap has a reveal", () => {
        expect(hasReveal(wrongTap)).toBe(true);
        expect(hasReveal(timeout)).toBe(false);
        expect(hasReveal(left)).toBe(false);
        expect(hasReveal(perfect)).toBe(false);
        expect(hasReveal(null)).toBe(false);
    });
});

describe("avatarOutcome", () => {
    test("the winner is crowned and the loser gets the red ring", () => {
        expect(avatarOutcome(wrongTap, 0)).toBe("winner");
        expect(avatarOutcome(wrongTap, 1)).toBe("loser");
    });

    test("Perfect Recall crowns both players", () => {
        expect(avatarOutcome(perfect, 0)).toBe("winner");
        expect(avatarOutcome(perfect, 1)).toBe("winner");
    });

    test("nobody is marked before there is a result", () => {
        expect(avatarOutcome(null, 0)).toBeNull();
    });
});

describe("resultMessage", () => {
    test("names the winner and says why", () => {
        expect(resultMessage(wrongTap, LOCAL_PLAYERS)).toBe("Player 1 wins: Player 2 tapped the wrong dot");
        expect(resultMessage(timeout, LOCAL_PLAYERS)).toBe("Player 2 wins: Player 1 ran out of time");
        expect(resultMessage(left, LOCAL_PLAYERS)).toBe("Player 1 wins: Player 2 left");
    });

    test("the shared ending uses its spec name", () => {
        expect(resultMessage(perfect, LOCAL_PLAYERS)).toBe("Perfect Recall – both players win");
    });
});