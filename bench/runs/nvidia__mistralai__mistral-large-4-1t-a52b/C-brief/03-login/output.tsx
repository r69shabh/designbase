import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";

export default function SignIn() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <header className="flex flex-col items-center gap-2 text-center">
          <span className="font-display text-lg font-semibold text-ink">Almanac</span>
          <h1 className="font-display text-2xl font-medium text-ink">Sign in</h1>
          <p className="font-body text-sm text-ink-2">Welcome back. Enter your details to continue.</p>
        </header>

        <Card>
          <form className="flex flex-col gap-6" onSubmit={(event) => event.preventDefault()}>
            <Field
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              defaultValue="mara.ellison@example.com"
              required
            />
            <div className="flex flex-col gap-2">
              <Field
                label="Password"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
              <div className="flex justify-end">
                <a
                  href="/forgot-password"
                  className="font-body text-sm text-ink-2 underline decoration-line underline-offset-2 hover:text-accent hover:decoration-accent"
                >
                  Forgot password?
                </a>
              </div>
            </div>
            <Button variant="primary" type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </Card>

        <p className="text-center font-body text-sm text-ink-2">
          New to Almanac?{" "}
          <a
            href="/sign-up"
            className="font-medium text-ink underline decoration-line underline-offset-2 hover:text-accent hover:decoration-accent"
          >
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}
