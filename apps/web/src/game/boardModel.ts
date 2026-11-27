import type { Snapshot } from "./transport";

// Pure mapping from a snapshot to what each dot should look like.
// Follows the spec's dot states: dim (not tappable), white (tappable), green (pressed or flashing),
// tick (correct replay tap), plus (add-phase cue and the mark on a newly added dot), cross (wrong tap).

export type DotTone = "idle" | "dim" | "green" | "red";
export type DotMark = "none" | "tick" | "plus" | "cross";

export interface DotView {
    dot: number;
    tone: DotTone;
    mark: DotMark;
    tappable: boolean;
}

/** Columns for a roughly square grid: 25 dots -> 5 columns, 9 -> 3, 4 -> 2. */
export function getColumns(dotCount: number): number {
    return Math.ceil(Math.sqrt(dotCount));
}

/**
 * @param flashDot the dot that was just added, if its green flash is still showing
 */
export function getDotViews(snapshot: Snapshot, flashDot: number | null = null): DotView[] {
    const { state, config, outcome, lastTap } = snapshot;
    const dotCount = config.levels[state.levelIndex].dotCount;
    const ended = state.phase === "ended";

    // Dots already replayed correctly this turn. In the add phase that is the whole sequence.
    const replayed = state.phase === "add" ? state.sequence : state.sequence.slice(0, state.replayIndex);
    const ticked = new Set(replayed);

    // After a wrong tap: the tapped dot shows a red cross and the right dot shows green.
    const wrongTap =
        outcome?.kind === "game_over" &&
            outcome.result.kind === "loss" &&
            outcome.result.reason === "wrong_tap" &&
            lastTap !== null
            ? { wrong: lastTap.dot, correct: state.sequence[state.replayIndex] }
            : null;

    return Array.from({ length: dotCount }, (_, dot): DotView => {
        if (wrongTap && dot === wrongTap.wrong) return { dot, tone: "red", mark: "cross", tappable: false };
        if (wrongTap && dot === wrongTap.correct) return { dot, tone: "green", mark: "none", tappable: false };
        if (ticked.has(dot)) return { dot, tone: "dim", mark: "tick", tappable: false };
        if (ended) return { dot, tone: "dim", mark: "none", tappable: false };
        if (dot === flashDot) return { dot, tone: "green", mark: "plus", tappable: true };
        if (state.phase === "add") return { dot, tone: "idle", mark: "plus", tappable: true };
        return { dot, tone: "idle", mark: "none", tappable: true };
    });
}

/** Screen-reader label: position plus state, since colour alone never carries meaning. */
export function dotLabel(view: DotView, columns: number): string {
    const row = Math.floor(view.dot / columns) + 1;
    const col = (view.dot % columns) + 1;
    const where = `Row ${row}, column ${col}`;
    switch (view.mark) {
        case "tick":
            return `${where}, replayed correctly`;
        case "plus":
            return `${where}, available to add`;
        case "cross":
            return `${where}, wrong tap`;
        default:
            return view.tappable ? where : `${where}, not available`;
    }
}