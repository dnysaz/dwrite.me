'use client'

import { useSyncExternalStore } from 'react'
import { Mail } from 'lucide-react'
import { GithubIcon, InstagramIcon, WhatsAppIcon } from '@/components/icons'

type Lang = 'en' | 'id'

let cachedLang: Lang = 'en'

if (typeof window !== 'undefined') {
  const stored = window.localStorage.getItem('about-lang')
  cachedLang = stored === 'en' || stored === 'id' ? stored : 'en'
}

const langListeners = new Set<() => void>()

function subscribeLang(listener: () => void) {
  langListeners.add(listener)
  return () => langListeners.delete(listener)
}

function getLangSnapshot() {
  return cachedLang
}

function changeLang(next: Lang) {
  cachedLang = next
  try {
    window.localStorage.setItem('about-lang', next)
  } catch {}
  langListeners.forEach((listener) => listener())
}

const copy = {
  title: { en: 'About Me', id: 'Tentang Saya' },
  intro: {
    en: `Hi! Let me introduce myself — I'm Ketut Dana. Born in Denpasar in 1993, spending my days writing code. Actually, I'm a bit of a quiet, introverted person by nature — but once the topic shifts to technology, I can go on and on without getting bored. My interest in the technical world started early. Back then I was really into Physics — but not just to read about it. I'm the kind of person who has to tear the thing apart with my own hands, figure out how it works, and put it back together — and if possible, even modify it so it's better than before. That curiosity has stayed with me ever since.

Before fully focusing on software, my working life bounced around a bit, though it always stayed in the engineering lane. I've been an electronics and cooling system technician, managed freezer operations for an ice cream distributor, built my own computer service business, and worked as a network technician and NOC operator. Out of all that experience, I finally found the "home" that fits me in programming.

Now I'm busy as a freelance web developer, building all kinds of websites, apps, and AI-powered products. Since last 2025, I've also been putting a lot of focus into AI Agents and open-source projects. Beyond that, I still run Media Computer Bali, my little computer service business. So yeah, I might come across as quiet, but this head of mine is always thinking, always curious, and it's never going to stop tinkering with code.`,
    id: `Halo! Kenalin, saya Ketut Dana. Lahir di Denpasar tahun 1993, kerjaan sehari-hari ngoding. Aslinya saya agak pendiam dan introvert, tapi kalau sudah bahas soal teknologi, bisa ngobrol panjang lebar tanpa bosan. Ketertarikan saya sama dunia teknik sudah mulai sejak kecil. Dulu sempat suka banget Fisika, tapi bukan cuma buat dibaca doang. Saya tipe yang harus bongkar langsung barangnya pakai tangan, cari tahu cara kerjanya, terus dirakit lagi — kalau bisa malah dimodif biar lebih bagus. Rasa penasaran itu terus terbawa sampai sekarang.

Sebelum fokus sepenuhnya ke software, perjalanan kerja saya agak loncat-loncat tapi masih di jalur teknik. Saya sempat jadi teknisi elektronik dan sistem pendingin, ngurusin operasional freezer buat distributor es krim, bangun usaha servis komputer sendiri, sampai kerja jadi teknisi jaringan dan operator NOC. Dari semua pengalaman itu, akhirnya saya nemuin "rumah" yang pas di dunia pemrograman.

Sekarang saya sibuk sebagai freelance web developer, bikin berbagai macam website, aplikasi, dan produk berbasis AI. Sejak 2025 kemarin, saya juga lagi banyak fokus ngerjain AI Agent dan proyek-proyek open source. Di luar itu, saya masih pegang Media Computer Bali, usaha servis komputer kecil-kecilan. Jadi ya begitulah, kelihatannya mungkin pendiam, tapi kepala ini selalu mikir, penasaran, dan nggak bakal pernah berhenti ngutak-atik kode.`,
  },
  educationHeading: { en: 'Education', id: 'Pendidikan' },
  education: [
    {
      title: 'SMK Rekayasa Denpasar',
      major: { en: 'Audio Video Engineering', id: 'Jurusan Teknik Audio Video' },
      period: { en: 'Graduated 2011', id: 'Lulus 2011' },
      desc: {
        en: 'I graduated from SMK Rekayasa Denpasar in 2011 with a focus on Audio Video Engineering. It was there that hands-on skills with electronics, a love for physics, and the habit of troubleshooting and fixing problems became part of who I am today.',
        id: 'Saya lulus dari SMK Rekayasa Denpasar pada tahun 2011 dengan fokus pada Teknik Audio Video. Di sinilah keterampilan praktis di bidang elektronika, kecintaan pada fisika, dan kebiasaan mencari serta menyelesaikan masalah teknis mulai menjadi bagian dari diri saya.',
      },
    },
    {
      title: 'Universitas Mahendradatta',
      major: {
        en: 'Industrial Engineering · Bachelor of Engineering (ST)',
        id: 'Teknik Industri · Sarjana Teknik (ST)',
      },
      period: { en: '2016 - 2020', id: '2016 - 2020' },
      desc: {
        en: 'While working full time, I enrolled at Universitas Mahendradatta and earned a Bachelor of Engineering (ST) in Industrial Engineering, graduating in 2020. Balancing work and study was not easy, but it taught me discipline and how to manage my time well.',
        id: 'Sambil bekerja penuh waktu, saya melanjutkan kuliah di Universitas Mahendradatta dan menyelesaikan S1 Teknik Industri dengan gelar Sarjana Teknik (ST), lulus pada tahun 2020. Menyeimbangkan pekerjaan dan kuliah tidaklah mudah, tetapi hal itu mengajarkan saya kedisiplinan dan cara mengatur waktu dengan baik.',
      },
    },
  ],
  careerHeading: { en: 'Career Timeline', id: 'Perjalanan Karier' },
  career: [
    {
      title: {
        en: 'Electronics & Cooling System Technician',
        id: 'Teknisi Elektronika & Sistem Pendingin',
      },
      org: 'CV. Bali Teknik',
      period: { en: '2011', id: '2011' },
      desc: {
        en: 'Right after graduation, my first job was as an electronics and cooling system technician at CV. Bali Teknik. I repaired electronic devices and worked on refrigeration and air-conditioning systems — my first real taste of the working world.',
        id: 'Tepat setelah lulus, pekerjaan pertama saya adalah sebagai teknisi elektronika dan sistem pendingin di CV. Bali Teknik. Saya memperbaiki perangkat elektronik dan mengerjakan sistem pendingin serta AC — pengalaman pertama saya merasakan langsung dunia kerja.',
      },
    },
    {
      title: {
        en: 'Cabinet Freezer Supervisor',
        id: 'Supervisor Cabinet Freezer',
      },
      org: 'Wall\u2019s Ice Cream Distributor \u00b7 Bali',
      period: { en: '2012 - 2015', id: '2012 - 2015' },
      desc: {
        en: 'From 2012 to 2015 I supervised the cabinet freezer section for a Wall\u2019s ice cream distributor in Bali. I made sure every freezer was always working so the cold chain never broke. It taught me responsibility, logistics, and how to take good care of equipment.',
        id: 'Dari tahun 2012 hingga 2015, saya menjadi supervisor bagian cabinet freezer untuk distributor Eskrim Wall di Bali. Saya memastikan semua freezer selalu berfungsi agar rantai dingin tidak pernah putus. Pekerjaan ini mengajarkan saya tanggung jawab, logistik, dan cara merawat peralatan dengan baik.',
      },
    },
    {
      title: {
        en: 'Network Technician & NOC',
        id: 'Teknisi Jaringan & Network Operating Center',
      },
      org: 'Neuviz Network',
      period: { en: '2015 - 2019', id: '2015 - 2019' },
      desc: {
        en: 'Between 2015 and 2019 I worked at Neuviz Network as a network technician and part of the Network Operating Center (NOC) team. I helped keep networks up and running, monitored operations, and jumped in whenever something went down. This is where my love of technology really met the industry.',
        id: 'Antara tahun 2015 dan 2019, saya bekerja di Neuviz Network sebagai teknisi jaringan dan anggota tim Network Operating Center (NOC). Saya membantu menjaga jaringan tetap berjalan, memantau operasional, dan langsung turun tangan ketika terjadi gangguan. Di sinilah kecintaan saya pada teknologi benar-benar bertemu dengan dunia industri.',
      },
    },
    {
      title: {
        en: 'Computer Technician (own business)',
        id: 'Teknisi Komputer (usaha pribadi)',
      },
      org: 'Media Computer Bali',
      period: { en: '2015 - Now', id: '2015 - Sekarang' },
      desc: {
        en: "Since 2015 I've been running Media Computer Bali, my own computer service business. It started small and grew into a service point where I repair and maintain computers for individuals and businesses across Bali. Running my own business taught me to be independent, patient, and detail-oriented.",
        id: "Sejak tahun 2015 saya menjalankan Media Computer Bali, usaha servis komputer milik saya sendiri. Usaha ini berawal dari kecil dan berkembang menjadi tempat servis yang dipercaya, tempat saya memperbaiki dan merawat komputer untuk perorangan maupun usaha di seluruh Bali. Menjalankan usaha sendiri mengajarkan saya untuk mandiri, sabar, dan teliti.",
      },
    },
    {
      title: {
        en: 'Freelance Web Developer',
        id: 'Freelance Web Developer',
      },
      org: 'Self-employed',
      period: { en: '2019 - Now', id: '2019 - Sekarang' },
      desc: {
        en: 'Since 2019 I\u2019ve been working as a freelance web developer. I build everything from simple landing pages to full-stack applications, and I genuinely enjoy turning an idea into something real that people use every day. Starting in 2025, my main focus shifted to AI Agents and open-source products — building tools that are useful, open, and free to use.',
        id: 'Sejak tahun 2019 saya bekerja sebagai freelance web developer. Saya membangun segala hal, mulai dari landing page sederhana hingga aplikasi full-stack, dan saya benar-benar menikmati proses mengubah ide menjadi sesuatu yang nyata yang dipakai orang setiap hari. Sejak tahun 2025, fokus utama saya beralih ke AI Agent dan produk open source — membangun perangkat yang bermanfaat, terbuka, dan bebas digunakan.',
      },
    },
  ],
  journeyHeading: { en: 'The Learning Journey', id: 'Perjalanan Belajar' },
  journey: [
    {
      year: { en: '2017', id: '2017' },
      title: {
        en: 'Started learning to code',
        id: 'Mulai belajar koding',
      },
      desc: {
        en: 'I started learning to code in my spare time, while still working full time.',
        id: 'Saya mulai belajar koding di waktu luang, sambil tetap bekerja penuh waktu.',
      },
    },
    {
      year: { en: '2019', id: '2019' },
      title: {
        en: 'Started freelance web development',
        id: 'Mulai freelance web development',
      },
      desc: {
        en: 'I took on my first web projects and officially became a freelancer.',
        id: 'Saya mengambil proyek web pertama dan resmi terjun sebagai freelancer.',
      },
    },
    {
      year: { en: '2021', id: '2021' },
      title: {
        en: 'Started exploring AI',
        id: 'Mulai mendalami AI',
      },
      desc: {
        en: 'I began diving into AI and machine learning — I wanted to understand how it works and how I could build useful products with it.',
        id: 'Saya mulai mendalami AI dan machine learning — saya ingin memahami cara kerjanya dan bagaimana saya bisa membangun produk yang bermanfaat dengannya.',
      },
    },
    {
      year: { en: '2025 - Now', id: '2025 - Sekarang' },
      title: {
        en: 'Focused on AI Agents & open source',
        id: 'Fokus AI Agent & open source',
      },
      desc: {
        en: "I'm now fully committed to freelance web development, while building AI Agents and publishing open-source products that anyone can use.",
        id: 'Kini saya sepenuhnya berkomitmen pada freelance web development, sambil membangun AI Agent dan merilis produk open source yang bisa dipakai siapa saja.',
      },
    },
  ],
  highlightsHeading: { en: 'Beyond the Resume', id: 'Di Balik Resume' },
  highlights: [
    {
      en: 'Since childhood I\u2019ve loved physics — it\u2019s the door that led me into the world of technology.',
      id: 'Sejak kecil saya mencintai Fisika — dialah pintu yang membawa saya masuk ke dunia teknologi.',
    },
    {
      en: 'During SMK, I ranked 2nd\u20133rd in class for three consecutive years.',
      id: 'Saat SMK, saya berhasil menempati peringkat 2\u20133 di kelas selama tiga tahun berturut-turut.',
    },
    {
      en: 'At university, I served as chairman of the Industrial Engineering student association (HIMA TI).',
      id: 'Saat kuliah, saya dipercaya menjadi Ketua Himpunan Mahasiswa Teknik Industri.',
    },
    {
      en: 'I was also chairman of the English UKM (student activity unit) — leading the group and organizing its activities.',
      id: 'Saya juga menjadi Ketua UKM (Unit Kegiatan Mahasiswa) bidang Bahasa Inggris — memimpin kelompok dan mengorganisir kegiatannya.',
    },
    {
      en: 'I got married in February 2024, and my family has been my biggest motivation ever since.',
      id: 'Saya menikah pada bulan Februari 2024, dan keluarga menjadi motivasi terbesar saya sejak saat itu.',
    },
    {
      en: 'When I\u2019m not coding, I love winding down with SpongeBob SquarePants, Detective Conan, and Crayon Shin-chan — and I\u2019m a big time book reader.',
      id: 'Di sela-sela koding, saya suka bersantai menonton SpongeBob SquarePants, Detective Conan, dan Crayon Shin-chan — dan saya juga penggemar berat membaca buku.',
    },
    {
      en: 'I\u2019ve written two books: \u201CSocial Engineering: Rahasia di Balik Penipuan Daring\u201D, which reveals how online scams work, and \u201CSeni Menyendiri\u201D, a self-improvement book about the art of being alone.',
      id: 'Saya sudah menulis 2 buku: \u201CSocial Engineering: Rahasia di Balik Penipuan Daring\u201D yang mengungkap cara kerja penipuan daring, dan \u201CSeni Menyendiri\u201D, buku self-improvement tentang seni menyendiri.',
    },
  ],
}

