"use client";

import { useState } from "react";
import { getColumns, getIdleDotViews } from "../game/boardModel";
import { BOARD_DOT_COUNT, LOCAL_PLAYERS } from "../game/config";
import type { OpponentKind } from "../game/opponents";
import Avatar from "./Avatar";
import Board from "./Board";
import OpponentDialog from "./OpponentDialog";
import OpponentSlot from "./OpponentSlot";

interface EmptyBoardProps {
    onChoose: (kind: OpponentKind) => void;
}

// The landing screen: the same layout as a game, but the dots are untappable
// until an opponent is added in the empty slot on the right.
export default function EmptyBoard({ onChoose }: EmptyBoardProps) {
    const [choosing, setChoosing] = useState(false);
    const dots = getIdleDotViews(BOARD_DOT_COUNT);
    const you = LOCAL_PLAYERS[0];

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border-2 border-transparent p-2">
                <Board dots={dots} columns={getColumns(dots.length)} onTap={() => { }} />
            </div>

            <p role="status" className="text-center">
                Add an opponent to start
            </p>

            <div className="flex justify-between">
                <Avatar logo={you.logo} name={you.name} active={false} />
                <OpponentSlot onClick={() => setChoosing(true)} />
            </div>

            {choosing && <OpponentDialog onChoose={onChoose} onClose={() => setChoosing(false)} />}
        </div>
    );
}