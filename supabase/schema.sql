-- =====================================================================
-- SKEMA DATABASE — Penjadwalan Kemoterapi (migrasi dari Google Sheets)
-- Jalankan file ini di Supabase Dashboard > SQL Editor, di project BARU.
-- Setelah ini berhasil, baru jalankan seed_data.sql untuk mengisi data lama.
-- =====================================================================

create extension if not exists pgcrypto;

-- ## Tabel utama pasien (dulu: sheet "List Pasien") ##
create table if not exists public.patients (
  id               uuid primary key default gen_random_uuid(),
  nama             text not null unique,
  diagnosa_regimen text,
  interval_hari    integer,
  catatan          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ## Satu baris = satu kelompok jadwal (tanggal + siklus) untuk satu pasien ##
-- (dulu: baris-baris di sheet "Data Pasien" yang punya Tanggal+Siklus sama,
--  di sini dikelompokkan jadi satu baris "schedules" + banyak "schedule_items")
create table if not exists public.schedules (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.patients(id) on delete cascade,
  tanggal     date not null,
  siklus      text,
  keterangan  text,               -- berisi kata "tertunda" kalau ditandai tertunda
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_schedules_patient on public.schedules(patient_id);
create index if not exists idx_schedules_tanggal on public.schedules(tanggal);

-- ## Rincian obat per jadwal (dulu: kolom Obat + Jumlah per baris) ##
create table if not exists public.schedule_items (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid not null references public.schedules(id) on delete cascade,
  obat         text not null,
  jumlah       numeric
);
create index if not exists idx_items_schedule on public.schedule_items(schedule_id);
create index if not exists idx_items_obat on public.schedule_items(lower(obat));

-- ## Stok obat (dulu: sheet "Stok Obat") ##
create table if not exists public.drug_stock (
  id               uuid primary key default gen_random_uuid(),
  nama_obat        text not null unique,
  stok_saat_ini    numeric not null default 0,
  terakhir_update  timestamptz not null default now(),
  catatan          text
);

-- ## Log aktivitas / audit trail (dulu: sheet "Log Aktivitas") ##
create table if not exists public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  waktu      timestamptz not null default now(),
  user_email text,
  aksi       text not null,
  detail     text
);
create index if not exists idx_log_waktu on public.activity_log(waktu desc);

-- Trigger kecil supaya updated_at otomatis terisi ulang saat baris diubah.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_patients_updated on public.patients;
create trigger trg_patients_updated before update on public.patients
  for each row execute function public.set_updated_at();

drop trigger if exists trg_schedules_updated on public.schedules;
create trigger trg_schedules_updated before update on public.schedules
  for each row execute function public.set_updated_at();

-- =====================================================================
-- KEAMANAN (Row Level Security)
-- Data pasien kemoterapi adalah data medis sensitif. Skema ini MEWAJIBKAN
-- login (Supabase Auth) untuk semua akses baca/tulis — TIDAK ada akses
-- publik/anonim sama sekali, beda dengan sheet Google yang aksesnya
-- ditentukan oleh siapa yang diundang ke Spreadsheet.
--
-- Cara menambah pengguna (misalnya perawat/apoteker) setelah ini:
--   Supabase Dashboard > Authentication > Users > Add user
--   (matikan "Allow new users to sign up" di Authentication > Settings
--   supaya orang luar tidak bisa daftar sendiri).
-- =====================================================================

alter table public.patients enable row level security;
alter table public.schedules enable row level security;
alter table public.schedule_items enable row level security;
alter table public.drug_stock enable row level security;
alter table public.activity_log enable row level security;

drop policy if exists "auth full access" on public.patients;
create policy "auth full access" on public.patients
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth full access" on public.schedules;
create policy "auth full access" on public.schedules
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth full access" on public.schedule_items;
create policy "auth full access" on public.schedule_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth full access" on public.drug_stock;
create policy "auth full access" on public.drug_stock
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth full access" on public.activity_log;
create policy "auth full access" on public.activity_log
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- =====================================================================
-- VIEW BANTUAN: ringkasan jadwal terakhir/berikutnya per pasien
-- (menggantikan kolom "Siklus Saat Ini / Tanggal Kemo Terakhir / Perkiraan
--  Kemo Berikutnya" yang dulu ditulis manual ke sheet List Pasien — di sini
--  dihitung otomatis dari data schedules, jadi selalu akurat/real-time)
-- =====================================================================
create or replace view public.v_patient_summary as
select
  p.id,
  p.nama,
  p.diagnosa_regimen,
  p.interval_hari,
  p.catatan,
  last_s.tanggal as tanggal_kemo_terakhir,
  last_s.siklus  as siklus_saat_ini,
  case when p.interval_hari is not null and last_s.tanggal is not null
       then last_s.tanggal + (p.interval_hari || ' days')::interval
       else null end as perkiraan_kemo_berikutnya,
  last_obat.obat_ringkas as obat_yang_digunakan
from public.patients p
left join lateral (
  select s.tanggal, s.siklus, s.id
  from public.schedules s
  where s.patient_id = p.id
  order by s.tanggal desc
  limit 1
) last_s on true
left join lateral (
  select string_agg(distinct si.obat, ', ') as obat_ringkas
  from public.schedule_items si
  where si.schedule_id = last_s.id
) last_obat on true;
