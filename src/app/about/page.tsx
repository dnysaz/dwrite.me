import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { AboutContent } from '@/components/about-content'
import { siteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Get to know Ketut Dana better — background, education, work experience, and hobbies. Web Developer & AI Enthusiast from Bali.',
  alternates: { canonical: siteUrl('/about') },
  openGraph: {
    type: 'profile',
    title: 'About Me | Ketut Dana',
    description:
      'Background, education, work experience, and hobbies of Ketut Dana, Web Developer & AI Enthusiast from Bali.',
    url: siteUrl('/about'),
  },
  twitter: {
    card: 'summary',
    title: 'About Me | Ketut Dana',
    description:
      'Background, education, work experience, and hobbies of Ketut Dana.',
  },
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <AboutContent />
    </div>
  )
}