-- ============================================================================
-- dwrite.me — Supabase Seed (DATA DUMMY)
-- Jalankan di Supabase Dashboard → SQL Editor → New query → Run.
-- Bisa dijalankan berulang (idempotent: on conflict do nothing).
-- Jalankan SETELAH supabase-schema.sql (file struktur database).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SEED SITE SETTINGS (kontak & identitas)
-- ----------------------------------------------------------------------------
insert into public.site_settings (key, value) values
  ('site_name',        'dwrite.me'),
  ('owner_name',       'Ketut Dana'),
  ('owner_email',      'danayasa2@gmail.com'),
  ('owner_whatsapp',   '+62 857-9272-1649'),
  ('owner_whatsapp_wa','https://wa.me/6285792721649'),
  ('owner_instagram',  '@kdanays'),
  ('owner_instagram_url','https://instagram.com/kdanays'),
  ('owner_github',     '@dnysaz'),
  ('owner_github_url', 'https://github.com/dnysaz'),
  ('owner_github_username', 'dnysaz')
on conflict (key) do update set value = excluded.value;

-- ----------------------------------------------------------------------------
-- Catatan: file ini OPSIONAL (dummy). Schema berdiri sendiri tanpa ini.
-- Profil dibuat otomatis saat login pertama kali; tidak ada isian manual.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- 2. PROFIL
-- Profil owner TIDAK perlu di-seed manual. Trigger `on_auth_user_created`
-- otomatis membuat baris profil begitu kamu login pertama kali sebagai owner.
-- Setelah login, isi datanya lewat SQL Editor (bio satu saja, bahasa Inggris):
--   select id, email from auth.users;   -- cari id kamu
--   update public.profiles
--   set display_name = 'Ketut Dana',
--       bio_en = 'Intro singkat bahasa Inggris...',
--       location = 'Denpasar, Bali, Indonesia'
--   where id = '<uid_kamu>';
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- 3. SEED KATEGORI BLOG (5 kategori)
-- ----------------------------------------------------------------------------
insert into public.blog_categories (id, name, slug, description) values
  ('11111111-1111-1111-1111-111111111111', 'Programming', 'programming', 'Artikel soal coding, bahasa pemrograman, dan teknik pengembangan web.'),
  ('22222222-2222-2222-2222-222222222222', 'AI & Agents', 'ai-agents', 'Catatan soal AI, prompt, dan pengembangan AI Agent.'),
  ('33333333-3333-3333-3333-333333333333', 'Open Source', 'open-source', 'Berbagi cerita seputar kode terbuka dan kontribusi komunitas.'),
  ('44444444-4444-4444-4444-444444444444', 'Network & Hardware', 'network-hardware', 'Jaringan, perangkat keras, dan pengalaman teknis di lapangan.'),
  ('55555555-5555-5555-5555-555555555555', 'Life & Self-Improvement', 'life-self-improvement', 'Refleksi pribadi, kebiasaan, dan pengembangan diri.')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 4. SEED POST BLOG (10 dummy)
-- ----------------------------------------------------------------------------
with filler as (
  select 'Sebenarnya tulisan ini masih versi awal yang sengaja saya susun sebagai contoh struktur artikel. Pembukanya sengaja dibuat cair, isinya santai tapi berbobot, dan penutupnya meninggalkan kesan. Nantinya setiap pos akan ditulis lebih lengkap sesuai topik masing-masing.' as text
)
insert into public.blog_posts
  (title, slug, excerpt, content, category_id, author_id, cover_image_url, read_time_minutes, status, published_at)
