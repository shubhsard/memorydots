import LocalGame from "@/components/LocalGame";

export default function Home() {
  return (
    <main className="min-h-screen bg-black p-4 text-white">
      <div className="mx-auto max-w-[420px] space-y-6">
        <h1 className="text-center text-2xl font-bold text-blue-500">memorydots</h1>
        <LocalGame />
      </div>
    </main>
  );
}