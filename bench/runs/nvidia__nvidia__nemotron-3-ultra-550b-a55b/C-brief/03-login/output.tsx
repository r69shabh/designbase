import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

export default function SignInScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <Card className="w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="font-display text-2xl font-medium text-ink">Sign in</h1>
          <p className="mt-2 font-body text-base text-ink-2">Enter your email and password to access your account.</p>
        </header>

        <form className="flex flex-col gap-6" noValidate>
          <Field
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            hint="We'll never share your email."
          />

          <Field
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="remember"
                className="h-4 w-4 rounded-sm border-line text-accent focus:outline-accent"
              />
              <span className="font-body text-sm text-ink-2">Remember me</span>
            </label>
            <a href="/forgot-password" className="font-body text-sm text-accent hover:text-ink underline underline-offset-2">
              Forgot password?
            </a>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full">
            Sign in
          </Button>
        </form>

        <footer className="mt-8 text-center">
          <p className="font-body text-sm text-ink-2">
            Don't have an account?{" "}
            <a href="/sign-up" className="text-accent hover:text-ink underline underline-offset-2 font-medium">
              Create one
            </a>
          </p>
        </footer>
      </Card>
    </main>
  );
}
