import GameApp from "@/components/GameApp";

// min-h-dvh follows the visible screen height as phone browser bars show and hide.
// The padding keeps content clear of notches and the home bar (needs viewport-fit=cover in layout.tsx).
export default function Home() {
  return (
    <main className="min-h-dvh bg-black pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] text-white">
      <div className="mx-auto max-w-[420px] space-y-6">
        <h1 className="text-center text-2xl font-bold text-blue-500">memorydots</h1>
        <GameApp />
      </div>
    </main>
  );
}