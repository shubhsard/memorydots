import type { Result } from "@memorydots/engine";
import type { PlayerInfo } from "./guide";

// The end of a round plays out in stages (spec): after a wrong tap the wrong dot and the
// correct dot are revealed for about 2 s, then the result is declared for about 2 s, then
// the rematch becomes available. Other endings skip the reveal.
export type ResultStage = "reveal" | "result" | "rematch";

export const REVEAL_MS = 1_000;
export const RESULT_MS = 1_000;

export function hasReveal(result: Result | null): boolean {
    return result?.kind === "loss" && result.reason === "wrong_tap";
}

/** When each stage begins, in ms after the round ended. The first stage always starts at 0. */
export function resultSchedule(reveal: boolean): { stage: ResultStage; atMs: number }[] {
    return reveal
        ? [
            { stage: "reveal", atMs: 0 },
            { stage: "result", atMs: REVEAL_MS },
            { stage: "rematch", atMs: REVEAL_MS + RESULT_MS },
        ]
        : [
            { stage: "result", atMs: 0 },
            { stage: "rematch", atMs: RESULT_MS },
        ];
}

export type AvatarOutcome = "winner" | "loser" | null;

/** Crown for a winner, red ring for the loser. Perfect Recall crowns everyone (spec open item 6). */
export function avatarOutcome(result: Result | null, playerIndex: number): AvatarOutcome {
    if (result === null) return null;
    if (result.kind === "perfect_recall") return "winner";
    if (playerIndex === result.winner) return "winner";
    if (playerIndex === result.loser) return "loser";
    return null;
}

export function resultMessage(result: Result, players: PlayerInfo[]): string {
    if (result.kind === "perfect_recall") return "Perfect Recall – both players win";
    const winner = players[result.winner];
    const loser = players[result.loser];
    const why =
        result.reason === "wrong_tap"
            ? `${loser.name} tapped the wrong dot`
            : result.reason === "timeout"
                ? `${loser.name} ran out of time`
                : `${loser.name} left`;
    return `${winner.winLabel}: ${why}`;
}