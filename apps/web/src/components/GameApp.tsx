"use client";

import { useState } from "react";
import Landing from "./Landing";
import LocalGame from "./LocalGame";

type Screen = "landing" | "local";

// Single-page shell: switches between screens with no page loads.
// Leaving a game unmounts it, which also closes its transport and stops its timers.
export default function GameApp() {
    const [screen, setScreen] = useState<Screen>("landing");

    if (screen === "local") return <LocalGame onLeave={() => setScreen("landing")} />;
    return <Landing onPlayLocal={() => setScreen("local")} />;
}