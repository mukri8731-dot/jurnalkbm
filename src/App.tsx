import React, { useState, useEffect } from 'react';
import { User, Teacher, School, Journal } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { JournalFormView } from './components/JournalFormView';
import { JournalListView } from './components/JournalListView';
import { AttendanceReportView } from './components/AttendanceReportView';
import { StudentsView } from './components/StudentsView';
import { ClassesAndSubjectsView } from './components/ClassesAndSubjectsView';
import { TeachersAdminView } from './components/TeachersAdminView';
import { SchoolSettingsView } from './components/SchoolSettingsView';
import { TeacherProfileView } from './components/TeacherProfileView';
import { BackupView } from './components/BackupView';
import { ChangePasswordView } from './components/ChangePasswordView';
import { JournalPrintModal } from './components/JournalPrintModal';

const AUTH_STORAGE_KEY = 'kbm_auth_user';
const TEACHER_STORAGE_KEY = 'kbm_auth_teacher';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [teacher, setTeacher] = useState<Teacher | null>(() => {
    try {
      const saved = localStorage.getItem(TEACHER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [school, setSchool] = useState<School | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Journal View / Print Modal state
  const [activePrintJournal, setActivePrintJournal] = useState<Journal | null>(null);

  // Journal Form Edit state
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);

  // Fetch school identity on mount
  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    try {
      const s = await api.getSchool();
      setSchool(s);
    } catch (e) {
      console.error('Error loading school:', e);
    }
  };

  // Login handler
  const handleLoginSuccess = (loggedInUser: User, loggedInTeacher: Teacher | null, rememberMe: boolean) => {
    setUser(loggedInUser);
    setTeacher(loggedInTeacher);

    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
      if (loggedInTeacher) {
        localStorage.setItem(TEACHER_STORAGE_KEY, JSON.stringify(loggedInTeacher));
      }
    }
    setCurrentTab('dashboard');
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    setTeacher(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TEACHER_STORAGE_KEY);
  };

  // Open journal details / print modal
  const handleViewJournal = async (journalId: string) => {
    try {
      const full = await api.getJournalById(journalId);
      setActivePrintJournal(full);
    } catch (err) {
      alert('Gagal memuat detail jurnal');
    }
  };

  // Edit journal
  const handleEditJournal = (journalId: string) => {
    setEditingJournalId(journalId);
    setCurrentTab('create-journal');
  };

  // Create new journal fresh
  const handleCreateNewJournal = () => {
    setEditingJournalId(null);
    setCurrentTab('create-journal');
  };

  // If not logged in, show Login Screen
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        user={user}
        teacher={teacher}
        school={school}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onLogout={handleLogout}
        onOpenProfile={() => setCurrentTab('profile')}
        draftCount={0}
      />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'create-journal' && currentTab !== 'create-journal') {
              setEditingJournalId(null);
            }
            setCurrentTab(tab);
          }}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          user={user}
          teacher={teacher}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'dashboard' && (
            <DashboardView
              user={user}
              teacher={teacher}
              onNavigate={(tab) => {
                if (tab === 'create-journal') setEditingJournalId(null);
                setCurrentTab(tab);
              }}
              onSelectJournalToView={handleViewJournal}
              onSelectJournalToEdit={handleEditJournal}
            />
          )}

          {currentTab === 'create-journal' && (
            <JournalFormView
              user={user}
              teacher={teacher}
              editJournalId={editingJournalId}
              onSuccess={(savedId) => {
                setEditingJournalId(null);
                setCurrentTab('journal-history');
              }}
              onCancel={() => {
                setEditingJournalId(null);
                setCurrentTab('journal-history');
              }}
            />
          )}

          {currentTab === 'journal-history' && (
            <JournalListView
              user={user}
              teacher={teacher}
              onViewJournal={handleViewJournal}
              onEditJournal={handleEditJournal}
              onCreateNew={handleCreateNewJournal}
            />
          )}

          {currentTab === 'attendance-report' && (
            <AttendanceReportView
              user={user}
              teacher={teacher}
              onViewJournal={handleViewJournal}
            />
          )}

          {currentTab === 'students' && <StudentsView user={user} />}

          {currentTab === 'classes-subjects' && <ClassesAndSubjectsView user={user} />}

          {currentTab === 'teachers' && <TeachersAdminView user={user} />}

          {currentTab === 'school-settings' && (
            <SchoolSettingsView user={user} onSchoolUpdated={(s) => setSchool(s)} />
          )}

          {currentTab === 'profile' && (
            <TeacherProfileView
              user={user}
              teacher={teacher}
              onTeacherUpdated={(t) => {
                setTeacher(t);
                localStorage.setItem(TEACHER_STORAGE_KEY, JSON.stringify(t));
              }}
            />
          )}

          {currentTab === 'change-password' && (
            <ChangePasswordView user={user} />
          )}

          {currentTab === 'backup' && (
            <BackupView
              user={user}
              onDataReset={() => {
                loadSchoolData();
              }}
            />
          )}
        </main>
      </div>

      {/* Official Printable Report & PDF Modal */}
      {activePrintJournal && (
        <JournalPrintModal
          journal={activePrintJournal}
          onClose={() => setActivePrintJournal(null)}
        />
      )}
    </div>
  );
}
