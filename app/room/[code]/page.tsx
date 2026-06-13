"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getQuestionById, getRandomQuestion } from "@/lib/questions";
import { createClient } from "@/utils/supabase/client";

type RoomStatus = "lobby" | "active" | "question" | "result" | "ended";
type SelectedOption = "A" | "B";

interface Room {
  id: string;
  room_code: string;
  host_name: string;
  status: RoomStatus;
  round_number: number;
  current_question_id: string | null;
  round_started_at: string | null;
  countdown_seconds: number;
}

interface Player {
  id: string;
  name: string;
  is_host: boolean;
  joined_at: string;
}

interface RoomAnswer {
  id: string;
  player_id: string;
  question_id: string;
  round_number: number;
  selected_option: SelectedOption;
}

function percentage(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const code = useMemo(() => params.code.toUpperCase(), [params.code]);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answers, setAnswers] = useState<RoomAnswer[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPlayerName(window.localStorage.getItem(`sip-happens-player-${code}`) ?? "");
    const supabase = createClient();

    async function loadRoom() {
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id, room_code, host_name, status, round_number, current_question_id, round_started_at, countdown_seconds")
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

      if (roomData.round_number > 0) {
        const { data: answerData, error: answersError } = await supabase
          .from("room_answers")
          .select("id, player_id, question_id, round_number, selected_option")
          .eq("room_id", roomData.id)
          .eq("round_number", roomData.round_number);

        if (answersError) {
          setError(answersError.message);
          return;
        }

        setAnswers(answerData ?? []);
      } else {
        setAnswers([]);
      }
    }

    loadRoom();
    const channel = supabase
      .channel(`room-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" }, loadRoom)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_answers" }, loadRoom)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, loadRoom)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code]);

  const currentPlayer = players.find((player) => player.name === playerName);
  const isHost = Boolean(currentPlayer?.is_host || room?.host_name === playerName);
  const question = getQuestionById(room?.current_question_id);
  const currentAnswer = answers.find((answer) => answer.player_id === currentPlayer?.id);
  const optionAAnswers = answers.filter((answer) => answer.selected_option === "A");
  const optionBAnswers = answers.filter((answer) => answer.selected_option === "B");
  const totalAnswers = optionAAnswers.length + optionBAnswers.length;
  const optionAPercentage = percentage(optionAAnswers.length, totalAnswers);
  const optionBPercentage = percentage(optionBAnswers.length, totalAnswers);
  const allAnswered = players.length > 0 && totalAnswers >= players.length;
  const playedQuestionIds = room?.current_question_id ? [room.current_question_id] : [];

  async function copyInvite() {
    await navigator.clipboard.writeText(
      `Komm in meinen Sip Happens Raum. Code: ${code}\n${window.location.origin}/join`
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function startRound() {
    if (!room || busy) {
      return;
    }

    const nextQuestion = getRandomQuestion(playedQuestionIds);

    if (!nextQuestion) {
      setError("Keine aktive Frage gefunden.");
      return;
    }

    setBusy(true);
    setError("");

    const supabase = createClient();
    const { error: startError } = await supabase
      .from("rooms")
      .update({
        status: "question",
        round_number: room.round_number + 1,
        current_question_id: nextQuestion.id,
        round_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", room.id);

    if (startError) {
      setError(startError.message);
    }

    setBusy(false);
  }

  async function submitAnswer(selectedOption: SelectedOption) {
    if (!room || !currentPlayer || !question || busy || currentAnswer) {
      return;
    }

    setBusy(true);
    setError("");

    const supabase = createClient();
    const { error: answerError } = await supabase.from("room_answers").insert({
      room_id: room.id,
      player_id: currentPlayer.id,
      question_id: question.id,
      round_number: room.round_number,
      selected_option: selectedOption
    });

    if (answerError && answerError.code !== "23505") {
      setError(answerError.message);
      setBusy(false);
      return;
    }

    const nextAnswerCount = currentAnswer ? totalAnswers : totalAnswers + 1;
    if (nextAnswerCount >= players.length) {
      const { error: finishError } = await supabase
        .from("rooms")
        .update({ status: "result", updated_at: new Date().toISOString() })
        .eq("id", room.id);

      if (finishError) {
        setError(finishError.message);
      }
    }

    setBusy(false);
  }

  async function endGame() {
    if (!room || busy) {
      return;
    }

    setBusy(true);
    setError("");

    const supabase = createClient();
    const { error: endError } = await supabase
      .from("rooms")
      .update({ status: "ended", updated_at: new Date().toISOString() })
      .eq("id", room.id);

    if (endError) {
      setError(endError.message);
    }

    setBusy(false);
  }

  function namesFor(option: SelectedOption) {
    const ids = new Set(
      answers.filter((answer) => answer.selected_option === option).map((answer) => answer.player_id)
    );
    const names = players.filter((player) => ids.has(player.id)).map((player) => player.name);
    return names.length > 0 ? names.join(", ") : "Niemand";
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
          {room ? (
            <p className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
              Status: {room.status === "lobby" ? "Lobby" : room.status === "question" ? "Frage läuft" : room.status === "result" ? "Ergebnis" : room.status}
            </p>
          ) : null}

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
        {!currentPlayer && room ? (
          <p className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm font-semibold text-amber-100">
            Du bist auf diesem Gerät noch nicht als Spieler im Raum gespeichert. Tritt dem Raum mit Code {code} bei.
          </p>
        ) : null}

        {room?.status === "lobby" ? (
          <div className="mt-6 rounded-[2rem] border border-violetGlow/30 bg-violetGlow/10 p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-200">Bereit?</p>
            <h2 className="mt-3 text-3xl font-black text-white">Starte die erste Runde</h2>
            <p className="mt-3 text-slate-300">
              Alle Spieler beantworten dieselbe Frage. Sobald alle abgestimmt haben, erscheint das Ergebnis.
            </p>
            {isHost ? (
              <button
                onClick={startRound}
                disabled={busy || players.length === 0}
                className="mt-5 h-14 w-full rounded-2xl bg-violetGlow px-6 text-lg font-black text-white shadow-2xl shadow-violetGlow/25 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Starte..." : "Spiel starten"}
              </button>
            ) : (
              <p className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-4 font-semibold text-slate-300">
                Warte darauf, dass der Host das Spiel startet.
              </p>
            )}
          </div>
        ) : null}

        {room?.status === "question" && question ? (
          <div className="mt-6 rounded-[2rem] border border-cyanGlow/30 bg-white/[0.06] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">Runde {room.round_number}</p>
              <span className="rounded-full border border-white/10 bg-slate-950 px-4 py-2 text-sm font-bold text-slate-300">
                {totalAnswers} von {players.length} abgestimmt
              </span>
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight text-white">{question.question}</h2>

            {currentAnswer ? (
              <p className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 font-semibold text-emerald-100">
                Antwort gespeichert. Warte auf die anderen.
              </p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => submitAnswer("A")}
                  disabled={!currentPlayer || busy}
                  className="min-h-32 rounded-3xl border border-violetGlow/40 bg-violetGlow/20 p-5 text-left text-xl font-black text-white transition hover:-translate-y-0.5 hover:bg-violetGlow/30 disabled:opacity-50"
                >
                  <span className="block text-sm uppercase tracking-[0.2em] text-violet-200">Option A</span>
                  {question.optionA}
                </button>
                <button
                  onClick={() => submitAnswer("B")}
                  disabled={!currentPlayer || busy}
                  className="min-h-32 rounded-3xl border border-cyanGlow/40 bg-cyanGlow/20 p-5 text-left text-xl font-black text-white transition hover:-translate-y-0.5 hover:bg-cyanGlow/30 disabled:opacity-50"
                >
                  <span className="block text-sm uppercase tracking-[0.2em] text-cyan-100">Option B</span>
                  {question.optionB}
                </button>
              </div>
            )}

            {allAnswered && isHost ? (
              <button
                onClick={async () => {
                  if (!room) return;
                  const supabase = createClient();
                  await supabase.from("rooms").update({ status: "result", updated_at: new Date().toISOString() }).eq("id", room.id);
                }}
                className="mt-5 h-12 w-full rounded-2xl bg-cyanGlow font-black text-slate-950"
              >
                Ergebnis anzeigen
              </button>
            ) : null}
          </div>
        ) : null}

        {room?.status === "result" && question ? (
          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">Ergebnis Runde {room.round_number}</p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-white">{question.question}</h2>

            <div className="mt-6 grid gap-4">
              <ResultRow label={`A · ${question.optionA}`} percentage={optionAPercentage} names={namesFor("A")} selected={currentAnswer?.selected_option === "A"} />
              <ResultRow label={`B · ${question.optionB}`} percentage={optionBPercentage} names={namesFor("B")} selected={currentAnswer?.selected_option === "B"} />
            </div>

            <div className="mt-6 rounded-3xl border border-cyanGlow/30 bg-cyanGlow/10 p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-100">Folgefrage</p>
              <p className="mt-3 text-xl font-bold leading-8 text-white">{question.followUp}</p>
            </div>
            <p className="mt-5 rounded-3xl border border-white/10 bg-slate-950 p-5 text-base font-semibold leading-7 text-slate-300">
              Diskutiert kurz: Wer hat die wildeste Begründung?
            </p>

            {isHost ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={startRound}
                  disabled={busy}
                  className="h-14 rounded-2xl bg-violetGlow px-6 font-black text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  Nächste Runde
                </button>
                <button
                  onClick={endGame}
                  disabled={busy}
                  className="h-14 rounded-2xl border border-white/10 bg-white/5 px-6 font-black text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                >
                  Spiel beenden
                </button>
              </div>
            ) : (
              <p className="mt-5 font-semibold text-slate-400">Warte auf die nächste Runde.</p>
            )}
          </div>
        ) : null}

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

function ResultRow({
  label,
  percentage,
  names,
  selected
}: {
  label: string;
  percentage: number;
  names: string;
  selected: boolean;
}) {
  return (
    <div className={`rounded-3xl border p-5 ${selected ? "border-violetGlow bg-violetGlow/15" : "border-white/10 bg-slate-950"}`}>
      <div className="flex items-center justify-between gap-4">
        <p className="font-black text-white">{label}</p>
        <span className="text-2xl font-black text-cyan-100">{percentage}%</span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900">
        <div className="h-full rounded-full bg-gradient-to-r from-violetGlow to-cyanGlow" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-400">{names}</p>
    </div>
  );
}
