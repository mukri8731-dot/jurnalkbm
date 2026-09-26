import React, { useState, useEffect } from 'react';
import { Building2, Save, Upload, CheckCircle, School } from 'lucide-react';
import { api } from '../services/api';
import { School as SchoolType, User } from '../types';

interface SchoolSettingsViewProps {
  user: User | null;
  onSchoolUpdated: (school: SchoolType) => void;
}

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({ user, onSchoolUpdated }) => {
  const [school, setSchool] = useState<SchoolType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    loadSchool();
  }, []);

  const loadSchool = async () => {
    setLoading(true);
    try {
      const data = await api.getSchool();
      setSchool(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;

    setSaving(true);
    try {
      const updated = await api.updateSchool(school);
      setSchool(updated);
      onSchoolUpdated(updated);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      alert('Gagal menyimpan identitas sekolah');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      api.uploadImage(base64).then((res) => {
        setSchool((prev) => (prev ? { ...prev, logo_url: res.url } : null));
      });
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat profil sekolah...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Identitas Sekolah</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Data identitas ini tersimpan di database dan otomatis muncul pada kop surat laporan KBM resmi.
          </p>
        </div>

        {successMsg && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Berhasil disimpan ke database!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        {/* LOGO */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-white border border-slate-300 p-2 flex items-center justify-center shrink-0 shadow-xs">
            {school?.logo_url ? (
              <img src={school.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <School className="w-10 h-10 text-slate-400" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Logo Resmi Sekolah
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Format transparan (PNG) atau JPG. Akan dicetak pada bagian kiri atas kop laporan.
            </p>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ganti Logo Sekolah</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
        </div>

        {/* INSTANSI & SEKOLAH */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nama Instansi / Dinas
            </label>
            <textarea
              rows={2}
              value={school?.nama_instansi || ''}
              onChange={(e) => setSchool({ ...school!, nama_instansi: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              placeholder="PEMERINTAH PROVINSI JAWA TIMUR&#10;DINAS PENDIDIKAN"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nama Satuan Pendidikan / Sekolah
            </label>
            <input
              type="text"
              value={school?.nama_sekolah || ''}
              onChange={(e) => setSchool({ ...school!, nama_sekolah: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden font-bold"
              placeholder="SMA NEGERI 1 MAJU JAYA"
            />
          </div>
        </div>

        {/* ALAMAT */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Alamat Lengkap Sekolah
          </label>
          <input
            type="text"
            value={school?.alamat || ''}
            onChange={(e) => setSchool({ ...school!, alamat: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
            placeholder="Jl. Pendidikan No. 45, Kebomas, Surabaya"
          />
        </div>

        {/* NPSN, NSS, TELP, FAX */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">NPSN</label>
            <input
              type="text"
              value={school?.npsn || ''}
              onChange={(e) => setSchool({ ...school!, npsn: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">NSS</label>
            <input
              type="text"
              value={school?.nss || ''}
              onChange={(e) => setSchool({ ...school!, nss: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nomor Telepon</label>
            <input
              type="text"
              value={school?.telepon || ''}
              onChange={(e) => setSchool({ ...school!, telepon: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Fax</label>
            <input
              type="text"
              value={school?.fax || ''}
              onChange={(e) => setSchool({ ...school!, fax: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* EMAIL & WEBSITE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Sekolah</label>
            <input
              type="email"
              value={school?.email || ''}
              onChange={(e) => setSchool({ ...school!, email: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Website</label>
            <input
              type="text"
              value={school?.website || ''}
              onChange={(e) => setSchool({ ...school!, website: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* KEPALA SEKOLAH */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Pejabat Pengesah (Kepala Sekolah)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Nama Lengkap Kepala Sekolah Beserta Gelar
              </label>
              <input
                type="text"
                value={school?.nama_kepala_sekolah || ''}
                onChange={(e) => setSchool({ ...school!, nama_kepala_sekolah: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden font-semibold"
                placeholder="Drs. H. Suryanto, M.M."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                NIP Kepala Sekolah
              </label>
              <input
                type="text"
                value={school?.nip_kepala_sekolah || ''}
                onChange={(e) => setSchool({ ...school!, nip_kepala_sekolah: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden font-mono"
                placeholder="19680312 199303 1 005"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'SIMPAN IDENTITAS SEKOLAH'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
