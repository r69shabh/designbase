import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

export default function SignInPage() {
  return (
    <div className="bg-paper min-h-screen flex items-center justify-center">
      <main className="mx-auto max-w-md w-full p-6">
        <PageHeader
          title="Sign in"
          description="Enter your credentials to access your account."
        />
        <div className="flex flex-col gap-8 mt-8">
          <Card>
            <form className="flex flex-col gap-6">
              <Field
                label="Email address"
                type="email"
                name="email"
                placeholder="you@example.com"
                required
              />
              <Field
                label="Password"
                type="password"
                name="password"
                placeholder="••••••••"
                required
              />
              <div className="flex justify-between items-center">
                <a
                  href="/forgot-password"
                  className="text-sm text-ink-2 hover:text-ink underline"
                >
                  Forgot password?
                </a>
                <Button type="submit" variant="primary" size="md">
                  Sign in
                </Button>
              </div>
            </form>
          </Card>

          <div className="text-sm text-ink-2">
            Don’t have an account?{" "}
            <a
              href="/create-account"
              className="text-accent hover:underline"
            >
              Create one
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
