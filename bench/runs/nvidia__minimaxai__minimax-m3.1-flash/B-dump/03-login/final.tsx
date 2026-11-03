import { Button } from "@/components/Button";
import { Field } from "@/components/Field";

export default function SignIn() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="font-display text-xl font-semibold text-ink">Almanac</span>
          <h1 className="font-display text-lg font-medium text-ink">Sign in to your account</h1>
          <p className="font-body text-sm text-ink-2">
            Access your ledger, records and year-end reports.
          </p>
        </div>

        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => event.preventDefault()}
        >
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ada.lovelace@example.com"
            defaultValue="ada.lovelace@example.com"
          />

          <div className="flex flex-col gap-2">
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              defaultValue="ledger-1843"
            />
            <a
              href="/forgot-password"
              className="self-end font-body text-sm text-ink-2 underline underline-offset-4 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Forgot password?
            </a>
          </div>

          <Button type="submit" variant="primary" className="w-full">
            Sign in
          </Button>
        </form>

        <div className="flex flex-col items-center gap-2 border-t border-line pt-6">
          <p className="font-body text-sm text-ink-2">New to Almanac?</p>
          <a
            href="/create-account"
            className="font-body text-sm font-medium text-ink underline underline-offset-4 transition-colors hover:text-ink-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Create an account
          </a>
        </div>

        <p className="font-mono text-xs text-ink-3">
          Demo account: ada.lovelace@example.com
        </p>
      </div>
    </main>
  );
}
