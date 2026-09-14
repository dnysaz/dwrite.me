export const GITHUB_USERNAME = 'dnysaz'

export type GithubUser = {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  followers: number
  public_repos: number
}

export type GithubRepo = {
  id: number
  name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
}

export const languageColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  PHP: '#4f5d95',
  Python: '#3572a5',
  CSS: '#663399',
  HTML: '#e34c26',
  Vue: '#41b883',
  Astro: '#ff5d01',
  SCSS: '#c6538c',
}

export function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export async function githubFetch<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'dwrite.me',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

export function fetchGithubUser() {
  return githubFetch<GithubUser>(
    `https://api.github.com/users/${GITHUB_USERNAME}`
  )
}

export function fetchGithubRepos() {
  return githubFetch<GithubRepo[]>(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`
  )
}

export async function fetchRepoLanguages(
  username: string,
  repo: string
): Promise<string[] | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${username}/${repo}/languages`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'dwrite.me',
        },
        next: { revalidate: 86_400 },
      }
    )

    if (!response.ok) return null
    const data = (await response.json()) as Record<string, number>
    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([language]) => language)
  } catch {
    return null
  }
}

async function batch<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn))
  }
}

export async function fetchReposWithStack(
  limit = 40
): Promise<(GithubRepo & { stack: string[] })[]> {
  const repos = (await fetchGithubRepos()) ?? []

  const withStack: (GithubRepo & { stack: string[] })[] = repos.map((repo) => ({
    ...repo,
    stack: repo.language ? [repo.language] : [],
  }))

  await batch(withStack.slice(0, limit), 10, async (repo) => {
    const languages = await fetchRepoLanguages(GITHUB_USERNAME, repo.name)
    if (languages && languages.length > 0) repo.stack = languages
  })

  return withStack
}