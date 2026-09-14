'use client'

import { useState } from 'react'
import {
  formatCount,
  languageColors,
  type GithubRepo,
} from '@/lib/github'
import { GithubIcon } from '@/components/icons'

const PAGE_SIZE = 10

function languageColor(language: string) {
  return languageColors[language] ?? '#94a3b8'
}

export function ProjectGrid({
  repos,
}: {
  repos: (GithubRepo & { stack: string[] })[]
}) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const shown = repos.slice(0, visible)
  const hasMore = visible < repos.length

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((repo) => (
          <a
            key={repo.id}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40 hover:bg-muted"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="truncate text-lg font-semibold group-hover:text-primary">
                {repo.name}
              </h3>
              <GithubIcon className="mt-1 h-[18px] w-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>

            {repo.description && (
              <p className="line-clamp-3 text-base leading-relaxed text-muted-foreground">
                {repo.description}
              </p>
            )}

            {repo.stack.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {repo.stack.map((language) => (
                  <span
                    key={language}
                    className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium"
                  >
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: languageColor(language) }}
                    />
                    {language}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>★ {formatCount(repo.stargazers_count)}</span>
                <span>⑂ {formatCount(repo.forks_count)}</span>
              </div>
              <span className="text-sm font-medium text-primary">
                View Repo →
              </span>
            </div>
          </a>
        ))}
      </div>

      <div className="flex items-center justify-center">
        {hasMore ? (
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Load More ({repos.length - visible} left)
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">
            All {repos.length} projects loaded
          </p>
        )}
      </div>
    </div>
  )
}