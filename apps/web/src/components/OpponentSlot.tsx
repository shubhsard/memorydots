interface OpponentSlotProps {
    onClick: () => void;
}

// Sits where the opponent's avatar will be: a human icon with a plus, labelled in words
// because a bare icon is easy to miss.
export default function OpponentSlot({ onClick }: OpponentSlotProps) {
    return (
        <button type="button" onClick={onClick} className="flex w-24 flex-col items-center gap-1">
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-blue-500 text-blue-500">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z" />
                </svg>
                <span
                    aria-hidden="true"
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-base font-bold text-white"
                >
                    +
                </span>
            </span>
            <span className="text-sm font-semibold text-blue-500">Add opponent</span>
        </button>
    );
}