values
  (
    'Ngoding Itu Nggak Selalu Lurus',
    'ngoding-itu-nggak-selalu-lurus',
    'Jalan belajar coding sering muter-muter: mulai dari copy-paste, pelan-pelan paham konsep, sampai akhirnya bisa bikin kode sendiri. Justru dari kesalahan kecil saya paling banyak belajar.',
    'Jalan belajar coding sering muter-muter: mulai dari copy-paste, pelan-pelan paham konsep, sampai akhirnya bisa bikin kode sendiri. Justru dari kesalahan kecil saya paling banyak belajar.' || E'\n\n' ||
    'Dalam dunia programming, semuanya selalu berangkat dari rasa penasaran sederhana. Saya sering mengingat momen-momen kecil ketika sebuah ide muncul begitu saja — dari melihat baris error yang membingungkan sampai akhirnya terawa karena ternyata masalahnya cuma typo satu huruf. Pengalaman semacam inilah yang paling saya syukuri, karena dari sanalah pola pikir saya terbentuk.' || E'\n\n' ||
    (select text from filler) || E'\n\n' ||
    'Kesimpulannya sederhana: jangan takut salah. Setiap kesalahan adalah bahan bakar berikutnya untuk menjadi programer yang lebih baik.',
    '11111111-1111-1111-1111-111111111111', null,
    'https://picsum.photos/seed/dwrite-code-1/1200/600', 5, 'published', '2026-01-12'
  ),
  (
    'Saya Mulai Serius ke AI Agent di 2025',
    'mulai-serius-ke-ai-agent-di-2025',
    'Dari sekadar coba-coba prompt, akhirnya masuk ke dunia AI Agent. Ini cerita saya membangun agent pertama untuk otomasi tugas-tugas kecil sehari-hari.',
    'Dari sekadar coba-coba prompt, akhirnya masuk ke dunia AI Agent. Ini cerita saya membangun agent pertama untuk otomasi tugas-tugas kecil sehari-hari.' || E'\n\n' ||
    'Ketenaran AI dua tahun terakhir bukan sekadar tren buat saya. Ini adalah teknologi yang benar-benar mengubah cara saya bekerja sehari-hari. Dari yang awalnya hanya bertanya-jawab dengan model bahasa, saya mulai penasaran bagaimana cara membuat mesin ini bisa bekerja sendiri menyelesaikan sebuah tugas — satu alur kerja demi satu alur kerja.' || E'\n\n' ||
    (select text from filler) || E'\n\n' ||
    'Ke depan, saya percaya semua orang akan punya "rekan kerja digital" sendiri. Dan saya ingin menjadi bagian dari orang-orang yang membangun fondasinya.',
    '22222222-2222-2222-2222-222222222222', null,
    'https://picsum.photos/seed/dwrite-ai-1/1200/600', 7, 'published', '2026-01-28'
  ),
  (
    'Kenapa Saya Suka Merilis Kode ke Publik',
    'kenapa-saya-suka-merilis-kode-ke-publik',
    'Berbagi kode bukan cuma soal "biar dilihat orang", tapi juga jadi gudang ilmu buat yang lagi belajar — termasuk saya sendiri. Ada cerita menarik di balik repos paling kecil.',
    'Berbagi kode bukan cuma soal "biar dilihat orang", tapi juga jadi gudang ilmu buat yang lagi belajar — termasuk saya sendiri. Ada cerita menarik di balik repos paling kecil.' || E'\n\n' ||
    'Ada kehangatan tersendiri saat kode saya dibaca orang lain. Di komunitas open source, saya belajar bahwa berbagi bukan membuat kita kehilangan — justru membuat ilmu itu tumbuh. Setiap pull request, setiap issue yang dibuka, semuanya mengajarkan saya cara berkomunikasi dan berkolaborasi yang lebih baik.' || E'\n\n' ||
    (select text from filler) || E'\n\n' ||
    'Kalau kamu ragu untuk mulai berkontribusi, mulai saja dari perubahan kecil seperti memperbaiki dokumentasi. Semua orang besar pernah kecil.',
    '33333333-3333-3333-3333-333333333333', null,
    'https://picsum.photos/seed/dwrite-oss-1/1200/600', 4, 'published', '2026-02-04'
  ),
  (
    'Dari NOC Operator ke Dunia Software',
    'dari-noc-operator-ke-dunia-software',
    'Gue sempat hidup di dunia network: pantau trafik, cabut-cabut kabel, risol masalah di tengah malam. Ternyata fondasi itu sangat terasa sampai sekarang.',
    'Gue sempat hidup di dunia network: pantau trafik, cabut-cabut kabel, risol masalah di tengah malam. Ternyata fondasi itu sangat terasa sampai sekarang.' || E'\n\n' ||
    'Dulu saya mengira bahwa jaringan itu soal kabel, switch, dan lampu indikator. Semakin lama saya berkarir, semakin saya sadar bahwa jaringan sebenarnya soal bagaimana hal-hal saling terhubung — dan metafora itu ternyata sangat berlaku juga di dunia software.' || E'\n\n' ||
    (select text from filler) || E'\n\n' ||
    'Fondasi yang kuat itu tidak selalu terlihat — tapi ia menopang semuanya. Sama seperti pengalaman teknis saya di bidang jaringan yang ternyata sangat membantu saya di dunia coding.',
    '44444444-4444-4444-4444-444444444444', null,
    'https://picsum.photos/seed/dwrite-net-1/1200/600', 6, 'published', '2026-02-19'
  ),
  (
    'Seni Menyendiri untuk Para Introvert',
    'seni-menyendiri-untuk-para-introvert',
    'Buat pendiam seperti saya, menyendiri bukan kesepian. Justru dari situ energi kembali. Ini catatan kecil tentang memanfaatkan waktu sendiri secara sehat.',
    'Buat pendiam seperti saya, menyendiri bukan kesepian. Justru dari situ energi kembali. Ini catatan kecil tentang memanfaatkan waktu sendiri secara sehat.' || E'\n\n' ||
    'Menjadi introvert bukanlah kekurangan, melainkan cara pandang yang berbeda dalam menikmati hidup. Saya belajar bahwa dengan mengenali ritme diri sendiri, banyak hal jadi lebih ringan — mulai dari cara bekerja, cara belajar, sampai cara bersosialisasi.' || E'\n\n' ||
    (select text from filler) || E'\n\n' ||
    'Pada akhirnya, hidup bukan soal menjadi orang lain. Ini soal menjadi versi terbaik dari diri sendiri — dengan irama yang kita pilih sendiri.',
    '55555555-5555-5555-5555-555555555555', null,
    'https://picsum.photos/seed/dwrite-life-1/1200/600', 5, 'published', '2026-03-05'
  ),
  (
    'Efek "Ah Kucoba Dulu" yang Mengubah Karier',
    'efek-ah-kucoba-dulu-yang-mengubah-karier',
    'Semua berawal dari membongkar komputer orang dan penasaran soal cara kerja sesuatu. Banyak hal besar berangkat dari rasa iseng, ujung-ujungnya jadi jalan hidup.',
    'Semua berawal dari membongkar komputer orang dan penasaran soal cara kerja sesuatu. Banyak hal besar berangkat dari rasa iseng, ujung-ujungnya jadi jalan hidup.' || E'\n\n' ||
    'Dalam dunia programming, semuanya selalu berangkat dari rasa penasaran sederhana. Saya sering mengingat momen-momen kecil ketika sebuah ide muncul begitu saja — dari melihat baris error yang membingungkan sampai akhirnya terawa karena ternyata masalahnya cuma typo satu huruf. Pengalaman semacam inilah yang paling saya syukuri, karena dari sanalah pola pikir saya terbentuk.' || E'\n\n' ||
    (select text from filler) || E'\n\n' ||
    'Kesimpulannya sederhana: jangan takut salah. Setiap kesalahan adalah bahan bakar berikutnya untuk menjadi programer yang lebih baik.',
    '11111111-1111-1111-1111-111111111111', null,
    'https://picsum.photos/seed/dwrite-code-2/1200/600', 6, 'published', '2026-03-18'
  ),
  (
    'Prompt Engineer Itu Bukan Pesulap',
    'prompt-engineer-itu-bukan-pesulap',
    'Banyak yang mengira bikin prompt bagus itu seperti sulap. Realitanya soal ketekunan uji-coba dan debugging. Ini versi jujurnya dari lapangan.',
    'Banyak yang mengira bikin prompt bagus itu seperti sulap. Realitanya soal ketekunan uji-coba dan debugging. Ini versi jujurnya dari lapangan.' || E'\n\n' ||
    'Ketenaran AI dua tahun terakhir bukan sekadar tren buat saya. Ini adalah teknologi yang benar-benar mengubah cara saya bekerja sehari-hari. Dari yang awalnya hanya bertanya-jawab dengan model bahasa, saya mulai penasaran bagaimana cara membuat mesin ini bisa bekerja sendiri menyelesaikan sebuah tugas — satu alur kerja demi satu alur kerja.' || E'\n\n' ||
    (select text from filler) || E'\n\n' ||
    'Ke depan, saya percaya semua orang akan punya "rekan kerja digital" sendiri. Dan saya ingin menjadi bagian dari orang-orang yang membangun fondasinya.',
    '22222222-2222-2222-2222-222222222222', null,
    'https://picsum.photos/seed/dwrite-ai-2/1200/600', 5, 'published', '2026-04-02'
  ),
  (
    'Belajar Bahasa Inggris dari Dokumentasi',
    'belajar-bahasa-inggris-dari-dokumentasi',
    'Salah satu cara saya memperbaiki bahasa Inggris secara gratis: baca dan tulis dokumentasi open source. Ilmu + networking dua duanya dapat.',
    'Salah satu cara saya memperbaiki bahasa Inggris secara gratis: baca dan tulis dokumentasi open source. Ilmu + networking dua duanya dapat.' || E'\n\n' ||
    'Ada kehangatan tersendiri saat kode saya dibaca orang lain. Di komunitas open source, saya belajar bahwa berbagi bukan membuat kita kehilangan — justru membuat ilmu itu tumbuh. Setiap pull request, setiap issue yang dibuka, semuanya mengajarkan saya cara berkomunikasi dan berkolaborasi yang lebih baik.' || E'\n\n' ||
    (select text from filler) || E'\n\n' ||
    'Kalau kamu ragu untuk mulai berkontribusi, mulai saja dari perubahan kecil seperti memperbaiki dokumentasi. Semua orang besar pernah kecil.',
    '33333333-3333-3333-3333-333333333333', null,
    'https://picsum.photos/seed/dwrite-oss-2/1200/600', 4, 'published', '2026-04-17'
  ),
  (
    'Cabut-Pasang: Jurnal Teknisi Komputer',
    'cabut-pasang-jurnal-teknisi-komputer',
    'Bertahun-tahun menjadi teknisi, saya hafal betul bahwa 90% masalah itu dari kabel dan settingan sepele. Analoginya masih berlaku di programming.',
    'Bertahun-tahun menjadi teknisi, saya hafal betul bahwa 90% masalah itu dari kabel dan settingan sepele. Analoginya masih berlaku di programming.' || E'\n\n' ||
    'Dulu saya mengira bahwa jaringan itu soal kabel, switch, dan lampu indikator. Semakin lama saya berkarir, semakin saya sadar bahwa jaringan sebenarnya soal bagaimana hal-hal saling terhubung — dan metafora itu ternyata sangat berlaku juga di dunia software.' || E'\n\n' ||
    (select text from filler) || E'\n\n' ||
    'Fondasi yang kuat itu tidak selalu terlihat — tapi ia menopang semuanya. Sama seperti pengalaman teknis saya di bidang jaringan yang ternyata sangat membantu saya di dunia coding.',
    '44444444-4444-4444-4444-444444444444', null,
    'https://picsum.photos/seed/dwrite-net-2/1200/600', 7, 'published', '2026-05-01'
  ),
  (
    'Ritual Pagi Sederhana Sebelum Ngoding',
    'ritual-pagi-sederhana-sebelum-ngoding',
    'Sebelum mulai kerja, saya biasanya ngopi, jalan sore, dan menyusun target hari itu. Bukan yang neko-neko, cukup biar kepala tetap tenang saat debugging.',
    'Sebelum mulai kerja, saya biasanya ngopi, jalan sore, dan menyusun target hari itu. Bukan yang neko-neko, cukup biar kepala tetap tenang saat debugging.' || E'\n\n' ||
    'Menjadi introvert bukanlah kekurangan, melainkan cara pandang yang berbeda dalam menikmati hidup. Saya belajar bahwa dengan mengenali ritme diri sendiri, banyak hal jadi lebih ringan — mulai dari cara bekerja, cara belajar, sampai cara bersosialisasi.' || E'\n\n' ||
    (select text from filler) || E'\n\n' ||
    'Pada akhirnya, hidup bukan soal menjadi orang lain. Ini soal menjadi versi terbaik dari diri sendiri — dengan irama yang kita pilih sendiri.',
    '55555555-5555-5555-5555-555555555555', null,
    'https://picsum.photos/seed/dwrite-life-2/1200/600', 3, 'published', '2026-05-15'
  )
on conflict (slug) do nothing;

-- ============================================================================
-- 5. CATATAN (dummy opsional)
-- ----------------------------------------------------------------------------
-- 1) File ini bisa dijalankan atau tidak. Schema sudah jalan tanpa dummy.
-- 2) Seed posts memakai author_id null: tetap tampil di blog publik (published)
--    dan di Dashboard (karena hanya ada satu akun pemilik).
-- 3) (Opsional) arahkan post seed agar tercatat sebagai tulisanmu:
--      update public.blog_posts set author_id = auth.uid()
--      where author_id is null;
--    (jalan via Supabase editor setelah login sebagai pemilik, atau ganti
--    auth.uid() dengan UUID akunmu dari: select id from auth.users;)
-- ============================================================================