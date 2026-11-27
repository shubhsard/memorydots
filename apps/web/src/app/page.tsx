import EngineCheck from "@/components/EngineCheck";

export default function Home() {
  return (
    <main className="mx-auto max-w-md space-y-4 p-8">
      <h1 className="text-2xl font-bold">memorydots</h1>
      <p className="text-sm text-gray-500">Temporary engine check. Replaced in Step 2.</p>
      <EngineCheck />
    </main>
  );
}