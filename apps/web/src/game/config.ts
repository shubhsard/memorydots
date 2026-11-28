import type { EngineConfig } from "@memorydots/engine";
import type { PlayerInfo } from "./guide";

// MVP: a single level, the 5x5 grid of 25 dots, two players.
// Stall limits match the spec: 10 s idle, then a visible 10 s countdown.
export const LOCAL_CONFIG: EngineConfig = {
  levels: [{ levelNumber: 1, levelType: "grid", dotCount: 25 }],
  playerCount: 2,
  idleMs: 10_000,
  countdownMs: 10_000,
};

// Number of dots on the board, also used for the empty board shown before an opponent is added.
export const BOARD_DOT_COUNT = LOCAL_CONFIG.levels[0].dotCount;

// How long a newly added dot keeps its green flash (spec: about 3 seconds).
export const ADDED_FLASH_MS = 1_000;

// Local mode: two people share one device. The creator ("You", Y) is on the left and goes first.
export const LOCAL_PLAYERS: PlayerInfo[] = [
  { name: "You", logo: "Y", turnLabel: "Your turn", winLabel: "You win" },
  { name: "Local", logo: "L", turnLabel: "Local's turn", winLabel: "Local wins" },
];