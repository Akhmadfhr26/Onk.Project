var sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// =====================================================================
// AUTH
// =====================================================================
// Pemetaan ID login sederhana -> akun Supabase asli.
// Tambahkan baris baru di sini kalau mau bikin ID lain.
var LOGIN_ID_MAP = {
  'depo': 'depo@klinik.local',
  'perawat': 'perawat@klinik.local',
  'admin': 'admin@klinik.local'
};

function handleLogin() {
  var idInput = document.getElementById('loginEmail').value.trim();
  var password = document.getElementById('loginPassword').value;
  var errEl = document.getElementById('loginError');
  errEl.textContent = '';
  if (!idInput || !password) { errEl.textContent = 'Isi ID dan kata sandi.'; return; }

  var email = LOGIN_ID_MAP[idInput.toLowerCase()];
  if (!email) { errEl.textContent = 'ID tidak dikenali.'; return; }

  document.getElementById('loginBtn').disabled = true;
  document.getElementById('loginBtn').textContent = 'Masuk...';

  sb.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
    document.getElementById('loginBtn').disabled = false;
    document.getElementById('loginBtn').textContent = 'Masuk';
    if (res.error) { errEl.textContent = 'ID atau kata sandi salah.'; return; }
    showApp(res.data.user);
  });
}

function handleLogout() {
  sb.auth.signOut().then(function () {
    allSchedulesCache = null;
    nurseAllSchedulesCache = null;
    currentUserRole = null;
    document.getElementById('appScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'block';
  });
}

// =====================================================================
// ROLE -> MENU
// depo   : tab farmasi (kalender, kebutuhan obat, daftar pasien, tertunda,
//          dashboard, cari obat, daftarkan pasien)
// perawat: tab perawat (kalender perawat, list pasien kemoterapi perawat,
//          daftarkan pasien perawat)
// admin  : semua tab di atas sekaligus
// =====================================================================
var TAB_ROLES = {
  kalender: ['depo', 'admin'],
  rentang: ['depo', 'admin'],
  riwayat: ['depo', 'admin'],
  tertunda: ['depo', 'admin'],
  dashboard: ['depo', 'admin'],
  cariobat: ['depo', 'admin'],
  tambah: ['depo', 'admin'],
  kalenderPerawat: ['perawat', 'admin'],
  riwayatPerawat: ['perawat', 'admin'],
  tambahPerawat: ['perawat', 'admin']
};

function applyRoleUI(role) {
  Object.keys(TAB_ROLES).forEach(function (t) {
    var btn = document.getElementById('tabBtn' + capitalize(t));
    if (btn) btn.style.display = (TAB_ROLES[t].indexOf(role) !== -1) ? '' : 'none';
  });
  var lblFarmasi = document.getElementById('sidebarLabelFarmasi');
  var lblPerawat = document.getElementById('sidebarLabelPerawat');
  if (lblFarmasi) lblFarmasi.style.display = (role === 'depo' || role === 'admin') ? '' : 'none';
  if (lblPerawat) lblPerawat.style.display = (role === 'perawat' || role === 'admin') ? '' : 'none';
}

function showApp(user) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'block';
  document.getElementById('headerUserEmail').textContent = user.email || '';

  sb.from('profiles').select('role').eq('id', user.id).maybeSingle().then(function (res) {
    if (res.error || !res.data) {
      document.getElementById('headerUserEmail').textContent =
        (user.email || '') + ' (role belum diset — hubungi admin)';
      return;
    }
    currentUserRole = res.data.role;
    applyRoleUI(currentUserRole);

    tanggalAktif = new Date();
    nurseTanggalAktif = new Date();
    document.getElementById('kalTanggalJump').value = toIsoDate(tanggalAktif);
    var kalPerawatJump = document.getElementById('kalPerawatTanggalJump');
    if (kalPerawatJump) kalPerawatJump.value = toIsoDate(nurseTanggalAktif);

    if (currentUserRole === 'perawat') {
      switchTab('kalenderPerawat');
    } else {
      switchTab('kalender');
    }
  });
}

// =====================================================================
// Tab switching (menangani tab farmasi + tab perawat)
// =====================================================================
function switchTab(nama) {
  var tabs = Object.keys(TAB_ROLES);
  tabs.forEach(function (t) {
    var contentEl = document.getElementById('tab' + capitalize(t));
    var btnEl = document.getElementById('tabBtn' + capitalize(t));
    if (contentEl) contentEl.style.display = (nama === t) ? 'block' : 'none';
    if (btnEl) btnEl.classList.toggle('active', nama === t);
  });

  if (nama === 'rentang') {
    if (!document.getElementById('rentangMulai').value) {
      var hariIni = new Date();
      var seminggu = new Date();
      seminggu.setDate(seminggu.getDate() - 6);
      document.getElementById('rentangMulai').value = toIsoDate(seminggu);
      document.getElementById('rentangAkhir').value = toIsoDate(hariIni);
    }
    if (currentStokRows.length === 0) {
      currentStokRows = [{ obat: '', tanggal: toIsoDate(new Date()), jumlah: '' }];
      renderStokRowsTable();
    }
    isiDatalistObat('daftarObatDatalistTambah');
  }
  if (nama === 'riwayat' && !patientListDimuat) muatDaftarPasien();
  if (nama === 'tertunda' && !tertundaDimuat) muatPasienTertunda();
  if (nama === 'dashboard' && !dashboardDimuat) muatDashboard();
  if (nama === 'kalender') muatKalender();
  if (nama === 'cariobat' && !obatDatalistDimuat) muatDaftarObatUntukPencarian();
  if (nama === 'tambah') muatDataUntukTambah();

  if (nama === 'kalenderPerawat') muatKalenderPerawat();
  if (nama === 'riwayatPerawat' && !nursePatientListDimuat) muatDaftarPasienPerawat();
  if (nama === 'tambahPerawat') muatDataUntukTambahPerawat();
}
function capitalize(s) {
  if (s === 'cariobat') return 'CariObat';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Cek sesi saat halaman dibuka (biar tidak perlu login ulang tiap refresh)
sb.auth.getSession().then(function (res) {
  if (res.data && res.data.session) {
    showApp(res.data.session.user);
  }
});
document.getElementById('loginPassword').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') handleLogin();
});
