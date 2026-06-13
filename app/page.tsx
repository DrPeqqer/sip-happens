export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-50">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col justify-center">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-neutral-500">
          Bereit für den Neustart
        </p>
        <h1 className="mt-5 text-5xl font-black tracking-normal sm:text-7xl">
          Neues Projekt
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-400">
          Die alte App wurde entfernt. GitHub, Vercel und Supabase bleiben verbunden.
        </p>
      </section>
    </main>
  );
}
