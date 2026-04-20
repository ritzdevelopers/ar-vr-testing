import Scene from "../components/Scene";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">A-Frame Scene in Next.js</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Client-rendered scene with interactive cursor, lighting, and model.
        </p>

        <Scene
          modelSrc="/VD.glb"
          modelPosition="0 0 -3"
          cameraPosition="0 1.1 -5.4"
        />
      </div>
    </main>
  );
}
