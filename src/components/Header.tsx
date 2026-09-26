import React from 'react';
import {
  Menu,
  School as SchoolIcon,
  Database,
  User as UserIcon,
  LogOut,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { User, Teacher, School } from '../types';

interface HeaderProps {
  user: User | null;
  teacher: Teacher | null;
  school: School | null;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  draftCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  teacher,
  school,
  onOpenMobileMenu,
  onLogout,
  onOpenProfile,
  draftCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="flex items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Left: Mobile hamburger + App Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-2 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            aria-label="Buka navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-100">
              <SchoolIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  JURNAL KBM DIGITAL
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Database Terhubung
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                {school?.nama_sekolah || 'SMK NEGERI 1 CERME GRESIK'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: User profile & controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {draftCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Ada draft tersimpan
            </div>
          )}

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left"
                title="Lihat Profil"
              >
                <div className="relative">
                  {teacher?.foto_url ? (
                    <img
                      src={teacher.foto_url}
                      alt={teacher.nama}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs ring-2 ring-indigo-500/20">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </div>

                <div className="hidden md:block">
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {teacher?.nama || user.username}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                    {user.role === 'admin' ? 'Administrator' : teacher?.mata_pelajaran || 'Guru'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
