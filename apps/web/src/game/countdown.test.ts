import { describe, expect, test } from "vitest";
import { countdownSecondsLeft } from "./countdown";

// 10 s idle, then a visible 10 s countdown, starting from time 0.
const clock = { countdownStartsAt: 10_000, stallsOutAt: 20_000 };

describe("countdownSecondsLeft", () => {
    test("there is no countdown without a clock (the round has ended)", () => {
        expect(countdownSecondsLeft(null, 15_000)).toBeNull();
    });

    test("nothing is shown during the idle period", () => {
        expect(countdownSecondsLeft(clock, 0)).toBeNull();
        expect(countdownSecondsLeft(clock, 9_999)).toBeNull();
    });

    test("it starts at 10 the moment the idle limit passes", () => {
        expect(countdownSecondsLeft(clock, 10_000)).toBe(10);
    });

    test("it counts down in whole seconds, rounding up", () => {
        expect(countdownSecondsLeft(clock, 10_001)).toBe(10);
        expect(countdownSecondsLeft(clock, 11_000)).toBe(9);
        expect(countdownSecondsLeft(clock, 15_500)).toBe(5);
        expect(countdownSecondsLeft(clock, 19_000)).toBe(1);
        expect(countdownSecondsLeft(clock, 19_999)).toBe(1);
    });

    test("it reaches 0 when they stall out and never goes negative", () => {
        expect(countdownSecondsLeft(clock, 20_000)).toBe(0);
        expect(countdownSecondsLeft(clock, 25_000)).toBe(0);
    });
});