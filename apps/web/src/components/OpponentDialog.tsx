"use client";

import { useEffect, useRef } from "react";
import { OPPONENT_OPTIONS } from "../game/opponents";
import type { OpponentKind } from "../game/opponents";

interface OpponentDialogProps {
    onChoose: (kind: OpponentKind) => void;
    onClose: () => void;
}

// A native modal <dialog> listing the opponents: the browser handles the focus trap and Escape.
// Render it only while it should be open.
export default function OpponentDialog({ onChoose, onClose }: OpponentDialogProps) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = ref.current;
        if (dialog && !dialog.open) dialog.showModal();
    }, []);

    return (
        <dialog
            ref={ref}
            aria-labelledby="opponent-title"
            onClose={onClose}
            className="m-auto w-[min(90vw,22rem)] rounded-2xl bg-neutral-900 p-6 text-white backdrop:bg-black/60 backdrop:backdrop-blur-sm"
        >
            <h2 id="opponent-title" className="text-lg font-semibold">
                Choose an opponent
            </h2>
            <ul className="mt-4 space-y-2">
                {OPPONENT_OPTIONS.map((option) => (
                    <li key={option.kind}>
                        <button
                            type="button"
                            onClick={() => onChoose(option.kind)}
                            className="w-full rounded-xl bg-white/10 px-4 py-3 text-left"
                        >
                            <span className="block font-semibold">{option.title}</span>
                            <span className="block text-sm text-white/70">{option.description}</span>
                        </button>
                    </li>
                ))}
            </ul>
            <div className="mt-4 text-right">
                <button type="button" onClick={onClose} className="text-blue-500">
                    Cancel
                </button>
            </div>
        </dialog>
    );
}