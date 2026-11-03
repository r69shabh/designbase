import { Button } from "@/components/Button";
import { Field } from "@/components/Field";

export default function SignIn() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <span className="font-mono text-xs uppercase tracking-wide text-ink-3">
              Almanac
            </span>
            <h1 className="font-display text-3xl font-semibold text-ink">Sign in</h1>
            <p className="font-body text-base text-ink-2">
              Welcome back. Sign in to review your accounts, entries and closing
              balances.
            </p>
          </header>

          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => event.preventDefault()}
          >
            <Field
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              defaultValue="ada.lovelace@almanac.co"
            />

            <div className="flex flex-col gap-2">
              <Field
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                defaultValue="almanac-demo-2024"
              />
              <div className="flex justify-end">
                <a
                  href="/forgot-password"
                  className="font-body text-sm text-ink-2 underline underline-offset-4 hover:text-ink"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full">
              Sign in
            </Button>
          </form>

          <p className="font-body text-sm text-ink-2">
            New to Almanac?{" "}
            <a
              href="/create-account"
              className="font-body text-sm font-medium text-ink underline underline-offset-4 hover:text-accent"
            >
              Create an account
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
