interface AvatarProps {
    logo: string;
    name: string;
    active: boolean;
}

// Blue ring marks the active player. The label is also bold, and the guide message
// names the turn in words, so colour is never the only cue.
export default function Avatar({ logo, name, active }: AvatarProps) {
    return (
        <div className="flex w-24 flex-col items-center gap-1" aria-current={active ? "true" : undefined}>
            <div
                className={[
                    "flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-xl font-bold",
                    active ? "ring-4 ring-blue-500" : "ring-2 ring-white/20",
                ].join(" ")}
                aria-hidden="true"
            >
                {logo}
            </div>
            <span className={active ? "text-sm font-semibold" : "text-sm text-white/70"}>{name}</span>
        </div>
    );
}