import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  FileCheck,
  RotateCcw,
  X,
  Upload,
  Camera,
  Trash2,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../services/api';
import {
  User,
  Teacher,
  SchoolClass,
  Subject,
  Student,
  Journal,
  AttendanceDetail,
  JournalPhoto,
} from '../types';

interface JournalFormViewProps {
  user: User | null;
  teacher: Teacher | null;
  editJournalId?: string | null;
  onSuccess: (savedJournalId: string) => void;
  onCancel: () => void;
}

export const JournalFormView: React.FC<JournalFormViewProps> = ({
  user,
  teacher,
  editJournalId,
  onSuccess,
  onCancel,
}) => {
  // Master lists
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form states
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [hari, setHari] = useState(() => getIndonesianDayName(new Date().toISOString().slice(0, 10)));
  const [jamKe, setJamKe] = useState('Jam ke 1-2');
  const [jamMulai, setJamMulai] = useState('07:00');
  const [jamSelesai, setJamSelesai] = useState('08:30');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState(teacher?.id || '');
  const [jenisKbm, setJenisKbm] = useState('Tatap Muka');
  const [materi, setMateri] = useState('');
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState('');
  const [kegiatanPembelajaran, setKegiatanPembelajaran] = useState('');
  const [catatan, setCatatan] = useState('');
  const [refleksi, setRefleksi] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState('');
  const [semester, setSemester] = useState('Ganjil');
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027');

  // Photos
  const [fotoUtamaUrl, setFotoUtamaUrl] = useState('');
  const [photosTambahan, setPhotosTambahan] = useState<{ photo_url: string; caption: string }[]>([
    { photo_url: '', caption: 'Dokumentasi Foto KBM Tambahan 1' },
    { photo_url: '', caption: 'Dokumentasi Foto KBM Tambahan 2' },
  ]);

  // Attendance
  const [attendanceList, setAttendanceList] = useState<AttendanceDetail[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Status & Autosave
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Day Name Helper
  function getIndonesianDayName(dateStr: string): string {
    if (!dateStr) return 'Senin';
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Senin' : days[d.getDay()];
  }

  // Load classes, subjects, teachers
  useEffect(() => {
    async function init() {
      setLoadingInitial(true);
      try {
        const [cls, subjs, tchs] = await Promise.all([
          api.getClasses(),
          api.getSubjects(),
          api.getTeachers(),
        ]);
        setClasses(cls);
        setSubjects(subjs);
        setTeachersList(tchs);

        if (!editJournalId) {
          if (cls.length > 0) setClassId(cls[0].id);
          if (subjs.length > 0) setSubjectId(subjs[0].id);
          if (teacher?.id) setTeacherId(teacher.id);
          else if (tchs.length > 0) setTeacherId(tchs[0].id);
        } else {
          // Editing existing journal
          await loadExistingJournal(editJournalId);
        }
      } catch (err) {
        console.error('Error loading form initial data:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    init();
  }, [editJournalId]);

  // Load existing journal for edit
  const loadExistingJournal = async (id: string) => {
    try {
      const j = await api.getJournalById(id);
      setTanggal(j.tanggal);
      setHari(j.hari || getIndonesianDayName(j.tanggal));
      setJamKe(j.jam_ke);
      setJamMulai(j.jam_mulai);
      setJamSelesai(j.jam_selesai);
      setClassId(j.class_id);
      setSubjectId(j.subject_id);
      setTeacherId(j.teacher_id);
      setJenisKbm(j.jenis_kbm);
      setMateri(j.materi);
      setTujuanPembelajaran(j.tujuan_pembelajaran || '');
      setKegiatanPembelajaran(j.kegiatan_pembelajaran || '');
      setCatatan(j.catatan || '');
      setRefleksi(j.refleksi || '');
      setTindakLanjut(j.tindak_lanjut || '');
      setSemester(j.semester);
      setTahunAjaran(j.tahun_ajaran);
      setFotoUtamaUrl(j.foto_utama_url || '');

      if (j.attendance && j.attendance.length > 0) {
        setAttendanceList(j.attendance);
      }

      if (j.photos && j.photos.length > 0) {
        setPhotosTambahan(
          j.photos.map((p, idx) => ({
            photo_url: p.photo_url,
            caption: p.caption || `Dokumentasi Foto KBM Tambahan ${idx + 1}`,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading journal to edit:', err);
    }
  };

  // When classId changes (and not editing with existing attendance), load students
  useEffect(() => {
    if (!classId) return;
    if (editJournalId && attendanceList.length > 0) return; // Keep existing attendance if editing

    async function loadStudentsForClass() {
      setLoadingStudents(true);
      try {
        const students = await api.getStudents(classId);
        const mapped: AttendanceDetail[] = students
          .filter((s) => s.status_aktif)
          .map((s) => ({
            student_id: s.id,
            nama_siswa: s.nama_siswa,
            nis: s.nis,
            nisn: s.nisn,
            jenis_kelamin: s.jenis_kelamin,
            status: 'H',
            keterangan: '',
          }));
        setAttendanceList(mapped);
      } catch (err) {
        console.error('Error loading students:', err);
      } finally {
        setLoadingStudents(false);
      }
    }
    loadStudentsForClass();
  }, [classId]);

  // When date changes, update Indonesian Day automatically
  const handleDateChange = (val: string) => {
    setTanggal(val);
    setHari(getIndonesianDayName(val));
  };

  // Attendance handlers
  const handleStatusChange = (studentId: string, status: 'H' | 'S' | 'I' | 'A' | 'D') => {
    setAttendanceList((prev) =>
      prev.map((item) => (item.student_id === studentId ? { ...item, status } : item))
    );
  };

  const handleKeteranganChange = (studentId: string, keterangan: string) => {
    setAttendanceList((prev) =>
      prev.map((item) => (item.student_id === studentId ? { ...item, keterangan } : item))
    );
  };

  const handleHadirkanSemua = () => {
    setAttendanceList((prev) =>
      prev.map((item) => ({
        ...item,
        status: 'H',
        keterangan: '',
      }))
    );
  };

  // Image compression & upload handler
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress using canvas (max 1000px width/height)
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1000;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          // Upload to persistent server disk
          api
            .uploadImage(compressedBase64)
            .then((res) => {
              onComplete(res.url);
              setNotification({ type: 'success', message: 'Foto berhasil diunggah ke server persisten.' });
            })
            .catch(() => {
              // Fallback to base64 if upload fails
              onComplete(compressedBase64);
            });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Photo tambahan controls
  const handleAddPhotoField = () => {
    if (photosTambahan.length >= 5) return;
    setPhotosTambahan((prev) => [
      ...prev,
      { photo_url: '', caption: `Dokumentasi Foto KBM Tambahan ${prev.length + 1}` },
    ]);
  };

  const handleRemovePhotoField = (idx: number) => {
    setPhotosTambahan((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePhotoTambahanCaption = (idx: number, caption: string) => {
    setPhotosTambahan((prev) => {
      const copy = [...prev];
      copy[idx].caption = caption;
      return copy;
    });
  };

  const handlePhotoTambahanUrl = (idx: number, url: string) => {
    setPhotosTambahan((prev) => {
      const copy = [...prev];
      copy[idx].photo_url = url;
      return copy;
    });
  };

  // Real-time Attendance Counters
  const rekapHadir = attendanceList.filter((a) => a.status === 'H').length;
  const rekapSakit = attendanceList.filter((a) => a.status === 'S').length;
  const rekapIzin = attendanceList.filter((a) => a.status === 'I').length;
  const rekapAlpha = attendanceList.filter((a) => a.status === 'A').length;
  const rekapDispen = attendanceList.filter((a) => a.status === 'D').length;
  const totalSiswa = attendanceList.length;

  // Save / Draft Action
  const handleSave = async (statusToSave: 'terkirim' | 'draft' = 'terkirim') => {
    // Validation
    if (!tanggal) {
      setNotification({ type: 'error', message: 'Tanggal KBM wajib diisi.' });
      return;
    }
    if (!classId) {
      setNotification({ type: 'error', message: 'Kelas wajib dipilih.' });
      return;
    }
    if (!subjectId) {
      setNotification({ type: 'error', message: 'Mata pelajaran wajib dipilih.' });
      return;
    }
    if (!materi.trim()) {
      setNotification({ type: 'error', message: 'Materi Pembelajaran wajib diisi.' });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    const payload = {
      id: editJournalId || undefined,
      teacher_id: teacherId || teacher?.id,
      class_id: classId,
      subject_id: subjectId,
      tanggal,
      hari,
      jam_ke: jamKe,
      jam_mulai: jamMulai,
      jam_selesai: jamSelesai,
      jenis_kbm: jenisKbm,
      materi,
      tujuan_pembelajaran: tujuanPembelajaran,
      kegiatan_pembelajaran: kegiatanPembelajaran,
      catatan,
      refleksi,
      tindak_lanjut: tindakLanjut,
      semester,
      tahun_ajaran: tahunAjaran,
      status: statusToSave,
      foto_utama_url: fotoUtamaUrl,
      attendance: attendanceList.map((a) => ({
        student_id: a.student_id,
        status: a.status,
        keterangan: a.keterangan,
      })),
      photos: photosTambahan.filter((p) => p.photo_url.trim().length > 0),
    };

    try {
      const res = await api.saveJournal(payload);
      setNotification({
        type: 'success',
        message: statusToSave === 'draft' ? 'Draft Jurnal KBM berhasil disimpan.' : 'Jurnal KBM berhasil disimpan ke database.',
      });
      setTimeout(() => {
        onSuccess(res.journal_id || editJournalId || '');
      }, 1000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal menyimpan jurnal ke database.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Autosave Draft interval (every 30 seconds if form has materi)
  useEffect(() => {
    if (!materi || isSubmitting) return;

    autoSaveTimerRef.current = setTimeout(() => {
      // Background draft save
      const draftPayload = {
        id: editJournalId || undefined,
        teacher_id: teacherId || teacher?.id,
        class_id: classId,
        subject_id: subjectId,
        tanggal,
        hari,
        jam_ke: jamKe,
        jam_mulai: jamMulai,
        jam_selesai: jamSelesai,
        jenis_kbm: jenisKbm,
        materi,
        tujuan_pembelajaran: tujuanPembelajaran,
        kegiatan_pembelajaran: kegiatanPembelajaran,
        catatan,
        refleksi,
        tindak_lanjut: tindakLanjut,
        semester,
        tahun_ajaran: tahunAjaran,
        status: 'draft',
        foto_utama_url: fotoUtamaUrl,
        attendance: attendanceList.map((a) => ({
          student_id: a.student_id,
          status: a.status,
          keterangan: a.keterangan,
        })),
        photos: photosTambahan.filter((p) => p.photo_url.trim().length > 0),
      };

      api.saveJournal(draftPayload).then(() => {
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastAutoSaved(`Draft tersimpan otomatis pukul ${timeStr}`);
      }).catch(() => {
        // silent autosave failure
      });
    }, 25000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [
    materi,
    tanggal,
    classId,
    subjectId,
    teacherId,
    jamKe,
    jenisKbm,
    tujuanPembelajaran,
    kegiatanPembelajaran,
    catatan,
    refleksi,
    tindakLanjut,
    attendanceList,
    fotoUtamaUrl,
    photosTambahan,
  ]);

  if (loadingInitial) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500 font-medium">Memuat data formulir KBM...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Title & Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {editJournalId ? 'Edit Jurnal Laporan KBM' : 'Input Jurnal Laporan KBM'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Format Standar Dinas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Lengkapi data kegiatan belajar mengajar, materi, presensi siswa, dan dokumentasi foto.
          </p>
        </div>

        {lastAutoSaved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium animate-fade-in self-start sm:self-auto">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lastAutoSaved}</span>
          </div>
        )}
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
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FORM SECTION 1: IDENTITAS PERTEMUAN KBM */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              1. Identitas & Jadwal Pertemuan KBM
            </h3>
          </div>
          <span className="text-xs text-slate-500">Wajib Diisi</span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Tanggal KBM */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tanggal KBM <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Hari (Otomatis) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Hari <span className="text-indigo-600 text-[10px] font-normal">(Otomatis dari Tanggal)</span>
            </label>
            <input
              type="text"
              value={hari}
              readOnly
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 cursor-not-allowed"
            />
          </div>

          {/* Jam Pelajaran Ke */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Jam Ke
            </label>
            <select
              value={jamKe}
              onChange={(e) => setJamKe(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="Jam ke 1-2">Jam ke 1-2</option>
              <option value="Jam ke 3-4">Jam ke 3-4</option>
              <option value="Jam ke 5-6">Jam ke 5-6</option>
              <option value="Jam ke 7-8">Jam ke 7-8</option>
              <option value="Jam ke 1-3">Jam ke 1-3</option>
              <option value="Jam ke 4-6">Jam ke 4-6</option>
              <option value="Tambahan / Ekstrakurikuler">Tambahan / Remedial</option>
            </select>
          </div>

          {/* Jam Mulai & Jam Selesai */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Jam Mulai
              </label>
              <input
                type="time"
                value={jamMulai}
                onChange={(e) => setJamMulai(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Jam Selesai
              </label>
              <input
                type="time"
                value={jamSelesai}
                onChange={(e) => setJamSelesai(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Kelas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Kelas <span className="text-red-500">*</span>
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
              required
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama_kelas} ({c.jurusan} - Tingkat {c.tingkat})
                </option>
              ))}
            </select>
          </div>

          {/* Mata Pelajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mata Pelajaran <span className="text-red-500">*</span>
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
              required
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama_mapel} ({s.kode})
                </option>
              ))}
            </select>
          </div>

          {/* Guru Pengajar */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Guru Pengajar <span className="text-red-500">*</span>
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              disabled={user?.role !== 'admin'}
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-indigo-500 focus:outline-hidden ${
                user?.role === 'admin' ? 'bg-slate-50 border-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {teachersList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama} ({t.nip || 'Guru'})
                </option>
              ))}
            </select>
            {user?.role !== 'admin' && (
              <p className="text-[10px] text-slate-400 mt-1">Sesuai dengan akun guru yang sedang login.</p>
            )}
          </div>

          {/* Jenis KBM */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Jenis KBM / Metode
            </label>
            <select
              value={jenisKbm}
              onChange={(e) => setJenisKbm(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="Tatap Muka">Tatap Muka</option>
              <option value="Diskusi">Diskusi</option>
              <option value="Kerja Kelompok">Kerja Kelompok</option>
              <option value="Praktikum">Praktikum</option>
              <option value="Presentasi">Presentasi</option>
              <option value="Project Based Learning">Project Based Learning (PjBL)</option>
              <option value="Problem Based Learning">Problem Based Learning (PBL)</option>
              <option value="Asesmen">Asesmen / Penilaian Harian</option>
              <option value="Pembelajaran Mandiri">Pembelajaran Mandiri</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Semester & Tahun Ajaran */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tahun Ajaran
              </label>
              <input
                type="text"
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FORM SECTION 2: MATERI & DESKRIPSI PEMBELAJARAN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              2. Materi, Tujuan, dan Pelaksanaan KBM
            </h3>
          </div>
          <span className="text-xs text-slate-500">Format Jurnal Resmi</span>
        </div>

        <div className="p-6 space-y-5">
          {/* Materi Pembelajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Materi Pembelajaran / Pokok Bahasan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={materi}
              onChange={(e) => setMateri(e.target.value)}
              placeholder="Contoh: Menentukan Akar-Akar Persamaan Kuadrat dengan Rumus ABC"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
              required
            />
          </div>

          {/* Tujuan Pembelajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tujuan Pembelajaran (TP)
            </label>
            <textarea
              rows={2}
              value={tujuanPembelajaran}
              onChange={(e) => setTujuanPembelajaran(e.target.value)}
              placeholder="Peserta didik mampu memahami konsep dan menyelesaikan persoalan kontekstual..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Kegiatan Pembelajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup)
            </label>
            <textarea
              rows={3}
              value={kegiatanPembelajaran}
              onChange={(e) => setKegiatanPembelajaran(e.target.value)}
              placeholder="1. Pendahuluan: Apersepsi dan tujuan pembelajaran.&#10;2. Inti: Diskusi kelompok dan pemecahan LKPD.&#10;3. Penutup: Kesimpulan dan evaluasi singkat."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Catatan / Kejadian & Refleksi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan / Kejadian Khusus Selama KBM
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Misal: Siswa sangat antusias dalam sesi praktikum; 2 siswa izin terlambat."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Refleksi Guru
              </label>
              <textarea
                rows={2}
                value={refleksi}
                onChange={(e) => setRefleksi(e.target.value)}
                placeholder="Evaluasi kendala atau keberhasilan strategi mengajar hari ini..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Tindak Lanjut */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Rencana Tindak Lanjut (Remedial / Pengayaan / Tugas)
            </label>
            <input
              type="text"
              value={tindakLanjut}
              onChange={(e) => setTindakLanjut(e.target.value)}
              placeholder="Pemberian tugas pengayaan dan bimbingan tambahan pekan depan..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* FORM SECTION 3: PRESENSI SISWA & REKAP OTOMATIS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                3. Presensi Siswa ({attendanceList.length} Siswa Terdaftar)
              </h3>
              <p className="text-[11px] text-slate-500">
                Default seluruh siswa adalah HADIR. Klik status untuk mengubah yang Sakit, Izin, Alpha, atau Dispensasi.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleHadirkanSemua}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs shadow-xs hover:bg-emerald-700 active:scale-95 transition-all self-start sm:self-auto"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>HADIRKAN SEMUA</span>
          </button>
        </div>

        {/* Live Rekap Summary Bar */}
        <div className="bg-indigo-900 text-white p-4 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-xs">
            <span className="text-[10px] text-emerald-300 font-semibold block uppercase">Hadir (H)</span>
            <span className="text-base font-bold text-white">{rekapHadir}</span>
          </div>
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-xs">
            <span className="text-[10px] text-blue-300 font-semibold block uppercase">Sakit (S)</span>
            <span className="text-base font-bold text-white">{rekapSakit}</span>
          </div>
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-xs">
            <span className="text-[10px] text-amber-300 font-semibold block uppercase">Izin (I)</span>
            <span className="text-base font-bold text-white">{rekapIzin}</span>
          </div>
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-xs">
            <span className="text-[10px] text-red-300 font-semibold block uppercase">Alpha (A)</span>
            <span className="text-base font-bold text-white">{rekapAlpha}</span>
          </div>
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-xs">
            <span className="text-[10px] text-purple-300 font-semibold block uppercase">Dispen (D)</span>
            <span className="text-base font-bold text-white">{rekapDispen}</span>
          </div>
          <div className="bg-white/15 rounded-lg p-2 backdrop-blur-xs">
            <span className="text-[10px] text-indigo-200 font-semibold block uppercase">Total Siswa</span>
            <span className="text-base font-bold text-white">{totalSiswa}</span>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center">No</th>
                <th className="py-2.5 px-4 w-28">NIS</th>
                <th className="py-2.5 px-4">Nama Siswa</th>
                <th className="py-2.5 px-4 text-center w-56">Status Kehadiran</th>
                <th className="py-2.5 px-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingStudents ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Memuat daftar siswa kelas...
                  </td>
                </tr>
              ) : attendanceList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada siswa di kelas ini. Buka menu Data Siswa untuk menambah siswa.
                  </td>
                </tr>
              ) : (
                attendanceList.map((att, idx) => (
                  <tr key={att.student_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-4 font-mono text-slate-600">{att.nis || '-'}</td>
                    <td className="py-2 px-4 font-semibold text-slate-900">
                      {att.nama_siswa}
                      <span className="ml-1 text-[10px] text-slate-400 font-normal">
                        ({att.jenis_kelamin})
                      </span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-50 shadow-2xs">
                        {(['H', 'S', 'I', 'A', 'D'] as const).map((code) => {
                          const isSelected = att.status === code;
                          let activeClass = '';
                          if (isSelected) {
                            if (code === 'H') activeClass = 'bg-emerald-600 text-white font-bold shadow-xs';
                            else if (code === 'S') activeClass = 'bg-blue-600 text-white font-bold shadow-xs';
                            else if (code === 'I') activeClass = 'bg-amber-600 text-white font-bold shadow-xs';
                            else if (code === 'A') activeClass = 'bg-red-600 text-white font-bold shadow-xs';
                            else if (code === 'D') activeClass = 'bg-purple-600 text-white font-bold shadow-xs';
                          } else {
                            activeClass = 'text-slate-600 hover:bg-slate-200';
                          }

                          return (
                            <button
                              key={code}
                              type="button"
                              onClick={() => handleStatusChange(att.student_id, code)}
                              className={`w-7 h-7 text-xs rounded-md transition-all ${activeClass}`}
                              title={
                                code === 'H'
                                  ? 'Hadir'
                                  : code === 'S'
                                  ? 'Sakit'
                                  : code === 'I'
                                  ? 'Izin'
                                  : code === 'A'
                                  ? 'Alpha'
                                  : 'Dispensasi'
                              }
                            >
                              {code}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={att.keterangan || ''}
                        onChange={(e) => handleKeteranganChange(att.student_id, e.target.value)}
                        placeholder={att.status !== 'H' ? 'Keterangan (misal: flu, izin keluarga, dll)' : '-'}
                        className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM SECTION 4: DOKUMENTASI KEGIATAN KBM (FOTO UTAMA & FOTO TAMBAHAN) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              4. Dokumentasi Kegiatan KBM (Foto Persisten)
            </h3>
          </div>
          <span className="text-xs text-slate-500">Tersimpan Permanen ke Disk</span>
        </div>

        <div className="p-6 space-y-6">
          {/* Foto Utama */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Dokumentasi Utama KBM (Foto Cover Laporan)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Foto ini akan tampil di bagian depan Laporan KBM Resmi.
                </p>
              </div>
              {fotoUtamaUrl && (
                <button
                  type="button"
                  onClick={() => setFotoUtamaUrl('')}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Foto
                </button>
              )}
            </div>

            {fotoUtamaUrl ? (
              <div className="relative group max-w-md rounded-xl overflow-hidden border border-slate-300 shadow-xs">
                <img
                  src={fotoUtamaUrl}
                  alt="Dokumentasi Utama KBM"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/90 text-slate-800 text-xs font-semibold hover:bg-white transition-all shadow-md">
                    Ganti Foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setFotoUtamaUrl)}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/40 transition-all text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">Unggah Foto Dokumentasi Utama</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik untuk memilih file foto (JPG, PNG, WebP) - Kompresi otomatis
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, setFotoUtamaUrl)}
                />
              </label>
            )}
          </div>

          {/* Foto Tambahan 1 s/d 5 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Foto Dokumentasi Tambahan (Lampiran)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Maksimal 5 foto tambahan (diskusi kelompok, hasil kerja siswa, whiteboard, dll).
                </p>
              </div>

              {photosTambahan.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddPhotoField}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  + Tambah Slot Foto
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photosTambahan.map((photo, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">Foto Tambahan #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhotoField(idx)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Hapus slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {photo.photo_url ? (
                    <div className="relative group rounded-lg overflow-hidden border border-slate-300">
                      <img
                        src={photo.photo_url}
                        alt={photo.caption}
                        className="w-full h-36 object-cover"
                      />
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <span className="px-2.5 py-1 bg-white text-slate-800 text-[11px] font-semibold rounded-md shadow-xs">
                          Ganti
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, (url) => handlePhotoTambahanUrl(idx, url))}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="h-36 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-white text-center p-2 transition-all">
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[11px] font-medium text-indigo-600">Pilih Foto #{idx + 1}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, (url) => handlePhotoTambahanUrl(idx, url))}
                      />
                    </label>
                  )}

                  <input
                    type="text"
                    value={photo.caption}
                    onChange={(e) => handlePhotoTambahanCaption(idx, e.target.value)}
                    placeholder="Keterangan foto..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS (STICKY AT BOTTOM) */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-300 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            BATAL
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset semua input form ke awal?')) {
                setMateri('');
                setTujuanPembelajaran('');
                setKegiatanPembelajaran('');
                setCatatan('');
                setRefleksi('');
                setTindakLanjut('');
                setFotoUtamaUrl('');
                handleHadirkanSemua();
              }
            }}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave('draft')}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Clock className="w-4 h-4 text-amber-700" />
            <span>SIMPAN DRAFT</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave('terkirim')}
            className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-600/30 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>SIMPAN JURNAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
