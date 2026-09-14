import {
  fetchGithubRepos,
  fetchGithubUser,
  formatCount,
} from '@/lib/github'
import Image from 'next/image'
import { RepoMarquee } from '@/components/repo-marquee'
import { ContributionCalendar } from '@/components/contribution-calendar'

export async function GithubSection() {
  const [user, repos] = await Promise.all([fetchGithubUser(), fetchGithubRepos()])

  if (!user) {
    return (
      <section className="flex flex-col gap-10 border-t border-border py-24">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          My GitHub
        </h2>
        <p className="mt-4 text-base text-muted-foreground">
          GitHub cards could not be loaded. Check back later.
        </p>
      </section>
    )
  }

  const repoList = repos ?? []

  return (
    <section className="flex flex-col gap-10 border-t border-border py-24">
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
        My GitHub
      </h2>

      <div className="grid min-w-0 gap-6 lg:grid-cols-4">
        <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <Image
              src={user.avatar_url}
              alt={`${user.login} avatar`}
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-full border border-border"
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <h3 className="truncate text-xl font-semibold">
                {user.name ?? user.login}
              </h3>
              <p className="text-sm text-primary">@{user.login}</p>
            </div>
          </div>
          {user.bio && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {user.bio}
            </p>
          )}
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-lg font-semibold">
                {formatCount(user.followers)}
              </span>
              <span className="text-xs text-muted-foreground">Followers</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold">
                {formatCount(user.public_repos)}
              </span>
              <span className="text-xs text-muted-foreground">Repos</span>
            </div>
          </div>
          <a
            href={`https://github.com/${user.login}?tab=repositories`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View Repos
          </a>
        </div>

        <div className="flex min-w-0 flex-col gap-6 rounded-2xl border border-border bg-card p-6 lg:col-span-3">
          <ContributionCalendar username={user.login} />
        </div>
      </div>

      {repoList.length > 0 && <RepoMarquee repos={repoList} />}
    </section>
  )
}