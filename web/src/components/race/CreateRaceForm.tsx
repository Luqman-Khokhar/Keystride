"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { RACE_PLAYER_OPTIONS, RACE_TRACK_OPTIONS, RACE_WORD_OPTIONS, type RaceTrackStyle } from "@/lib/race";
import { errorMessage, fieldErrors, useCreateRaceMutation, useGetMeQuery } from "@/store/api";
import { Field } from "@/components/auth/Field";
import { Row, Segmented, Switch } from "@/components/settings/controls";
import { AlertIcon } from "@/components/ui/icons";
import { ghostButtonCls, primaryButtonCls, Skeleton } from "@/components/ui/states";

export function CreateRaceForm() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useGetMeQuery();
  const [create, { isLoading, error, reset }] = useCreateRaceMutation();

  const [title, setTitle] = useState("");
  const [words, setWords] = useState(25);
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [track, setTrack] = useState<RaceTrackStyle>("laser");

  const fields = fieldErrors(error);
  const onForm = () => {
    if (error) reset();
  };

  if (userLoading) return <Skeleton className="h-96 w-full max-w-2xl" />;
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Start a race</h1>
        <p className="text-sub">You need an account to host a race.</p>
        <Link href="/login?next=/competitions/race" className={primaryButtonCls}>
          Sign in
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await create({ title, words, punctuation, numbers, maxPlayers, track });
    if ("data" in res && res.data) router.push(`/c/${res.data.slug}`);
  };

  const otherError = error && Object.keys(fields).some((k) => k !== "title");

  return (
    <form
      onSubmit={onSubmit}
      onChange={onForm}
      onClick={onForm}
      noValidate
      className="flex w-full max-w-2xl flex-col gap-2"
      aria-labelledby="race-title"
    >
      <h1 id="race-title" className="text-2xl font-semibold tracking-tight text-text">
        Start a race
      </h1>
      <p className="mb-2 text-sm text-sub">
        A private lobby for friends. Everyone starts together when you press start, gets one attempt, and the
        first to finish wins.
      </p>

      <div className="pb-4">
        <Field label="Title" name="title" required maxLength={60} placeholder="Lunch break showdown"
          value={title} onChange={(e) => setTitle(e.target.value)} error={fields.title} />
      </div>

      <Row title="Words" description="Length of the race text.">
        <Segmented
          label="Race length in words"
          value={String(words)}
          options={RACE_WORD_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
          onChange={(v) => setWords(Number(v))}
        />
      </Row>
      <Row title="Punctuation">
        <Switch label="Punctuation" checked={punctuation} onChange={setPunctuation} />
      </Row>
      <Row title="Numbers">
        <Switch label="Numbers" checked={numbers} onChange={setNumbers} />
      </Row>
      <Row title="Players" description="Including you.">
        <Segmented
          label="Max players"
          value={String(maxPlayers)}
          options={RACE_PLAYER_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
          onChange={(v) => setMaxPlayers(Number(v))}
        />
      </Row>
      <Row title="Track" description="How everyone's progress is drawn.">
        <Segmented label="Track style" value={track} options={RACE_TRACK_OPTIONS} onChange={setTrack} />
      </Row>

      {(otherError || (error && !Object.keys(fields).length)) && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-error">
          <AlertIcon className="size-4" />
          {otherError ? Object.values(fields).find((_, i) => Object.keys(fields)[i] !== "title") : errorMessage(error, "Couldn't create the race")}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button type="submit" disabled={isLoading} className={primaryButtonCls}>
          {isLoading ? "Creating…" : "Create lobby"}
        </button>
        <Link href="/competitions" className={ghostButtonCls}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
