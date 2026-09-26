import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  GraduationCap,
  TrendingUp,
  PlusCircle,
  History,
  FileSpreadsheet,
  CheckCircle,
  Eye,
  Printer,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, Journal, User, Teacher } from '../types';

interface DashboardViewProps {
  user: User | null;
  teacher: Teacher | null;
  onNavigate: (tab: any) => void;
  onSelectJournalToView: (journalId: string) => void;
  onSelectJournalToEdit: (journalId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  teacher,
  onNavigate,
  onSelectJournalToView,
  onSelectJournalToEdit,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJournals, setRecentJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user, teacher]);

  const loadData = async () => {
    setLoading(true);
    try {
      const teacherId = user?.role === 'guru' ? teacher?.id : undefined;
      const [statsData, journalsData] = await Promise.all([
        api.getStats(teacherId, user?.role),
        api.getJournals(teacherId ? { teacher_id: teacherId } : undefined),
      ]);
      setStats(statsData);
      setRecentJournals(journalsData.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const maxMonthly = stats?.monthlyData ? Math.max(...stats.monthlyData.map((m) => m.total), 1) : 1;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-indigo-100 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Tahun Ajaran 2026/2027 • Semester Ganjil
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Selamat Datang, {teacher?.nama || user?.username}!
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-xl mt-1">
              {user?.role === 'admin'
                ? 'Kelola operasional dan monitoring seluruh agenda kegiatan belajar mengajar sekolah secara terpadu.'
                : `Jurnal mengajar mata pelajaran ${teacher?.mata_pelajaran || 'Umum'}. Catat presensi, materi, dan dokumentasi KBM hari ini.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('create-journal')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-xs sm:text-sm shadow-lg shadow-black/10 hover:bg-indigo-50 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>+ Buat Jurnal Baru</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('journal-history')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 backdrop-blur-md text-white font-medium text-xs sm:text-sm border border-white/20 transition-all"
            >
              <History className="w-4 h-4" />
              <span>Riwayat Jurnal</span>
            </button>
          </div>
        </div>
      </div>

      {/* 7 Statistik Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Jurnal</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-slate-900">{stats?.totalJurnal ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Tersimpan di database</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Hari Ini</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-emerald-600">{stats?.jurnalHariIni ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Pertemuan hari ini</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Minggu Ini</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-blue-600">{stats?.jurnalMingguIni ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Pekan berjalan</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Bulan Ini</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-purple-600">{stats?.jurnalBulanIni ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Bulan aktif</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Jumlah Kelas</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-slate-900">{stats?.totalKelas ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Kelas terdaftar</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Jumlah Siswa</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-slate-900">{stats?.totalSiswa ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Siswa aktif</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Sesi</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-rose-600">{stats?.totalPertemuan ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Total pertemuan</p>
          </div>
        </div>
      </div>

      {/* Middle Row: Monthly Chart + Presensi Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Rekap Bulanan */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Rekap Frekuensi Pertemuan KBM per Bulan (2026)
              </h3>
              <p className="text-xs text-slate-500">Jumlah sesi jurnal mengajar per bulan</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('attendance-report')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Lihat Laporan Lengkap <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
            {stats?.monthlyData.map((m, idx) => {
              const heightPercent = Math.max((m.total / (maxMonthly || 1)) * 100, 8);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.total}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                      m.total > 0
                        ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-xs group-hover:from-indigo-700 group-hover:to-indigo-500'
                        : 'bg-slate-100'
                    }`}
                  />
                  <span className="text-[10px] font-medium text-slate-500 group-hover:text-slate-800">
                    {m.bulan}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Semester Ganjil 2026/2027</span>
            <span className="font-semibold text-slate-700">Total Terdata: {stats?.totalJurnal ?? 0} Pertemuan</span>
          </div>
        </div>

        {/* Rekap Kehadiran Siswa */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">
              Agregat Kehadiran Siswa
            </h3>
            <p className="text-xs text-slate-500 mb-4">Total rekap presensi seluruh sesi terdata</p>

            {stats?.rekapKehadiran ? (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-700">Hadir (H)</span>
                    <span className="text-slate-900">{stats.rekapKehadiran.H} Siswa</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${stats.rekapKehadiran.total > 0 ? (stats.rekapKehadiran.H / stats.rekapKehadiran.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-blue-700">Sakit (S)</span>
                    <span className="text-slate-900">{stats.rekapKehadiran.S} Siswa</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${stats.rekapKehadiran.total > 0 ? (stats.rekapKehadiran.S / stats.rekapKehadiran.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-700">Izin (I)</span>
                    <span className="text-slate-900">{stats.rekapKehadiran.I} Siswa</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${stats.rekapKehadiran.total > 0 ? (stats.rekapKehadiran.I / stats.rekapKehadiran.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-red-700">Alpha / Alpa (A)</span>
                    <span className="text-slate-900">{stats.rekapKehadiran.A} Siswa</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{
                        width: `${stats.rekapKehadiran.total > 0 ? (stats.rekapKehadiran.A / stats.rekapKehadiran.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-purple-700">Dispensasi (D)</span>
                    <span className="text-slate-900">{stats.rekapKehadiran.D} Siswa</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{
                        width: `${stats.rekapKehadiran.total > 0 ? (stats.rekapKehadiran.D / stats.rekapKehadiran.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Belum ada data presensi tersimpan.</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-500">Tingkat Partisipasi:</span>
            <span className="font-bold text-emerald-600 text-sm">
              {stats?.rekapKehadiran?.total
                ? `${Math.round((stats.rekapKehadiran.H / stats.rekapKehadiran.total) * 100)}%`
                : '100%'}
            </span>
          </div>
        </div>
      </div>

      {/* Jurnal KBM Terkini Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Jurnal KBM Terbaru</h3>
            <p className="text-xs text-slate-500">Catatan kegiatan pembelajaran yang baru diinput</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('journal-history')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto"
          >
            Lihat Semua Riwayat Jurnal <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Kelas & Mapel</th>
                <th className="py-3 px-4">Materi Pembelajaran</th>
                <th className="py-3 px-4">Guru Pengajar</th>
                <th className="py-3 px-4 text-center">Presensi (H/S/I/A/D)</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentJournals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada jurnal yang diinput. Klik "+ Buat Jurnal Baru" untuk memulai.
                  </td>
                </tr>
              ) : (
                recentJournals.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-900">{j.tanggal}</p>
                      <p className="text-[11px] text-slate-500">
                        {j.hari}, {j.jam_ke}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px] mr-1.5">
                        {j.nama_kelas}
                      </span>
                      <span className="font-medium text-slate-800">{j.nama_mapel}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <p className="font-medium text-slate-900 line-clamp-1">{j.materi}</p>
                      <span className="inline-block text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm mt-0.5">
                        {j.jenis_kbm}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                      {j.nama_guru}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {j.rekap_kehadiran ? (
                        <div className="inline-flex items-center gap-1 text-[11px]">
                          <span className="px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 font-bold">
                            H:{j.rekap_kehadiran.H}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-800">
                            S:{j.rekap_kehadiran.S}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800">
                            I:{j.rekap_kehadiran.I}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-sm bg-red-100 text-red-800">
                            A:{j.rekap_kehadiran.A}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectJournalToView(j.id)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Lihat Laporan Lengkap"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectJournalToView(j.id)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Cetak Laporan"
                        >
                          <Printer className="w-4 h-4" />
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
    </div>
  );
};
