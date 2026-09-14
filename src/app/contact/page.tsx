import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { ContactCards } from '@/components/contact-cards'
import { ContactForm } from '@/components/contact-form'
import { siteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact Ketut Dana via WhatsApp, email, Instagram, or GitHub. Have a project idea or just want to say hi? Send a message through the contact form.',
  alternates: { canonical: siteUrl('/contact') },
  openGraph: {
    type: 'website',
    title: 'Contact | Ketut Dana',
    description:
      'How to reach Ketut Dana — WhatsApp, email, Instagram, GitHub — or send a message through the contact form.',
    url: siteUrl('/contact'),
  },
  twitter: {
    card: 'summary',
    title: 'Contact | Ketut Dana',
    description:
      'Contact Ketut Dana via WhatsApp, email, Instagram, or GitHub.',
  },
}

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-20 px-4 py-20 sm:px-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Contact
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Have a question, a project idea, or just want to say hi? Reach me
            through any of the channels below, or use the form.
          </p>
        </div>

        <ContactCards />

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Send a Message
          </h2>
          <ContactForm />
        </div>
      </main>
    </div>
  )
}