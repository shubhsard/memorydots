import type { Snapshot } from "./transport";

export interface PlayerInfo {
  name: string;      // "You", "Player 1"
  logo: string;      // "Y", "L"
  turnLabel: string; // "Your turn", "Player 1's turn"
  winLabel: string;  // "You win", "Player 1 wins"
}

/**
 * The short guide line below the board. It names whose turn it is and what to do next.
 * It deliberately never says how many dots are in the sequence: players must remember that.
 */
export function guideMessage(snapshot: Snapshot, players: PlayerInfo[]): string {
  const { state } = snapshot;
  if (state.phase === "ended") {
    // While the wrong dot is being revealed; the result message takes over afterwards.
    const result = state.result;
    return result?.kind === "loss" && result.reason === "wrong_tap" ? "Wrong tap" : "Round over";
  }
  const who = players[state.activePlayer].turnLabel;
  const action = state.phase === "replay" ? "tap the dots in order" : "pick any dot";
  return `${who}: ${action}`;
}