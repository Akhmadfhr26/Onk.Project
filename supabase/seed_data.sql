-- =====================================================================
-- SEED DATA — migrasi dari 'Perencanaan Jadwal Pasien Kemoterapi.xlsx'
-- Jalankan SETELAH schema.sql. Aman dijalankan sekali di project baru.
-- =====================================================================

begin;

-- ## Pasien (List Pasien + gabungan nama dari Data Pasien) ##
insert into public.patients (nama, diagnosa_regimen, interval_hari, catatan) values
('Agustinus', NULL, 14, NULL),
('Rusita', '-', 21, NULL),
('Riyan', NULL, 14, NULL),
('Siti Nurul Aini', NULL, 21, NULL),
('Saparni', NULL, 21, NULL),
('Tarmuji', NULL, 21, NULL),
('Syuriani', NULL, 7, NULL),
('Agustinus Paran', NULL, 14, NULL),
('Hamidah', NULL, 21, NULL),
('Matius Ding', NULL, 21, NULL),
('Siyamto (zometa)', NULL, 30, NULL),
('Aminah', NULL, 21, NULL),
('mohd. yusuf 5', NULL, 21, NULL),
('Sulastri', NULL, 21, NULL),
('Deya', NULL, 28, NULL),
('Anik', NULL, 21, NULL),
('Sundari', NULL, NULL, NULL),
('Nur Afni', NULL, 14, NULL),
('Tukiman', NULL, 14, NULL),
('Poninten', NULL, 21, NULL),
('rosa dalima 5', NULL, 21, NULL),
('Rony', NULL, 7, NULL),
('Armawan', NULL, 21, NULL),
('Iin Subhatin', NULL, 21, NULL),
('Daliyem', NULL, 14, NULL),
('Tukiri', NULL, 21, NULL),
('Zhurena', NULL, 30, NULL),
('Suharto HB', NULL, 21, NULL),
('Waginah', NULL, 21, NULL),
('Kasemin', NULL, 14, NULL),
('Ariansyah', NULL, 21, NULL),
('Mariyati', NULL, 21, NULL),
('riyan adi saputra', NULL, 21, NULL),
('Asia Mappa (zometa)', NULL, 30, NULL),
('Arhariah', NULL, 21, NULL),
('Haula', NULL, 21, NULL),
('jam''ah', NULL, 21, NULL),
('Nawawi', NULL, 30, NULL),
('Senayah', NULL, 21, NULL),
('Aldi Trigunadi', NULL, 21, NULL),
('Karolina Priskalia', NULL, 14, NULL),
('Muhammad Ali Alhamidi', NULL, 21, NULL),
('Joko Wuryanto', NULL, 21, NULL),
('agra Birka', NULL, 21, NULL),
('Dewi Anggraeni', NULL, 30, NULL),
('Nunik', NULL, 21, NULL),
('Syafitriansyah', NULL, 30, NULL),
('Diana', NULL, 21, NULL),
('Jamalia', NULL, 21, NULL),
('Retno Mintarsih', NULL, 21, NULL),
('Amon', NULL, 21, NULL),
('wiwik', NULL, 21, NULL),
('Yugo Widya', NULL, 14, NULL),
('Atin', NULL, 14, NULL),
('Lidia', NULL, 21, NULL),
('M. AL-GIFARRY', NULL, 21, NULL),
('Nurdin Askali', NULL, 14, NULL),
('NURSAHIDAH', NULL, 21, NULL),
('Sumarni', NULL, 21, NULL),
('Jerum Penu', NULL, 21, NULL),
('Fitrianingsih', NULL, 21, NULL),
('Purnama Sari', NULL, 21, NULL),
('Musliati', NULL, 21, NULL),
('Rahmat Efendi', NULL, 21, NULL),
('Ainah', NULL, 28, NULL),
('Ria Armilasari', NULL, 21, NULL),
('m. Iduansyah', NULL, NULL, NULL),
('Andriyani', NULL, NULL, NULL),
('Musori', NULL, 28, NULL),
('Heru Septianus', NULL, 21, NULL),
('Abdussalam', NULL, 21, NULL),
('Sapariyem', NULL, 21, NULL),
('Ezra', NULL, 21, NULL),
('Rafnia', NULL, NULL, NULL),
('Suprayitno', NULL, 7, NULL),
('Zhurena (iban)', NULL, NULL, NULL),
('Santi Herawati', NULL, NULL, NULL),
('ariantje diimpudus', NULL, NULL, NULL),
('Muin', NULL, NULL, NULL),
('Rahmat Effendi', NULL, NULL, NULL),
('Jerum Peni', NULL, NULL, NULL),
('EDY SUSANTO', NULL, NULL, NULL),
('Sapari', NULL, NULL, NULL),
('Weni', NULL, NULL, NULL),
('Ade Syahrial', NULL, NULL, NULL),
('Candra Gunawan', NULL, NULL, NULL),
('Rahmat', NULL, NULL, NULL),
('rosa dalima', NULL, NULL, NULL),
('Yati', NULL, NULL, NULL),
('Retno Mintarsih (zometa)', NULL, NULL, NULL),
('Jesika Wenti Lubung', NULL, NULL, NULL),
('Kaelani', NULL, NULL, NULL),
('Musli''in', NULL, NULL, NULL),
('Nurmy', NULL, NULL, NULL)
on conflict (nama) do nothing;

-- ## Jadwal kemo (schedules) + rincian obat (schedule_items) ##
do $$
declare
  v_patient_id uuid;
  v_schedule_id uuid;
