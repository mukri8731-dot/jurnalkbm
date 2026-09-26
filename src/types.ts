export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'guru';
  teacher_id?: string;
}

export interface Teacher {
  id: string;
  nama: string;
  nip: string;
  email: string;
  telepon: string;
  mata_pelajaran: string;
  jabatan: string;
  foto_url: string;
  tanda_tangan_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface School {
  id: string;
  logo_url: string;
  nama_instansi: string;
  nama_sekolah: string;
  alamat: string;
  npsn: string;
  nss: string;
  telepon: string;
  fax: string;
  email: string;
  website: string;
  nama_kepala_sekolah: string;
  nip_kepala_sekolah: string;
  updated_at?: string;
}

export interface SchoolClass {
  id: string;
  nama_kelas: string;
  tingkat: string;
  jurusan: string;
  wali_kelas: string;
  tahun_ajaran: string;
  created_at?: string;
  updated_at?: string;
}

export interface Subject {
  id: string;
  kode: string;
  nama_mapel: string;
  tingkat: string;
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  nama_siswa: string;
  jenis_kelamin: 'L' | 'P';
  class_id: string;
  nama_kelas?: string;
  status_aktif: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Journal {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  tanggal: string; // YYYY-MM-DD
  hari: string;
  jam_ke: string;
  jam_mulai: string;
  jam_selesai: string;
  jenis_kbm: string;
  materi: string;
  tujuan_pembelajaran: string;
  kegiatan_pembelajaran: string;
  catatan: string;
  refleksi: string;
  tindak_lanjut: string;
  semester: string;
  tahun_ajaran: string;
  status: 'terkirim' | 'draft';
  foto_utama_url?: string;
  created_at?: string;
  updated_at?: string;

  // Joined fields
  nama_guru?: string;
  nip_guru?: string;
  foto_guru?: string;
  tanda_tangan_guru?: string;
  nama_kelas?: string;
  nama_mapel?: string;
  kode_mapel?: string;
  rekap_kehadiran?: AttendanceSummary;
  jumlah_foto?: number;
  school?: School;
  attendance?: AttendanceDetail[];
  photos?: JournalPhoto[];
}

export interface AttendanceSummary {
  H: number;
  S: number;
  I: number;
  A: number;
  D: number;
  total: number;
}

export interface AttendanceDetail {
  id?: string;
  journal_id?: string;
  student_id: string;
  status: 'H' | 'S' | 'I' | 'A' | 'D';
  keterangan: string;
  nama_siswa?: string;
  nis?: string;
  nisn?: string;
  jenis_kelamin?: 'L' | 'P';
}

export interface JournalPhoto {
  id?: string;
  journal_id?: string;
  photo_url: string;
  caption: string;
  urutan: number;
}

export interface DashboardStats {
  totalJurnal: number;
  jurnalHariIni: number;
  jurnalMingguIni: number;
  jurnalBulanIni: number;
  totalKelas: number;
  totalSiswa: number;
  totalPertemuan: number;
  monthlyData: { bulan: string; total: number }[];
  rekapKehadiran: AttendanceSummary;
}

export interface DatabaseStatus {
  status: string;
  engine: string;
  tables: Record<string, number>;
  diskPersistent: boolean;
  lastUpdated: string;
}
