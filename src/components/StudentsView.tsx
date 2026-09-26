import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Upload,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  Filter,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { Student, SchoolClass, User } from '../types';

interface StudentsViewProps {
  user: User | null;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ user }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch] = useState('');

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formNis, setFormNis] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formClassId, setFormClassId] = useState('');
  const [formAktif, setFormAktif] = useState(true);

  // Modal import Excel
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importClassId, setImportClassId] = useState('');
  const [importPreview, setImportPreview] = useState<Partial<Student>[]>([]);

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [selectedClass, search]);

  const loadClasses = async () => {
    try {
      const cls = await api.getClasses();
      setClasses(cls);
      if (cls.length > 0 && !formClassId) {
        setFormClassId(cls[0].id);
        setImportClassId(cls[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents(selectedClass || undefined, search || undefined);
      setStudents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormNis('');
    setFormNisn('');
    setFormNama('');
    setFormGender('L');
    if (classes.length > 0) setFormClassId(classes[0].id);
    setFormAktif(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setFormNis(s.nis);
    setFormNisn(s.nisn);
    setFormNama(s.nama_siswa);
    setFormGender(s.jenis_kelamin);
    setFormClassId(s.class_id);
    setFormAktif(s.status_aktif);
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formClassId) {
      alert('Nama siswa dan kelas wajib diisi');
      return;
    }

    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, {
          nis: formNis,
          nisn: formNisn,
          nama_siswa: formNama,
          jenis_kelamin: formGender,
          class_id: formClassId,
          status_aktif: formAktif,
        });
        setNotification({ type: 'success', message: 'Data siswa berhasil diperbarui.' });
      } else {
        await api.createStudent({
          nis: formNis,
          nisn: formNisn,
          nama_siswa: formNama,
          jenis_kelamin: formGender,
          class_id: formClassId,
          status_aktif: formAktif,
        });
        setNotification({ type: 'success', message: 'Siswa baru berhasil ditambahkan.' });
      }
      setIsModalOpen(false);
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data siswa');
    }
  };

  const handleDeleteStudent = async (id: string, nama: string) => {
    if (!window.confirm(`Hapus data siswa "${nama}"? Data presensi siswa ini juga akan dibersihkan.`)) {
      return;
    }
    try {
      await api.deleteStudent(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      setNotification({ type: 'success', message: 'Data siswa berhasil dihapus.' });
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus siswa');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data = students.map((s, idx) => ({
      No: idx + 1,
      NIS: s.nis,
      NISN: s.nisn,
      'Nama Siswa': s.nama_siswa,
      'Jenis Kelamin': s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      Kelas: s.nama_kelas || '',
      Status: s.status_aktif ? 'Aktif' : 'Non-aktif',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
    XLSX.writeFile(wb, `Data-Siswa_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Download Import Template
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const sample = [
      { NIS: '26020', NISN: '0089876541', 'Nama Siswa': 'Ahmad Dahlan', 'Jenis Kelamin (L/P)': 'L' },
      { NIS: '26021', NISN: '0089876542', 'Nama Siswa': 'Fatimah Zahra', 'Jenis Kelamin (L/P)': 'P' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
    XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx');
  };

  // Handle Excel File Upload for Import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        const parsed: Partial<Student>[] = rawJson.map((row) => ({
          nis: String(row['NIS'] || row['nis'] || ''),
          nisn: String(row['NISN'] || row['nisn'] || ''),
          nama_siswa: String(row['Nama Siswa'] || row['Nama'] || row['nama_siswa'] || ''),
          jenis_kelamin: (String(row['Jenis Kelamin (L/P)'] || row['Jenis Kelamin'] || 'L').toUpperCase().startsWith('P')
            ? 'P'
            : 'L') as ('L' | 'P'),
        })).filter((s) => s.nama_siswa);

        setImportPreview(parsed);
      } catch (err) {
        alert('Gagal membaca file Excel. Pastikan format file sesuai.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = async () => {
    if (importPreview.length === 0) {
      alert('Tidak ada data siswa untuk diimpor');
      return;
    }
    try {
      const res = await api.bulkImportStudents(importPreview, importClassId);
      setNotification({ type: 'success', message: res.message });
      setIsImportModalOpen(false);
      setImportPreview([]);
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Gagal mengimpor data siswa');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Master Data Siswa</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {students.length} Siswa Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data siswa per kelas. Siswa yang terdaftar otomatis muncul pada presensi jurnal KBM.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>IMPORT EXCEL</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT EXCEL</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ TAMBAH SISWA</span>
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-medium border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{notification.message}</span>
          </div>
          <button type="button" onClick={() => setNotification(null)}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      )}

      {/* FILTER & SEARCH */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama siswa, NIS, atau NISN..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama_kelas} ({c.jurusan})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STUDENTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">NISN</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4 text-center">L/P</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Memuat daftar siswa...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada siswa terdaftar. Tambahkan siswa atau impor dari file Excel.
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{s.nis || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{s.nisn || '-'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{s.nama_siswa}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          s.jenis_kelamin === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                        }`}
                      >
                        {s.jenis_kelamin === 'L' ? 'L' : 'P'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{s.nama_kelas}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status_aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {s.status_aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Siswa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(s.id, s.nama_siswa)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT SISWA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nama Siswa Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Muhammad Rizky"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">NIS</label>
                  <input
                    type="text"
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    placeholder="26001"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">NISN</label>
                  <input
                    type="text"
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    placeholder="0081234501"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={formAktif}
                    onChange={(e) => setFormAktif(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Status Siswa Aktif</span>
                </label>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/25"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORT EXCEL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Import Data Siswa dari Excel</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-900">Belum punya format Excel?</p>
                  <p className="text-[11px] text-indigo-700">Unduh format template standar (.xlsx) disini.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-white text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-50 shadow-2xs"
                >
                  Unduh Template
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Masukkan Siswa ke Kelas:
                </label>
                <select
                  value={importClassId}
                  onChange={(e) => setImportClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama_kelas} ({c.jurusan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Pilih File Excel (.xlsx / .xls / .csv)
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileImport}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              {importPreview.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-emerald-700 mb-1">
                    Pratinjau ({importPreview.length} Siswa Terbaca):
                  </p>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 text-[11px] space-y-1">
                    {importPreview.map((p, i) => (
                      <div key={i} className="flex justify-between py-0.5 border-b border-slate-200/60">
                        <span>{p.nama_siswa}</span>
                        <span className="font-mono text-slate-500">NIS: {p.nis || '-'} | {p.jenis_kelamin}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={importPreview.length === 0}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/25 disabled:opacity-50"
                >
                  Impor Sekarang ({importPreview.length} Data)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
