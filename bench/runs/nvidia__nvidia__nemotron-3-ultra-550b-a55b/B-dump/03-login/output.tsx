import { Field } from "@/components/Field";
import { Button } from "@/components/Button";

export default function SignIn() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="font-display text-xl font-medium text-ink">Almanac</h1>

        <Field
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
        />

        <Field
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
        />

        <Button variant="primary" className="w-full">
          Sign in
        </Button>

        <div className="flex flex-col gap-3 text-center">
          <Button variant="ghost" size="sm" className="w-full">
            Create an account
          </Button>
          <a
            href="/forgot-password"
            className="font-body text-sm text-ink-2 underline underline-offset-2 hover:text-ink"
          >
            Forgot your password?
          </a>
        </div>
      </div>
    </main>
  );
}
