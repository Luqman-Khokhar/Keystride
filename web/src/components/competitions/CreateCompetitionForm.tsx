"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { TIME_OPTIONS, WORD_OPTIONS, type TestMode } from "@keystride/engine";
import { ATTEMPT_CAPS, DURATIONS } from "@/lib/competition";
import { errorMessage, fieldErrors, useCreateCompetitionMutation, useGetMeQuery } from "@/store/api";
import type { CompetitionVisibility } from "@/store/types";
import { Field } from "@/components/auth/Field";
import { Row, Segmented, Switch } from "@/components/settings/controls";
import { linkCls, primaryButtonCls, Skeleton } from "@/components/ui/states";

/** datetime-local value (local time) → ISO string; "" → undefined. */
const toIso = (local: string) => (local ? new Date(local).toISOString() : undefined);

/** Now + 10 minutes, formatted for a datetime-local input. */
function defaultLater(): string {
  const d = new Date(Date.now() + 10 * 60_000);
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-error">
      <span aria-hidden="true">⚠ </span>
      {message}
    </p>
  );
}

export function CreateCompetitionForm() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useGetMeQuery();
  const [create, { isLoading, error, reset }] = useCreateCompetitionMutation();
  const ids = { desc: useId(), descErr: useId(), start: useId(), startErr: useId(), players: useId(), playersErr: useId() };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<TestMode>("time");
  const [amount, setAmount] = useState(30);
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [visibility, setVisibility] = useState<CompetitionVisibility>("public");
  const [startNow, setStartNow] = useState(true);
  const [startLocal, setStartLocal] = useState(defaultLater);
  const [duration, setDuration] = useState(60);
  const [maxPlayers, setMaxPlayers] = useState("50");
  const [maxAttempts, setMaxAttempts] = useState<number | null>(null);

  const fields = fieldErrors(error);
  // Editing any field clears the previous submit's errors (they're re-checked on submit).
  const onForm = () => {
    if (error) reset();
  };
  const fieldKeys = Object.keys(fields);

  if (userLoading) return <Skeleton className="h-96 w-full max-w-2xl" />;
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl text-text">create a competition</h1>
        <p className="text-sub">You need an account to host a competition.</p>
        <Link href="/login?next=/competitions/new" className={primaryButtonCls}>
          Sign in
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await create({
      title,
      description,
      config: { mode, amount, punctuation, numbers, language: "english" },
      visibility,
      startsAt: startNow ? undefined : toIso(startLocal),
      durationMinutes: duration,
      maxPlayers: Number(maxPlayers),
      maxAttempts,
    });
    if ("data" in res && res.data) router.push(`/c/${res.data.slug}`);
  };

  const amounts = mode === "time" ? TIME_OPTIONS : WORD_OPTIONS;

  return (
    <form
      onSubmit={onSubmit}
      onChange={onForm}
      onClick={onForm}
      noValidate
      className="flex w-full max-w-2xl flex-col gap-2"
      aria-labelledby="create-title"
    >
      <h1 id="create-title" className="mb-2 text-2xl text-text">
        create a competition
      </h1>

      <div className="flex flex-col gap-4 pb-4">
        <Field label="Title" name="title" required maxLength={60} placeholder="Friday night race"
          value={title} onChange={(e) => setTitle(e.target.value)} error={fields.title} />
        <div className="flex flex-col gap-1">
          <label htmlFor={ids.desc} className="text-sm text-sub">
            Description <span className="text-xs">(optional, {280 - description.length} characters left)</span>
          </label>
          <textarea
            id={ids.desc}
            maxLength={280}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={fields.description ? true : undefined}
            aria-describedby={fields.description ? ids.descErr : undefined}
            className="resize-y rounded-lg border-2 border-transparent bg-bg-alt px-3 py-2 text-text outline-none transition-colors hover:border-sub-alt focus-visible:border-main aria-invalid:border-error"
          />
          <FieldError id={ids.descErr} message={fields.description} />
        </div>
      </div>

      <Row title="test mode">
        <Segmented
          label="Test mode"
          value={mode}
          options={[{ value: "time", label: "time" }, { value: "words", label: "words" }]}
          onChange={(m) => {
            setMode(m);
            setAmount(m === "time" ? 30 : 25);
          }}
        />
      </Row>
      <Row title={mode === "time" ? "seconds" : "words"}>
        <Segmented
          label={mode === "time" ? "Test length in seconds" : "Test length in words"}
          value={String(amount)}
          options={amounts.map((a) => ({ value: String(a), label: String(a) }))}
          onChange={(v) => setAmount(Number(v))}
        />
      </Row>
      <Row title="punctuation">
        <Switch label="Punctuation" checked={punctuation} onChange={setPunctuation} />
      </Row>
      <Row title="numbers">
        <Switch label="Numbers" checked={numbers} onChange={setNumbers} />
      </Row>
      <Row title="who can find it" description="Link-only competitions don't appear in the public list.">
        <Segmented
          label="Visibility"
          value={visibility}
          options={[{ value: "public", label: "public" }, { value: "unlisted", label: "link only" }]}
          onChange={setVisibility}
        />
      </Row>
      <Row title="start">
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Segmented
            label="Start"
            value={startNow ? "now" : "later"}
            options={[{ value: "now", label: "now" }, { value: "later", label: "later" }]}
            onChange={(v) => setStartNow(v === "now")}
          />
          {!startNow && (
            <>
              <label htmlFor={ids.start} className="sr-only">
                Start date and time
              </label>
              <input
                id={ids.start}
                type="datetime-local"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                aria-invalid={fields.startsAt ? true : undefined}
                aria-describedby={fields.startsAt ? ids.startErr : undefined}
                className="rounded-lg border-2 border-transparent bg-bg-alt px-3 py-1.5 text-text outline-none hover:border-sub-alt focus-visible:border-main aria-invalid:border-error"
              />
              <FieldError id={ids.startErr} message={fields.startsAt} />
            </>
          )}
        </div>
      </Row>
      <Row title="duration" description="How long the competition stays open.">
        <Segmented
          label="Duration"
          value={String(duration)}
          options={DURATIONS.map((d) => ({ value: String(d.minutes), label: d.label }))}
          onChange={(v) => setDuration(Number(v))}
        />
      </Row>
      <Row title="attempts per player" description="Best verified attempt counts.">
        <Segmented
          label="Attempts per player"
          value={String(maxAttempts)}
          options={ATTEMPT_CAPS.map((n) => ({ value: String(n), label: n === null ? "unlimited" : String(n) }))}
          onChange={(v) => setMaxAttempts(v === "null" ? null : Number(v))}
        />
      </Row>
      <Row title="max players" description="Between 2 and 100.">
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <label htmlFor={ids.players} className="sr-only">
            Max players
          </label>
          <input
            id={ids.players}
            type="number"
            inputMode="numeric"
            min={2}
            max={100}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            aria-invalid={fields.maxPlayers ? true : undefined}
            aria-describedby={fields.maxPlayers ? ids.playersErr : undefined}
            className="w-24 rounded-lg border-2 border-transparent bg-bg-alt px-3 py-1.5 text-text outline-none transition-colors hover:border-sub-alt focus-visible:border-main aria-invalid:border-error"
          />
          <FieldError id={ids.playersErr} message={fields.maxPlayers} />
        </div>
      </Row>

      {error && (fieldKeys.length === 0 || fieldKeys.some((k) => !["title", "description", "startsAt", "maxPlayers"].includes(k))) && (
        <p role="alert" className="text-sm text-error">
          <span aria-hidden="true">⚠ </span>
          {fieldKeys.length ? Object.values(fields)[0] : errorMessage(error, "Couldn't create the competition")}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-sub-alt pt-4">
        <button type="submit" disabled={isLoading} className={primaryButtonCls}>
          {isLoading ? "Creating…" : "Create competition"}
        </button>
        <Link href="/competitions" className={linkCls}>
          cancel
        </Link>
      </div>
    </form>
  );
}
