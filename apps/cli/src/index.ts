// memorydots terminal adapter.
// All rules live in engine.ts. This file only reads input, calls applyEvent, and prints.
//   npm start -w @memorydots/cli   (from the repo root)

import readline from "node:readline/promises";
import { createGame, applyEvent } from "@memorydots/engine";
import type { EngineConfig, LevelDef } from "@memorydots/engine";

// Same seven levels as the original prototype. Players type 1..dotCount; the engine uses 0..dotCount-1.
const LEVELS: LevelDef[] = [
    { levelNumber: 1, levelType: "grid", dotCount: 4 },
    { levelNumber: 2, levelType: "grid", dotCount: 9 },
    { levelNumber: 3, levelType: "grid", dotCount: 25 },
    { levelNumber: 4, levelType: "circle", dotCount: 8 },
    { levelNumber: 5, levelType: "orion", dotCount: 7 },
    { levelNumber: 6, levelType: "scorpius", dotCount: 8 },
    { levelNumber: 7, levelType: "cassiopeia", dotCount: 8 },
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Keeps asking until the input parses as an integer. Whether the value is valid
// for the level is the engine's call, not ours.
async function askInteger(prompt: string, invalidMessage: string): Promise<number> {
    while (true) {
        const text = (await rl.question(prompt)).trim();
        const value = Number(text);
        if (text !== "" && Number.isInteger(value)) return value;
        console.log(invalidMessage);
    }
}

async function main(): Promise<void> {
    try {
        let playerCount = 0;
        while (playerCount <= 1) {
            playerCount = await askInteger(
                "Enter number of players: ",
                "Please enter a valid number of players (must be greater than 1)."
            );
            if (playerCount <= 1) {
                console.log("Please enter a valid number of players (must be greater than 1).");
            }
        }

        const config: EngineConfig = {
            levels: LEVELS,
            playerCount,
            idleMs: 10_000, // unused here: a terminal has no stall timer
            countdownMs: 10_000,
        };
        let state = createGame(config);

        console.log("\nGame started!");
        console.log(`Total players: ${playerCount}`);
        console.log(`Current Level: ${LEVELS[state.levelIndex].levelNumber}`);

        let turnOpen = false;

        while (state.phase !== "ended") {
            const player = state.activePlayer;

            if (!turnOpen) {
                console.log(`\n========== PLAYER ${player + 1}'S TURN ==========`);
                turnOpen = true;
            }

            const prompt =
                state.phase === "replay"
                    ? `Guess element ${state.replayIndex}: `
                    : `Player ${player + 1}, enter a new element value for element ${state.sequence.length}: `;
            const value = await askInteger(prompt, "Invalid element value. Please enter a valid value.");

            const before = state;
            const { state: next, outcome } = applyEvent(config, state, {
                type: "tap",
                player,
                dot: value - 1,
            });
            state = next;

            switch (outcome.kind) {
                case "rejected":
                    console.log(
                        outcome.reason === "dot_already_used"
                            ? "Element value already exists. Enter a unique value."
                            : "Invalid element value. Please enter a valid value."
                    );
                    break;

                case "replay_correct":
                case "replay_finished":
                    console.log(`Correct! Player ${player + 1} recalled element ${before.replayIndex}.`);
                    break;

                case "dot_added":
                    console.log(`\nElement ${before.sequence.length} added successfully!`);
                    turnOpen = false;
                    break;

                case "level_complete": {
                    const done = LEVELS[before.levelIndex];
                    const nextLevel = LEVELS[outcome.nextLevelIndex];
                    console.log(`Correct! Player ${player + 1} recalled element ${before.replayIndex}.`);
                    console.log(`\nPlayer ${player + 1} has completed Level ${done.levelNumber}!`);
                    console.log(`\nMoving to Level ${nextLevel.levelNumber}`);
                    console.log(`Level type: ${nextLevel.levelType}`);
                    turnOpen = false;
                    break;
                }

                case "game_over": {
                    const result = outcome.result;
                    if (result.kind === "perfect_recall") {
                        console.log(`Correct! Player ${player + 1} recalled element ${before.replayIndex}.`);
                        console.log(
                            `\nPlayer ${player + 1} has completed Level ${LEVELS[before.levelIndex].levelNumber}!`
                        );
                        console.log("\nCongratulations! All levels completed!");
                    } else {
                        console.log("\nIncorrect!");
                        if (result.reason === "wrong_tap") {
                            console.log(
                                `The correct value for element ${before.replayIndex} was ${before.sequence[before.replayIndex] + 1}`
                            );
                        }
                        console.log(
                            playerCount === 2
                                ? `Player ${result.loser + 1} loses. Player ${result.winner + 1} wins!`
                                : `Player ${result.loser + 1} loses.`
                        );
                    }
                    break;
                }
            }
        }

        console.log("\n========== GAME OVER ==========");
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        rl.close();
    }
}

main();