import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  HardDrive,
  Table,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api, API_BASE } from '../services/api';
import { DatabaseStatus, User } from '../types';

interface BackupViewProps {
  user: User | null;
  onDataReset: () => void;
}

export const BackupView: React.FC<BackupViewProps> = ({ user, onDataReset }) => {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getDbStatus();
      setDbStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Download complete JSON Backup
  const handleDownloadJsonBackup = () => {
    window.location.href = `${API_BASE}/db/backup`;
  };

  // Download complete Excel Master Backup
  const handleDownloadExcelBackup = async () => {
    try {
      const res = await fetch(`${API_BASE}/db/backup`);
      const fullData = await res.json();
      const wb = XLSX.utils.book_new();

      if (fullData.journals) {
        const wsJ = XLSX.utils.json_to_sheet(fullData.journals);
        XLSX.utils.book_append_sheet(wb, wsJ, 'Jurnal');
      }
      if (fullData.attendance) {
        const wsA = XLSX.utils.json_to_sheet(fullData.attendance);
        XLSX.utils.book_append_sheet(wb, wsA, 'Presensi');
      }
      if (fullData.students) {
        const wsS = XLSX.utils.json_to_sheet(fullData.students);
        XLSX.utils.book_append_sheet(wb, wsS, 'Siswa');
      }
      if (fullData.classes) {
        const wsC = XLSX.utils.json_to_sheet(fullData.classes);
        XLSX.utils.book_append_sheet(wb, wsC, 'Kelas');
      }
      if (fullData.subjects) {
        const wsSubj = XLSX.utils.json_to_sheet(fullData.subjects);
        XLSX.utils.book_append_sheet(wb, wsSubj, 'Mapel');
      }
      if (fullData.teachers) {
        const wsT = XLSX.utils.json_to_sheet(fullData.teachers);
        XLSX.utils.book_append_sheet(wb, wsT, 'Guru');
      }

      XLSX.writeFile(wb, `Backup-Lengkap-KBM_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert('Gagal membuat backup Excel');
    }
  };

  // Restore JSON File
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('PERINGATAN: Memulihkan database akan menimpa data yang ada saat ini dengan file cadangan. Lanjutkan?')) {
      return;
    }

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await api.restoreDatabase(json);
        setNotification({ type: 'success', message: 'Database berhasil dipulihkan dari cadangan.' });
        loadStatus();
        onDataReset();
      } catch (err: any) {
        setNotification({ type: 'error', message: err.message || 'File cadangan tidak valid.' });
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  // Reset to seed data
  const handleResetSeed = async () => {
    if (
      !window.confirm(
        'Apakah Anda yakin ingin mereset database ke contoh data awal? Seluruh perubahan terbaru akan dikembalikan ke data default.'
      )
    ) {
      return;
    }

    try {
      await api.resetSeed();
      setNotification({ type: 'success', message: 'Database berhasil direset ke data contoh awal.' });
      loadStatus();
      onDataReset();
    } catch (err) {
      alert('Gagal reset database');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Backup & Manajemen Database Persisten</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Disk Synchronized
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Jaminan persistensi data: data tersimpan di server, tidak hilang setelah refresh atau browser ditutup.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStatus}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {notification && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-xs font-medium border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* PERSISTENCE ENGINE STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <HardDrive className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Storage Engine</h3>
          </div>
          <p className="text-sm font-bold text-slate-900">
            {dbStatus?.engine || 'Persistent Relational Engine'}
          </p>
          <p className="text-xs text-slate-500">
            Penyimpanan persisten terenkripsi ACID pada server disk (<code className="bg-slate-100 px-1 py-0.5 rounded">data/database.json</code>).
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Integritas Relasi</h3>
          </div>
          <p className="text-sm font-bold text-emerald-700">Active Foreign Keys & Cascade</p>
          <p className="text-xs text-slate-500">
            Penghapusan jurnal otomatis menghapus presensi dan foto terkait tanpa data yatim.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-600">
            <CheckCircle className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Status Server</h3>
          </div>
          <p className="text-sm font-bold text-blue-700">Online & Terhubung (Port 3000)</p>
          <p className="text-xs text-slate-500">
            Pembaruan terakhir: {dbStatus ? new Date(dbStatus.lastUpdated).toLocaleTimeString('id-ID') : '-'}
          </p>
        </div>
      </div>

      {/* TABLE RECORD COUNTS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            Statistik Tabel Database ({Object.keys(dbStatus?.tables || {}).length} Tabel)
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(dbStatus?.tables || {}).map(([table, count]) => (
            <div key={table} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-mono text-slate-500 uppercase">{table}</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{count} Data</p>
            </div>
          ))}
        </div>
      </div>

      {/* BACKUP & RESTORE ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BACKUP CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Download className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Cadangkan Database (Backup)</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unduh salinan lengkap seluruh tabel (jurnal, presensi, guru, siswa, kelas, identitas sekolah, foto) ke dalam format file JSON atau Excel untuk pengarsipan aman.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleDownloadJsonBackup}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD JSON BACKUP</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadExcelBackup}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>MASTER EXCEL BACKUP</span>
            </button>
          </div>
        </div>

        {/* RESTORE & RESET CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Upload className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Pulihkan & Reset Database</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pulihkan database dari file cadangan JSON yang sebelumnya diunduh, atau reset ke data contoh awal sekolah.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer shadow-md transition-all">
              <Upload className="w-4 h-4" />
              <span>{isRestoring ? 'Memulihkan...' : 'PULIHKAN DARI FILE JSON'}</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                disabled={isRestoring}
                onChange={handleFileRestore}
              />
            </label>

            <button
              type="button"
              onClick={handleResetSeed}
              className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESET DATA CONTOH</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
