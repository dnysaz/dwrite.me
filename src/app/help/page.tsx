import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { siteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Help',
  description:
    'A quick guide to exploring the dwrite.me website — navigation, pages, theme, and FAQs about this site.',
  alternates: { canonical: siteUrl('/help') },
  twitter: {
    card: 'summary',
    title: 'Help | dwrite.me',
    description: 'A quick guide to exploring the dwrite.me website.',
  },
}

const sections = [
  {
    title: 'Navigation',
    items: [
      {
        heading: 'Top menu (Navbar)',
        body: 'At the top of the page you\u2019ll find the menu: Home, Blog, About Me, Contact, and Help. Click any of them to move between pages.',
      },
      {
        heading: 'Mobile mode',
        body: 'On small screens the menu turns into a burger icon (☰) in the top-right corner. Tap it to open the menu, then pick the page you want.',
      },
      {
        heading: 'Back to the homepage',
        body: 'Click the "dwrite.me" text in the top-left corner of the navbar to go back to the main page at any time.',
      },
    ],
  },
  {
    title: 'Pages & Content',
    items: [
      {
        heading: 'Home',
        body: 'The main page shows a short profile, skills, work experience, GitHub statistics, a project list, and a contact button.',
      },
      {
        heading: 'About Me',
        body: 'Contains my full story — background, education, career journey, and hobbies. There\u2019s an EN/ID button to switch the language between English and Indonesian.',
      },
      {
        heading: 'Contact',
        body: 'Find all the ways to reach me (WhatsApp, Email, Instagram, GitHub), or send a message through the form available there.',
      },
      {
        heading: 'Blog',
        body: 'The page for posts and articles. Any time there\u2019s something new written, it will appear here.',
      },
    ],
  },
  {
    title: 'Appearance',
    items: [
      {
        heading: 'Light & dark theme',
        body: 'There\u2019s a toggle button in the bottom-right corner of the page. Your theme choice is saved in the browser, so it stays the same next time you visit.',
      },
      {
        heading: 'GitHub contributions',
        body: 'The little grid of squares on the Home page shows a year of GitHub contribution activity, running from January to December.',
      },
      {
        heading: 'Project list',
        body: 'The Projects section shows repositories from the GitHub account, newest first, up to 10 per page. Use the "Load More" button to reveal the next projects.',
      },
    ],
  },
  {
    title: 'Frequently Asked Questions',
    items: [
      {
        heading: 'How do I contact you?',
        body: 'Open the Contact page. Every way to reach me is available there — WhatsApp, email, Instagram, and GitHub.',
      },
      {
        heading: 'Can I use the content on this site?',
        body: 'This is a personal profile site. If you\u2019re interested in projects or code I build, check my GitHub account (@dnysaz).',
      },
      {
        heading: 'The GitHub graph is not showing?',
        body: 'Try refreshing the page. The data is fetched from GitHub and cached so the page stays fast.',
      },
      {
        heading: 'Need more help?',
        body: 'If your question isn\u2019t answered yet, feel free to send a message through the Contact page.',
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-24 px-4 py-20 sm:px-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Help
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            A quick guide to exploring this site. Pick a topic below to see its
            explanation.
          </p>
        </div>

        <div className="flex flex-col gap-24">
          {sections.map((section) => (
            <section
              key={section.title}
              className="flex flex-col gap-8 border-t border-border pt-14"
            >
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {section.title}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {section.items.map((item) => (
                  <div
                    key={item.heading}
                    className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5"
                  >
                    <h3 className="text-lg font-semibold">{item.heading}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}