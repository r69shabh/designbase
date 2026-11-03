import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";

export default function SignIn() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="flex w-full max-w-md flex-col gap-8">
        <header className="flex flex-col gap-2 text-center">
          <p className="font-mono text-xs text-ink-3">Almanac</p>
          <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
          <p className="font-body text-sm text-ink-2">
            Welcome back. Enter your details to open your ledger.
          </p>
        </header>

        <Card>
          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => event.preventDefault()}
          >
            <Field
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              defaultValue="maren.holt@ledgermail.com"
              required
            />
            <div className="flex flex-col gap-2">
              <Field
                label="Password"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Your password"
                required
              />
              <a
                href="/forgot-password"
                className="self-end font-body text-sm text-ink-2 underline decoration-line underline-offset-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Forgot password?
              </a>
            </div>
            <Button variant="primary" type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </Card>

        <p className="text-center font-body text-sm text-ink-2">
          New to Almanac?{" "}
          <a
            href="/create-account"
            className="font-medium text-ink underline decoration-line underline-offset-2 hover:decoration-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}
