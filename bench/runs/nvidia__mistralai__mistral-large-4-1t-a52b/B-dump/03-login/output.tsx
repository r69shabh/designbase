import type { FormEvent } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";

export default function SignInPage() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-xl font-semibold text-ink">Almanac</h1>
          <p className="font-body text-sm text-ink-2">Sign in to your account to continue.</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <Field
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            defaultValue="ava@meridianpress.com"
            required
          />
          <div className="flex flex-col gap-2">
            <Field
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
            <a
              href="/forgot-password"
              className="self-end font-body text-sm text-ink-2 underline decoration-line underline-offset-2 hover:text-ink"
            >
              Forgot password?
            </a>
          </div>
          <Button variant="primary" type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <div className="flex items-center justify-center gap-2">
          <span className="font-body text-sm text-ink-3">New to Almanac?</span>
          <Button variant="ghost" size="sm" type="button">
            Create an account
          </Button>
        </div>
      </div>
    </main>
  );
}
