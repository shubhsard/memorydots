"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { GameEvent } from "@memorydots/engine";
import { ADDED_FLASH_MS } from "./config";
import type { GameTransport, Snapshot } from "./transport";

/**
 * Connects a React component to any GameTransport (Local now, Remote later).
 * Also tracks the short green flash on a newly added dot, which is UI-only timing.
 */
export function useGame(transport: GameTransport) {
    const snapshot = useSyncExternalStore(
        (onChange) => transport.onState(() => onChange()),
        () => transport.getSnapshot(),
        () => transport.getSnapshot()
    );

    // Adjust state while rendering when a new snapshot arrives (no effect needed for this).
    const [seen, setSeen] = useState<Snapshot>(snapshot);
    const [flash, setFlash] = useState<{ dot: number } | null>(null);
    if (seen !== snapshot) {
        setSeen(snapshot);
        if (snapshot.outcome?.kind === "dot_added") setFlash({ dot: snapshot.outcome.dot });
        else if (snapshot.outcome === null) setFlash(null); // a fresh round
    }

    useEffect(() => {
        if (!flash) return;
        const id = setTimeout(() => setFlash(null), ADDED_FLASH_MS);
        return () => clearTimeout(id);
    }, [flash]);

    const send = useCallback((event: GameEvent) => transport.send(event), [transport]);
    const rematch = useCallback(() => transport.rematch(), [transport]);

    return { snapshot, flashDot: flash?.dot ?? null, send, rematch };
}