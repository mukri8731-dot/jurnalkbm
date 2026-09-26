import React, { useRef, useState } from 'react';
import { Printer, Download, X, School } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { Journal, School as SchoolType, Teacher, User } from '../types';

interface AttendanceReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodLabel: string;
  filterDescription: string;
  journals: Journal[];
  summary: {
    totalPertemuan: number;
    aggHadir: number;
    aggSakit: number;
    aggIzin: number;
    aggAlpha: number;
    aggDispen: number;
    aggTotal: number;
    persenKehadiran: number;
  };
  user: User | null;
  teacher: Teacher | null;
  school: SchoolType | null;
}

export const AttendanceReportPrintModal: React.FC<AttendanceReportPrintModalProps> = ({
  isOpen,
  onClose,
  periodLabel,
  filterDescription,
  journals,
  summary,
  user,
  teacher,
  school,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const defaultSchool: SchoolType = {
    id: school?.id || 'school-001',
    logo_url:
      school?.logo_url && !school.logo_url.includes('Tut_Wuri')
        ? school.logo_url
        : 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Coat_of_arms_of_East_Java.svg/200px-Coat_of_arms_of_East_Java.svg.png',
    nama_instansi: school?.nama_instansi || 'PEMERINTAH PROVINSI JAWA TIMUR\nDINAS PENDIDIKAN',
    nama_sekolah: school?.nama_sekolah || 'SMK NEGERI 1 CERME GRESIK',
    alamat: school?.alamat || 'Jl. Jurit, Kecamatan Cerme Kabupaten Gresik',
    npsn: school?.npsn || '20500423',
    nss: school?.nss || '301056789012',
    telepon: school?.telepon || '(031) 7992471',
    fax: school?.fax || '(031) 7998485',
    email: school?.email || 'smkn1cermegresik@yahoo.co.id',
    website: school?.website || 'https://smkn1cermegresik.sch.id/',
    nama_kepala_sekolah: school?.nama_kepala_sekolah || 'DARWATI, S.Pd., S.ST., M.Si.',
    nip_kepala_sekolah: school?.nip_kepala_sekolah || '19711206 199702 2 003',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const pageElements = printRef.current.querySelectorAll<HTMLElement>('.pdf-page');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      if (pageElements.length > 0) {
        for (let i = 0; i < pageElements.length; i++) {
          if (i > 0) pdf.addPage();
          const canvas = await html2canvas(pageElements[i], {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }
      } else {
        const element = printRef.current;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      const safePeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
      const safeDate = new Date().toISOString().slice(0, 10);
      pdf.save(`Rekap-KBM_${safePeriod}_${safeDate}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal membuat PDF otomatis. Gunakan tombol CETAK untuk menyimpan sebagai PDF melalui browser.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const todayIndo = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:fixed-none">
      <div className="relative w-full max-w-[850px] bg-white rounded-2xl shadow-2xl flex flex-col my-auto print:shadow-none print:rounded-none print:w-full">
        {/* Floating Top Control Toolbar (Hidden in Print) */}
        <div className="sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 rounded-t-2xl flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-400" />
            <span className="text-xs sm:text-sm font-bold tracking-tight">
              Preview Rekap & Laporan Resmi (Sesuai Format PDF Sekolah)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>🖨 CETAK</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Membuat PDF...' : '📄 DOWNLOAD PDF'}</span>
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

        {/* PRINTABLE OFFICIAL CANVAS */}
        <div ref={printRef} className="bg-white text-black font-sans leading-tight">
          <div
            className="pdf-page bg-white p-10 sm:p-12 min-h-[1122px] w-[794px] mx-auto box-border flex flex-col justify-between print:min-h-[297mm] print:h-[297mm] print:w-full print:p-8 print:break-after-page"
            data-pdf-page="1"
          >
            <div>
              {/* KOP SURAT FORMAL */}
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

              {/* TITLE & METADATA */}
              <div className="text-center mb-4">
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider underline text-black">
                  LAPORAN REKAPITULASI KEGIATAN BELAJAR MENGAJAR (KBM)
                </h3>
                <p className="text-xs text-black mt-1 font-semibold">
                  Periode: {periodLabel}
                </p>
                {filterDescription && (
                  <p className="text-[11px] text-slate-700 mt-0.5">
                    {filterDescription}
                  </p>
                )}
              </div>

              {/* SUMMARY TABLE */}
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase underline mb-1.5 text-black">
                  REKAPITULASI KEHADIRAN & PERTEMUAN:
                </h4>
                <table className="w-full text-xs border-collapse border border-black text-center">
                  <thead>
                    <tr>
                      <th className="border border-black p-1.5 font-normal">Total Sesi</th>
                      <th className="border border-black p-1.5 font-normal">Hadir (H)</th>
                      <th className="border border-black p-1.5 font-normal">Sakit (S)</th>
                      <th className="border border-black p-1.5 font-normal">Izin (I)</th>
                      <th className="border border-black p-1.5 font-normal">Alpha (A)</th>
                      <th className="border border-black p-1.5 font-normal">Dispen (D)</th>
                      <th className="border border-black p-1.5 font-normal">Total Presensi</th>
                      <th className="border border-black p-1.5 font-normal">% Partisipasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-bold text-sm">
                      <td className="border border-black p-1.5">{summary.totalPertemuan}</td>
                      <td className="border border-black p-1.5">{summary.aggHadir}</td>
                      <td className="border border-black p-1.5">{summary.aggSakit}</td>
                      <td className="border border-black p-1.5">{summary.aggIzin}</td>
                      <td className="border border-black p-1.5">{summary.aggAlpha}</td>
                      <td className="border border-black p-1.5">{summary.aggDispen}</td>
                      <td className="border border-black p-1.5">{summary.aggTotal}</td>
                      <td className="border border-black p-1.5">{summary.persenKehadiran}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* DETAIL KBM TABLE */}
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase underline mb-1.5 text-black">
                  RINCIAN SESI KBM TERDATA ({journals.length} PERTEMUAN):
                </h4>
                <table className="w-full text-xs border-collapse border border-black">
                  <thead>
                    <tr>
                      <th className="border border-black p-1 w-8 text-center font-normal">No</th>
                      <th className="border border-black p-1 w-24 text-center font-normal">Tanggal & Jam</th>
                      <th className="border border-black p-1 w-20 text-center font-normal">Kelas</th>
                      <th className="border border-black p-1 w-28 text-center font-normal">Mata Pelajaran</th>
                      <th className="border border-black p-1 w-28 text-center font-normal">Guru Pengajar</th>
                      <th className="border border-black p-1 text-center font-normal">Materi Pembelajaran</th>
                      <th className="border border-black p-1 w-24 text-center font-normal">Presensi (H/S/I/A/D)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-black p-4 text-center text-slate-400 italic">
                          Tidak ada catatan KBM pada filter periode ini.
                        </td>
                      </tr>
                    ) : (
                      journals.map((j, idx) => {
                        const r = j.rekap_kehadiran || { H: 0, S: 0, I: 0, A: 0, D: 0, total: 0 };
                        return (
                          <tr key={j.id || idx}>
                            <td className="border border-black p-1 text-center font-medium">{idx + 1}</td>
                            <td className="border border-black p-1 whitespace-nowrap text-center">
                              <p className="font-semibold text-black">{j.tanggal}</p>
                              <p className="text-[10px] text-slate-600">{j.jam_ke}</p>
                            </td>
                            <td className="border border-black p-1 text-center font-bold text-black">{j.nama_kelas}</td>
                            <td className="border border-black p-1 text-left">{j.nama_mapel}</td>
                            <td className="border border-black p-1 text-left">{j.nama_guru}</td>
                            <td className="border border-black p-1 text-left">
                              <p className="font-medium text-black leading-snug">{j.materi}</p>
                              <span className="text-[9px] text-slate-600">
                                ({j.jenis_kbm})
                              </span>
                            </td>
                            <td className="border border-black p-1 text-center whitespace-nowrap font-mono text-[10px]">
                              {r.H}/{r.S}/{r.I}/{r.A}/{r.D}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SIGNATURE BLOCK */}
            <div className="pt-2 text-xs flex justify-between">
              <div className="w-64 text-left">
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala {defaultSchool.nama_sekolah}</p>
                <div className="h-16 flex items-center">
                  {/* Official Stamp space */}
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
                  Gresik, {todayIndo}
                </p>
                <p className="font-bold">
                  {user?.role === 'guru' && teacher ? 'Guru Pengajar,' : 'Koordinator KBM / Kurikulum,'}
                </p>
                <div className="h-16 flex items-center">
                  {teacher?.tanda_tangan_url ? (
                    <img
                      src={teacher.tanda_tangan_url}
                      alt="Tanda Tangan"
                      className="max-h-14 object-contain"
                    />
                  ) : null}
                </div>
                <p className="font-bold underline text-black">
                  {teacher?.nama || (user?.role === 'admin' ? 'Administrator KBM' : user?.username)}
                </p>
                <p className="text-[11px] text-black">
                  {teacher?.nip ? `NIP. ${teacher.nip}` : 'NIP. -'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
