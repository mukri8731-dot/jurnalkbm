import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // hashed or demo plain
  role: 'admin' | 'guru';
  teacher_id?: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
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
  updated_at: string;
}

export interface SchoolClass {
  id: string;
  nama_kelas: string;
  tingkat: string;
  jurusan: string;
  wali_kelas: string;
  tahun_ajaran: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  kode: string;
  nama_mapel: string;
  tingkat: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  nama_siswa: string;
  jenis_kelamin: 'L' | 'P';
  class_id: string;
  status_aktif: boolean;
  created_at: string;
  updated_at: string;
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
  semester: string; // 'Ganjil' | 'Genap'
  tahun_ajaran: string;
  status: 'terkirim' | 'draft';
  foto_utama_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  journal_id: string;
  student_id: string;
  status: 'H' | 'S' | 'I' | 'A' | 'D';
  keterangan: string;
  created_at: string;
  updated_at: string;
}

export interface JournalPhoto {
  id: string;
  journal_id: string;
  photo_url: string;
  caption: string;
  urutan: number;
  created_at: string;
}

export interface DatabaseSchema {
  users: User[];
  teachers: Teacher[];
  schools: School[];
  classes: SchoolClass[];
  subjects: Subject[];
  students: Student[];
  journals: Journal[];
  attendance: Attendance[];
  journal_photos: JournalPhoto[];
  academic_years: { id: string; tahun: string; aktif: boolean }[];
  semesters: { id: string; nama: string; aktif: boolean }[];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getInitialData(): DatabaseSchema {
  const now = new Date().toISOString();

  const teacher1Id = 't-001';
  const teacher2Id = 't-002';
  const teacher3Id = 't-003';

  const teachers: Teacher[] = [
    {
      id: teacher1Id,
      nama: 'Drs. Budi Santoso, M.Pd.',
      nip: '19750815 199903 1 002',
      email: 'budi@sekolah.sch.id',
      telepon: '081234567890',
      mata_pelajaran: 'Matematika',
      jabatan: 'Guru Ahli Madya / Koordinator KBM',
      foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      tanda_tangan_url: '',
      created_at: now,
      updated_at: now,
    },
    {
      id: teacher2Id,
      nama: 'Siti Aminah, S.Pd.',
      nip: '19820412 200604 2 015',
      email: 'siti@sekolah.sch.id',
      telepon: '082345678901',
      mata_pelajaran: 'Bahasa Indonesia',
      jabatan: 'Guru Ahli Muda',
      foto_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      tanda_tangan_url: '',
      created_at: now,
      updated_at: now,
    },
    {
      id: teacher3Id,
      nama: 'Ahmad Fauzi, S.Kom., M.T.',
      nip: '19881120 201101 1 008',
      email: 'ahmad@sekolah.sch.id',
      telepon: '085678901234',
      mata_pelajaran: 'Informatika',
      jabatan: 'Guru Ahli Muda / Pembina Lab Komputer',
      foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      tanda_tangan_url: '',
      created_at: now,
      updated_at: now,
    },
  ];

  const users: User[] = [
    {
      id: 'u-admin',
      username: 'admin',
      email: 'admin@sekolah.sch.id',
      password: 'admin123',
      role: 'admin',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'u-budi',
      username: 'budi',
      email: 'budi@sekolah.sch.id',
      password: 'guru123',
      role: 'guru',
      teacher_id: teacher1Id,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'u-siti',
      username: 'siti',
      email: 'siti@sekolah.sch.id',
      password: 'guru123',
      role: 'guru',
      teacher_id: teacher2Id,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'u-ahmad',
      username: 'ahmad',
      email: 'ahmad@sekolah.sch.id',
      password: 'guru123',
      role: 'guru',
      teacher_id: teacher3Id,
      created_at: now,
      updated_at: now,
    },
  ];

  const school: School = {
    id: 'school-001',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Coat_of_arms_of_East_Java.svg/200px-Coat_of_arms_of_East_Java.svg.png',
    nama_instansi: 'PEMERINTAH PROVINSI JAWA TIMUR\nDINAS PENDIDIKAN',
    nama_sekolah: 'SMK NEGERI 1 CERME GRESIK',
    alamat: 'Jl. Jurit, Kecamatan Cerme Kabupaten Gresik',
    npsn: '20500423',
    nss: '301056789012',
    telepon: '(031) 7992471',
    fax: '(031) 7998485',
    email: 'smkn1cermegresik@yahoo.co.id',
    website: 'https://smkn1cermegresik.sch.id/',
    nama_kepala_sekolah: 'DARWATI, S.Pd., S.ST., M.Si.',
    nip_kepala_sekolah: '19711206 199702 2 003',
    updated_at: now,
  };

  const classes: SchoolClass[] = [
    {
      id: 'c-10-mipa1',
      nama_kelas: 'X MIPA 1',
      tingkat: '10',
      jurusan: 'MIPA',
      wali_kelas: 'Drs. Budi Santoso, M.Pd.',
      tahun_ajaran: '2026/2027',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'c-10-mipa2',
      nama_kelas: 'X MIPA 2',
      tingkat: '10',
      jurusan: 'MIPA',
      wali_kelas: 'Siti Aminah, S.Pd.',
      tahun_ajaran: '2026/2027',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'c-11-mipa1',
      nama_kelas: 'XI MIPA 1',
      tingkat: '11',
      jurusan: 'MIPA',
      wali_kelas: 'Ahmad Fauzi, S.Kom., M.T.',
      tahun_ajaran: '2026/2027',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'c-12-mipa1',
      nama_kelas: 'XII MIPA 1',
      tingkat: '12',
      jurusan: 'MIPA',
      wali_kelas: 'Dra. Endang Purwanti',
      tahun_ajaran: '2026/2027',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'c-10-ips1',
      nama_kelas: 'X IPS 1',
      tingkat: '10',
      jurusan: 'IPS',
      wali_kelas: 'Bambang Irawan, S.Pd.',
      tahun_ajaran: '2026/2027',
      created_at: now,
      updated_at: now,
    },
  ];

  const subjects: Subject[] = [
    { id: 's-mtk', kode: 'MTK-01', nama_mapel: 'Matematika Wajib', tingkat: '10, 11, 12', created_at: now, updated_at: now },
    { id: 's-bind', kode: 'BIN-01', nama_mapel: 'Bahasa Indonesia', tingkat: '10, 11, 12', created_at: now, updated_at: now },
    { id: 's-inf', kode: 'INF-01', nama_mapel: 'Informatika', tingkat: '10, 11', created_at: now, updated_at: now },
    { id: 's-fis', kode: 'FIS-01', nama_mapel: 'Fisika', tingkat: '10, 11, 12', created_at: now, updated_at: now },
    { id: 's-bio', kode: 'BIO-01', nama_mapel: 'Biologi', tingkat: '10, 11, 12', created_at: now, updated_at: now },
    { id: 's-kim', kode: 'KIM-01', nama_mapel: 'Kimia', tingkat: '10, 11, 12', created_at: now, updated_at: now },
    { id: 's-bing', kode: 'BIG-01', nama_mapel: 'Bahasa Inggris', tingkat: '10, 11, 12', created_at: now, updated_at: now },
    { id: 's-pai', kode: 'PAI-01', nama_mapel: 'Pendidikan Agama Islam', tingkat: '10, 11, 12', created_at: now, updated_at: now },
  ];

  // Students for X MIPA 1 (12 sample students)
  const students: Student[] = [
    { id: 'std-01', nis: '26001', nisn: '0081234501', nama_siswa: 'Aditya Pratama', jenis_kelamin: 'L', class_id: 'c-10-mipa1', status_aktif: true, created_at: now, updated_at: now },
    { id: 'std-02', nis: '26002', nisn: '0081234502', nama_siswa: 'Annisa Rahmawati', jenis_kelamin: 'P', class_id: 'c-10-mipa1', status_aktif: true, created_at: now, updated_at: now },
    { id: 'std-03', nis: '26003', nisn: '0081234503', nama_siswa: 'Bayu Bagaskara', jenis_kelamin: 'L', class_id: 'c-10-mipa1', status_aktif: true, created_at: now, updated_at: now },
    { id: 'std-04', nis: '26004', nisn: '0081234504', nama_siswa: 'Citra Dewi Anggraini', jenis_kelamin: 'P', class_id: 'c-10-mipa1', status_aktif: true, created_at: now, updated_at: now },
    { id: 'std-05', nis: '26005', nisn: '0081234505', nama_siswa: 'Dimas Arya Nugraha', jenis_kelamin: 'L', class_id: 'c-10-mipa1', status_aktif: true, created_at: now, updated_at: now },
    { id: 'std-06', nis: '26006', nisn: '0081234506', nama_siswa: 'Fadhil Muhammad', jenis_kelamin: 'L', class_id: 'c-10-mipa1', status_aktif: true, created_at: now, updated_at: now },
    { id: 'std-07', nis: '26007', nisn: '0081234507', nama_siswa: 'Gita Maharani', jenis_kelamin: 'P', class_id: 'c-10-mipa1', status_aktif: true, created_at: now, updated_at: now },
    { id: 'std-08', nis: '26008', nisn: '0081234508', nama_siswa: 'Hafidz Abdurrahman', jenis_kelamin: 'L', class_id: 'c-10-mipa1', status_aktif: true, created_at: now, updated_at: now },
    { id: 'std-09', nis: '26009', nisn: '0081234509', nama_siswa: 'Indah Kusuma Wardani', jenis_kelamin: 'P', class_id: 'c-10-mipa1', status_aktif: true, created_at: now, updated_at: now },
    { id: 'std-10', nis: '26010', nisn: '0081234510', nama_siswa: 'Kresna Wijaya', jenis_kelamin: 'L', class_id: 'c-10-mipa1', status_aktif: true, created_at: now, updated_at: now },
    { id: 'std-11', nis: '26011', nisn: '0081234511', nama_siswa: 'Laila Nur Azizah', jenis_kelamin: 'P', class_id: 'c-10-mipa1', status_aktif: true, created_at: now, updated_at: now },
    { id: 'std-12', nis: '26012', nisn: '0081234512', nama_siswa: 'Muhammad Rizky Ilham', jenis_kelamin: 'L', class_id: 'c-10-mipa1', status_aktif: true, created_at: now, updated_at: now },

    // Students for X MIPA 2
    { id: 'std-13', nis: '26013', nisn: '0081234513', nama_siswa: 'Nabila Syahrani', jenis_kelamin: 'P', class_id: 'c-10-mipa2', status_aktif: true, created_at: now, updated_at: now },
    { id: 'std-14', nis: '26014', nisn: '0081234514', nama_siswa: 'Rafi Ramadhan', jenis_kelamin: 'L', class_id: 'c-10-mipa2', status_aktif: true, created_at: now, updated_at: now },
    { id: 'std-15', nis: '26015', nisn: '0081234515', nama_siswa: 'Zahra Aulia', jenis_kelamin: 'P', class_id: 'c-10-mipa2', status_aktif: true, created_at: now, updated_at: now },
  ];

  // Sample Journals
  const journal1Id = 'j-001';
  const journal2Id = 'j-002';
  const journal3Id = 'j-003';

  const journals: Journal[] = [
    {
      id: journal1Id,
      teacher_id: teacher1Id,
      class_id: 'c-10-mipa1',
      subject_id: 's-mtk',
      tanggal: '2026-09-24',
      hari: 'Kamis',
      jam_ke: 'Jam ke 1-2',
      jam_mulai: '07:00',
      jam_selesai: '08:30',
      jenis_kbm: 'Problem Based Learning',
      materi: 'Persamaan dan Fungsi Kuadrat: Menentukan Akar-Akar Persamaan Kuadrat dengan Rumus ABC',
      tujuan_pembelajaran: 'Peserta didik mampu menyelesaikan masalah kontekstual persamaan kuadrat menggunakan metode pemfaktoran dan rumus ABC secara mandiri dan kritis.',
      kegiatan_pembelajaran: '1. Pendahuluan (Apersepsi materi faktorisasi).\n2. Inti: Pembagian kelompok pemecahan kasus lintasan peluru, diskusi analisis determinan D, demonstrasi rumus ABC.\n3. Penutup: Evaluasi kuis 2 soal dan penugasan lembar kerja.',
      catatan: 'Kegiatan KBM berjalan kondusif. Kelompok 3 sangat aktif mempresentasikan solusi grafik parabola.',
      refleksi: 'Siswa lebih cepat memahami konsep ketika dikaitkan dengan simulasi visual gerak parabola.',
      tindak_lanjut: 'Memberikan materi pengayaan untuk 5 siswa yang selesai lebih awal dan bimbingan tambahan bagi yang kesulitan.',
      semester: 'Ganjil',
      tahun_ajaran: '2026/2027',
      status: 'terkirim',
      foto_utama_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
      created_at: now,
      updated_at: now,
    },
    {
      id: journal2Id,
      teacher_id: teacher2Id,
      class_id: 'c-10-mipa1',
      subject_id: 's-bind',
      tanggal: '2026-09-25',
      hari: 'Jumat',
      jam_ke: 'Jam ke 3-4',
      jam_mulai: '08:45',
      jam_selesai: '10:15',
      jenis_kbm: 'Diskusi',
      materi: 'Menganalisis Struktur dan Kaidah Kebahasaan Teks Laporan Hasil Observasi (LHO)',
      tujuan_pembelajaran: 'Peserta didik dapat mengidentifikasi struktur definisi umum, deskripsi bagian, dan deskripsi manfaat pada teks observasi.',
      kegiatan_pembelajaran: 'Peserta didik membaca teks observasi tentang ekosistem mangrove, menandai verba relasional, lalu menyusun ringkasan berkelompok.',
      catatan: 'Siswa Annisa dan Dimas izin sakit. Siswa lainnya antusias berdiskusi.',
      refleksi: 'Pemanfaatan artikel terkini membuat minat membaca siswa meningkat.',
      tindak_lanjut: 'Tugas menulis draf observasi lingkungan sekolah pekan depan.',
      semester: 'Ganjil',
      tahun_ajaran: '2026/2027',
      status: 'terkirim',
      foto_utama_url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
      created_at: now,
      updated_at: now,
    },
    {
      id: journal3Id,
      teacher_id: teacher3Id,
      class_id: 'c-10-mipa1',
      subject_id: 's-inf',
      tanggal: '2026-09-26',
      hari: 'Sabtu',
      jam_ke: 'Jam ke 5-6',
      jam_mulai: '10:30',
      jam_selesai: '12:00',
      jenis_kbm: 'Praktikum',
      materi: 'Pemrograman Dasar Python: Pengkondisian Percabangan (if-else) dan Perulangan (looping)',
      tujuan_pembelajaran: 'Siswa dapat membuat kode program sederhana menggunakan logika if-elif-else dan perulangan for di Google Colab.',
      kegiatan_pembelajaran: 'Praktik di Laboratorium Komputer. Siswa menulis program penentu kelulusan nilai dan deret angka ganjil-genap.',
      catatan: 'Lab komputer lancar, seluruh komputer berfungsi normal. Koneksi internet stabil.',
      refleksi: 'Metode live coding sangat membantu siswa menemukan error sintaks secara mandiri.',
      tindak_lanjut: 'Challenge mini-project kalkulator sederhana untuk pertemuan berikutnya.',
      semester: 'Ganjil',
      tahun_ajaran: '2026/2027',
      status: 'terkirim',
      foto_utama_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
      created_at: now,
      updated_at: now,
    },
  ];

  // Attendance for Journal 1 (X MIPA 1, 12 students)
  const attendance: Attendance[] = [
    { id: 'att-1-01', journal_id: journal1Id, student_id: 'std-01', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-1-02', journal_id: journal1Id, student_id: 'std-02', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-1-03', journal_id: journal1Id, student_id: 'std-03', status: 'S', keterangan: 'Sakit demam', created_at: now, updated_at: now },
    { id: 'att-1-04', journal_id: journal1Id, student_id: 'std-04', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-1-05', journal_id: journal1Id, student_id: 'std-05', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-1-06', journal_id: journal1Id, student_id: 'std-06', status: 'I', keterangan: 'Izin acara keluarga', created_at: now, updated_at: now },
    { id: 'att-1-07', journal_id: journal1Id, student_id: 'std-07', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-1-08', journal_id: journal1Id, student_id: 'std-08', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-1-09', journal_id: journal1Id, student_id: 'std-09', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-1-10', journal_id: journal1Id, student_id: 'std-10', status: 'D', keterangan: 'Dispensasi Lomba OSN Matematika', created_at: now, updated_at: now },
    { id: 'att-1-11', journal_id: journal1Id, student_id: 'std-11', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-1-12', journal_id: journal1Id, student_id: 'std-12', status: 'H', keterangan: '', created_at: now, updated_at: now },

    // Attendance for Journal 2
    { id: 'att-2-01', journal_id: journal2Id, student_id: 'std-01', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-2-02', journal_id: journal2Id, student_id: 'std-02', status: 'S', keterangan: 'Sakit flu', created_at: now, updated_at: now },
    { id: 'att-2-03', journal_id: journal2Id, student_id: 'std-03', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-2-04', journal_id: journal2Id, student_id: 'std-04', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-2-05', journal_id: journal2Id, student_id: 'std-05', status: 'S', keterangan: 'Sakit', created_at: now, updated_at: now },
    { id: 'att-2-06', journal_id: journal2Id, student_id: 'std-06', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-2-07', journal_id: journal2Id, student_id: 'std-07', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-2-08', journal_id: journal2Id, student_id: 'std-08', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-2-09', journal_id: journal2Id, student_id: 'std-09', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-2-10', journal_id: journal2Id, student_id: 'std-10', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-2-11', journal_id: journal2Id, student_id: 'std-11', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-2-12', journal_id: journal2Id, student_id: 'std-12', status: 'H', keterangan: '', created_at: now, updated_at: now },

    // Attendance for Journal 3
    { id: 'att-3-01', journal_id: journal3Id, student_id: 'std-01', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-3-02', journal_id: journal3Id, student_id: 'std-02', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-3-03', journal_id: journal3Id, student_id: 'std-03', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-3-04', journal_id: journal3Id, student_id: 'std-04', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-3-05', journal_id: journal3Id, student_id: 'std-05', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-3-06', journal_id: journal3Id, student_id: 'std-06', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-3-07', journal_id: journal3Id, student_id: 'std-07', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-3-08', journal_id: journal3Id, student_id: 'std-08', status: 'A', keterangan: 'Tanpa keterangan', created_at: now, updated_at: now },
    { id: 'att-3-09', journal_id: journal3Id, student_id: 'std-09', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-3-10', journal_id: journal3Id, student_id: 'std-10', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-3-11', journal_id: journal3Id, student_id: 'std-11', status: 'H', keterangan: '', created_at: now, updated_at: now },
    { id: 'att-3-12', journal_id: journal3Id, student_id: 'std-12', status: 'H', keterangan: '', created_at: now, updated_at: now },
  ];

  const journal_photos: JournalPhoto[] = [
    {
      id: 'jp-1-01',
      journal_id: journal1Id,
      photo_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&q=80',
      caption: 'Dokumentasi Foto KBM Tambahan 1: Diskusi kelompok pengerjaan LKPD rumus ABC',
      urutan: 1,
      created_at: now,
    },
    {
      id: 'jp-1-02',
      journal_id: journal1Id,
      photo_url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80',
      caption: 'Dokumentasi Foto KBM Tambahan 2: Presentasi perwakilan siswa di depan kelas',
      urutan: 2,
      created_at: now,
    },
  ];

  const academic_years = [
    { id: 'ay-1', tahun: '2026/2027', aktif: true },
    { id: 'ay-2', tahun: '2025/2026', aktif: false },
  ];

  const semesters = [
    { id: 'sem-1', nama: 'Ganjil', aktif: true },
    { id: 'sem-2', nama: 'Genap', aktif: false },
  ];

  return {
    users,
    teachers,
    schools: [school],
    classes,
    subjects,
    students,
    journals,
    attendance,
    journal_photos,
    academic_years,
    semesters,
  };
}

class PersistentDatabase {
  private data: DatabaseSchema;
  private isSaving: boolean = false;
  private pendingSave: boolean = false;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Verify key tables exist
        if (parsed.journals && parsed.teachers && parsed.students) {
          console.log('[Database] Loaded existing database from disk:', DB_FILE);
          return parsed;
        }
      }
    } catch (err) {
      console.error('[Database] Failed to read database.json, initializing fresh seed data', err);
    }

    console.log('[Database] Initializing new database seed file at:', DB_FILE);
    const initial = getInitialData();
    this.writeSync(initial);
    return initial;
  }

  private writeSync(data: DatabaseSchema) {
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, DB_FILE);
  }

  public save() {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }
    this.isSaving = true;
    try {
      const tmp = DB_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (e) {
      console.error('[Database] Error persisting data to disk:', e);
    } finally {
      this.isSaving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        this.save();
      }
    }
  }

  public resetSeed(): DatabaseSchema {
    this.data = getInitialData();
    this.save();
    return this.data;
  }

  public restore(newData: DatabaseSchema): boolean {
    if (!newData.journals || !newData.teachers) {
      throw new Error('Invalid backup file schema');
    }
    this.data = newData;
    this.save();
    return true;
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  // Relations & Cascades
  public deleteJournal(id: string): boolean {
    const idx = this.data.journals.findIndex((j) => j.id === id);
    if (idx === -1) return false;

    // Cascade delete attendance
    this.data.attendance = this.data.attendance.filter((a) => a.journal_id !== id);
    // Cascade delete photos
    this.data.journal_photos = this.data.journal_photos.filter((p) => p.journal_id !== id);
    // Remove journal
    this.data.journals.splice(idx, 1);

    this.save();
    return true;
  }
}

export const db = new PersistentDatabase();
