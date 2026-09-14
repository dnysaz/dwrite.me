import { ProjectGrid } from '@/components/project-grid'
import { fetchReposWithStack } from '@/lib/github'

export async function ProjectsSection() {
  const repos = await fetchReposWithStack()

  if (repos.length === 0) {
    return (
      <section className="flex flex-col gap-10 border-t border-border py-24">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Projects
        </h2>
        <p className="mt-4 text-base text-muted-foreground">
          Projects could not be loaded. Check back later.
        </p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-10 border-t border-border py-24">
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Projects
      </h2>
      <ProjectGrid repos={repos} />
    </section>
  )
}