import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, Plus, Edit2, Trash2, X, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { SchoolClass, Subject, User } from '../types';

interface ClassesAndSubjectsViewProps {
  user: User | null;
}

export const ClassesAndSubjectsView: React.FC<ClassesAndSubjectsViewProps> = ({ user }) => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'classes' | 'subjects'>('classes');

  // Modal Class
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [className, setClassName] = useState('');
  const [classTingkat, setClassTingkat] = useState('10');
  const [classJurusan, setClassJurusan] = useState('MIPA');
  const [classWali, setClassWali] = useState('');
  const [classTahun, setClassTahun] = useState('2026/2027');

  // Modal Subject
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjKode, setSubjKode] = useState('');
  const [subjNama, setSubjNama] = useState('');
  const [subjTingkat, setSubjTingkat] = useState('Semua');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cls, subjs] = await Promise.all([api.getClasses(), api.getSubjects()]);
      setClasses(cls);
      setSubjects(subjs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassName('');
    setClassTingkat('10');
    setClassJurusan('MIPA');
    setClassWali('');
    setClassTahun('2026/2027');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (c: SchoolClass) => {
    setEditingClass(c);
    setClassName(c.nama_kelas);
    setClassTingkat(c.tingkat);
    setClassJurusan(c.jurusan);
    setClassWali(c.wali_kelas);
    setClassTahun(c.tahun_ajaran);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className) return;

    try {
      if (editingClass) {
        await api.updateClass(editingClass.id, {
          nama_kelas: className,
          tingkat: classTingkat,
          jurusan: classJurusan,
          wali_kelas: classWali,
          tahun_ajaran: classTahun,
        });
      } else {
        await api.createClass({
          nama_kelas: className,
          tingkat: classTingkat,
          jurusan: classJurusan,
          wali_kelas: classWali,
          tahun_ajaran: classTahun,
        });
      }
      setIsClassModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan kelas');
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!window.confirm(`Hapus kelas "${name}"?`)) return;
    try {
      await api.deleteClass(id);
      loadData();
    } catch (err: any) {
      alert('Gagal menghapus kelas');
    }
  };

  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubjKode('');
    setSubjNama('');
    setSubjTingkat('Semua');
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (s: Subject) => {
    setEditingSubject(s);
    setSubjKode(s.kode);
    setSubjNama(s.nama_mapel);
    setSubjTingkat(s.tingkat);
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjNama) return;

    try {
      if (editingSubject) {
        await api.updateSubject(editingSubject.id, {
          kode: subjKode,
          nama_mapel: subjNama,
          tingkat: subjTingkat,
        });
      } else {
        await api.createSubject({
          kode: subjKode,
          nama_mapel: subjNama,
          tingkat: subjTingkat,
        });
      }
      setIsSubjectModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan mata pelajaran');
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!window.confirm(`Hapus mata pelajaran "${name}"?`)) return;
    try {
      await api.deleteSubject(id);
      loadData();
    } catch (err: any) {
      alert('Gagal menghapus mata pelajaran');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Data Master Kelas & Mata Pelajaran</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi rombel kelas dan kurikulum mata pelajaran KBM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={activeSubTab === 'classes' ? handleOpenAddClass : handleOpenAddSubject}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{activeSubTab === 'classes' ? '+ TAMBAH KELAS' : '+ TAMBAH MAPEL'}</span>
          </button>
        </div>
      </div>

      {/* SUB TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('classes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'classes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Daftar Kelas ({classes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'subjects'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Mata Pelajaran ({subjects.length})</span>
        </button>
      </div>

      {/* TAB 1: KELAS */}
      {activeSubTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs">
                    Tingkat {c.tingkat} • {c.jurusan}
                  </span>
                  <span className="text-[11px] text-slate-400">{c.tahun_ajaran}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{c.nama_kelas}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Wali Kelas: <span className="text-slate-700 font-medium">{c.wali_kelas || '-'}</span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditClass(c)}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  title="Edit Kelas"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClass(c.id, c.nama_kelas)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Hapus Kelas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: MATA PELAJARAN */}
      {activeSubTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-28">Kode Mapel</th>
                <th className="py-3 px-4">Nama Mata Pelajaran</th>
                <th className="py-3 px-4">Tingkat Kelas</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">{s.kode}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{s.nama_mapel}</td>
                  <td className="py-3 px-4 text-slate-600">{s.tingkat}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSubject(s)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(s.id, s.nama_mapel)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL KELAS */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingClass ? 'Edit Rombel Kelas' : 'Tambah Rombel Kelas'}
              </h3>
              <button type="button" onClick={() => setIsClassModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nama Kelas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Contoh: X MIPA 1"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Tingkat
                  </label>
                  <select
                    value={classTingkat}
                    onChange={(e) => setClassTingkat(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  >
                    <option value="10">Kelas 10</option>
                    <option value="11">Kelas 11</option>
                    <option value="12">Kelas 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Jurusan
                  </label>
                  <select
                    value={classJurusan}
                    onChange={(e) => setClassJurusan(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  >
                    <option value="MIPA">MIPA</option>
                    <option value="IPS">IPS</option>
                    <option value="Bahasa">Bahasa</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Wali Kelas
                </label>
                <input
                  type="text"
                  value={classWali}
                  onChange={(e) => setClassWali(e.target.value)}
                  placeholder="Nama wali kelas..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  value={classTahun}
                  onChange={(e) => setClassTahun(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/25"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MAPEL */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
              </h3>
              <button type="button" onClick={() => setIsSubjectModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Kode Mapel
                </label>
                <input
                  type="text"
                  value={subjKode}
                  onChange={(e) => setSubjKode(e.target.value)}
                  placeholder="Contoh: MTK-01"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nama Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subjNama}
                  onChange={(e) => setSubjNama(e.target.value)}
                  placeholder="Contoh: Fisika"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Tingkat
                </label>
                <input
                  type="text"
                  value={subjTingkat}
                  onChange={(e) => setSubjTingkat(e.target.value)}
                  placeholder="10, 11, 12"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/25"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
