import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  Copy,
  Share2,
  X,
  FileSpreadsheet,
  Check,
  School,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import * as XLSX from 'xlsx';
import { Journal, School as SchoolType } from '../types';

interface JournalPrintModalProps {
  journal: Journal | null;
  onClose: () => void;
}

export const JournalPrintModal: React.FC<JournalPrintModalProps> = ({ journal, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!journal) return null;

  const defaultSchool: SchoolType = {
    id: journal.school?.id || 'school-001',
    logo_url:
      journal.school?.logo_url && !journal.school.logo_url.includes('Tut_Wuri')
        ? journal.school.logo_url
        : 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Coat_of_arms_of_East_Java.svg/200px-Coat_of_arms_of_East_Java.svg.png',
    nama_instansi: journal.school?.nama_instansi || 'PEMERINTAH PROVINSI JAWA TIMUR\nDINAS PENDIDIKAN',
    nama_sekolah: journal.school?.nama_sekolah || 'SMK NEGERI 1 CERME GRESIK',
    alamat: journal.school?.alamat || 'Jl. Jurit, Kecamatan Cerme Kabupaten Gresik',
    npsn: journal.school?.npsn || '20500423',
    nss: journal.school?.nss || '301056789012',
    telepon: journal.school?.telepon || '(031) 7992471',
    fax: journal.school?.fax || '(031) 7998485',
    email: journal.school?.email || 'smkn1cermegresik@yahoo.co.id',
    website: journal.school?.website || 'https://smkn1cermegresik.sch.id/',
    nama_kepala_sekolah: journal.school?.nama_kepala_sekolah || 'DARWATI, S.Pd., S.ST., M.Si.',
    nip_kepala_sekolah: journal.school?.nip_kepala_sekolah || '19711206 199702 2 003',
  };

  const rekap = journal.rekap_kehadiran || {
    H: 0,
    S: 0,
    I: 0,
    A: 0,
    D: 0,
    total: 0,
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formattedDate = formatDateIndo(journal.tanggal);

  const getCity = () => {
    const addr = (defaultSchool.alamat || '').toLowerCase();
    if (addr.includes('cerme') || addr.includes('gresik')) return 'Gresik';
    if (addr.includes('surabaya')) return 'Surabaya';
    return 'Gresik';
  };

  const formatStatus = (st: string) => {
    switch (st) {
      case 'H':
        return 'Hadir';
      case 'S':
        return 'Sakit';
      case 'I':
        return 'Izin';
      case 'A':
        return 'Alpa';
      case 'D':
        return 'Dispensasi';
      default:
        return st || 'Hadir';
    }
  };

  const attendanceList = journal.attendance || [];
  // Page 3 contains up to 34 students, Page 4 continues with 35+
  const firstPageAttendance = attendanceList.slice(0, 34);
  const secondPageAttendance = attendanceList.slice(34);

  const handlePrint = () => {
    window.print();
  };

  // High fidelity multi-page A4 PDF generation matching the exact uploaded PDF format
  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const pageElements = printRef.current.querySelectorAll<HTMLElement>('.pdf-page');
      if (pageElements.length === 0) return;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pageElements.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const canvas = await html2canvas(pageElements[i], {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      const safeTeacher = (journal.nama_guru || 'Guru').replace(/[^a-zA-Z0-9]/g, '');
      const safeClass = (journal.nama_kelas || 'Kelas').replace(/[^a-zA-Z0-9]/g, '');
      const fileName = `Laporan-KBM_${safeTeacher}_${formattedDate.replace(/\//g, '-')}_${safeClass}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal membuat PDF otomatis. Gunakan tombol CETAK untuk simpan sebagai PDF dari browser.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const journalData = [
      ['LAPORAN KEGIATAN BELAJAR MENGAJAR (KBM)'],
      ['Sekolah', defaultSchool.nama_sekolah],
      ['NPSN', defaultSchool.npsn],
      ['Tanggal', formattedDate],
      ['Hari / Jam', `${journal.hari} / ${journal.jam_ke}`],
      ['Kelas', journal.nama_kelas],
      ['Mata Pelajaran', journal.nama_mapel],
      ['Guru Pengajar', journal.nama_guru],
      ['NIP Guru', journal.nip_guru || '-'],
      ['Jenis KBM', journal.jenis_kbm],
      ['Materi Pembelajaran', journal.materi],
      ['Catatan / Kejadian', journal.catatan || '-'],
      [],
      ['REKAPITULASI KEHADIRAN SISWA'],
      ['Hadir (H)', rekap.H],
      ['Sakit (S)', rekap.S],
      ['Izin (I)', rekap.I],
      ['Alpha (A)', rekap.A],
      ['Dispen (D)', rekap.D],
      ['Total Siswa', rekap.total],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(journalData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Jurnal KBM');

    if (attendanceList.length > 0) {
      const attData = [
        ['No', 'NIS', 'Nama Siswa', 'Status', 'Keterangan'],
        ...attendanceList.map((a, idx) => [
          idx + 1,
          a.nis || '-',
          a.nama_siswa || '-',
          formatStatus(a.status),
          a.keterangan || '-',
        ]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(attData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Daftar Presensi');
    }

    const safeTeacher = (journal.nama_guru || 'Guru').replace(/[^a-zA-Z0-9]/g, '');
    const safeClass = (journal.nama_kelas || 'Kelas').replace(/[^a-zA-Z0-9]/g, '');
    XLSX.writeFile(wb, `Laporan-KBM_${safeTeacher}_${formattedDate.replace(/\//g, '-')}_${safeClass}.xlsx`);
  };

  const handleCopyText = () => {
    const text = `*LAPORAN KEGIATAN BELAJAR MENGAJAR (KBM)*
*${defaultSchool.nama_sekolah}*

Tanggal KBM : ${formattedDate}
Mata Pelajaran : ${journal.nama_mapel}
Hari / Jam Ke : ${journal.hari} / ${journal.jam_ke}
Jenis KBM : ${journal.jenis_kbm}
Kelas : ${journal.nama_kelas}
Guru Pengajar : ${journal.nama_guru}
Materi Pembelajaran : ${journal.materi}
Catatan / Kejadian : ${journal.catatan || 'tidak ad'}

*REKAPITULASI KEHADIRAN SISWA:*
Hadir: ${rekap.H} | Sakit: ${rekap.S} | Izin: ${rekap.I} | Alpha: ${rekap.A} | Dispen: ${rekap.D} | Total: ${rekap.total}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:fixed-none">
      <div className="relative w-full max-w-[850px] bg-white rounded-2xl shadow-2xl flex flex-col my-auto print:shadow-none print:rounded-none print:w-full">
        {/* Floating Top Control Toolbar (Hidden in Print) */}
        <div className="sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 rounded-t-2xl flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-400" />
            <span className="text-xs sm:text-sm font-bold tracking-tight">
              Preview Laporan KBM Resmi (Sesuai Format PDF Sekolah)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>🖨 CETAK</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Membuat PDF...' : '📄 DOWNLOAD PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>📊 EXCEL</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'TERSALIN!' : '📋 COPAS'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CANVAS CONTAINER */}
        <div ref={printRef} className="bg-white text-black font-sans leading-tight">
          {/* ========================================================= */}
          {/* PAGE 1: KOP SURAT, DETAIL KBM, REKAP KEHADIRAN, DOKUMENTASI UTAMA, TTD */}
          {/* ========================================================= */}
          <div
            className="pdf-page bg-white p-10 sm:p-12 min-h-[1122px] w-[794px] mx-auto box-border flex flex-col justify-between print:min-h-[297mm] print:h-[297mm] print:w-full print:p-8 print:break-after-page"
            data-pdf-page="1"
          >
            <div>
              {/* KOP SURAT */}
              <div className="border-b-[3px] border-black pb-2.5 mb-5 relative">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-20 h-24 shrink-0 flex items-center justify-center">
                    <img
                      src={defaultSchool.logo_url}
                      alt="Logo Sekolah"
                      className="max-h-24 max-w-20 object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="flex-1 text-center font-sans">
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-black whitespace-pre-line leading-tight">
                      {defaultSchool.nama_instansi}
                    </p>
                    <h2 className="text-base sm:text-xl font-bold uppercase tracking-tight text-black my-0.5">
                      {defaultSchool.nama_sekolah}
                    </h2>
                    <p className="text-[11px] text-black leading-snug">
                      {defaultSchool.alamat}
                    </p>
                    <p className="text-[10px] text-black mt-0.5">
                      NPSN : {defaultSchool.npsn} | NSS : {defaultSchool.nss}
                    </p>
                    <p className="text-[10px] text-black">
                      Telp. {defaultSchool.telepon} | Fax. {defaultSchool.fax} | E-mail : {defaultSchool.email}
                    </p>
                    <p className="text-[10px] text-black">
                      Website : {defaultSchool.website}
                    </p>
                  </div>

                  <div className="w-20 h-24 shrink-0 hidden sm:block"></div>
                </div>
              </div>

              {/* REPORT TITLE */}
              <div className="text-center mb-4">
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider underline text-black">
                  LAPORAN KEGIATAN BELAJAR MENGAJAR (KBM)
                </h3>
              </div>

              {/* MAIN KBM TABLE */}
              <table className="w-full text-xs border-collapse border border-black mb-4">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 w-1/2 align-top">
                      <span className="font-bold">Tanggal KBM</span> : {formattedDate}
                    </td>
                    <td className="border border-black p-2 w-1/2 align-top">
                      <span className="font-bold">Mata Pelajaran</span> : {journal.nama_mapel}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 align-top">
                      <span className="font-bold">Hari / Jam Ke</span> : {journal.hari} / {journal.jam_ke}
                    </td>
                    <td className="border border-black p-2 align-top">
                      <span className="font-bold">Jenis KBM</span> : {journal.jenis_kbm}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 align-top">
                      <span className="font-bold">Kelas</span> : {journal.nama_kelas}
                    </td>
                    <td className="border border-black p-2 align-top">
                      <span className="font-bold">Guru Pengajar</span> : {journal.nama_guru}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 align-top">
                      <p className="font-bold mb-0.5">Materi Pembelajaran :</p>
                      <p className="whitespace-pre-line">{journal.materi}</p>
                    </td>
                    <td className="border border-black p-2 align-top">
                      <p className="font-bold mb-0.5">Catatan / Kejadian :</p>
                      <p className="whitespace-pre-line">{journal.catatan || 'tidak ad'}</p>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* REKAPITULASI KEHADIRAN SISWA */}
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase underline mb-1.5 text-black">
                  REKAPITULASI KEHADIRAN SISWA:
                </h4>
                <table className="w-full text-xs border-collapse border border-black text-center">
                  <thead>
                    <tr>
                      <th className="border border-black p-1.5 font-normal">Hadir (H)</th>
                      <th className="border border-black p-1.5 font-normal">Sakit (S)</th>
                      <th className="border border-black p-1.5 font-normal">Izin (I)</th>
                      <th className="border border-black p-1.5 font-normal">Alpha (A)</th>
                      <th className="border border-black p-1.5 font-normal">Dispen (D)</th>
                      <th className="border border-black p-1.5 font-normal">Total Siswa</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-bold text-sm">
                      <td className="border border-black p-1.5">{rekap.H}</td>
                      <td className="border border-black p-1.5">{rekap.S}</td>
                      <td className="border border-black p-1.5">{rekap.I}</td>
                      <td className="border border-black p-1.5">{rekap.A}</td>
                      <td className="border border-black p-1.5">{rekap.D}</td>
                      <td className="border border-black p-1.5">{rekap.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* DOKUMENTASI KEGIATAN KBM */}
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase underline mb-2 text-black">
                  DOKUMENTASI KEGIATAN KBM:
                </h4>
                <div className="w-full flex justify-center">
                  {journal.foto_utama_url ? (
                    <img
                      src={journal.foto_utama_url}
                      alt="Dokumentasi Utama"
                      className="max-h-56 max-w-md w-auto object-cover rounded-xs border border-slate-200"
                    />
                  ) : (
                    <div className="h-44 w-80 border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                      [Foto Dokumentasi Kegiatan KBM]
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SIGNATURE BLOCK */}
            <div className="pt-2 text-xs flex justify-between">
              <div className="w-64 text-left">
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala {defaultSchool.nama_sekolah}</p>
                <div className="h-16 flex items-center">
                  {/* Stamp/Signature space */}
                </div>
                <p className="font-bold underline text-black">
                  {defaultSchool.nama_kepala_sekolah}
                </p>
                <p className="text-[11px] text-black">
                  NIP. {defaultSchool.nip_kepala_sekolah}
                </p>
              </div>

              <div className="w-64 text-left">
                <p>
                  {getCity()}, {formattedDate}
                </p>
                <p className="font-bold">Guru Mata Pelajaran</p>
                <div className="h-16 flex items-center">
                  {journal.tanda_tangan_guru ? (
                    <img
                      src={journal.tanda_tangan_guru}
                      alt="Tanda Tangan"
                      className="max-h-14 object-contain"
                    />
                  ) : null}
                </div>
                <p className="font-bold underline text-black">
                  {journal.nama_guru}
                </p>
                <p className="text-[11px] text-black">
                  NIP. {journal.nip_guru || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PAGE 2: LAMPIRAN FOTO DOKUMENTASI KBM TAMBAHAN */}
          {/* ========================================================= */}
          <div
            className="pdf-page bg-white p-10 sm:p-12 min-h-[1122px] w-[794px] mx-auto box-border flex flex-col justify-start print:min-h-[297mm] print:h-[297mm] print:w-full print:p-8 print:break-after-page"
            data-pdf-page="2"
          >
            <div className="text-center mb-8">
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider underline text-black">
                LAMPIRAN FOTO DOKUMENTASI KBM TAMBAHAN
              </h3>
            </div>

            {/* 2-Column Framed Grid Container */}
            <div className="border border-slate-300 p-4 rounded-xs min-h-[200px]">
              <div className="grid grid-cols-2 gap-6 text-center">
                {journal.photos && journal.photos.length > 0 ? (
                  journal.photos.map((photo, idx) => (
                    <div key={photo.id || idx} className="flex flex-col items-center">
                      <img
                        src={photo.photo_url}
                        alt={photo.caption}
                        className="h-44 w-full object-cover rounded-xs border border-slate-200 mb-2"
                      />
                      <p className="text-xs text-black font-normal">
                        {photo.caption || `Dokumentasi Foto KBM Tambahan ${idx + 2}`}
                      </p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex flex-col items-center">
                      <div className="h-44 w-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400 mb-2">
                        [Foto Tambahan 2]
                      </div>
                      <p className="text-xs text-black font-normal">Dokumentasi Foto KBM Tambahan 2</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-44 w-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400 mb-2">
                        [Foto Tambahan 3]
                      </div>
                      <p className="text-xs text-black font-normal">Dokumentasi Foto KBM Tambahan 3</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PAGE 3: LAMPIRAN DAFTAR KEHADIRAN SISWA (Baris 1 - 34) */}
          {/* ========================================================= */}
          <div
            className="pdf-page bg-white p-10 sm:p-12 min-h-[1122px] w-[794px] mx-auto box-border flex flex-col justify-start print:min-h-[297mm] print:h-[297mm] print:w-full print:p-8 print:break-after-page"
            data-pdf-page="3"
          >
            <div className="text-center mb-1">
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider underline text-black">
                LAMPIRAN DAFTAR KEHADIRAN SISWA
              </h3>
            </div>
            <div className="text-center mb-4">
              <p className="text-xs font-bold text-black">
                Kelas: {journal.nama_kelas} | Mapel: {journal.nama_mapel} | Tanggal: {formattedDate}
              </p>
            </div>

            <table className="w-full text-xs border-collapse border border-black">
              <thead>
                <tr>
                  <th className="border border-black p-1 w-10 text-center font-normal">No</th>
                  <th className="border border-black p-1 w-24 text-center font-normal">NIS</th>
                  <th className="border border-black p-1 text-center font-normal">Nama Siswa</th>
                  <th className="border border-black p-1 w-28 text-center font-normal">Status</th>
                  <th className="border border-black p-1 w-24 text-center font-normal">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {firstPageAttendance.length > 0 ? (
                  firstPageAttendance.map((att, idx) => (
                    <tr key={att.student_id || idx}>
                      <td className="border border-black p-1 text-center">{idx + 1}</td>
                      <td className="border border-black p-1 text-center font-mono">{att.nis || '-'}</td>
                      <td className="border border-black p-1 pl-3 text-left uppercase">{att.nama_siswa}</td>
                      <td className="border border-black p-1 text-center font-bold">
                        {formatStatus(att.status)}
                      </td>
                      <td className="border border-black p-1 text-center">
                        {att.keterangan || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="border border-black p-4 text-center text-slate-400">
                      Tidak ada data siswa
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* PAGE 4: LANJUTAN DAFTAR KEHADIRAN SISWA (Baris 35 dst.) */}
          {/* ========================================================= */}
          {secondPageAttendance.length > 0 && (
            <div
              className="pdf-page bg-white p-10 sm:p-12 min-h-[1122px] w-[794px] mx-auto box-border flex flex-col justify-start print:min-h-[297mm] print:h-[297mm] print:w-full print:p-8 print:break-after-page"
              data-pdf-page="4"
            >
              <table className="w-full text-xs border-collapse border border-black mt-2">
                <thead>
                  <tr>
                    <th className="border border-black p-1 w-10 text-center font-normal">No</th>
                    <th className="border border-black p-1 w-24 text-center font-normal">NIS</th>
                    <th className="border border-black p-1 text-center font-normal">Nama Siswa</th>
                    <th className="border border-black p-1 w-28 text-center font-normal">Status</th>
                    <th className="border border-black p-1 w-24 text-center font-normal">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {secondPageAttendance.map((att, idx) => (
                    <tr key={att.student_id || idx}>
                      <td className="border border-black p-1 text-center">{idx + 35}</td>
                      <td className="border border-black p-1 text-center font-mono">{att.nis || '-'}</td>
                      <td className="border border-black p-1 pl-3 text-left uppercase">{att.nama_siswa}</td>
                      <td className="border border-black p-1 text-center font-bold">
                        {formatStatus(att.status)}
                      </td>
                      <td className="border border-black p-1 text-center">
                        {att.keterangan || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
