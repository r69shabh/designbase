export interface NavItem { label: string; href: string; active?: boolean; count?: number }

export function SideNav({ product, items }: { product: string; items: NavItem[] }) {
  return (
    <nav className="flex h-full w-full flex-col gap-8 border-r border-line bg-paper-2 px-4 py-6 md:w-64">
      <span className="font-display text-lg font-semibold text-ink">{product}</span>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={`flex items-center justify-between rounded-sm border-l-2 px-3 py-2 font-body text-sm ${item.active ? "border-accent text-ink font-medium" : "border-transparent text-ink-2 hover:text-ink"}`}
            >
              {item.label}
              {item.count !== undefined && <span className="font-mono text-xs text-ink-3">{item.count}</span>}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
