import { ArrowRight, UsersRound } from "lucide-react";

import { hasSupabasePublicEnv } from "@/lib/supabase";

export default function Home() {
  const hasSupabase = hasSupabasePublicEnv();

  return (
    <main className="relative min-h-screen overflow-hidden bg-midnight px-6 py-8 text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.24),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(6,182,212,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_42%)]" />
      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-between">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-2xl shadow-violetGlow/20">
              <UsersRound className="h-5 w-5 text-cyanGlow" />
            </div>
            <span className="text-sm font-black uppercase tracking-[0.24em] text-slate-400">
              Deep Choices
            </span>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300">
            MVP
          </span>
        </header>

        <div className="grid gap-10 py-16 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-cyanGlow/30 bg-cyanGlow/10 px-4 py-2 text-sm font-extrabold text-cyan-100">
              Mehrheit gewinnt. Minderheit diskutiert.
            </p>
            <h1 className="max-w-3xl text-6xl font-black leading-none tracking-normal text-white sm:text-7xl md:text-8xl">
              Sip Happens
            </h1>
            <p className="mt-6 max-w-xl text-2xl font-bold leading-9 text-slate-300">
              Das Entscheidungs Trinkspiel
            </p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400">
              Zwei Optionen, ein Raum, schnelle Entscheidungen. Funktioniert auch mit alkoholfreien Getränken.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="rounded-[1.5rem] border border-white/10 bg-panel p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                Raumcode
              </p>
              <p className="mt-3 text-5xl font-black tracking-normal text-white">A7K9Q2</p>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-900">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violetGlow to-cyanGlow" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-400">
                4 von 6 haben abgestimmt
              </p>
            </div>
          </div>
        </div>

        <div className="relative grid gap-4 pb-4 sm:grid-cols-2">
          <a
            href="#create"
            className="group flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-violetGlow px-6 py-4 text-center text-lg font-black text-white shadow-2xl shadow-violetGlow/25 transition hover:-translate-y-0.5 hover:bg-violet-500"
          >
            Raum erstellen
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </a>
          <a
            href="#join"
            className="flex min-h-16 items-center justify-center rounded-2xl border border-cyanGlow/40 bg-cyanGlow/10 px-6 py-4 text-center text-lg font-black text-cyan-50 transition hover:-translate-y-0.5 hover:bg-cyanGlow/20"
          >
            Raum beitreten
          </a>
        </div>

        {!hasSupabase ? (
          <p className="relative pb-2 text-sm font-semibold text-amber-200">
            Supabase ist vorbereitet. Setze NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.
          </p>
        ) : null}
      </section>
    </main>
  );
}
