import { Field } from "@/components/Field";
import { Button } from "@/components/Button";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="font-display text-xl text-ink">Sign in to Almanac</h1>

        <Field
          label="Email address"
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

        <Button variant="ghost" size="sm" className="self-end">
          Forgot password?
        </Button>

        <Button variant="primary" size="md" className="w-full">
          Sign in
        </Button>

        <Button variant="ghost" size="sm" className="mx-auto">
          Create account
        </Button>
      </div>
    </main>
  );
}
