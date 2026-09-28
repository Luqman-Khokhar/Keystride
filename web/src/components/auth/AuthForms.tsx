"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { safeNext } from "@/lib/format";
import { errorMessage, fieldErrors, useGetMeQuery, useLoginMutation, useRegisterMutation } from "@/store/api";
import { AlertIcon } from "@/components/ui/icons";
import { primaryButtonCls } from "@/components/ui/states";
import { Field } from "./Field";

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-center gap-1.5 text-sm text-error">
      <AlertIcon className="size-4" />
      {message}
    </p>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [register, { isLoading, error }] = useRegisterMutation();
  const [values, setValues] = useState({ username: "", email: "", password: "", confirm: "" });
  const [confirmError, setConfirmError] = useState<string>();
  const fields = fieldErrors(error);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (values.password !== values.confirm) {
      setConfirmError("Passwords don't match");
      return;
    }
    setConfirmError(undefined);
    const res = await register({ username: values.username, email: values.email, password: values.password });
    if ("data" in res) onDone();
  };

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const hasFieldErrors = Object.keys(fields).length > 0;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4" aria-labelledby="register-title">
      <h2 id="register-title" className="text-xl font-semibold tracking-tight text-text">
        Create account
      </h2>
      <Field label="Username" name="username" autoComplete="username" required minLength={3} maxLength={20}
        value={values.username} onChange={set("username")} error={fields.username} hint="3–20 letters, numbers or _" />
      <Field label="Email" name="email" type="email" autoComplete="email" required
        value={values.email} onChange={set("email")} error={fields.email} />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={8}
        value={values.password} onChange={set("password")} error={fields.password} hint="At least 8 characters" />
      <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" required
        value={values.confirm} onChange={set("confirm")} error={confirmError} />
      <FormError message={error && !hasFieldErrors ? errorMessage(error) : null} />
      <button type="submit" disabled={isLoading} className={primaryButtonCls}>
        {isLoading ? "Creating account…" : "Sign up"}
      </button>
    </form>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const [login, { isLoading, error }] = useLoginMutation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const fields = fieldErrors(error);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await login({ identifier, password });
    if ("data" in res) onDone();
  };

  const hasFieldErrors = Object.keys(fields).length > 0;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4" aria-labelledby="login-title">
      <h2 id="login-title" className="text-xl font-semibold tracking-tight text-text">
        Sign in
      </h2>
      <Field label="Email or username" name="identifier" autoComplete="username" required
        value={identifier} onChange={(e) => setIdentifier(e.target.value)} error={fields.identifier} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required
        value={password} onChange={(e) => setPassword(e.target.value)} error={fields.password} />
      <FormError message={error && !hasFieldErrors ? errorMessage(error) : null} />
      <button type="submit" disabled={isLoading} className={primaryButtonCls}>
        {isLoading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function AuthForms() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { data: user } = useGetMeQuery();

  // Already signed in (or just signed in) → leave the page.
  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const done = () => router.replace(next);

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-12 md:grid-cols-2">
      <LoginForm onDone={done} />
      <RegisterForm onDone={done} />
    </div>
  );
}
