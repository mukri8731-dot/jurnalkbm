import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Printer,
  FileText,
  Copy,
  Calendar,
  GraduationCap,
  Users,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { Journal, SchoolClass, Subject, Teacher, User } from '../types';

interface JournalListViewProps {
  user: User | null;
  teacher: Teacher | null;
  onViewJournal: (journalId: string) => void;
  onEditJournal: (journalId: string) => void;
  onCreateNew: () => void;
}

export const JournalListView: React.FC<JournalListViewProps> = ({
  user,
  teacher,
  onViewJournal,
  onEditJournal,
  onCreateNew,
}) => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(user?.role === 'guru' && teacher?.id ? teacher.id : '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [semester, setSemester] = useState('');
  const [tahunAjaran, setTahunAjaran] = useState('');

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadJournals();
  }, [selectedClass, selectedSubject, selectedTeacher, startDate, endDate, semester, tahunAjaran, search]);

  const loadFilterOptions = async () => {
    try {
      const [cls, subjs, tchs] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getTeachers(),
      ]);
      setClasses(cls);
      setSubjects(subjs);
      setTeachers(tchs);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  const loadJournals = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedClass) filters.class_id = selectedClass;
      if (selectedSubject) filters.subject_id = selectedSubject;
      if (selectedTeacher) filters.teacher_id = selectedTeacher;
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;
      if (semester) filters.semester = semester;
      if (tahunAjaran) filters.tahun_ajaran = tahunAjaran;
      if (search) filters.search = search;

      const data = await api.getJournals(filters);
      setJournals(data);
    } catch (err) {
      console.error('Error loading journals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedTeacher(user?.role === 'guru' && teacher?.id ? teacher.id : '');
    setStartDate('');
    setEndDate('');
    setSemester('');
    setTahunAjaran('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.deleteJournal(deleteId);
      setJournals((prev) => prev.filter((j) => j.id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus jurnal');
    } finally {
      setIsDeleting(false);
    }
  };

  // Section 16: Copas Jurnal Tunggal
  const handleCopySingle = (j: Journal, e: React.MouseEvent) => {
    e.stopPropagation();
    const r = j.rekap_kehadiran || { H: 0, S: 0, I: 0, A: 0, D: 0, total: 0 };
    const text = `LAPORAN KEGIATAN BELAJAR MENGAJAR (KBM)
Tanggal: ${j.tanggal}
Hari/Jam: ${j.hari}, ${j.jam_ke}
Kelas: ${j.nama_kelas}
Mata Pelajaran: ${j.nama_mapel}
Guru: ${j.nama_guru}
Materi: ${j.materi}
Jenis KBM: ${j.jenis_kbm}
Catatan: ${j.catatan || '-'}
Hadir: ${r.H}
Sakit: ${r.S}
Izin: ${r.I}
Alpha: ${r.A}
Dispensasi: ${r.D}
Total Siswa: ${r.total}`;

    navigator.clipboard.writeText(text);
    setCopiedId(j.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Section 16: Copas Rekap Jurnal Sekaligus
  const handleCopyAll = () => {
    if (journals.length === 0) return;

    let text = `REKAPITULASI JURNAL KBM (${journals.length} PERTEMUAN)\n`;
    text += `Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}\n`;
    text += `=========================================\n\n`;

    journals.forEach((j, idx) => {
      const r = j.rekap_kehadiran || { H: 0, S: 0, I: 0, A: 0, D: 0, total: 0 };
      text += `${idx + 1}. [${j.tanggal} - ${j.nama_kelas} - ${j.nama_mapel}]\n`;
      text += `   Guru: ${j.nama_guru}\n`;
      text += `   Materi: ${j.materi} (${j.jenis_kbm})\n`;
      text += `   Presensi: Hadir ${r.H} | Sakit ${r.S} | Izin ${r.I} | Alpha ${r.A} | Dispen ${r.D} (Total: ${r.total})\n`;
      if (j.catatan) text += `   Catatan: ${j.catatan}\n`;
      text += `-----------------------------------------\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Export filtered journals to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const dataRows = journals.map((j, idx) => {
      const r = j.rekap_kehadiran || { H: 0, S: 0, I: 0, A: 0, D: 0, total: 0 };
      return {
        No: idx + 1,
        Tanggal: j.tanggal,
        Hari: j.hari,
        'Jam Ke': j.jam_ke,
        Kelas: j.nama_kelas,
        'Mata Pelajaran': j.nama_mapel,
        'Guru Pengajar': j.nama_guru,
        'Jenis KBM': j.jenis_kbm,
        'Materi Pembelajaran': j.materi,
        'Tujuan Pembelajaran': j.tujuan_pembelajaran,
        'Kegiatan Pembelajaran': j.kegiatan_pembelajaran,
        'Catatan / Kejadian': j.catatan,
        'Refleksi Guru': j.refleksi,
        'Tindak Lanjut': j.tindak_lanjut,
        'Hadir (H)': r.H,
        'Sakit (S)': r.S,
        'Izin (I)': r.I,
        'Alpha (A)': r.A,
        'Dispensasi (D)': r.D,
        'Total Siswa': r.total,
        Status: j.status,
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Jurnal KBM');
    XLSX.writeFile(wb, `Rekap-Jurnal-KBM_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Riwayat Jurnal Laporan KBM</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {journals.length} Sesi Terdata
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cari, filter, lihat detail laporan resmi, cetak, download PDF, atau ekspor data ke Excel.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            title="Salin ringkasan seluruh jurnal yang sedang difilter"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAll ? 'TERSALIN!' : '📋 COPAS REKAP'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>EXPORT EXCEL</span>
          </button>

          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <span>+ BUAT JURNAL</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filter & Pencarian Jurnal</span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Cari Materi / Catatan
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ketik topik materi, metode pembelajaran..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Filter Kelas */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Kelas
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama_kelas}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Mata Pelajaran */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Mata Pelajaran
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="">Semua Mata Pelajaran</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama_mapel}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Guru */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Guru Pengajar
            </label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              disabled={user?.role === 'guru'}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:opacity-70"
            >
              <option value="">Semua Guru</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal Mulai */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Tanggal Selesai */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Tanggal Selesai
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Semester */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="">Semua Semester</option>
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE RIWAYAT JURNAL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Tanggal & Jam</th>
                <th className="py-3 px-4 whitespace-nowrap">Kelas</th>
                <th className="py-3 px-4 whitespace-nowrap">Mata Pelajaran</th>
                <th className="py-3 px-4">Materi Pembelajaran</th>
                <th className="py-3 px-4 whitespace-nowrap">Guru Pengajar</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Presensi</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Memuat data jurnal KBM dari database...
                  </td>
                </tr>
              ) : journals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ditemukan catatan jurnal sesuai kriteria filter.
                  </td>
                </tr>
              ) : (
                journals.map((j) => {
                  const r = j.rekap_kehadiran || { H: 0, S: 0, I: 0, A: 0, D: 0, total: 0 };
                  const isOwnerOrAdmin = user?.role === 'admin' || j.teacher_id === teacher?.id;

                  return (
                    <tr key={j.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900">{j.tanggal}</p>
                        <p className="text-[11px] text-slate-500">
                          {j.hari}, {j.jam_ke}
                        </p>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-xs">
                          {j.nama_kelas}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-900">{j.nama_mapel}</p>
                        <span className="text-[10px] text-slate-400">{j.kode_mapel}</span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-medium text-slate-900 line-clamp-1">{j.materi}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm">
                            {j.jenis_kbm}
                          </span>
                          {j.foto_utama_url && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-sm font-medium">
                              📷 Ada Foto
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-800 font-medium">
                        {j.nama_guru}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold">
                          <span className="px-1 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                            H:{r.H}
                          </span>
                          <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded">
                            S:{r.S}
                          </span>
                          <span className="px-1 py-0.5 bg-amber-100 text-amber-800 rounded">
                            I:{r.I}
                          </span>
                          <span className="px-1 py-0.5 bg-red-100 text-red-800 rounded">
                            A:{r.A}
                          </span>
                          <span className="px-1 py-0.5 bg-purple-100 text-purple-800 rounded">
                            D:{r.D}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            j.status === 'draft'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {j.status === 'draft' ? 'DRAFT' : 'TERKIRIM'}
                        </span>
                      </td>

                      {/* Section 11 Actions: Lihat, Edit, Hapus, Cetak, PDF, COPAS */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onViewJournal(j.id)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="👁 Lihat Detail & Cetak"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopySingle(j, e)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="📋 COPAS Format Singkat"
                          >
                            {copiedId === j.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {isOwnerOrAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => onEditJournal(j.id)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="✏️ Edit Jurnal"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteId(j.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="🗑 Hapus Jurnal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL KONFIRMASI HAPUS JURNAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Apakah Anda yakin ingin menghapus jurnal ini?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tindakan ini akan menghapus data jurnal kegiatan belajar mengajar beserta seluruh data presensi siswa dan foto dokumentasi terkait dari database persisten. Data yang dihapus tidak dapat dipulihkan.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-600/25 flex items-center gap-2"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Ya, Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
