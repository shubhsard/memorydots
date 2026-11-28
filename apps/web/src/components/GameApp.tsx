"use client";

import { useState } from "react";
import type { OpponentKind } from "../game/opponents";
import EmptyBoard from "./EmptyBoard";
import LocalGame from "./LocalGame";

// Single-page shell: no page loads. With no opponent it shows the empty board;
// leaving a game goes back to it, and unmounting the game also closes its transport.
export default function GameApp() {
    const [opponent, setOpponent] = useState<OpponentKind | null>(null);

    if (opponent === "local") return <LocalGame onLeave={() => setOpponent(null)} />;
    return <EmptyBoard onChoose={setOpponent} />;
}