export function AboutContent() {
  const lang = useSyncExternalStore<Lang>(subscribeLang, getLangSnapshot, () => 'en')

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-16 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          {copy.title[lang]}
        </h1>
        <div className="inline-flex w-fit rounded-full border border-border p-1">
          {(['en', 'id'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => changeLang(option)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                lang === option
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {option === 'en' ? 'EN' : 'ID'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
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

      <div className="space-y-4 pt-4 text-lg leading-relaxed text-muted-foreground">
        {copy.intro[lang].split('\n\n').map((paragraph) => (
          <p key={paragraph} className="max-w-3xl">
            {paragraph}
          </p>
        ))}
      </div>

      <section className="mt-6 flex flex-col gap-6 border-t border-border pt-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {copy.educationHeading[lang]}
        </h2>
        <div className="flex flex-col gap-6">
          {copy.education.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <span className="text-sm text-muted-foreground">
                  {item.period[lang]}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-primary">
                {item.major[lang]}
              </p>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {item.desc[lang]}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-2 flex flex-col gap-6 border-t border-border pt-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {copy.careerHeading[lang]}
        </h2>
        <div className="flex flex-col gap-6">
          {copy.career.map((job) => (
            <div
              key={job.title[lang]}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl font-semibold">{job.title[lang]}</h3>
                <span className="text-sm text-muted-foreground">
                  {job.period[lang]}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-primary">
                {job.org}
              </p>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {job.desc[lang]}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-2 flex flex-col gap-6 border-t border-border pt-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {copy.journeyHeading[lang]}
        </h2>
        <ol className="relative flex flex-col gap-0">
          {[...copy.journey].reverse().map((step, index, reversed) => (
            <li key={step.year.en} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  aria-hidden
                  className="mt-2 h-3 w-3 shrink-0 rounded-full border-2 border-primary bg-background"
                />
                {index !== reversed.length - 1 && (
                  <span
                    aria-hidden
                    className="w-px flex-1 bg-border"
                  />
                )}
              </div>
              <div
                className={`flex-1 pb-10 ${
                  index === reversed.length - 1 ? 'pb-0' : ''
                }`}
              >
                <span className="text-sm font-semibold text-primary">
                  {step.year[lang]}
                </span>
                <h3 className="mt-1 text-lg font-semibold leading-snug">
                  {step.title[lang]}
                </h3>
                <p className="mt-1 max-w-lg text-base leading-relaxed text-muted-foreground">
                  {step.desc[lang]}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-2 flex flex-col gap-6 border-t border-border pt-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {copy.highlightsHeading[lang]}
        </h2>
        <ul className="flex flex-col gap-3">
          {copy.highlights.map((highlight) => (
            <li
              key={highlight[lang]}
              className="flex items-start gap-3 text-base leading-relaxed text-muted-foreground"
            >
              <span
                aria-hidden
                className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-primary"
              />
              {highlight[lang]}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}