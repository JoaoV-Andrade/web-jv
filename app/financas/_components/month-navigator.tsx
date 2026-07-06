import Link from "next/link"

export function MonthNavigator({
  label,
  prevHref,
  nextHref,
}: {
  label: string
  prevHref: string
  nextHref: string | null
}) {
  return (
    <div className="flex items-center gap-1 mt-0.5">
      <Link
        href={prevHref}
        aria-label="Mês anterior"
        className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:text-text hover:bg-border/50 transition-colors"
      >
        ‹
      </Link>
      <span className="text-text-muted text-sm capitalize min-w-[9rem] text-center">
        {label}
      </span>
      {nextHref ? (
        <Link
          href={nextHref}
          aria-label="Próximo mês"
          className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:text-text hover:bg-border/50 transition-colors"
        >
          ›
        </Link>
      ) : (
        <span
          aria-hidden
          className="w-6 h-6 flex items-center justify-center text-border cursor-default"
        >
          ›
        </span>
      )}
    </div>
  )
}
