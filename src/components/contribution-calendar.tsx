const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const CELL = 12
const GAP = 3

const levelColors = [
  'var(--muted)',
  'oklch(0.85 0.08 259.8)',
  'oklch(0.75 0.13 259.8)',
  'oklch(0.62 0.19 259.8)',
  'oklch(0.48 0.24 259.8)',
]

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

async function fetchContributions(username: string): Promise<Map<string, number>> {
  const map = new Map<string, number>()

  try {
    const response = await fetch(
      `https://github.com/users/${username}/contributions`,
      {
        headers: {
          Accept: 'text/html',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        },
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) return map

    const html = await response.text()
    const regex = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="([0-4])"/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(html))) {
      map.set(match[1], Number(match[2]))
    }
  } catch {
    // ignore
  }

  return map
}

function levelColor(level: number) {
  return levelColors[Math.min(4, Math.max(0, level))] ?? levelColors[0]
}

export async function ContributionCalendar({
  username,
}: {
  username: string
}) {
  const year = new Date().getFullYear()
  const levels = await fetchContributions(username)

  const first = new Date(Date.UTC(year, 0, 1))
  const last = new Date(Date.UTC(year, 11, 31))

  const start = new Date(first)
  start.setUTCDate(first.getUTCDate() - first.getUTCDay())

  const end = new Date(last)
  end.setUTCDate(last.getUTCDate() + (6 - last.getUTCDay()))

  const dayMs = 86_400_000
  const weeks: ({ date: Date; level: number } | null)[][] = []
  const monthLabelColumns = new Map<number, number>()

  for (let d = new Date(start), col = 0; d <= end; col++) {
    const week: ({ date: Date; level: number } | null)[] = []
    for (let i = 0; i < 7; i++) {
      if (d <= end) {
        const inYear = d.getUTCFullYear() === year
        if (inYear && d.getUTCDate() === 1) {
          monthLabelColumns.set(d.getUTCMonth(), col)
        }
        week.push({
          date: new Date(d),
          level: inYear ? (levels.get(iso(d)) ?? 0) : 0,
        })
      } else {
        week.push(null)
      }
      d = new Date(d.getTime() + dayMs)
    }
    weeks.push(week)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-2">
          <div className="relative h-5">
            {[...monthLabelColumns.entries()].map(([month, col]) => (
              <span
                key={month}
                className="absolute top-0 text-xs font-medium text-muted-foreground"
                style={{ left: col * (CELL + GAP) }}
              >
                {MONTHS[month]}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell, di) =>
                  cell ? (
                    <div
                      key={di}
                      title={`${iso(cell.date)} — ${cell.level} contribution${cell.level === 1 ? '' : 's'}`}
                      className="h-3 w-3 rounded-[3px]"
                      style={{ backgroundColor: levelColor(cell.level) }}
                    />
                  ) : (
                    <div key={di} className="h-3 w-3" />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>
          Contribution graph · {year}
        </span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {levelColors.map((color, i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-[3px]"
              style={{ backgroundColor: color }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}