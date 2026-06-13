"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/utils/supabase/client";

export default function JoinRoomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const playerName = name.trim();
    const code = roomCode.trim().toUpperCase();

    if (!playerName) {
      setError("Bitte gib deinen Namen ein.");
      return;
    }

    if (!code) {
      setError("Bitte gib einen Raumcode ein.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("id, room_code, status")
        .eq("room_code", code)
        .maybeSingle();

      if (roomError) {
        throw new Error(roomError.message);
      }

      if (!room) {
        throw new Error("Diesen Raum gibt es nicht.");
      }

      if (room.status === "ended") {
        throw new Error("Dieser Raum wurde beendet.");
      }

      const { error: playerError } = await supabase.from("room_players").insert({
        room_id: room.id,
        name: playerName,
        is_host: false
      });

      if (playerError) {
        if (playerError.code === "23505") {
          throw new Error("Dieser Name ist im Raum schon vergeben.");
        }
        throw new Error(playerError.message);
      }

      window.localStorage.setItem(`sip-happens-player-${room.room_code}`, playerName);
      router.push(`/room/${room.room_code}`);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Beitritt fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-midnight px-6 py-8 text-slate-50">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col justify-center">
        <Link href="/" className="mb-8 text-sm font-bold text-slate-400 hover:text-white">
          Zurück
        </Link>
        <h1 className="text-5xl font-black text-white">Raum beitreten</h1>
        <p className="mt-4 text-lg leading-8 text-slate-400">
          Gib deinen Namen und den sechsstelligen Code ein.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
          <label htmlFor="playerName" className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
            Dein Name
          </label>
          <input
            id="playerName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Max"
            className="mt-3 h-14 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 text-lg font-bold text-white outline-none ring-cyanGlow/40 transition placeholder:text-slate-600 focus:ring-4"
          />

          <label htmlFor="roomCode" className="mt-6 block text-sm font-black uppercase tracking-[0.18em] text-slate-500">
            Raumcode
          </label>
          <input
            id="roomCode"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            placeholder="A7K9Q2"
            className="mt-3 h-14 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 text-lg font-black uppercase tracking-[0.2em] text-white outline-none ring-cyanGlow/40 transition placeholder:text-slate-600 focus:ring-4"
          />

          {error ? <p className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm font-semibold text-red-100">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 h-14 w-full rounded-2xl bg-cyanGlow text-lg font-black text-slate-950 shadow-2xl shadow-cyanGlow/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Trete bei..." : "Raum beitreten"}
          </button>
        </form>
      </section>
    </main>
  );
}
