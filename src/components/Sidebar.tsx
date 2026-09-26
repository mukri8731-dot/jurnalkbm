import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  History,
  Users,
  GraduationCap,
  BookmarkCheck,
  CalendarCheck,
  Building2,
  UserCheck,
  Database,
  X,
  FileSpreadsheet,
  KeyRound,
} from 'lucide-react';
import { User, Teacher } from '../types';

export type NavTab =
  | 'dashboard'
  | 'create-journal'
  | 'journal-history'
  | 'attendance-report'
  | 'students'
  | 'classes-subjects'
  | 'teachers'
  | 'school-settings'
  | 'profile'
  | 'backup'
  | 'change-password';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  teacher: Teacher | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  user,
}) => {
  const isAdmin = user?.role === 'admin';

  const menuSections = [
    {
      title: 'UTAMA',
      items: [
        { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'JURNAL KBM',
      items: [
        { id: 'create-journal' as NavTab, label: 'Buat Jurnal KBM', icon: PlusCircle, highlight: true },
        { id: 'journal-history' as NavTab, label: 'Riwayat Jurnal', icon: History },
        { id: 'attendance-report' as NavTab, label: 'Rekap & Laporan', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'DATA MASTER',
      items: [
        { id: 'students' as NavTab, label: 'Data Siswa', icon: Users },
        { id: 'classes-subjects' as NavTab, label: 'Kelas & Mapel', icon: GraduationCap },
        ...(isAdmin ? [{ id: 'teachers' as NavTab, label: 'Data Guru', icon: UserCheck }] : []),
      ],
    },
    {
      title: 'PENGATURAN',
      items: [
        { id: 'profile' as NavTab, label: isAdmin ? 'Profil Akun' : 'Profil Guru', icon: BookmarkCheck },
        { id: 'change-password' as NavTab, label: 'Ganti Password', icon: KeyRound },
        { id: 'school-settings' as NavTab, label: 'Identitas Sekolah', icon: Building2 },
        { id: 'backup' as NavTab, label: 'Backup Database', icon: Database },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Sidebar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold">
              KBM
            </div>
            <span className="font-bold text-sm tracking-wide text-white">MENU NAVIGASI</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {menuSections.map((sec) => (
            <div key={sec.title}>
              <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {sec.title}
              </p>
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      } ${item.highlight && !isActive ? 'text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60' : ''}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Database indicator footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex-1 truncate">
              <p className="text-[11px] font-medium text-slate-200">Database Persisten</p>
              <p className="text-[10px] text-slate-400">Sinkronisasi Lokal Aktif</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
