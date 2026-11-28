import type { AvatarOutcome } from "../game/result";

interface AvatarProps {
  logo: string;
  name: string;
  active: boolean;
  /** Seconds left on the stall countdown; shown as a badge on the avatar when not null. */
  countdown?: number | null;
  /** Set once the result is declared: a crown for the winner, a red ring for the loser. */
  outcome?: AvatarOutcome;
}

// Blue ring marks the active player. The label is also bold, the guide message names the turn
// in words, and the crown is a symbol, so colour is never the only cue.
export default function Avatar({ logo, name, active, countdown = null, outcome = null }: AvatarProps) {
  const ring =
    outcome === "loser" ? "ring-4 ring-red-600" : active ? "ring-4 ring-blue-500" : "ring-2 ring-white/20";

  return (
    <div className="flex w-24 flex-col items-center gap-1" aria-current={active ? "true" : undefined}>
      <div className="relative">
        {outcome === "winner" && (
          <span aria-hidden="true" className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl">
            👑
          </span>
        )}
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-xl font-bold ${ring}`}
          aria-hidden="true"
        >
          {logo}
        </div>
        {countdown !== null && (
          <span
            aria-hidden="true"
            className="absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-1 text-sm font-bold text-black"
          >
            {countdown}
          </span>
        )}
      </div>
      <span className={active ? "text-sm font-semibold" : "text-sm text-white/70"}>{name}</span>
      {outcome === "winner" && <span className="sr-only">Winner</span>}
      {outcome === "loser" && <span className="sr-only">Lost</span>}
    </div>
  );
}