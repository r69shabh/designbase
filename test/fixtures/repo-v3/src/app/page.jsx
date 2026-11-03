import { Button } from "~/components/Button";
import TextField from "~/components/TextField";

export default function Page() {
  return (
    <main className="p-18 space-y-4">
      <h1 className="font-display text-display">Welcome</h1>
      <div className="rounded-lg border border-border p-4 shadow-card">
        <TextField label="Email" />
        <Button intent="primary">Continue</Button>
      </div>
    </main>
  );
}
