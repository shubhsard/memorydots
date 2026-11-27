import { applyEvent, createGame } from "@memorydots/engine";
import type { EngineConfig, GameEvent } from "@memorydots/engine";
import type { Clock, GameTransport, Snapshot } from "./transport";

type Listener = (snapshot: Snapshot) => void;

/**
 * Runs the engine in the same process as the UI (Local and Bot modes).
 * Also keeps the stall clock: the idle limit plus the visible countdown,
 * after which it sends a `timeout` event for the active player.
 */
export class LocalTransport implements GameTransport {
    private readonly config: EngineConfig;
    private readonly firstPlayer: number;
    private readonly listeners = new Set<Listener>();
    private snapshot: Snapshot;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private closed = false;

    constructor(config: EngineConfig, firstPlayer = 0) {
        this.config = config;
        this.firstPlayer = firstPlayer;
        this.snapshot = {
            config,
            state: createGame(config, firstPlayer),
            outcome: null,
            clock: this.startClock(),
            lastTap: null,
            roundNumber: 1,
        };
    }

    getSnapshot(): Snapshot {
        return this.snapshot;
    }

    send(event: GameEvent): void {
        if (this.closed) return;

        const before = this.snapshot.state;
        const { state, outcome } = applyEvent(this.config, before, event);

        // Spec: any tap by the player whose turn it is resets the idle limit.
        // Taps from the other player, and non-tap events, never touch the clock.
        const resetsClock =
            event.type === "tap" && event.player === before.activePlayer && before.phase !== "ended";

        let clock = this.snapshot.clock;
        if (state.phase === "ended") {
            this.stopTimer();
            clock = null;
        } else if (resetsClock) {
            clock = this.startClock();
        }

        const lastTap = event.type === "tap" ? { player: event.player, dot: event.dot } : null;
        this.publish({ ...this.snapshot, state, outcome, clock, lastTap });
    }

    rematch(): void {
        if (this.closed || this.snapshot.state.phase !== "ended") return;

        // Spec: the starter alternates each round.
        const roundNumber = this.snapshot.roundNumber + 1;
        const starter = (this.firstPlayer + roundNumber - 1) % this.config.playerCount;

        this.publish({
            config: this.config,
            state: createGame(this.config, starter),
            outcome: null,
            clock: this.startClock(),
            lastTap: null,
            roundNumber,
        });
    }

    onState(callback: Listener): () => void {
        this.listeners.add(callback);
        callback(this.snapshot);
        return () => {
            this.listeners.delete(callback);
        };
    }

    close(): void {
        this.closed = true;
        this.stopTimer();
        this.listeners.clear();
    }

    // ---------- internals ----------

    private publish(snapshot: Snapshot): void {
        this.snapshot = snapshot;
        for (const listener of [...this.listeners]) listener(snapshot);
    }

    // (Re)starts the stall timer for whoever is active now and returns its clock.
    private startClock(): Clock {
        this.stopTimer();
        const { idleMs, countdownMs } = this.config;
        const now = Date.now();
        this.timer = setTimeout(() => {
            this.timer = null;
            this.send({ type: "timeout", player: this.snapshot.state.activePlayer });
        }, idleMs + countdownMs);
        return { countdownStartsAt: now + idleMs, stallsOutAt: now + idleMs + countdownMs };
    }

    private stopTimer(): void {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}