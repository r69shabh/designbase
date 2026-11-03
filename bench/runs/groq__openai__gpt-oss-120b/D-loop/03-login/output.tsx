import { useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

export default function SignIn() {
  const [email, setEmail] = useState("jane.doe@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // mock validation
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    // proceed with sign‑in logic
    console.log("Signing in:", { email, password });
  };

  return (
    <main className="bg-paper min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full space-y-8">
        <PageHeader
          title="Sign in"
          description="Enter your credentials to access your account."
        />
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Field
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              hint="We’ll never share your email."
              error={error ?? undefined}
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex items-center justify-between text-sm">
              <Button
                variant="ghost"
                size="sm"
                as="a"
                href="#"
                className="text-ink-2 hover:text-ink"
              >
                Forgot password?
              </Button>
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="md">
                Sign in
              </Button>
            </div>
          </form>
        </Card>
        <div className="text-center">
          <p className="font-body text-sm text-ink-2">
            Don’t have an account?{" "}
            <Button
              variant="secondary"
              size="sm"
              as="a"
              href="#"
              className="font-body font-medium text-ink hover:text-ink"
            >
              Create account
            </Button>
          </p>
        </div>
      </div>
    </main>
  );
}
