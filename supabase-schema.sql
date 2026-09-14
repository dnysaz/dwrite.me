-- ============================================================================
-- dwrite.me — Supabase Schema (STRUKTUR DATABASE)
-- Jalankan di Supabase Dashboard → SQL Editor → New query → Run.
--
-- File khusus struktur: tabel, trigger, fungsi, Row Level Security, dan storage.
-- Untuk data dummy (seed), jalankan file terpisah: supabase-data.sql
--
-- PENTING: file ini otomatis MENGOSONGKAN semua tabel setiap kali dijalankan
-- (truncate). Jadi database selalu mulai dari 0; data dummy hanya masuk
-- setelah menjalankan supabase-data.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABEL KONFIGURASI SITE (key-value) — data kontak & identitas situs
-- ----------------------------------------------------------------------------
create table if not exists public.site_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. PROFIL (perluas auth.users)
-- Trigger otomatis: setelah user baru signup, dibuatkan baris profil.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  bio_en       text,
  location     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. KATEGORI BLOG
-- ----------------------------------------------------------------------------
create table if not exists public.blog_categories (
  id          uuid primary key,
  name        text not null,
  slug        text unique not null,
  description text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. POST BLOG
-- ----------------------------------------------------------------------------
create table if not exists public.blog_posts (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text unique not null,
  excerpt          text not null,
  content          text not null,              -- paragraf dipisah baris kosong (\n\n)
  category_id      uuid references public.blog_categories (id) on delete set null,
  author_id        uuid references public.profiles (id) on delete set null,
  cover_image_url  text,
  tags             text[] not null default '{}',
  read_time_minutes int not null default 5,
  status           text not null default 'published' check (status in ('draft','published')),
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Kolom tags untuk database yang sudah ada (idempotent)
alter table public.blog_posts add column if not exists tags text[] not null default '{}';

create index if not exists blog_posts_status_idx    on public.blog_posts (status);
create index if not exists blog_posts_category_idx  on public.blog_posts (category_id);
create index if not exists blog_posts_published_idx on public.blog_posts (published_at desc);

-- ----------------------------------------------------------------------------
-- 5. PESAN DARI FORM KONTAK
-- ----------------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  is_read    boolean not null default false,
  status     text not null default 'new',   -- 'new' | 'read' | 'deleted' (soft delete)
  created_at timestamptz not null default now()
);

-- Kolom status untuk database yang sudah ada (idempotent, soft delete messages)
alter table public.messages add column if not exists status text not null default 'new';

create index if not exists messages_created_idx on public.messages (created_at desc);
create index if not exists messages_status_idx on public.messages (status);

-- ----------------------------------------------------------------------------
-- 6. PROYEK (opsional: kurasi/pin proyek dari GitHub, atau fallback)
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  html_url    text not null,
  language    text,
  stack       jsonb not null default '[]',      -- contoh: ["TypeScript","Next.js"]
  stars       integer not null default 0,
  forks       integer not null default 0,
  featured    boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. CACHE GITHUB API (hindari rate limit 60/jam tanpa token)
-- ----------------------------------------------------------------------------
create table if not exists public.github_cache (
  key         text primary key,                 -- 'user' | 'repos' | 'contributions:<tahun>'
  payload     jsonb not null,
  fetched_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '1 hour'
);

-- ----------------------------------------------------------------------------
-- 7c. GEMINI API KEY (disimpan terenkripsi AES-256-GCM, kunci = APP_ENCRYPTION_KEY)
-- ----------------------------------------------------------------------------
-- Kolom baru untuk database yang sudah ada (idempotent, aman dijalankan ulang):
alter table public.site_settings
  add column if not exists gemini_api_key_enc text;

comment on column public.site_settings.gemini_api_key_enc is
  'Gemini API key terenkripsi (AES-256-GCM, format iv:tag:cipher hex). Null = belum diatur.';

-- ----------------------------------------------------------------------------
-- 7b. RESET DATA: menjalankan schema = database mulai dari 0 (kosong)
-- Semua data lama ikut terhapus. Dummy data hanya masuk lewat supabase-data.sql.
-- ============================================================================
truncate table public.site_settings,
             public.profiles,
             public.blog_categories,
             public.blog_posts,
             public.messages,
             public.projects,
             public.github_cache
cascade;

-- ============================================================================
-- 8. TRIGGER: set updated_at otomatis
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_site_settings on public.site_settings;
create trigger set_updated_at_site_settings
  before update on public.site_settings
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_blog_posts on public.blog_posts;
create trigger set_updated_at_blog_posts
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_projects on public.projects;
create trigger set_updated_at_projects
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 9. TRIGGER: buat profil otomatis saat user baru signup
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 9b. FUNGSI ANTI-SPAM (rate limit form kontak)
-- ----------------------------------------------------------------------------
-- Hitung pesan dari email yang sama dalam X menit terakhir.
-- Anonim boleh memanggil (security definer) untuk rate-limit form kontak.
create or replace function public.count_recent_messages(p_email text, p_minutes int default 60)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from public.messages
  where email = p_email
    and created_at > now() - make_interval(mins => p_minutes);
$$;

-- ============================================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================================
alter table public.site_settings  enable row level security;
alter table public.profiles       enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_posts     enable row level security;
alter table public.messages       enable row level security;
alter table public.projects       enable row level security;
alter table public.github_cache   enable row level security;

-- Semua orang boleh baca (konten publik)
drop policy if exists site_settings_select on public.site_settings;
create policy site_settings_select on public.site_settings for select using (true);

-- Sembunyikan kolom rahasia dari akses anonim/publik (RLS per-baris tidak bisa
-- per-kolom, jadi kita batasi via GRANT kolom). Halaman publik tetap bisa baca
-- key/value/updated_at; kolom terenkripsi hanya bisa diakses via server action
-- (role authenticated) dan isinya tetap tak terbaca tanpa APP_ENCRYPTION_KEY.
revoke select on public.site_settings from anon;
grant select (key, value, updated_at) on public.site_settings to anon;

-- Pemilik (satu-satunya akun yang login) boleh mengubah setting situs (mis. OG image)
drop policy if exists site_settings_insert on public.site_settings;
create policy site_settings_insert on public.site_settings
  for insert with check (auth.role() = 'authenticated');

drop policy if exists site_settings_update on public.site_settings;
create policy site_settings_update on public.site_settings
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (true);

drop policy if exists blog_categories_select on public.blog_categories;
create policy blog_categories_select on public.blog_categories for select using (true);

-- Post blog: publik hanya bisa baca yang published; penulis boleh baca semua
-- (termasuk draft). Mencegah draft bocor lewat REST.
drop policy if exists blog_posts_select on public.blog_posts;
drop policy if exists blog_posts_select_public on public.blog_posts;
create policy blog_posts_select_public on public.blog_posts
  for select using (status = 'published' and published_at is not null);

drop policy if exists blog_posts_select_own on public.blog_posts;
create policy blog_posts_select_own on public.blog_posts
  for select using (auth.uid() = author_id or author_id is null);

drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects for select using (true);

drop policy if exists github_cache_select on public.github_cache;
create policy github_cache_select on public.github_cache for select using (true);

-- Siapa pun boleh kirim pesan lewat form kontak, tapi hanya pemilik yang baca
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert with check (true);

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select using (auth.role() = 'authenticated');

drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages for update using (auth.role() = 'authenticated');

drop policy if exists messages_delete on public.messages;
create policy messages_delete on public.messages for delete using (auth.role() = 'authenticated');

-- Pemilik profil hanya bisa update profilnya sendiri
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Pemilik profil bisa membuat baris profilnya sendiri (dipakai upsert dari app)
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (auth.uid() = id);

-- Pemilik (satu-satunya akun) boleh kelola blog, kategori, proyek & cache
drop policy if exists blog_posts_insert on public.blog_posts;
create policy blog_posts_insert on public.blog_posts for insert with check (auth.role() = 'authenticated');
drop policy if exists blog_posts_update on public.blog_posts;
create policy blog_posts_update on public.blog_posts for update using (auth.role() = 'authenticated');
drop policy if exists blog_posts_delete on public.blog_posts;
create policy blog_posts_delete on public.blog_posts for delete using (auth.role() = 'authenticated');

drop policy if exists blog_categories_insert on public.blog_categories;
create policy blog_categories_insert on public.blog_categories for insert with check (auth.role() = 'authenticated');
drop policy if exists blog_categories_update on public.blog_categories;
create policy blog_categories_update on public.blog_categories for update using (auth.role() = 'authenticated');
drop policy if exists blog_categories_delete on public.blog_categories;
create policy blog_categories_delete on public.blog_categories for delete using (auth.role() = 'authenticated');

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert with check (auth.role() = 'authenticated');
drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects for update using (auth.role() = 'authenticated');
drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects for delete using (auth.role() = 'authenticated');

drop policy if exists github_cache_insert on public.github_cache;
create policy github_cache_insert on public.github_cache for insert with check (auth.role() = 'authenticated');
drop policy if exists github_cache_update on public.github_cache;
create policy github_cache_update on public.github_cache for update using (auth.role() = 'authenticated');

-- ============================================================================
-- 11. STORAGE: bucket avatar (untuk fitur upload gambar di Dashboard → Settings)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Siapa pun boleh melihat gambar avatar (dibutuhkan <img src> publik)
drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

-- Hanya user yang login boleh upload / edit avatar
-- File harus berada di folder nama user sendiri: {auth.uid()}/...
drop policy if exists avatars_auth_upload on storage.objects;
create policy avatars_auth_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_auth_update on storage.objects;
create policy avatars_auth_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_auth_delete on storage.objects;
create policy avatars_auth_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 12. STORAGE: bucket post-images (thumbnail post blog)
-- Gambar dari form Create/Edit Post disimpan di sini, sudah dikompres WebP.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Siapa pun boleh melihat thumbnail post (dibutuhkan <img> publik)
drop policy if exists post_images_public_read on storage.objects;
create policy post_images_public_read on storage.objects
  for select using (bucket_id = 'post-images');

-- Hanya user yang login boleh upload thumbnail
-- File harus berada di folder posts/{uuid}.webp
drop policy if exists post_images_auth_upload on storage.objects;
create policy post_images_auth_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = 'posts'
  );

drop policy if exists post_images_auth_update on storage.objects;
create policy post_images_auth_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = 'posts'
  );

drop policy if exists post_images_auth_delete on storage.objects;
create policy post_images_auth_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = 'posts'
  );