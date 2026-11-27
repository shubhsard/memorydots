import type { Snapshot } from "./transport";

export interface PlayerInfo {
  name: string;      // "You", "Local"
  logo: string;      // "Y", "L"
  turnLabel: string; // "Your turn", "Local's turn"
}

/**
 * The short guide line below the board. It names whose turn it is and what to do next.
 * It deliberately never says how many dots are in the sequence: players must remember that.
 */
export function guideMessage(snapshot: Snapshot, players: PlayerInfo[]): string {
  const { state } = snapshot;
  if (state.phase === "ended") return "Round over"; // replaced by real result messages in step 3c
  const who = players[state.activePlayer].turnLabel;
  const action = state.phase === "replay" ? "tap the dots in order" : "pick any dot";
  return `${who}: ${action}`;
}