begin
  select id into v_patient_id from public.patients where lower(nama) = 'agustinus' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-01', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'oksaliplatin 50', 1.0),
  (v_schedule_id, 'ca folinat', 14.0),
  (v_schedule_id, 'curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rusita' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-01', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Cisplatin 50', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'riyan' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-02', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Metotrexate', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'siti nurul aini' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-02', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'paklitaksel', 3.0),
  (v_schedule_id, 'cisplatin 50', 2.0),
  (v_schedule_id, 'herzemab', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'saparni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-03', '8', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 16.0);

  select id into v_patient_id from public.patients where lower(nama) = 'tarmuji' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-03', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Vinkristin', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'agustinus paran' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-04', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'hamidah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-04', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'matius ding' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-04', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Pemetrexed', 2.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'Karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'siyamto (zometa)' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-04', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'syuriani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-04', '3D', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'aminah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-05', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'deya' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-05', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'daunocin', 6.0),
  (v_schedule_id, 'sitarabin', 7.0);

  select id into v_patient_id from public.patients where lower(nama) = 'mohd. yusuf 5' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-05', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'dosetaksel 80', 1.0),
  (v_schedule_id, 'dosetaksel 20', 2.0),
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 15.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sulastri' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-05', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'paklitaksel', 3.0),
  (v_schedule_id, 'cisplatin 50', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nur afni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-06', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'oksaliplatin 50', 1.0),
  (v_schedule_id, 'ca folinat', 7.0),
  (v_schedule_id, 'curacil', 9.0);

  select id into v_patient_id from public.patients where lower(nama) = 'poninten' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-06', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rosa dalima 5' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-06', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sundari' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-06', 'prephase', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Vinkristin', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'tukiman' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-06', '8', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'andriyani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-07', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Cisplatin 50', 3.0),
  (v_schedule_id, 'Sitarabin', 6.0);

  select id into v_patient_id from public.patients where lower(nama) = 'iin subhatin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-07', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rony' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-07', '3A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'daliyem' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-08', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'tukiri' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-08', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'paklitaksel', 3.0),
  (v_schedule_id, 'Karboplatin 450', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'zhurena' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-08', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Ifosfamid', 8.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Mesna', 18.0);

  select id into v_patient_id from public.patients where lower(nama) = 'zhurena (iban)' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-08', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Ibandronat', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'suharto hb' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-09', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'paklitaksel', 3.0),
  (v_schedule_id, 'Cisplatin 50', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'waginah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-10', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ariansyah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-11', '3A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Gemsitabin', 2.0),
  (v_schedule_id, 'Karboplatin 450', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'kasemin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-11', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'syuriani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-11', '4A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'mariyati' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-12', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'riyan adi saputra' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-12', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Metotrexate (MTX)', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Siklofosfamid', 2.0),
  (v_schedule_id, 'mesna', 3.0),
  (v_schedule_id, 'sitarabin', 3.0);

  select id into v_patient_id from public.patients where lower(nama) = 'arhariah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-13', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Cisplatin 50', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'asia mappa (zometa)' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-13', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'aldi trigunadi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-14', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Metotrexate (MTX)', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'mesna', 3.0),
  (v_schedule_id, 'sitarabin', 3.0);

  select id into v_patient_id from public.patients where lower(nama) = 'haula' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-14', '9', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 2.0),
  (v_schedule_id, 'Cisplatin 50', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'jam''ah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-14', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nawawi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-14', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rony' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-14', '3B', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'senayah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-14', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'tarmuji' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-14', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'agra birka' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-15', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'daunocin', 3.0),
  (v_schedule_id, 'Sitarabin', 7.0);

  select id into v_patient_id from public.patients where lower(nama) = 'agustinus' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-15', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'oksaliplatin 50', 1.0),
  (v_schedule_id, 'ca folinat', 14.0),
  (v_schedule_id, 'curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'dewi anggraeni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-15', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'joko wuryanto' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-15', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'karolina priskalia' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-15', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Irinotekan', 3.0),
  (v_schedule_id, 'Ca Folinat', 12.0),
  (v_schedule_id, 'curacil', 7.0);

  select id into v_patient_id from public.patients where lower(nama) = 'muhammad ali alhamidi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-15', '1A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'gemsitabin', 2.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nunik' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-15', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'santi herawati' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-15', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Brentuksimab', 3.0),
  (v_schedule_id, 'Sitarabin', 4.0),
  (v_schedule_id, 'Etoposide', 4.0),
  (v_schedule_id, 'cisplatin 50', 4.0);

  select id into v_patient_id from public.patients where lower(nama) = 'syafitriansyah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-16', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'diana' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-17', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'jamalia' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-17', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0),
  (v_schedule_id, 'Herzemab', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'retno mintarsih' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-18', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 4.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'amon' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-19', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Karboplatin', 1.0),
  (v_schedule_id, 'Curacil', 12.0);

  select id into v_patient_id from public.patients where lower(nama) = 'wiwik' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-19', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'yugo widya' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-19', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'agustinus paran' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-20', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ariantje diimpudus' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-20', '11', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'herzemab', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'atin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-20', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Ca Folinat', 12.0),
  (v_schedule_id, 'Curacil', 12.0);

  select id into v_patient_id from public.patients where lower(nama) = 'lidia' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-20', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Cisplatin 50', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'm. al-gifarry' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-20', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 1.0),
  (v_schedule_id, 'Siklofosfamid', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'muin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-20', '6A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Gemsitabin', 2.0),
  (v_schedule_id, 'Karboplatin 450', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'syuriani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-20', '4B', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'tukiman' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-20', '9', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'anik' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-21', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nurdin askali' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-21', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Dosetaksel 80', 1.0),
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'ca folinat', 6.0),
  (v_schedule_id, 'Curacil', 7.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nursahidah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-21', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Brentuksimab', 2.0),
  (v_schedule_id, 'Etoposide', 1.0),
  (v_schedule_id, 'Cisplatin 50', 1.0),
  (v_schedule_id, 'Sitarabin', 3.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rahmat effendi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-21', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 16.0),
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 16.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rony' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-21', '3C', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sumarni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-21', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Metotrexate (MTX)', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'fitrianingsih' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-22', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Ifosfamid', 8.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'mesna', 17.0);

  select id into v_patient_id from public.patients where lower(nama) = 'jerum peni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-22', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'mesna', 17.0),
  (v_schedule_id, 'Ifosfamid', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'musliati' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-22', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 1.0),
  (v_schedule_id, 'Cisplatin', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nur afni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-22', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'oksaliplatin 50', 1.0),
  (v_schedule_id, 'ca folinat', 7.0),
  (v_schedule_id, 'curacil', 9.0);

  select id into v_patient_id from public.patients where lower(nama) = 'purnama sari' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-22', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'mesna', 17.0),
  (v_schedule_id, 'Ifosfamid', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ainah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-24', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Siklofosfamid', 3.0);

  select id into v_patient_id from public.patients where lower(nama) = 'aminah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-24', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'Karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ria armilasari' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-24', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Metotrexate (MTX)', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'edy susanto' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-25', '1A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rafnia' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-29', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'oksaliplatin 50', 1.0),
  (v_schedule_id, 'ca folinat', 11.0),
  (v_schedule_id, 'curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sundari' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-25', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'aminah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-26', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ezra' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-28', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'matius ding' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-26', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Pemetrexed', 2.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'Karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'mohd. yusuf 5' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-26', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'dosetaksel 80', 1.0),
  (v_schedule_id, 'dosetaksel 20', 2.0),
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 15.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sapari' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-26', '1A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'weni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-26', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ade syahrial' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-27', '3A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Cisplatin 50', 2.0),
  (v_schedule_id, 'Cisplatin 10', 1.0),
  (v_schedule_id, 'Etoposide', 6.0);

  select id into v_patient_id from public.patients where lower(nama) = 'candra gunawan' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-27', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 1.0),
  (v_schedule_id, 'Etoposide', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'poninten' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-27', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rahmat' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-27', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 16.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rahmat' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-27', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'karboplatin 450', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rosa dalima' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-27', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sulastri' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-27', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'paklitaksel', 3.0),
  (v_schedule_id, 'cisplatin 50', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'syuriani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-27', '4C', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'yati' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-27', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Karboplatin 150', 1.0),
  (v_schedule_id, 'Karboplatin 450', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'iin subhatin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-28', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'retno mintarsih (zometa)' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-28', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rony' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-28', '3D', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sumarni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-03', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Metotrexate (MTX)', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'agustinus' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-29', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'oksaliplatin 50', 1.0),
  (v_schedule_id, 'ca folinat', 14.0),
  (v_schedule_id, 'curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'jesika wenti lubung' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-29', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'karolina priskalia' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-31', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Irinotekan', 3.0),
  (v_schedule_id, 'Ca Folinat', 12.0),
  (v_schedule_id, 'curacil', 7.0);

  select id into v_patient_id from public.patients where lower(nama) = 'muin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-29', '6B', 'Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'gemsitabin', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'tukiri' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-31', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'paklitaksel', 3.0),
  (v_schedule_id, 'Karboplatin 450', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'armawan' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-30', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Brentuksimab', 2.0),
  (v_schedule_id, 'Etoposide', 4.0),
  (v_schedule_id, 'Sitarabin', 3.0),
  (v_schedule_id, 'Cisplatin 50', 4.0);

  select id into v_patient_id from public.patients where lower(nama) = 'suharto hb' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-30', '2', 'Tertunda; Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'paklitaksel', 3.0),
  (v_schedule_id, 'Cisplatin 50', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'andriyani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-30', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Cisplatin 50', 3.0),
  (v_schedule_id, 'Sitarabin', 6.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ariansyah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-31', '3B', 'Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Gemsitabin', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'daliyem' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-31', '', 'Tertunda; Tertunda; Tertunda; Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'kaelani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-31', '8', 'Tertunda; Tertunda; Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 2.0),
  (v_schedule_id, 'ca folinat', 14.0),
  (v_schedule_id, 'curacil', 10.0);

  select id into v_patient_id from public.patients where lower(nama) = 'kaelani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-31', '9', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 2.0),
  (v_schedule_id, 'ca folinat', 14.0),
  (v_schedule_id, 'curacil', 10.0);

  select id into v_patient_id from public.patients where lower(nama) = 'muhammad ali alhamidi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-31', '1B', 'Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'gemsitabin', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'musli''in' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-31', '1', 'Tertunda; Tertunda; Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Ifosfamid', 10.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Mesna', 24.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nurmy' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-31', '4', 'Tertunda; Tertunda; Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 2.0),
  (v_schedule_id, 'ca folinat', 13.0),
  (v_schedule_id, 'curacil', 10.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rusita' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-31', '6', 'Tertunda; Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Cisplatin 50', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'saparni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-04', '9', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 16.0);

  select id into v_patient_id from public.patients where lower(nama) = 'waginah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-31', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ariansyah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-03', '4A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Gemsitabin', 2.0),
  (v_schedule_id, 'Karboplatin 450', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'edy susanto' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-01', '1B', 'Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'kasemin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-01', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'deya' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-02', '2', 'Tertunda; Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'daunocin', 6.0),
  (v_schedule_id, 'sitarabin', 7.0);

  select id into v_patient_id from public.patients where lower(nama) = 'mariyati' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-02', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'riyan adi saputra' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-02', '', 'Tertunda; Tertunda; Tertunda; Tertunda; Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Metotrexate (MTX)', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Siklofosfamid', 2.0),
  (v_schedule_id, 'mesna', 3.0),
  (v_schedule_id, 'sitarabin', 3.0);

  select id into v_patient_id from public.patients where lower(nama) = 'yugo widya' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-02', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'agustinus paran' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-03', '3', 'Tertunda; Tertunda; Tertunda; Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'arhariah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-04', '5', 'Tertunda; Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Cisplatin 50', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'atin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-03', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Ca Folinat', 12.0),
  (v_schedule_id, 'Curacil', 12.0);

  select id into v_patient_id from public.patients where lower(nama) = 'siyamto (zometa)' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-04', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'syuriani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-03', '4D', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'aldi trigunadi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-04', '', 'Tertunda; Tertunda; Tertunda; Tertunda; Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'mtx', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'mesna', 3.0),
  (v_schedule_id, 'sitarabin', 3.0);

  select id into v_patient_id from public.patients where lower(nama) = 'jam''ah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-04', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nurdin askali' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-04', '2', 'Tertunda; Tertunda; Tertunda; Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Dosetaksel 80', 1.0),
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'ca folinat', 6.0),
  (v_schedule_id, 'Curacil', 7.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rony' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-04', '4A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'senayah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-04', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'tukiman' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-04', '10', 'Tertunda; Tertunda; Tertunda; Tertunda') returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'agra birka' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-05', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'daunocin', 3.0),
  (v_schedule_id, 'Sitarabin', 7.0);

  select id into v_patient_id from public.patients where lower(nama) = 'daliyem' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-05', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'joko wuryanto' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-05', '7', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'muhammad ali alhamidi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-05', '1A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'gemsitabin', 2.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nunik' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-05', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nur afni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-05', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'oksaliplatin 50', 1.0),
  (v_schedule_id, 'ca folinat', 7.0),
  (v_schedule_id, 'curacil', 9.0);

  select id into v_patient_id from public.patients where lower(nama) = 'santi herawati' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-05', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Brentuksimab', 3.0),
  (v_schedule_id, 'Sitarabin', 4.0),
  (v_schedule_id, 'Etoposide', 4.0),
  (v_schedule_id, 'cisplatin 50', 4.0);

  select id into v_patient_id from public.patients where lower(nama) = 'zhurena (iban)' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-07', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Ibandronat', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'diana' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-08', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'edy susanto' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-08', '1C', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'jamalia' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-08', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0),
  (v_schedule_id, 'Herzemab', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rafnia' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-12', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'oksaliplatin 50', 1.0),
  (v_schedule_id, 'ca folinat', 11.0),
  (v_schedule_id, 'curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'retno mintarsih' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-08', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 4.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'amon' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-09', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Karboplatin', 1.0),
  (v_schedule_id, 'Curacil', 12.0);

  select id into v_patient_id from public.patients where lower(nama) = 'wiwik' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-09', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ariantje diimpudus' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-10', '11', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'herzemab', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'kaelani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-10', '9', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 2.0),
  (v_schedule_id, 'ca folinat', 14.0),
  (v_schedule_id, 'curacil', 10.0);

  select id into v_patient_id from public.patients where lower(nama) = 'lidia' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-10', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Cisplatin 50', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'm. al-gifarry' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-10', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 1.0),
  (v_schedule_id, 'Siklofosfamid', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'musli''in' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-10', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Ifosfamid', 10.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Mesna', 24.0);

  select id into v_patient_id from public.patients where lower(nama) = 'syuriani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-10', '5A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'anik' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-11', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'muin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-11', '6A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Gemsitabin', 2.0),
  (v_schedule_id, 'Karboplatin 450', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nursahidah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-11', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Brentuksimab', 2.0),
  (v_schedule_id, 'Etoposide', 1.0),
  (v_schedule_id, 'Cisplatin 50', 1.0),
  (v_schedule_id, 'Sitarabin', 3.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rahmat effendi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-11', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 16.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rony' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-11', '4B', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0),
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'agustinus' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-12', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'oksaliplatin 50', 1.0),
  (v_schedule_id, 'ca folinat', 14.0),
  (v_schedule_id, 'curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'asia mappa (zometa)' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-12', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'fitrianingsih' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-12', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Ifosfamid', 8.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'mesna', 17.0);

  select id into v_patient_id from public.patients where lower(nama) = 'jerum peni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-12', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'mesna', 17.0),
  (v_schedule_id, 'Ifosfamid', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'jesika wenti lubung' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-12', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'karolina priskalia' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-14', '7', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Irinotekan', 3.0),
  (v_schedule_id, 'Ca Folinat', 12.0),
  (v_schedule_id, 'curacil', 7.0);

  select id into v_patient_id from public.patients where lower(nama) = 'musliati' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-12', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 1.0),
  (v_schedule_id, 'Cisplatin', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'purnama sari' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-12', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'mesna', 17.0),
  (v_schedule_id, 'Ifosfamid', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rahmat effendi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-12', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 16.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nawawi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-13', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'aminah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-14', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'Karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'dewi anggraeni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-14', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ria armilasari' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-14', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Metotrexate (MTX)', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'saparni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-18', '10', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 16.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ade syahrial' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-15', '4A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Cisplatin 50', 2.0),
  (v_schedule_id, 'Cisplatin 10', 1.0),
  (v_schedule_id, 'Etoposide', 6.0);

  select id into v_patient_id from public.patients where lower(nama) = 'edy susanto' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-15', '1D', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'hamidah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-15', '8', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'kasemin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-15', '7', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'matius ding' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-15', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Pemetrexed', 2.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'Karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sundari' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-15', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'syafitriansyah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-15', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'aminah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-16', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ezra' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-18', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'mohd. yusuf 5' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-16', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'dosetaksel 80', 1.0),
  (v_schedule_id, 'dosetaksel 20', 2.0),
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 15.0);

  select id into v_patient_id from public.patients where lower(nama) = 'weni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-16', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'yugo widya' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-16', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'agustinus paran' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-17', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ariansyah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-19', '3B', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Gemsitabin', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'atin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-17', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Ca Folinat', 12.0),
  (v_schedule_id, 'Curacil', 12.0);

  select id into v_patient_id from public.patients where lower(nama) = 'candra gunawan' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-17', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 1.0),
  (v_schedule_id, 'Etoposide', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'poninten' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-17', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rahmat' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-17', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 16.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rosa dalima' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-17', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sulastri' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-17', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'paklitaksel', 3.0),
  (v_schedule_id, 'cisplatin 50', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'syuriani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-17', '5B', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'yati' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-17', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Karboplatin 150', 1.0),
  (v_schedule_id, 'Karboplatin 450', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'iin subhatin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-18', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nurdin askali' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-18', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Dosetaksel 80', 1.0),
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'ca folinat', 6.0),
  (v_schedule_id, 'Curacil', 7.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rony' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-18', '4c', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sumarni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-24', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Metotrexate (MTX)', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'tukiman' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-18', '10', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'daliyem' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-19', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'muin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-19', '7B', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'gemsitabin', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nur afni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-19', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'oksaliplatin 50', 1.0),
  (v_schedule_id, 'ca folinat', 7.0),
  (v_schedule_id, 'curacil', 9.0);

  select id into v_patient_id from public.patients where lower(nama) = 'tukiri' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-21', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'paklitaksel', 3.0),
  (v_schedule_id, 'Karboplatin 450', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'armawan' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-20', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Brentuksimab', 2.0),
  (v_schedule_id, 'Etoposide', 4.0),
  (v_schedule_id, 'Sitarabin', 3.0),
  (v_schedule_id, 'Cisplatin 50', 4.0);

  select id into v_patient_id from public.patients where lower(nama) = 'suharto hb' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-20', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'paklitaksel', 3.0),
  (v_schedule_id, 'Cisplatin 50', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ainah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-21', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Siklofosfamid', 3.0);

  select id into v_patient_id from public.patients where lower(nama) = 'andriyani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-20', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Cisplatin 50', 3.0),
  (v_schedule_id, 'Sitarabin', 6.0);

  select id into v_patient_id from public.patients where lower(nama) = 'waginah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-21', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ariansyah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-24', '5A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Gemsitabin', 2.0),
  (v_schedule_id, 'Karboplatin 450', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rafnia' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-26', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'oksaliplatin 50', 1.0),
  (v_schedule_id, 'ca folinat', 11.0),
  (v_schedule_id, 'curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'mariyati' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-23', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'riyan adi saputra' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-23', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'mtx', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Siklofosfamid', 2.0),
  (v_schedule_id, 'mesna', 3.0),
  (v_schedule_id, 'sitarabin', 3.0);

  select id into v_patient_id from public.patients where lower(nama) = 'edy susanto' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-24', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Ibandronat', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'kaelani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-24', '10', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 2.0),
  (v_schedule_id, 'ca folinat', 14.0),
  (v_schedule_id, 'curacil', 10.0);

  select id into v_patient_id from public.patients where lower(nama) = 'syuriani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-24', '5C', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'aldi trigunadi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-25', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Metotrexate (MTX)', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'mesna', 3.0),
  (v_schedule_id, 'sitarabin', 3.0);

  select id into v_patient_id from public.patients where lower(nama) = 'haula' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-25', '11', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 2.0),
  (v_schedule_id, 'Cisplatin 50', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'jam''ah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-25', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rony' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-25', '4D', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'senayah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-25', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'agra birka' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-26', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'daunocin', 3.0),
  (v_schedule_id, 'Sitarabin', 7.0);

  select id into v_patient_id from public.patients where lower(nama) = 'agustinus' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-26', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'oksaliplatin 100', 1.0),
  (v_schedule_id, 'oksaliplatin 50', 1.0),
  (v_schedule_id, 'ca folinat', 14.0),
  (v_schedule_id, 'curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'jesika wenti lubung' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-26', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'joko wuryanto' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-26', '8', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'karolina priskalia' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-28', '8', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Irinotekan', 3.0),
  (v_schedule_id, 'Ca Folinat', 12.0),
  (v_schedule_id, 'curacil', 7.0);

  select id into v_patient_id from public.patients where lower(nama) = 'muhammad ali alhamidi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-26', '2A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'gemsitabin', 2.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nunik' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-26', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'retno mintarsih (zometa)' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-27', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'diana' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-29', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'jamalia' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-29', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0),
  (v_schedule_id, 'Herzemab', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'kasemin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-29', '8', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'retno mintarsih' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-29', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 4.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'amon' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-30', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Karboplatin', 1.0),
  (v_schedule_id, 'Curacil', 12.0);

  select id into v_patient_id from public.patients where lower(nama) = 'deya' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-30', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'daunocin', 6.0),
  (v_schedule_id, 'sitarabin', 7.0);

  select id into v_patient_id from public.patients where lower(nama) = 'mohd. yusuf 5' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-30', '7', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'curacil', 15.0);

  select id into v_patient_id from public.patients where lower(nama) = 'wiwik' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-30', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'yugo widya' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-30', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ariantje diimpudus' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-01', '11', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'herzemab', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'm. al-gifarry' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-01', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 1.0),
  (v_schedule_id, 'Siklofosfamid', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'syuriani' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-01', '5D', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'anik' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-02', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'muin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-02', '7A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Gemsitabin', 2.0),
  (v_schedule_id, 'Karboplatin 450', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nursahidah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-02', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Brentuksimab', 2.0),
  (v_schedule_id, 'Etoposide', 1.0),
  (v_schedule_id, 'Cisplatin 50', 1.0),
  (v_schedule_id, 'Sitarabin', 3.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rahmat effendi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-02', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 16.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rony' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-02', '5A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'jerum peni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-03', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'mesna', 17.0),
  (v_schedule_id, 'Ifosfamid', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'musliati' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-03', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 1.0),
  (v_schedule_id, 'Cisplatin', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'purnama sari' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-03', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'mesna', 17.0),
  (v_schedule_id, 'Ifosfamid', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rahmat effendi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-03', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 16.0);

  select id into v_patient_id from public.patients where lower(nama) = 'siyamto (zometa)' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-04', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'aminah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-05', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'Karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ria armilasari' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-05', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Metotrexate (MTX)', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'saparni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-09', '11', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 16.0);

  select id into v_patient_id from public.patients where lower(nama) = 'hamidah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-06', '9', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'matius ding' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-06', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Pemetrexed', 2.0),
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'Karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sundari' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-06', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'aminah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-07', '7', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ezra' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-09', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'mohd. yusuf 5' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-07', '7', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'dosetaksel 80', 1.0),
  (v_schedule_id, 'dosetaksel 20', 2.0),
  (v_schedule_id, 'karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rahmat' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-07', '7', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 16.0);

  select id into v_patient_id from public.patients where lower(nama) = 'weni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-07', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'candra gunawan' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-08', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 1.0),
  (v_schedule_id, 'Etoposide', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'yati' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-08', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Karboplatin 150', 1.0),
  (v_schedule_id, 'Karboplatin 450', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'iin subhatin' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-09', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'nawawi' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-09', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'rony' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-09', '5B', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Bortezomib', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'jesika wenti lubung' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-10', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Oksaliplatin 100', 1.0),
  (v_schedule_id, 'Oksaliplatin 50', 1.0),
  (v_schedule_id, 'Ca Folinat', 14.0),
  (v_schedule_id, 'Curacil', 8.0);

  select id into v_patient_id from public.patients where lower(nama) = 'asia mappa (zometa)' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-12', '', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'ade syahrial' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-13', '5A', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Cisplatin 50', 2.0),
  (v_schedule_id, 'Cisplatin 10', 1.0),
  (v_schedule_id, 'Etoposide', 6.0);

  select id into v_patient_id from public.patients where lower(nama) = 'dewi anggraeni' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-14', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'syafitriansyah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-15', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Zometa', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sundari' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-27', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'musori' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-30', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Fludarabin', 3.0),
  (v_schedule_id, 'Siklofosfamid', 3.0);

  select id into v_patient_id from public.patients where lower(nama) = 'musori' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-27', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Fludarabin', 3.0),
  (v_schedule_id, 'Siklofosfamid', 3.0);

  select id into v_patient_id from public.patients where lower(nama) = 'heru septianus' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-31', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'Curacil', 16.0);

  select id into v_patient_id from public.patients where lower(nama) = 'heru septianus' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-21', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'karboplatin 150', 1.0),
  (v_schedule_id, 'curacil', 16.0);

  select id into v_patient_id from public.patients where lower(nama) = 'abdussalam' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-08-31', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'Curacil', 12.0);

  select id into v_patient_id from public.patients where lower(nama) = 'abdussalam' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-21', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'Curacil', 12.0);

  select id into v_patient_id from public.patients where lower(nama) = 'abdussalam' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-12', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'Curacil', 12.0);

  select id into v_patient_id from public.patients where lower(nama) = 'abdussalam' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-11-02', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'Curacil', 12.0);

  select id into v_patient_id from public.patients where lower(nama) = 'abdussalam' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-11-23', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Karboplatin 450', 1.0),
  (v_schedule_id, 'Curacil', 12.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sapariyem' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-02', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sapariyem' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-23', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sapariyem' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-14', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'sapariyem' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-11-04', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'epirubisin', 2.0),
  (v_schedule_id, 'curacil', 2.0);

  select id into v_patient_id from public.patients where lower(nama) = 'tarmuji' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-04', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'tarmuji' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-25', '3', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'tarmuji' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-10-16', '4', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'tarmuji' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-11-06', '5', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'tarmuji' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-11-27', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Rituksimab 500', 1.0),
  (v_schedule_id, 'Rituksimab 100', 1.0),
  (v_schedule_id, 'Vinkristin', 1.0),
  (v_schedule_id, 'Doksorubisin', 2.0),
  (v_schedule_id, 'Siklofosfamid', 1.0),
  (v_schedule_id, 'Siklofosfamid 200', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'suprayitno' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-02', '1', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Vinkristin', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'suprayitno' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-09', '2', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Vinkristin', 1.0);

  select id into v_patient_id from public.patients where lower(nama) = 'arhariah' limit 1;
  insert into public.schedules (patient_id, tanggal, siklus, keterangan) values (v_patient_id, '2026-09-23', '6', NULL) returning id into v_schedule_id;
  insert into public.schedule_items (schedule_id, obat, jumlah) values
  (v_schedule_id, 'Paklitaksel', 3.0),
  (v_schedule_id, 'Cisplatin 50', 2.0);

end $$;

-- ## Stok Obat ##
insert into public.drug_stock (nama_obat, stok_saat_ini, terakhir_update, catatan) values
('Rituksimab 500', 1.0, '2026-09-01T18:33:12.760000'::timestamptz, NULL),
('Doksorubisin', 7.0, '2026-09-01T18:52:13.672000'::timestamptz, NULL),
('Rituksimab 100', 4.0, '2026-09-01T18:53:35.697000'::timestamptz, NULL),
('Vinkristin', 7.0, '2026-09-02T18:54:35.216000'::timestamptz, NULL),
('Ibandronat', 2.0, '2026-09-01T18:54:10.075000'::timestamptz, NULL),
('epirubisin', 7.0, '2026-09-01T18:54:24.099000'::timestamptz, NULL),
('Herzemab', 2.0, '2026-09-01T18:54:44.456000'::timestamptz, NULL),
('Siklofosfamid 200', 5.0, '2026-09-01T18:54:59.968000'::timestamptz, NULL),
('Karboplatin 450', 13.0, '2026-09-02T18:55:50.196000'::timestamptz, NULL),
('Ca Folinat', 84.0, '2026-09-02T18:57:22.124000'::timestamptz, NULL),
('Siklofosfamid', 5.0, '2026-09-01T18:56:59.209000'::timestamptz, NULL),
('Karboplatin 150', 11.0, '2026-09-01T18:57:19.256000'::timestamptz, NULL),
('Gemsitabin', 13.0, '2026-09-02T18:55:25.528000'::timestamptz, NULL),
('Bortezomib', 3.0, '2026-09-02T18:54:56.003000'::timestamptz, NULL),
('Dosetaksel 80', 1.0, '2026-09-01T18:58:46.547000'::timestamptz, NULL),
('Irinotekan', 2.0, '2026-09-01T18:59:00.911000'::timestamptz, NULL),
('dosetaksel 20', 3.0, '2026-09-01T18:59:18.367000'::timestamptz, NULL),
('daunocin', 15.0, '2026-09-01T18:59:38.787000'::timestamptz, NULL),
('Cisplatin 10', 3.0, '2026-09-01T18:59:50.298000'::timestamptz, NULL),
('Oksaliplatin 100', 11.0, '2026-09-02T18:56:07.960000'::timestamptz, NULL),
('Paklitaksel', 36.0, '2026-09-01T19:03:54.681000'::timestamptz, NULL),
('Oksaliplatin 50', 11.0, '2026-09-02T18:56:44.645000'::timestamptz, NULL),
('Sitarabin', 2.0, '2026-09-02T18:58:13.451000'::timestamptz, NULL),
('Pemetrexed', 2.0, '2026-09-01T19:01:35.404000'::timestamptz, NULL),
('Zometa', 2.0, '2026-09-01T19:02:05.130000'::timestamptz, NULL),
('Ifosfamid', 9.0, '2026-09-01T19:02:23.577000'::timestamptz, NULL),
('Cisplatin 50', 17.0, '2026-09-01T19:03:01.545000'::timestamptz, NULL),
('Etoposide', 9.0, '2026-09-01T19:03:21.483000'::timestamptz, NULL),
('Metotrexate (MTX)', 16.0, '2026-09-02T18:54:04.350000'::timestamptz, NULL),
('Mesna', 56.0, '2026-09-01T19:04:37.419000'::timestamptz, NULL),
('Bleomicin', 3.0, '2026-09-01T19:13:02.084000'::timestamptz, NULL),
('Vinorelbin', 10.0, '2026-09-01T19:12:41.718000'::timestamptz, NULL),
('Dacarbazine', 12.0, '2026-09-01T19:13:19.173000'::timestamptz, NULL),
('Curacil', 114.0, '2026-09-02T19:16:06.833000'::timestamptz, NULL)
on conflict (nama_obat) do nothing;

-- ## Log Aktivitas (riwayat lama, hanya untuk arsip) ##
insert into public.activity_log (waktu, user_email, aksi, detail) values
('2026-08-30T23:20:07.291000'::timestamptz, '(tidak diketahui)', 'Tambah Jadwal', 'Pasien: Tarmuji, Tanggal: 04/09/2026, Siklus: 2, Obat: Rituksimab 500 (1), Rituksimab 100 (1), Vinkristin (1), Doksorubisin (2), Siklofosfamid (1), Siklofosfamid 200 (1)'),
('2026-08-30T23:20:11.531000'::timestamptz, '(tidak diketahui)', 'Tambah Jadwal', 'Pasien: Tarmuji, Tanggal: 25/09/2026, Siklus: 3, Obat: Rituksimab 500 (1), Rituksimab 100 (1), Vinkristin (1), Doksorubisin (2), Siklofosfamid (1), Siklofosfamid 200 (1)'),
('2026-08-30T23:20:14.961000'::timestamptz, '(tidak diketahui)', 'Tambah Jadwal', 'Pasien: Tarmuji, Tanggal: 16/10/2026, Siklus: 4, Obat: Rituksimab 500 (1), Rituksimab 100 (1), Vinkristin (1), Doksorubisin (2), Siklofosfamid (1), Siklofosfamid 200 (1)'),
('2026-08-30T23:20:19.303000'::timestamptz, '(tidak diketahui)', 'Tambah Jadwal', 'Pasien: Tarmuji, Tanggal: 06/11/2026, Siklus: 5, Obat: Rituksimab 500 (1), Rituksimab 100 (1), Vinkristin (1), Doksorubisin (2), Siklofosfamid (1), Siklofosfamid 200 (1)'),
('2026-08-30T23:20:24.102000'::timestamptz, '(tidak diketahui)', 'Tambah Jadwal', 'Pasien: Tarmuji, Tanggal: 27/11/2026, Siklus: 6, Obat: Rituksimab 500 (1), Rituksimab 100 (1), Vinkristin (1), Doksorubisin (2), Siklofosfamid (1), Siklofosfamid 200 (1)'),
('2026-08-31T00:16:59.962000'::timestamptz, '(tidak diketahui)', 'Daftarkan Pasien Baru', 'Pasien: Suprayitno, Diagnosa: Limfoma, Interval: 7 hari'),
('2026-08-31T00:17:03.308000'::timestamptz, '(tidak diketahui)', 'Tambah Jadwal', 'Pasien: Suprayitno, Tanggal: 02/09/2026, Siklus: 1, Obat: Vinkristin (1)'),
('2026-08-31T00:17:07.257000'::timestamptz, '(tidak diketahui)', 'Tambah Jadwal', 'Pasien: Suprayitno, Tanggal: 09/09/2026, Siklus: 2, Obat: Vinkristin (1)'),
('2026-08-31T00:18:34.676000'::timestamptz, '(tidak diketahui)', 'Ubah Tanggal Jadwal', 'Pasien: Siyamto (zometa), Siklus: , Dari: 03/09/2026 -> 04/09/2026, 1 jadwal berikutnya ikut digeser'),
('2026-08-31T17:11:08.516000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Tandai Tertunda', 'Pasien: EDY SUSANTO, Tanggal: 01/09/2026, Siklus: 1B'),
('2026-08-31T17:11:10.894000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Tandai Tertunda', 'Pasien: Ariansyah, Tanggal: 01/09/2026, Siklus: 4A'),
('2026-08-31T18:05:08.728000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Ubah Tanggal Jadwal', 'Pasien: Sapariyem, Siklus: 3, Dari: 01/09/2026 -> 02/09/2026, 9 jadwal berikutnya ikut digeser'),
('2026-08-31T22:26:09.870000'::timestamptz, 'amp.upss2021@gmail.com', 'Hapus Jadwal', 'Pasien: Arhariah, Tanggal: 03/09/2026, Siklus: 4, Jumlah baris dihapus: 2'),
('2026-08-31T22:26:42.530000'::timestamptz, 'amp.upss2021@gmail.com', 'Hapus Jadwal', 'Pasien: Arhariah, Tanggal: 17/09/2026, Siklus: 5, Jumlah baris dihapus: 1'),
('2026-08-31T22:27:18.891000'::timestamptz, 'amp.upss2021@gmail.com', 'Hapus Jadwal', 'Pasien: Arhariah, Tanggal: 24/09/2026, Siklus: 5, Jumlah baris dihapus: 1'),
('2026-08-31T22:28:47.416000'::timestamptz, 'amp.upss2021@gmail.com', 'Hapus Jadwal', 'Pasien: Arhariah, Tanggal: 24/09/2026, Siklus: 4, Jumlah baris dihapus: 2'),
('2026-08-31T22:29:37.383000'::timestamptz, 'amp.upss2021@gmail.com', 'Tambah Jadwal', 'Pasien: Arhariah, Tanggal: 22/09/2026, Siklus: 6, Obat: Paklitaksel (3), Cisplatin 50 (2)'),
('2026-09-01T16:59:38.390000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Tandai Tertunda', 'Pasien: Deya, Tanggal: 02/09/2026, Siklus: 2'),
('2026-09-01T16:59:50.390000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Tandai Tertunda', 'Pasien: riyan adi saputra, Tanggal: 02/09/2026, Siklus:'),
('2026-09-01T17:19:42.868000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Ubah Tanggal Jadwal', 'Pasien: Sapariyem, Siklus: 3, Dari: 02/09/2026 -> 03/09/2026, 9 jadwal berikutnya ikut digeser'),
('2026-09-01T18:33:12.993000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Update Stok Obat', 'Rituksimab 500 -> stok baru: 1'),
('2026-09-01T18:52:13.939000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Doksorubisin -> stok baru: 7'),
('2026-09-01T18:53:36.333000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Rituksimab 100 -> stok baru: 4'),
('2026-09-01T18:53:51.691000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Vinkristin -> stok baru: 8'),
('2026-09-01T18:54:10.267000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Ibandronat -> stok baru: 2'),
('2026-09-01T18:54:24.347000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'epirubisin -> stok baru: 7'),
('2026-09-01T18:54:44.720000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Herzemab -> stok baru: 2'),
('2026-09-01T18:55:00.203000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Siklofosfamid 200 -> stok baru: 5'),
('2026-09-01T18:55:27.238000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Karboplatin 450 -> stok baru: 14'),
('2026-09-01T18:56:34.244000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Ca Folinat -> stok baru: 102'),
('2026-09-01T18:56:59.451000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Siklofosfamid -> stok baru: 5'),
('2026-09-01T18:57:19.479000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Karboplatin 150 -> stok baru: 11'),
('2026-09-01T18:57:48.031000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Gemsitabin -> stok baru: 15'),
('2026-09-01T18:58:29.959000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Bortezomib -> stok baru: 4'),
('2026-09-01T18:58:46.806000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Dosetaksel 80 -> stok baru: 1'),
('2026-09-01T18:59:01.399000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Irinotekan -> stok baru: 2'),
('2026-09-01T18:59:18.610000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'dosetaksel 20 -> stok baru: 3'),
('2026-09-01T18:59:38.929000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'daunocin -> stok baru: 15'),
('2026-09-01T18:59:50.541000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Cisplatin 10 -> stok baru: 3'),
('2026-09-01T19:00:08.208000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Oksaliplatin 100 -> stok baru: 12'),
('2026-09-01T19:00:24.191000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Paklitaksel -> stok baru: 16'),
('2026-09-01T19:00:41.605000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Oksaliplatin 50 -> stok baru: 12'),
('2026-09-01T19:01:13.591000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Hapus Jadwal', 'Pasien: Zhurena, Tanggal: 29/08/2026, Siklus: 7, Jumlah baris dihapus: 3'),
('2026-09-01T19:01:25.132000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Sitarabin -> stok baru: 5'),
('2026-09-01T19:01:35.571000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Pemetrexed -> stok baru: 2'),
('2026-09-01T19:01:44.569000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Hapus Jadwal', 'Pasien: Hamidah, Tanggal: 31/08/2026, Siklus: 7, Jumlah baris dihapus: 3'),
('2026-09-01T19:02:05.376000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Zometa -> stok baru: 2'),
('2026-09-01T19:02:24.545000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Ifosfamid -> stok baru: 9'),
('2026-09-01T19:02:32.681000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Hapus Jadwal', 'Pasien: Luther Lawing, Tanggal: 31/08/2026, Siklus: 8, Jumlah baris dihapus: 3'),
('2026-09-01T19:03:01.727000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Cisplatin 50 -> stok baru: 17'),
('2026-09-01T19:03:22.327000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Etoposide -> stok baru: 9'),
('2026-09-01T19:03:23.414000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Batalkan Tanda Tertunda', 'Pasien: Aminah, Tanggal: 14/09/2026, Siklus:'),
('2026-09-01T19:03:54.730000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Paklitaksel -> stok baru: 36'),
('2026-09-01T19:04:17.846000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Metotrexate (MTX) -> stok baru: 17'),
('2026-09-01T19:04:37.573000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Mesna -> stok baru: 56'),
('2026-09-01T19:05:34.307000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Batalkan Tanda Tertunda', 'Pasien: m. Iduansyah, Tanggal: 30/12/2026, Siklus: 10'),
('2026-09-01T19:06:22.005000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Hapus Jadwal', 'Pasien: m. Iduansyah, Tanggal: 30/12/2026, Siklus: 10, Jumlah baris dihapus: 3'),
('2026-09-01T19:12:14.724000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Update Stok Obat', 'Bleomicin -> stok baru: 3'),
('2026-09-01T19:12:42.056000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Vinorelbin -> stok baru: 10'),
('2026-09-01T19:13:02.209000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Bleomicin -> stok baru: 3'),
('2026-09-01T19:13:19.342000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Dacarbazine -> stok baru: 12'),
('2026-09-01T19:15:31.419000'::timestamptz, '(tidak diketahui)', 'Hapus Jadwal', 'Pasien: Armawan, Tanggal: 20/09/2026, Siklus: 2, Jumlah baris dihapus: 4'),
('2026-09-01T21:26:55.870000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Update Stok Obat', 'Curacil -> stok baru: 125'),
('2026-09-02T01:33:58.265000'::timestamptz, '(tidak diketahui)', 'Export Laporan Kemoterapi (Selesai)', '01/08/2026 s/d 30/09/2026 -> Laporan Kemoterapi Selesai 01-08-2026 sd 30-09-2026.pdf'),
('2026-09-02T01:35:34.292000'::timestamptz, '(tidak diketahui)', 'Export Laporan Kemoterapi (Selesai)', '01/08/2026 s/d 31/08/2026 -> Laporan Kemoterapi Selesai 01-08-2026 sd 31-08-2026.pdf'),
('2026-09-02T17:29:22.097000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Tandai Tertunda', 'Pasien: Agustinus Paran, Tanggal: 03/09/2026, Siklus: 3'),
('2026-09-02T17:30:23.586000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Ubah Tanggal Jadwal', 'Pasien: Ariansyah, Siklus: 4A, Dari: 01/09/2026 -> 03/09/2026, 3 jadwal berikutnya ikut digeser'),
('2026-09-02T17:30:47.536000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Batalkan Tanda Tertunda', 'Pasien: Ariansyah, Tanggal: 03/09/2026, Siklus: 4A'),
('2026-09-02T17:31:14.121000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Ubah Tanggal Jadwal', 'Pasien: Sapariyem, Siklus: 3, Dari: 03/09/2026 -> 02/09/2026, 9 jadwal berikutnya ikut digeser'),
('2026-09-02T17:31:43.341000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Tandai Tertunda', 'Pasien: Arhariah, Tanggal: 03/09/2026, Siklus: 5'),
('2026-09-02T17:34:15.783000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Ubah Tanggal Jadwal', 'Pasien: Sumarni, Siklus: 1, Dari: 28/08/2026 -> 03/09/2026, 2 jadwal berikutnya ikut digeser'),
('2026-09-02T18:54:04.376000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Metotrexate (MTX) -> stok baru: 16'),
('2026-09-02T18:54:35.233000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Vinkristin -> stok baru: 7'),
('2026-09-02T18:54:56.012000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Bortezomib -> stok baru: 3'),
('2026-09-02T18:55:25.560000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Gemsitabin -> stok baru: 13'),
('2026-09-02T18:55:50.224000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Karboplatin 450 -> stok baru: 13'),
('2026-09-02T18:56:07.980000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Oksaliplatin 100 -> stok baru: 11'),
('2026-09-02T18:56:44.660000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Oksaliplatin 50 -> stok baru: 11'),
('2026-09-02T18:57:22.136000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Ca Folinat -> stok baru: 84'),
('2026-09-02T18:57:47.161000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Curacil -> stok baru: 113'),
('2026-09-02T18:58:13.468000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Sitarabin -> stok baru: 2'),
('2026-09-02T19:16:06.852000'::timestamptz, '(tidak diketahui)', 'Update Stok Obat', 'Curacil -> stok baru: 114'),
('2026-09-03T00:13:10.309000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Hapus Jadwal', 'Pasien: Haula, Tanggal: 04/09/2026, Siklus: 10, Jumlah baris dihapus: 2'),
('2026-09-03T00:13:47.350000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Tandai Tertunda', 'Pasien: Nurdin Askali, Tanggal: 04/09/2026, Siklus: 2'),
('2026-09-03T00:14:09.896000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Tandai Tertunda', 'Pasien: Tukiman, Tanggal: 04/09/2026, Siklus: 9'),
('2026-09-03T00:15:09.799000'::timestamptz, '(tidak diketahui)', 'Hapus Jadwal', 'Pasien: Tukiman, Tanggal: 04/09/2026, Siklus: 9, Jumlah baris dihapus: 4'),
('2026-09-03T00:15:35.329000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Tandai Tertunda', 'Pasien: Aldi Trigunadi, Tanggal: 04/09/2026, Siklus:'),
('2026-09-03T18:16:41.168000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Tandai Tertunda', 'Pasien: Tukiman, Tanggal: 04/09/2026, Siklus: 10'),
('2026-09-03T18:17:49.888000'::timestamptz, 'akhmad.fahri.ramadan@gmail.com', 'Ubah Tanggal Jadwal', 'Pasien: Arhariah, Siklus: 5, Dari: 03/09/2026 -> 04/09/2026, 2 jadwal berikutnya ikut digeser');

commit;