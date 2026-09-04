// =====================================================================
// KONFIGURASI SUPABASE
// Isi 2 nilai di bawah ini dengan punya project Supabase kamu sendiri.
// Ambil dari: Supabase Dashboard > Project Settings > API
//   - "Project URL"       -> SUPABASE_URL
//   - "anon public" key   -> SUPABASE_ANON_KEY
//
// Aman untuk taruh anon key ini di kode frontend (termasuk di repo publik
// GitHub) SELAMA Row Level Security (RLS) di schema.sql sudah aktif dan
// mewajibkan login (auth.role() = 'authenticated') — sudah begitu di
// schema.sql yang disediakan. Anon key TIDAK memberi akses tanpa login.
// =====================================================================

window.SUPABASE_URL = 'https://ahrkhorranrnpavykrtw.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocmtob3JyYW5ybnBhdnlrcnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTQ5NDUsImV4cCI6MjEwNDA3MDk0NX0.SCW96KwlJ0lDAURbQz8gastTKKgrsHXwcrruwa9UUJ8';
