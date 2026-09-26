import React, { useState, useRef, useEffect } from 'react';
import { User, Teacher } from '../types';
import { api } from '../services/api';
import { Save, Upload, CheckCircle, Camera, PenTool, RotateCcw } from 'lucide-react';

interface TeacherProfileViewProps {
  user: User | null;
  teacher: Teacher | null;
  onTeacherUpdated: (updatedTeacher: Teacher) => void;
}

export const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({
  user,
  teacher,
  onTeacherUpdated,
}) => {
  const [nama, setNama] = useState(teacher?.nama || '');
  const [nip, setNip] = useState(teacher?.nip || '');
  const [email, setEmail] = useState(teacher?.email || '');
  const [telepon, setTelepon] = useState(teacher?.telepon || '');
  const [mataPelajaran, setMataPelajaran] = useState(teacher?.mata_pelajaran || '');
  const [jabatan, setJabatan] = useState(teacher?.jabatan || '');
  const [fotoUrl, setFotoUrl] = useState(teacher?.foto_url || '');
  const [ttdUrl, setTtdUrl] = useState(teacher?.tanda_tangan_url || '');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Digital Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (teacher) {
      setNama(teacher.nama);
      setNip(teacher.nip);
      setEmail(teacher.email);
      setTelepon(teacher.telepon);
      setMataPelajaran(teacher.mata_pelajaran);
      setJabatan(teacher.jabatan);
      setFotoUrl(teacher.foto_url);
      setTtdUrl(teacher.tanda_tangan_url || '');
    }
  }, [teacher]);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      api.uploadImage(base64).then((res) => {
        setFotoUrl(res.url);
      });
    };
    reader.readAsDataURL(file);
  };

  // Canvas drawing for signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setTtdUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setTtdUrl('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher?.id) return;

    setSaving(true);
    try {
      const updated = await api.updateTeacher(teacher.id, {
        nama,
        nip,
        email,
        telepon,
        mata_pelajaran: mataPelajaran,
        jabatan,
        foto_url: fotoUrl,
        tanda_tangan_url: ttdUrl,
      });
      onTeacherUpdated(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Profil & Identitas Guru</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Informasi guru, foto profil, dan tanda tangan digital untuk pengesahan otomatis laporan KBM.
          </p>
        </div>

        {success && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Profil berhasil disimpan!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        {/* AVATAR & BASIC */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500 shadow-sm shrink-0 bg-slate-200 flex items-center justify-center">
            {fotoUrl ? (
              <img src={fotoUrl} alt={nama} className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-slate-400" />
            )}
            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <h3 className="text-base font-bold text-slate-900">{nama || 'Nama Guru'}</h3>
            <p className="text-xs font-mono text-slate-500">NIP. {nip || '-'}</p>
            <p className="text-xs text-indigo-700 font-medium">{jabatan || 'Guru Pengajar'}</p>
            <div className="pt-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Unggah Foto Profil</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
          </div>
        </div>

        {/* FIELDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nama Lengkap & Gelar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              NIP / NIK / NUPTK
            </label>
            <input
              type="text"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Email Resmi Guru
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nomor Handphone / WhatsApp
            </label>
            <input
              type="text"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Mata Pelajaran Utama Diampu
            </label>
            <input
              type="text"
              value={mataPelajaran}
              onChange={(e) => setMataPelajaran(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Jabatan / Tugas Tambahan
            </label>
            <input
              type="text"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* TANDA TANGAN DIGITAL (CANVAS) */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Tanda Tangan Digital Guru
              </h4>
            </div>
            <button
              type="button"
              onClick={clearSignature}
              className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Hapus / Ulangi
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Goreskan tanda tangan Anda pada kanvas di bawah menggunakan mouse atau layar sentuh. Tanda tangan ini otomatis disematkan pada lembar laporan cetak.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="border border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
              <canvas
                ref={canvasRef}
                width={320}
                height={130}
                className="cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            {ttdUrl && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Pratinjau Hasil
                </span>
                <img src={ttdUrl} alt="Tanda Tangan" className="h-16 w-32 object-contain mx-auto" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'SIMPAN PROFIL GURU'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
