"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/utils/supabase/client";

interface Room {
  id: string;
  room_code: string;
  host_name: string;
  status: string;
}

interface Player {
  id: string;
  name: string;
  is_host: boolean;
  joined_at: string;
}

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const code = useMemo(() => params.code.toUpperCase(), [params.code]);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadRoom() {
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id, room_code, host_name, status")
        .eq("room_code", code)
        .maybeSingle();

      if (roomError) {
        setError(roomError.message);
        return;
      }

      if (!roomData) {
        setError("Dieser Raum wurde nicht gefunden.");
        return;
      }

      setRoom(roomData);

      const { data: playerData, error: playersError } = await supabase
        .from("room_players")
        .select("id, name, is_host, joined_at")
        .eq("room_id", roomData.id)
        .order("joined_at", { ascending: true });

      if (playersError) {
        setError(playersError.message);
        return;
      }

      setPlayers(playerData ?? []);
    }

    loadRoom();
    const channel = supabase
      .channel(`room-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" }, loadRoom)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, loadRoom)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code]);

  async function copyInvite() {
    await navigator.clipboard.writeText(
      `Komm in meinen Sip Happens Raum. Code: ${code}\n${window.location.origin}/join`
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="min-h-screen bg-midnight px-6 py-8 text-slate-50">
      <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-3xl">
        <Link href="/" className="text-sm font-bold text-slate-400 hover:text-white">
          Zur Startseite
        </Link>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Raumcode</p>
          <h1 className="mt-3 text-6xl font-black tracking-normal text-white">{code}</h1>
          <p className="mt-4 text-lg font-semibold text-slate-400">
            {room ? `Host: ${room.host_name}` : "Lade Raum..."}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={copyInvite}
              className="h-12 rounded-2xl bg-violetGlow px-5 font-black text-white transition hover:bg-violet-500"
            >
              {copied ? "Link kopiert" : "Einladung kopieren"}
            </button>
            <Link
              href="/join"
              className="flex h-12 items-center justify-center rounded-2xl border border-cyanGlow/40 bg-cyanGlow/10 px-5 font-black text-cyan-50 transition hover:bg-cyanGlow/20"
            >
              Weitere beitreten lassen
            </Link>
          </div>
        </div>

        {error ? <p className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-semibold text-red-100">{error}</p> : null}

        <div className="mt-6 rounded-[2rem] border border-white/10 bg-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-white">Spieler</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300">
              {players.length} online
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {players.length === 0 ? (
              <p className="text-slate-400">Noch niemand im Raum.</p>
            ) : (
              players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 px-4 py-3"
                >
                  <span className="font-bold text-white">{player.name}</span>
                  {player.is_host ? (
                    <span className="rounded-full bg-violetGlow px-3 py-1 text-xs font-black text-white">Host</span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
