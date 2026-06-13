"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/utils/supabase/client";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode() {
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export default function CreateRoomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hostName = name.trim();

    if (!hostName) {
      setError("Bitte gib deinen Namen ein.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      let room:
        | {
            id: string;
            room_code: string;
          }
        | null = null;
      let lastError = "";

      for (let attempt = 0; attempt < 5 && !room; attempt += 1) {
        const { data, error: roomError } = await supabase
          .from("rooms")
          .insert({
            room_code: generateRoomCode(),
            host_name: hostName,
            status: "lobby"
          })
          .select("id, room_code")
          .single();

        if (roomError) {
          lastError = roomError.message;
        } else {
          room = data;
        }
      }

      if (!room) {
        throw new Error(lastError || "Raum konnte nicht erstellt werden.");
      }

      const { error: playerError } = await supabase.from("room_players").insert({
        room_id: room.id,
        name: hostName,
        is_host: true
      });

      if (playerError) {
        throw new Error(playerError.message);
      }

      window.localStorage.setItem(`sip-happens-player-${room.room_code}`, hostName);
      router.push(`/room/${room.room_code}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Raum konnte nicht erstellt werden.");
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
        <h1 className="text-5xl font-black text-white">Raum erstellen</h1>
        <p className="mt-4 text-lg leading-8 text-slate-400">
          Erstelle einen Raum und teile den Code mit deiner Gruppe.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
          <label htmlFor="hostName" className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
            Dein Name
          </label>
          <input
            id="hostName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Emre"
            className="mt-3 h-14 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 text-lg font-bold text-white outline-none ring-cyanGlow/40 transition placeholder:text-slate-600 focus:ring-4"
          />

          {error ? <p className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm font-semibold text-red-100">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 h-14 w-full rounded-2xl bg-violetGlow text-lg font-black text-white shadow-2xl shadow-violetGlow/25 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Erstelle Raum..." : "Raum erstellen"}
          </button>
        </form>
      </section>
    </main>
  );
}
