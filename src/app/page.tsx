import type { Metadata } from 'next'
import { Mail } from 'lucide-react'
import { GithubIcon, InstagramIcon, WhatsAppIcon } from '@/components/icons'
import { Navbar } from '@/components/navbar'
import { GithubSection } from '@/components/github-section'
import { ProjectsSection } from '@/components/projects-section'
import { LatestPostsSlider } from '@/components/latest-posts-slider'
import { getPublishedPosts } from '@/lib/blog'
import { getSiteOgImage } from '@/lib/site'
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  siteUrl,
} from '@/lib/seo'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = await getSiteOgImage()
  return {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    alternates: { canonical: siteUrl('/') },
    openGraph: {
      type: 'website',
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      url: siteUrl('/'),
      siteName: SITE_NAME,
      images: ogImage ? [ogImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: ogImage ? [ogImage] : [],
    },
  }
}

const skills = [
  { category: 'Frontend', items: ['JavaScript', 'TypeScript', 'Vue.js', 'Astro', 'Tailwind CSS', 'CSS'] },
  { category: 'Backend', items: ['PHP', 'Node.js', 'Python', 'Laravel'] },
  {
    category: 'Database & BaaS',
    items: ['Supabase', 'Neon Postgres', 'MySQL', 'SQLite'],
  },
]

const experiences = [
  {
    role: 'Freelance Web Developer',
    company: 'Self-employed',
    period: '2019 - Present',
    description:
      'Started learning to code in 2017 and turned it into a full freelance career in 2019 — building everything from landing pages to full-stack applications for clients.',
  },
  {
    role: 'Network Engineer & NOC',
    company: 'Neuviz Network',
    period: '2015 - 2020',
    description:
      'Worked as a network engineer and network operations center (NOC) staff, keeping networks running, monitoring operations, and handling troubleshooting.',
  },
  {
    role: 'ST · Engineering Degree',
    company: 'Universitas Mahendradatta',
    period: '2016 - 2020',
    description:
      'Earned an engineering degree (ST) while working full time, graduating in 2020.',
  },
  {
    role: 'Student',
    company: 'SMK Rekayasa Denpasar',
    period: 'Graduated 2011',
    description:
      'Graduated in 2011 with a technology background that sparked the interest in engineering and networking.',
  },
]

export default async function HomePage() {
  const posts = (await getPublishedPosts()).slice(0, 10)
  const defaultImage = await getSiteOgImage()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 sm:px-6">
        <section className="flex min-h-[calc(100dvh-9rem)] flex-col justify-center">
          <span className="mb-8 text-7xl leading-none sm:text-8xl" role="img" aria-label="waving hand">
            👋
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
            Hi, I&apos;m Ketut Dana.
          </h1>
          <p className="mt-4 text-2xl font-semibold text-primary sm:text-3xl">
            Web Developer &amp; AI Enthusiast.
          </p>
          <p className="mt-5 max-w-3xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
            I&apos;ve been passionate about coding since 2017, love building
            things with Open Source software, and I&apos;m always learning how AI
            can make better products.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://wa.me/6285792721649"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
            >
              <WhatsAppIcon className="h-[18px] w-[18px]" />
              WhatsApp
            </a>
            <a
              href="mailto:danayasa2@gmail.com"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
            >
              <Mail className="h-[18px] w-[18px]" />
              Email
            </a>
            <a
              href="https://instagram.com/kdanays"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
            >
              <InstagramIcon className="h-[18px] w-[18px]" />
              Instagram
            </a>
            <a
              href="https://github.com/dnysaz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
            >
              <GithubIcon className="h-[18px] w-[18px]" />
              GitHub
            </a>
          </div>
        </section>

        <GithubSection />

        {posts.length > 0 && (
          <LatestPostsSlider posts={posts} defaultImage={defaultImage} />
        )}

        <section className="flex flex-col gap-10 border-t border-border py-24">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Skills &amp; Tech Stack
          </h2>
          <div className="flex flex-col gap-8">
            {skills.map((group) => (
              <div key={group.category} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <h3 className="w-48 shrink-0 text-lg font-semibold text-primary">
                  {group.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium"
                    >
                      {item}
                    </span>
                  ))}
                  <span className="rounded-full border border-dashed border-border px-4 py-1.5 text-sm font-medium text-muted-foreground">
                    more
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-10 border-t border-border py-24">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Experience
          </h2>
          <div className="flex flex-col gap-6">
            {experiences.map((job) => (
              <div
                key={job.role}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-xl font-semibold">{job.role}</h3>
                  <span className="text-sm text-muted-foreground">{job.period}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-primary">{job.company}</p>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {job.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <ProjectsSection />
      <section className="flex flex-col items-center gap-6 border-t border-border py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Let&apos;s build something together.
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Have a project in mind or just want to say hi? I&apos;m always open
            to new ideas and collaborations.
          </p>
          <a
            href="/contact"
            className="mt-2 rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Contact Me
          </a>
        </section>
      </div>
    </div>
  )
}