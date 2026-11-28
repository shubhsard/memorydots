import { dotLabel } from "../game/boardModel";
import type { DotMark, DotTone, DotView } from "../game/boardModel";

const TONE: Record<DotTone, string> = {
    idle: "bg-white text-black",
    dim: "bg-white/25 text-white",
    green: "bg-green-500 text-black",
    red: "bg-red-600 text-white",
};

// Marks are text, so meaning never depends on colour alone.
const MARK: Record<DotMark, string> = { none: "", tick: "✓", plus: "+", cross: "✕" };

interface BoardProps {
    dots: DotView[];
    columns: number;
    onTap: (dot: number) => void;
}

export default function Board({ dots, columns, onTap }: BoardProps) {
    return (
        <div
            role="group"
            aria-label="Dot board"
            className="mx-auto grid w-full max-w-[420px] select-none gap-2"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
            {dots.map((view) => (
                <button
                    key={view.dot}
                    type="button"
                    disabled={!view.tappable}
                    aria-label={dotLabel(view, columns)}
                    onClick={() => onTap(view.dot)}
                    className={[
                        "flex aspect-square items-center justify-center rounded-full text-2xl font-bold transition-colors",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                        "disabled:cursor-default",
                        TONE[view.tone],
                        view.tappable ? "active:bg-green-500" : "",
                    ].join(" ")}
                >
                    <span aria-hidden="true">{MARK[view.mark]}</span>
                </button>
            ))}
        </div>
    );
}