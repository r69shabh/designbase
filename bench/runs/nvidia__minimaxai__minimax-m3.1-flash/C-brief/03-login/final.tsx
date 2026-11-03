import { Button } from "@/components/Button";
import { Field } from "@/components/Field";

const sampleAccount = {
  email: "ada.lovelace@example.com",
  password: "analytical-engine",
};

export default function SignIn() {
  return (
    <main className="flex min-h-screen flex-col bg-paper px-6 py-12">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <header className="mb-12">
          <p className="font-mono text-xs text-ink-3">Almanac</p>
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
            Sign in to your account
          </h1>
          <p className="mt-3 font-body text-base text-ink-2">
            Enter your email and password to open your ledger.
          </p>
        </header>

        <form action="/sign-in" method="post" className="flex flex-col gap-6">
          <Field
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={sampleAccount.email}
            hint="Use the address you registered with."
          />

          <div className="flex flex-col gap-2">
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              defaultValue={sampleAccount.password}
              hint={`Demo password: ${sampleAccount.password}`}
            />
            <div className="flex justify-end">
              <a
                href="/forgot-password"
                className="font-body text-sm text-accent underline underline-offset-4 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full">
            Sign in
          </Button>
        </form>

        <footer className="mt-12 border-t border-line pt-6">
          <p className="font-body text-sm text-ink-2">
            New to Almanac?{" "}
            <a
              href="/create-account"
              className="font-body text-sm font-medium text-accent underline underline-offset-4 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Create an account
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
