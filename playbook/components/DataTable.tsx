import type { ReactNode } from "react";

export interface Column<T> {
  key: keyof T & string;
  header: string;
  align?: "left" | "right";
  numeric?: boolean;
  render?: (row: T) => ReactNode;
}

export function DataTable<T extends { id: string }>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  return (
    <div className="overflow-x-auto border-y border-ink">
      <table className="w-full border-collapse font-body text-sm">
        <thead className="bg-paper-2">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 font-medium text-ink-2 ${c.align === "right" ? "text-right" : "text-left"}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-line hover:bg-paper-2">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-3 text-ink ${c.numeric ? "font-mono tabular-nums" : ""} ${c.align === "right" ? "text-right" : "text-left"}`}>
                  {c.render ? c.render(row) : String(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
