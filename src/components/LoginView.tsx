import React, { useState } from 'react';
import { School, Lock, User as UserIcon, LogIn, ShieldAlert, CheckCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { User, Teacher } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User, teacher: Teacher | null, rememberMe: boolean) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('budi');
  const [password, setPassword] = useState('guru123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Mohon masukkan username dan password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.login(username, password);
      onLoginSuccess(data.user, data.teacher, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Gagal login ke sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userDemo: string, passDemo: string) => {
    setUsername(userDemo);
    setPassword(passDemo);
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(userDemo, passDemo);
      onLoginSuccess(data.user, data.teacher, true);
    } catch (err: any) {
      setError(err.message || 'Gagal login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header decoration */}
        <div className="bg-indigo-600 px-6 py-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-3 shadow-inner">
            <School className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">JURNAL KBM DIGITAL</h2>
          <p className="text-xs text-indigo-100 mt-1">
            Sistem Informasi Jurnal Laporan Kegiatan Belajar Mengajar
          </p>
          <p className="text-[11px] text-indigo-200 mt-0.5 font-medium">
            SMA NEGERI 1 MAJU JAYA
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 flex items-center gap-2.5 p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: budi atau admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                />
                <span>Ingat Saya</span>
              </label>
              <span className="text-slate-400 text-[11px]">Database Persisten v2.0</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>LOGIN KE SISTEM</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Chips */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Akses Cepat Pengujian (1-Klik):</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="w-full text-left p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/60 hover:bg-indigo-100/70 transition-colors flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-indigo-900">Administrator</p>
                  <p className="text-[11px] text-indigo-600">Kelola guru, siswa, kelas, identitas, backup</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded-md font-medium group-hover:bg-indigo-300">
                  Masuk
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('budi', 'guru123')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">Guru: Drs. Budi Santoso, M.Pd.</p>
                  <p className="text-[11px] text-slate-500">Mata Pelajaran: Matematika Wajib</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-medium group-hover:bg-slate-300">
                  Masuk
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('siti', 'guru123')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">Guru: Siti Aminah, S.Pd.</p>
                  <p className="text-[11px] text-slate-500">Mata Pelajaran: Bahasa Indonesia</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-medium group-hover:bg-slate-300">
                  Masuk
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
