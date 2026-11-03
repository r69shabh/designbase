/** A labelled text input with optional hint and error. */
export default function TextField({ label, hint, error, ...props }) {
  return (
    <label className="block space-y-1 text-sm">
      <span>{label}</span>
      <input className="w-full rounded-md border border-border px-3 py-2" {...props} />
      {error ? <span className="text-danger">{error}</span> : hint ? <span>{hint}</span> : null}
    </label>
  );
}
