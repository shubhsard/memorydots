// The opponents a player can add from the empty board. Only Local exists so far;
// Bot, Remote and Random are added here as they are built, so the list never offers dead options.
export type OpponentKind = "local";

export interface OpponentOption {
    kind: OpponentKind;
    title: string;
    description: string;
}

export const OPPONENT_OPTIONS: OpponentOption[] = [
    { kind: "local", title: "Local", description: "Two players, one device" },
];