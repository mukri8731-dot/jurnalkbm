import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Filter,
  Copy,
  Printer,
  Calendar,
  Users,
  CheckCircle,
  GraduationCap,
  BookOpen,
  RotateCcw,
  Check,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { Journal, SchoolClass, Subject, Teacher, User, School as SchoolType } from '../types';
import { AttendanceReportPrintModal } from './AttendanceReportPrintModal';

interface AttendanceReportViewProps {
  user: User | null;
  teacher: Teacher | null;
  onViewJournal: (journalId: string) => void;
}

type PeriodType = 'harian' | 'mingguan' | 'bulanan' | 'semester' | 'tahunan';

export const AttendanceReportView: React.FC<AttendanceReportViewProps> = ({
  user,
  teacher,
  onViewJournal,
}) => {
  const [period, setPeriod] = useState<PeriodType>('bulanan');
  const [journals, setJournals] = useState<Journal[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [school, setSchool] = useState<SchoolType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(user?.role === 'guru' && teacher?.id ? teacher.id : '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedSemester, setSelectedSemester] = useState('Ganjil');
  const [selectedTahun, setSelectedTahun] = useState('2026/2027');

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadData();
  }, [period, selectedClass, selectedSubject, selectedTeacher, selectedDate, selectedMonth, selectedSemester, selectedTahun]);

  const loadOptions = async () => {
    try {
      const [cls, subjs, tchs, sch] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getTeachers(),
        api.getSchool().catch(() => null),
      ]);
      setClasses(cls);
      setSubjects(subjs);
      setTeachers(tchs);
      if (sch) setSchool(sch);
    } catch (e) {
      console.error(e);
    }
  };

  const getPeriodLabel = () => {
    if (period === 'harian') return `Harian (${selectedDate})`;
    if (period === 'mingguan') return `Mingguan (Pekan Tanggal ${selectedDate})`;
    if (period === 'bulanan') {
      const [y, m] = selectedMonth.split('-');
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      const monthName = monthNames[parseInt(m, 10) - 1] || m;
      return `Bulan ${monthName} ${y}`;
    }
    if (period === 'semester') return `Semester ${selectedSemester} Tahun Ajaran ${selectedTahun}`;
    if (period === 'tahunan') return `Tahun Ajaran ${selectedTahun}`;
    return period;
  };

  const getFilterDescription = () => {
    const parts: string[] = [];
    if (selectedClass) {
      const c = classes.find((item) => item.id === selectedClass);
      if (c) parts.push(`Kelas: ${c.nama_kelas}`);
    }
    if (selectedSubject) {
      const s = subjects.find((item) => item.id === selectedSubject);
      if (s) parts.push(`Mata Pelajaran: ${s.nama_mapel}`);
    }
    if (selectedTeacher) {
      const t = teachers.find((item) => item.id === selectedTeacher);
      if (t) parts.push(`Guru: ${t.nama}`);
    }
    return parts.join(' • ');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedClass) filters.class_id = selectedClass;
      if (selectedSubject) filters.subject_id = selectedSubject;
      if (selectedTeacher) filters.teacher_id = selectedTeacher;

      if (period === 'harian') {
        filters.start_date = selectedDate;
        filters.end_date = selectedDate;
      } else if (period === 'mingguan') {
        // Compute Monday and Sunday for selectedDate
        const curr = new Date(selectedDate);
        const day = curr.getDay() || 7;
        const monday = new Date(curr);
        monday.setDate(curr.getDate() - day + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        filters.start_date = monday.toISOString().slice(0, 10);
        filters.end_date = sunday.toISOString().slice(0, 10);
      } else if (period === 'bulanan') {
        const [y, m] = selectedMonth.split('-');
        filters.start_date = `${y}-${m}-01`;
        const lastDay = new Date(Number(y), Number(m), 0).getDate();
        filters.end_date = `${y}-${m}-${lastDay}`;
      } else if (period === 'semester') {
        filters.semester = selectedSemester;
        filters.tahun_ajaran = selectedTahun;
      } else if (period === 'tahunan') {
        filters.tahun_ajaran = selectedTahun;
      }

      const data = await api.getJournals(filters);
      setJournals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Aggregates
  const totalPertemuan = journals.length;
  let aggHadir = 0;
  let aggSakit = 0;
  let aggIzin = 0;
  let aggAlpha = 0;
  let aggDispen = 0;
  let aggTotal = 0;

  journals.forEach((j) => {
    if (j.rekap_kehadiran) {
      aggHadir += j.rekap_kehadiran.H;
      aggSakit += j.rekap_kehadiran.S;
      aggIzin += j.rekap_kehadiran.I;
      aggAlpha += j.rekap_kehadiran.A;
      aggDispen += j.rekap_kehadiran.D;
      aggTotal += j.rekap_kehadiran.total;
    }
  });

  const persenKehadiran = aggTotal > 0 ? Math.round((aggHadir / aggTotal) * 100) : 0;

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const summaryRow = [
      ['REKAP LAPORAN KEGIATAN BELAJAR MENGAJAR (KBM)'],
      ['Periode', period.toUpperCase()],
      ['Total Pertemuan KBM', totalPertemuan],
      ['Total Hadir', aggHadir],
      ['Total Sakit', aggSakit],
      ['Total Izin', aggIzin],
      ['Total Alpha', aggAlpha],
      ['Total Dispensasi', aggDispen],
      ['Total Kehadiran Siswa', aggTotal],
      ['Persentase Kehadiran', `${persenKehadiran}%`],
      [],
      ['No', 'Tanggal', 'Hari/Jam', 'Kelas', 'Mata Pelajaran', 'Guru', 'Materi', 'H', 'S', 'I', 'A', 'D', 'Total'],
    ];

    journals.forEach((j, idx) => {
      const r = j.rekap_kehadiran || { H: 0, S: 0, I: 0, A: 0, D: 0, total: 0 };
      summaryRow.push([
        idx + 1,
        j.tanggal,
        `${j.hari} (${j.jam_ke})`,
        j.nama_kelas || '',
        j.nama_mapel || '',
        j.nama_guru || '',
        j.materi,
        r.H,
        r.S,
        r.I,
        r.A,
        r.D,
        r.total,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(summaryRow);
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap KBM');
    XLSX.writeFile(wb, `Rekap_KBM_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Section 16: Copas Rekap
  const handleCopyRekap = () => {
    let text = `*REKAPITULASI LAPORAN KBM*\n`;
    text += `Periode: ${period.toUpperCase()}\n`;
    text += `Jumlah Pertemuan: ${totalPertemuan}\n`;
    text += `Siswa Hadir: ${aggHadir} (${persenKehadiran}%)\n`;
    text += `Siswa Sakit: ${aggSakit}\n`;
    text += `Siswa Izin: ${aggIzin}\n`;
    text += `Siswa Alpha: ${aggAlpha}\n`;
    text += `Dispensasi: ${aggDispen}\n`;
    text += `Total Presensi: ${aggTotal}\n\n`;
    text += `Rincian Sesi KBM:\n`;

    journals.forEach((j, idx) => {
      const r = j.rekap_kehadiran || { H: 0, S: 0, I: 0, A: 0, D: 0, total: 0 };
      text += `${idx + 1}. [${j.tanggal}] ${j.nama_kelas} - ${j.nama_mapel} (${j.nama_guru})\n`;
      text += `   Materi: ${j.materi}\n`;
      text += `   Presensi: H:${r.H} | S:${r.S} | I:${r.I} | A:${r.A} | D:${r.D}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Rekap Laporan & Presensi KBM</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan agregat rekapitulasi harian, mingguan, bulanan, semester, dan tahunan.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>📄 CETAK PDF</span>
          </button>

          <button
            type="button"
            onClick={handleCopyRekap}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'TERSALIN!' : '📋 COPAS REKAP'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>EXPORT EXCEL</span>
          </button>
        </div>
      </div>

      {/* PERIOD TABS */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
        {(
          [
            { id: 'harian', label: 'Rekap Harian' },
            { id: 'mingguan', label: 'Rekap Mingguan' },
            { id: 'bulanan', label: 'Rekap Bulanan' },
            { id: 'semester', label: 'Rekap Semester' },
            { id: 'tahunan', label: 'Rekap Tahun Ajaran' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPeriod(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              period === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {period === 'harian' && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Pilih Tanggal
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        )}

        {period === 'mingguan' && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Pilih Minggu (Tanggal Acuan)
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        )}

        {period === 'bulanan' && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Pilih Bulan & Tahun
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        )}

        {(period === 'semester' || period === 'tahunan') && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Tahun Ajaran
            </label>
            <input
              type="text"
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        )}

        {period === 'semester' && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
            Filter Kelas
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

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
            Filter Mata Pelajaran
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

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
            Filter Guru
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
      </div>

      {/* SUMMARY AGGREGATE CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Pertemuan KBM</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalPertemuan}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase">Hadir (H)</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{aggHadir}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-blue-600 uppercase">Sakit (S)</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{aggSakit}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-amber-600 uppercase">Izin (I)</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{aggIzin}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-red-600 uppercase">Alpha (A)</p>
          <p className="text-xl font-bold text-red-600 mt-1">{aggAlpha}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-purple-600 uppercase">Dispensasi (D)</p>
          <p className="text-xl font-bold text-purple-600 mt-1">{aggDispen}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">% Partisipasi</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{persenKehadiran}%</p>
        </div>
      </div>

      {/* DETAIL TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Daftar Sesi KBM Terkait ({journals.length} Sesi)
          </h3>
          <span className="text-xs text-slate-500 font-medium">Klik aksi untuk buka laporan resmi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Tanggal & Jam</th>
                <th className="py-2.5 px-4">Kelas</th>
                <th className="py-2.5 px-4">Mata Pelajaran</th>
                <th className="py-2.5 px-4">Guru</th>
                <th className="py-2.5 px-4">Materi</th>
                <th className="py-2.5 px-4 text-center">H</th>
                <th className="py-2.5 px-4 text-center">S</th>
                <th className="py-2.5 px-4 text-center">I</th>
                <th className="py-2.5 px-4 text-center">A</th>
                <th className="py-2.5 px-4 text-center">D</th>
                <th className="py-2.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Memuat data rekap...
                  </td>
                </tr>
              ) : journals.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Tidak ada catatan KBM pada periode ini.
                  </td>
                </tr>
              ) : (
                journals.map((j) => {
                  const r = j.rekap_kehadiran || { H: 0, S: 0, I: 0, A: 0, D: 0, total: 0 };
                  return (
                    <tr key={j.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{j.tanggal}</span>
                        <p className="text-[10px] text-slate-400">{j.jam_ke}</p>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap font-medium text-slate-800">
                        {j.nama_kelas}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap font-medium text-slate-800">
                        {j.nama_mapel}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap text-slate-700">
                        {j.nama_guru}
                      </td>
                      <td className="py-2.5 px-4 max-w-xs truncate">{j.materi}</td>
                      <td className="py-2.5 px-4 text-center text-emerald-700 font-bold">{r.H}</td>
                      <td className="py-2.5 px-4 text-center text-blue-700">{r.S}</td>
                      <td className="py-2.5 px-4 text-center text-amber-700">{r.I}</td>
                      <td className="py-2.5 px-4 text-center text-red-700">{r.A}</td>
                      <td className="py-2.5 px-4 text-center text-purple-700">{r.D}</td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onViewJournal(j.id)}
                          className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-[11px]"
                        >
                          Lihat
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CETAK & UNDUH PDF REKAP KBM */}
      <AttendanceReportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        periodLabel={getPeriodLabel()}
        filterDescription={getFilterDescription()}
        journals={journals}
        summary={{
          totalPertemuan,
          aggHadir,
          aggSakit,
          aggIzin,
          aggAlpha,
          aggDispen,
          aggTotal,
          persenKehadiran,
        }}
        user={user}
        teacher={teacher}
        school={school}
      />
    </div>
  );
};
