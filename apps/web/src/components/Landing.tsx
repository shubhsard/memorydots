interface LandingProps {
    onPlayLocal: () => void;
}

// Mode selection. Only Local exists so far; Bot, Remote and Random join this screen later.
export default function Landing({ onPlayLocal }: LandingProps) {
    return (
        <section className="space-y-6 text-center">
            <p className="text-white/80">A memory and focus game for two.</p>

            <button
                type="button"
                onClick={onPlayLocal}
                className="w-full rounded-full bg-blue-500 px-6 py-4 text-lg font-semibold text-white"
            >
                Local
                <span className="block text-sm font-normal text-white/80">Two players, one device</span>
            </button>

            <p className="text-sm text-white/60">
                Take turns replaying a growing sequence of dots, then add one more. The first player to
                forget loses.
            </p>
        </section>
    );
}