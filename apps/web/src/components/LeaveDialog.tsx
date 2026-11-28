"use client";

import { useEffect, useRef } from "react";

interface LeaveDialogProps {
    onLeave: () => void;
    onStay: () => void;
}

// A native modal <dialog>: the browser handles the focus trap, Escape, and inert background.
// Render it only while it should be open; Escape counts as "Stay".
export default function LeaveDialog({ onLeave, onStay }: LeaveDialogProps) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = ref.current;
        if (dialog && !dialog.open) dialog.showModal();
    }, []);

    return (
        <dialog
            ref={ref}
            aria-labelledby="leave-title"
            onClose={onStay}
            className="m-auto w-[min(90vw,22rem)] rounded-2xl bg-neutral-900 p-6 text-white backdrop:bg-black/60 backdrop:backdrop-blur-sm"
        >
            <h2 id="leave-title" className="text-lg font-semibold">
                Leave the game?
            </h2>
            <p className="mt-2 text-sm text-white/70">Leaving counts as a loss.</p>
            <div className="mt-6 flex items-center justify-end gap-4">
                <button type="button" onClick={onStay} className="text-blue-500">
                    Stay
                </button>
                <button
                    type="button"
                    onClick={onLeave}
                    className="rounded bg-blue-500 px-4 py-2 font-semibold text-white"
                >
                    Leave
                </button>
            </div>
        </dialog>
    );
}