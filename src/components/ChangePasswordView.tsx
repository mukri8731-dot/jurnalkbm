import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  User,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface ChangePasswordViewProps {
  user: UserType | null;
}

export const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({ user }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!currentPassword) {
      setNotification({ type: 'error', message: 'Password saat ini wajib diisi.' });
      return;
    }

    if (!newPassword || newPassword.length < 5) {
      setNotification({ type: 'error', message: 'Password baru minimal harus 5 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotification({ type: 'error', message: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    if (currentPassword === newPassword) {
      setNotification({
        type: 'error',
        message: 'Password baru tidak boleh sama dengan password saat ini.',
      });
      return;
    }

    setLoading(true);
    setNotification(null);

    try {
      const res = await api.changePassword(user.id, currentPassword, newPassword);
      setNotification({
        type: 'success',
        message: res.message || 'Password akun berhasil diubah ke sistem.',
      });
      // Clear inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal mengubah password.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Ganti Password Akun</h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                user?.role === 'admin'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}
            >
              {user?.role === 'admin' ? 'Administrator' : 'Guru Pengajar'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbarui kata sandi akun Anda untuk meningkatkan keamanan akses Jurnal KBM Digital.
          </p>
        </div>

        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 self-start sm:self-auto">
          <KeyRound className="w-5 h-5" />
        </div>
      </div>

      {/* User Information Card */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex items-center justify-between relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-indigo-500/20 blur-xl pointer-events-none"></div>

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold">
            <User className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <p className="text-xs text-indigo-200 uppercase font-semibold tracking-wider">
              Akun Aktif
            </p>
            <h3 className="text-base font-bold text-white">{user?.username}</h3>
            <p className="text-xs text-slate-300 font-mono">{user?.email}</p>
          </div>
        </div>

        <div className="hidden sm:block text-right relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Tersimpan di Database
          </span>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-xl text-xs font-medium border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Change Password Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-5"
      >
        {/* Current Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Password Saat Ini (Lama) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan kata sandi lama Anda"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 my-2"></div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Password Baru <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 5 karakter"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Gunakan kombinasi huruf atau angka yang mudah Anda ingat namun sulit ditebak orang lain.
          </p>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Konfirmasi Password Baru <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang password baru Anda"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-[11px] text-red-500 mt-1">
              Konfirmasi password tidak cocok dengan password baru.
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setNotification(null);
            }}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Lock className="w-4 h-4" />
            )}
            <span>SIMPAN PASSWORD BARU</span>
          </button>
        </div>
      </form>
    </div>
  );
};
