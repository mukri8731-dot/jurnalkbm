import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Edit2, Trash2, X, Mail, Phone, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import { Teacher, User } from '../types';

interface TeachersAdminViewProps {
  user: User | null;
}

export const TeachersAdminView: React.FC<TeachersAdminViewProps> = ({ user }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [email, setEmail] = useState('');
  const [telepon, setTelepon] = useState('');
  const [mataPelajaran, setMataPelajaran] = useState('');
  const [jabatan, setJabatan] = useState('Guru Mata Pelajaran');
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const data = await api.getTeachers();
      setTeachers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setNama('');
    setNip('');
    setEmail('');
    setTelepon('');
    setMataPelajaran('');
    setJabatan('Guru Mata Pelajaran');
    setPassword('guru123');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setNama(t.nama);
    setNip(t.nip);
    setEmail(t.email);
    setTelepon(t.telepon);
    setMataPelajaran(t.mata_pelajaran);
    setJabatan(t.jabatan);
    setPassword('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !email) return;

    try {
      if (editingTeacher) {
        await api.updateTeacher(editingTeacher.id, {
          nama,
          nip,
          email,
          telepon,
          mata_pelajaran: mataPelajaran,
          jabatan,
          ...(password && password.trim() ? { password: password.trim() } : {}),
        });
      } else {
        await api.createTeacher({
          nama,
          nip,
          email,
          telepon,
          mata_pelajaran: mataPelajaran,
          jabatan,
          password: password || 'guru123',
        });
      }
      setIsModalOpen(false);
      loadTeachers();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data guru');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus guru "${name}"? Akun login terkait juga akan dinonaktifkan.`)) return;
    try {
      await api.deleteTeacher(id);
      loadTeachers();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus guru');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Manajemen Data Dewan Guru</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data identitas guru pengajar dan akun akses Jurnal KBM Digital.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ TAMBAH GURU BARU</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map((t) => (
          <div
            key={t.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3">
                <img
                  src={t.foto_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={t.nama}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-100"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.nama}</h3>
                  <p className="text-[11px] font-mono text-slate-500">NIP. {t.nip || '-'}</p>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mapel: <b>{t.mata_pelajaran || '-'}</b></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.telepon || '-'}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                {t.jabatan}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(t)}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id, t.nama)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nama Lengkap & Gelar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Drs. Budi Santoso, M.Pd."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    NIP / NIK
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="19750815..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    value={mataPelajaran}
                    onChange={(e) => setMataPelajaran(e.target.value)}
                    placeholder="Matematika"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Email Resmi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@sekolah.sch.id"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    placeholder="0812..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Jabatan / Tugas
                </label>
                <input
                  type="text"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Guru Ahli Madya"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {editingTeacher ? 'Reset Password Akun (Opsional)' : 'Password Akun Login'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingTeacher ? 'Kosongkan jika tidak ingin mengubah password' : 'guru123'}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
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
                  Simpan Data Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
