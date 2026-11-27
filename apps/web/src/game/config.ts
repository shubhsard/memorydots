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

// How long a newly added dot keeps its green flash (spec: about 3 seconds).
export const ADDED_FLASH_MS = 1_000;

// Local mode: two people share one device. The creator ("You", Y) is on the left and goes first.
export const LOCAL_PLAYERS: PlayerInfo[] = [
  { name: "You", logo: "Y", turnLabel: "Your turn" },
  { name: "Local", logo: "L", turnLabel: "Local's turn" },
];