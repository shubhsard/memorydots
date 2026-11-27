interface AvatarProps {
  logo: string;
  name: string;
  active: boolean;
  /** Seconds left on the stall countdown; shown as a badge on the avatar when not null. */
  countdown?: number | null;
}

// Blue ring marks the active player. The label is also bold, and the guide message
// names the turn in words, so colour is never the only cue.
export default function Avatar({ logo, name, active, countdown = null }: AvatarProps) {
  return (
    <div className="flex w-24 flex-col items-center gap-1" aria-current={active ? "true" : undefined}>
      <div className="relative">
        <div
          className={[
            "flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-xl font-bold",
            active ? "ring-4 ring-blue-500" : "ring-2 ring-white/20",
          ].join(" ")}
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
    </div>
  );
}