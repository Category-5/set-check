import type { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata: Metadata = {
  title: "Stats",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

const RANGES = [7, 30, 90] as const

interface Row {
  label: string
  views: number
}

interface Stats {
  views: number
  visitors: number
  daily: { day: string; views: number; visitors: number }[]
  pages: Row[]
  referrers: Row[]
  countries: Row[]
  devices: Row[]
}

const number = new Intl.NumberFormat("en-US")

function Breakdown({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  const max = Math.max(1, ...rows.map((row) => row.views))
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <li key={row.label} className="relative flex justify-between gap-4 rounded px-2 py-1 text-sm">
              <span
                className="absolute inset-y-0 left-0 rounded bg-primary/15"
                style={{ width: `${(row.views / max) * 100}%` }}
                aria-hidden
              />
              <span className="relative truncate">{row.label}</span>
              <span className="relative tabular-nums text-muted-foreground">{number.format(row.views)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const { days: rawDays } = await searchParams
  const days = RANGES.find((range) => String(range) === rawDays) ?? 30

  const supabase = createAdminClient()
  const { data, error } = supabase
    ? await supabase.rpc("page_view_stats", { days })
    : { data: null, error: { message: "SUPABASE_SERVICE_ROLE_KEY is not set" } }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-semibold">Stats</h1>
        <p className="mt-4 text-sm text-muted-foreground">Could not load stats: {error?.message ?? "no data"}</p>
      </main>
    )
  }

  const stats = data as Stats
  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.views))

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Stats</h1>
        <nav className="flex gap-1 text-sm">
          {RANGES.map((range) => (
            <a
              key={range}
              href={`/stats?days=${range}`}
              className={`rounded-md px-3 py-1 ${range === days ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {range} days
            </a>
          ))}
        </nav>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <section className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Page views</p>
          <p className="text-3xl font-semibold tabular-nums">{number.format(stats.views)}</p>
        </section>
        <section className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Visitors</p>
          <p className="text-3xl font-semibold tabular-nums">{number.format(stats.visitors)}</p>
          <p className="text-xs text-muted-foreground">Sum of daily unique visitors</p>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Page views per day</h2>
        {stats.daily.length === 0 ? (
          <p className="text-sm text-muted-foreground">No views yet.</p>
        ) : (
          <div className="flex h-32 items-end gap-0.5">
            {stats.daily.map((d) => (
              <div
                key={d.day}
                className="flex-1 rounded-t bg-primary/70"
                style={{ height: `${Math.max(2, (d.views / maxDaily) * 100)}%` }}
                title={`${d.day}: ${number.format(d.views)} views, ${number.format(d.visitors)} visitors`}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Breakdown title="Top pages" rows={stats.pages} empty="No views yet." />
        <Breakdown title="Referrers" rows={stats.referrers} empty="No external referrers yet." />
        <Breakdown title="Countries" rows={stats.countries} empty="No country data yet." />
        <Breakdown title="Devices" rows={stats.devices} empty="No views yet." />
      </div>
    </main>
  )
}
