"use client";

import { useEffect, useState } from "react";
import { getColumns, getDotViews } from "../game/boardModel";
import { LOCAL_CONFIG, LOCAL_PLAYERS } from "../game/config";
import { guideMessage } from "../game/guide";
import { LocalTransport } from "../game/localTransport";
import { avatarOutcome, resultMessage } from "../game/result";
import type { GameTransport } from "../game/transport";
import { useCountdown } from "../game/useCountdown";
import { useGame } from "../game/useGame";
import { useResultStage } from "../game/useResultStage";
import Avatar from "./Avatar";
import Board from "./Board";

// Creates the in-browser transport for Local mode and cleans it up on unmount.
// (Created in an effect so React Strict Mode's mount/unmount/mount cycle gets a fresh transport.)
export default function LocalGame() {
    const [transport, setTransport] = useState<GameTransport | null>(null);

    useEffect(() => {
        const t = new LocalTransport(LOCAL_CONFIG);
        setTransport(t);
        return () => t.close();
    }, []);

    return transport ? <GameView transport={transport} /> : null;
}

// Works with any GameTransport: it never knows where the rules run.
function GameView({ transport }: { transport: GameTransport }) {
    const { snapshot, flashDot, send, rematch } = useGame(transport);
    const { state } = snapshot;
    const secondsLeft = useCountdown(snapshot.clock);

    const dots = getDotViews(snapshot, flashDot);
    const columns = getColumns(dots.length);
    const ended = state.phase === "ended";

    // After a wrong tap the board first reveals the right dot; then the result is declared,
    // and only after that can a rematch be requested.
    const stage = useResultStage(snapshot);
    const resultDeclared = stage === "result" || stage === "rematch";
    const message =
        resultDeclared && state.result !== null
            ? resultMessage(state.result, LOCAL_PLAYERS)
            : guideMessage(snapshot, LOCAL_PLAYERS);

    return (
        <div className="space-y-4">
            {/* The active player's playground has a blue border. Local mode has one shared playground. */}
            <div
                className={`rounded-2xl border-2 p-2 ${ended ? "border-transparent" : "border-blue-500"}`}
            >
                <Board
                    dots={dots}
                    columns={columns}
                    onTap={(dot) => send({ type: "tap", player: state.activePlayer, dot })}
                />
            </div>

            {/* role="status" makes this a polite live region, so screen readers announce each change. */}
            <p role="status" className="text-center">
                {message}
            </p>

            {/* The creator is always on the left. */}
            <div className="flex justify-between">
                {LOCAL_PLAYERS.map((player, index) => (
                    <Avatar
                        key={player.logo}
                        logo={player.logo}
                        name={player.name}
                        active={!ended && state.activePlayer === index}
                        countdown={!ended && state.activePlayer === index ? secondsLeft : null}
                        outcome={resultDeclared ? avatarOutcome(state.result, index) : null}
                    />
                ))}
            </div>

            {stage === "rematch" && (
                <div className="text-center">
                    <button
                        type="button"
                        onClick={rematch}
                        className="rounded border border-blue-500 px-4 py-2 text-blue-500"
                    >
                        Rematch
                    </button>
                </div>
            )}
        </div>
    );
}